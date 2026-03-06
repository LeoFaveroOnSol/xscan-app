import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

interface DexPair {
  baseToken?: { address?: string; symbol?: string; name?: string };
  pairAddress?: string;
  chainId?: string;
  marketCap?: number;
  fdv?: number;
  priceUsd?: string;
  liquidity?: { usd?: number };
  info?: { imageUrl?: string };
}

interface TokenInfo {
  symbol: string;
  name: string;
  mcap: number;
  image: string | null;
  price: number;
  poolAddress?: string;
  chainId?: string;
}

async function fetchWithTimeout(url: string, opts: RequestInit = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

async function getGTPool(tokenAddress: string): Promise<{ poolAddress: string; chainId: string } | null> {
  try {
    const res = await fetchWithTimeout(
      `https://api.geckoterminal.com/api/v2/search/pools?query=${tokenAddress}&network=solana`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const pools = data?.data || [];
    if (pools.length > 0) {
      const attr = pools[0].attributes || {};
      return { poolAddress: attr.address, chainId: 'solana' };
    }
  } catch { /* skip */ }
  return null;
}

async function getOHLCV(chainId: string, poolAddress: string, entryTimestamp: string) {
  const entryTs = Math.floor(new Date(entryTimestamp).getTime() / 1000);
  const now = Math.floor(Date.now() / 1000);

  const timeRangeHours = (now - entryTs) / 3600;

  // Try 1-min candles first for recent data (< 6h), then 15-min, then hourly
  let candles: number[][] = [];

  if (timeRangeHours < 6) {
    try {
      const res = await fetchWithTimeout(
        `https://api.geckoterminal.com/api/v2/networks/${chainId}/pools/${poolAddress}/ohlcv/minute?aggregate=1&limit=1000&before_timestamp=${now}`
      );
      if (res.ok) {
        const data = await res.json();
        candles = data?.data?.attributes?.ohlcv_list || [];
      }
    } catch { /* skip */ }
  }

  // 15-min candles for < 24h or as fallback
  if (candles.length === 0 && timeRangeHours < 24) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const res = await fetchWithTimeout(
        `https://api.geckoterminal.com/api/v2/networks/${chainId}/pools/${poolAddress}/ohlcv/minute?aggregate=15&limit=1000&before_timestamp=${now}`
      );
      if (res.ok) {
        const data = await res.json();
        candles = data?.data?.attributes?.ohlcv_list || [];
      }
    } catch { /* skip */ }
  }

  // Hourly candles for older data or as fallback
  if (candles.length === 0) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const res = await fetchWithTimeout(
        `https://api.geckoterminal.com/api/v2/networks/${chainId}/pools/${poolAddress}/ohlcv/hour?aggregate=1&limit=1000&before_timestamp=${now}`
      );
      if (res.ok) {
        const data = await res.json();
        candles = data?.data?.attributes?.ohlcv_list || [];
      }
    } catch { /* skip */ }
  }

  if (candles.length === 0) return null;

  const sorted = [...candles].sort((a, b) => a[0] - b[0]);

  let entryPrice = 0;
  let athHigh = 0;

  for (const c of sorted) {
    if (c[0] >= entryTs && entryPrice === 0) {
      entryPrice = c[1]; // open of first candle after entry
    }
    if (c[0] >= entryTs && c[2] > athHigh) {
      athHigh = c[2]; // highest high after entry
    }
  }

  // If no candle after entry (very recent call), use latest candles
  if (!entryPrice && sorted.length > 0) {
    entryPrice = sorted[sorted.length - 1][1];
    athHigh = Math.max(...sorted.map(c => c[2]));
  }

  if (!entryPrice) return null;

  // Calculate mcap from price using 1B supply (pump.fun standard)
  const SUPPLY = 1_000_000_000;
  return {
    entryPrice,
    athHigh,
    entryMcap: Math.round(entryPrice * SUPPLY),
    athMcap: Math.round(athHigh * SUPPLY),
    multiplier: athHigh > 0 && entryPrice > 0 ? athHigh / entryPrice : 1,
    candles: candles.length,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { handle } = await request.json();
    if (!handle) {
      return NextResponse.json({ error: 'handle is required' }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const cleanHandle = handle.replace('@', '');
    const heliusKey = process.env.HELIUS_API_KEY;

    // Get KOL
    const { data: kol, error: kolError } = await supabase
      .from('kols')
      .select('id')
      .eq('twitter_handle', cleanHandle)
      .single();

    if (kolError || !kol) {
      return NextResponse.json({ error: 'KOL not found' }, { status: 404 });
    }

    // Get ALL calls (backfill everything: metadata + entry price + ATH)
    const { data: calls } = await supabase
      .from('calls')
      .select('id, token_address, token_symbol, entry_market_cap, entry_timestamp, ath_multiplier')
      .eq('kol_id', kol.id);

    if (!calls || calls.length === 0) {
      return NextResponse.json({ success: true, message: 'No calls to backfill' });
    }

    // Unique addresses
    const addresses = Array.from(new Set(calls.map(c => c.token_address)));
    const tokenInfo: Record<string, TokenInfo> = {};

    // PASS 1: Fetch token metadata from DexScreener + Helius fallback
    for (const addr of addresses) {
      try {
        const dsRes = await fetchWithTimeout(`https://api.dexscreener.com/latest/dex/tokens/${addr}`);
        if (dsRes.ok) {
          const dsData = await dsRes.json();
          const pairs: DexPair[] = dsData?.pairs || [];
          if (pairs.length > 0) {
            const pair = pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
            const pairAddr = (pair.baseToken?.address || '').toLowerCase();
            if (pairAddr) {
              tokenInfo[pairAddr] = {
                symbol: pair.baseToken?.symbol || 'UNKNOWN',
                name: pair.baseToken?.name || 'Unknown',
                mcap: pair.marketCap || pair.fdv || 0,
                image: pair.info?.imageUrl || null,
                price: parseFloat(pair.priceUsd || '0'),
                poolAddress: pair.pairAddress,
                chainId: pair.chainId || 'solana',
              };
            }
          }
        }
      } catch { /* skip */ }
      await new Promise(r => setTimeout(r, 300));

      // Helius fallback for metadata
      if (!tokenInfo[addr.toLowerCase()] && heliusKey) {
        try {
          const hRes = await fetchWithTimeout(`https://mainnet.helius-rpc.com/?api-key=${heliusKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getAsset', params: { id: addr } }),
          });
          if (hRes.ok) {
            const hData = await hRes.json();
            const meta = hData?.result?.content?.metadata;
            const links = hData?.result?.content?.links || {};
            const files = hData?.result?.content?.files || [];
            if (meta?.symbol) {
              tokenInfo[addr.toLowerCase()] = {
                symbol: meta.symbol,
                name: meta.name || meta.symbol,
                mcap: 0,
                image: links.image || (files.length > 0 ? files[0].uri : null),
                price: 0,
              };
            }
          }
        } catch { /* skip */ }
        await new Promise(r => setTimeout(r, 200));
      }
    }

    // PASS 2: For each call, update metadata + get historical entry price + ATH via OHLCV
    let metadataUpdated = 0;
    let athUpdated = 0;
    let skipped = 0;

    for (const call of calls) {
      const info = tokenInfo[call.token_address.toLowerCase()];
      const updates: Record<string, unknown> = {};

      // Update metadata if UNKNOWN
      if (call.token_symbol === 'UNKNOWN' && info && info.symbol !== 'UNKNOWN') {
        updates.token_symbol = info.symbol;
        updates.token_name = info.name;
        if (info.image) updates.token_image_url = info.image;
        metadataUpdated++;
      }

      // Get pool address (from DexScreener or GeckoTerminal search)
      let poolAddress = info?.poolAddress;
      let chainId = info?.chainId || 'solana';

      if (!poolAddress) {
        const gtPool = await getGTPool(call.token_address);
        if (gtPool) {
          poolAddress = gtPool.poolAddress;
          chainId = gtPool.chainId;
        }
        await new Promise(r => setTimeout(r, 2000));
      }

      // Get OHLCV for entry price + ATH
      if (poolAddress) {
        const ohlcv = await getOHLCV(chainId, poolAddress, call.entry_timestamp);
        await new Promise(r => setTimeout(r, 2000));

        if (ohlcv) {
          // Always update entry_market_cap from OHLCV (historical, not current DexScreener)
          if (ohlcv.entryMcap > 0) {
            updates.entry_market_cap = ohlcv.entryMcap;
          }

          // Update ATH if better than existing
          if (ohlcv.multiplier > (call.ath_multiplier || 1)) {
            updates.ath_multiplier = +ohlcv.multiplier.toFixed(2);
            updates.ath_market_cap = ohlcv.athMcap;
            updates.is_win = ohlcv.multiplier >= 2;
            athUpdated++;
          }

          // Update current price from DexScreener
          if (info?.mcap) {
            updates.current_market_cap = Math.round(info.mcap);
            updates.current_price = info.price;
          }
        }
      }

      if (!updates.entry_market_cap && (!call.entry_market_cap || call.entry_market_cap <= 1) && info?.mcap) {
        updates.entry_market_cap = Math.round(info.mcap);
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from('calls').update(updates).eq('id', call.id);
      } else {
        skipped++;
      }
    }

    // PASS 3: Recalculate KOL stats
    const { data: allCalls } = await supabase
      .from('calls')
      .select('ath_multiplier')
      .eq('kol_id', kol.id);

    if (allCalls && allCalls.length > 0) {
      const total = allCalls.length;
      const wins = allCalls.filter(c => (c.ath_multiplier || 0) >= 2).length;
      const winrate = total > 0 ? (wins / total) * 100 : 0;
      const multipliers = allCalls.map(c => c.ath_multiplier || 1);
      const avg = multipliers.reduce((a: number, b: number) => a + b, 0) / multipliers.length;
      const best = Math.max(...multipliers);

      await supabase
        .from('kols')
        .update({ total_calls: total, winning_calls: wins, winrate: +winrate.toFixed(1), avg_multiplier: +avg.toFixed(2), best_multiplier: +best.toFixed(2) })
        .eq('id', kol.id);
    }

    return NextResponse.json({
      success: true,
      message: `Metadata: ${metadataUpdated} updated | ATH: ${athUpdated} updated | Skipped: ${skipped}`,
      metadataUpdated,
      athUpdated,
      skipped,
      total: calls.length,
    });
  } catch (err) {
    console.error('Backfill error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
