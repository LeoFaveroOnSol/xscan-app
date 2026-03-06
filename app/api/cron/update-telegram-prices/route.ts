import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getMultipleTokensData, DexScreenerChain } from '@/lib/api/dexscreener';
import { calculateMultiplier } from '@/lib/utils/calculations';
import { getOHLCVData, toGeckoNetwork, rateLimitDelay, GeckoTerminalNetwork } from '@/lib/api/geckoterminal';

// Supported chains for price updates
const SUPPORTED_CHAINS: DexScreenerChain[] = ['solana', 'bsc', 'base', 'ethereum'];

// This endpoint should be called by a cron job
// Configure in vercel.json:
// { "crons": [{ "path": "/api/cron/update-telegram-prices", "schedule": "*/15 * * * *" }] }

/**
 * Create a price update log entry
 */
async function createPriceLog(supabase: any) {
  const { data, error } = await supabase
    .from('telegram_scan_logs')
    .insert({
      scan_type: 'prices',
      status: 'running',
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Telegram] Failed to create price log', error);
    return null;
  }

  return data.id;
}

/**
 * Update price log with results
 */
async function updatePriceLog(
  supabase: any,
  logId: string,
  results: {
    callsUpdated: number;
    athsUpdated: number;
    expiredMonitoring: number;
    errors: number;
    errorMessage?: string;
    status: 'completed' | 'failed';
  }
) {
  await supabase
    .from('telegram_scan_logs')
    .update({
      completed_at: new Date().toISOString(),
      calls_created: results.callsUpdated,
      calls_skipped: results.athsUpdated,
      errors: results.errors,
      details: {
        aths_updated: results.athsUpdated,
        expired_monitoring: results.expiredMonitoring,
      },
      error_message: results.errorMessage,
      status: results.status,
    })
    .eq('id', logId);
}

/**
 * Calculate Telegram channel stats from calls
 */
function calculateChannelStats(calls: any[]): {
  total_calls: number;
  winning_calls: number;
  winrate: number;
  avg_multiplier: number;
  best_multiplier: number;
} {
  const total_calls = calls.length;
  const winning_calls = calls.filter((c) => c.ath_multiplier >= 2).length;
  const winrate = total_calls > 0 ? (winning_calls / total_calls) * 100 : 0;
  const avg_multiplier = total_calls > 0
    ? calls.reduce((acc, c) => acc + (c.ath_multiplier || 0), 0) / total_calls
    : 0;
  const best_multiplier = total_calls > 0
    ? Math.max(...calls.map((c) => c.ath_multiplier || 0))
    : 0;

  return {
    total_calls,
    winning_calls,
    winrate: Math.round(winrate * 100) / 100,
    avg_multiplier: Math.round(avg_multiplier * 100) / 100,
    best_multiplier: Math.round(best_multiplier * 100) / 100,
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret (optional but recommended for production)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Telegram] 💰 Starting price update cron job');

    const supabase = createServiceClient();

    // Create price log
    const priceLogId = await createPriceLog(supabase);

    // Get all active calls that should be monitored
    const { data: calls, error: callsError } = await supabase
      .from('telegram_calls')
      .select('*')
      .eq('status', 'active');

    if (callsError) {
      console.error('[Telegram] Error fetching calls:', callsError);

      if (priceLogId) {
        await updatePriceLog(supabase, priceLogId, {
          callsUpdated: 0,
          athsUpdated: 0,
          expiredMonitoring: 0,
          errors: 1,
          errorMessage: callsError.message,
          status: 'failed',
        });
      }

      return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 });
    }

    if (!calls || calls.length === 0) {
      console.log('[Telegram] No active calls to update');

      if (priceLogId) {
        await updatePriceLog(supabase, priceLogId, {
          callsUpdated: 0,
          athsUpdated: 0,
          expiredMonitoring: 0,
          errors: 0,
          status: 'completed',
        });
      }

      return NextResponse.json({ message: 'No active calls to update', updated: 0 });
    }

    console.log(`[Telegram] Found ${calls.length} active calls to update`);

    // Group calls by chain
    const callsByChain = new Map<DexScreenerChain, typeof calls>();
    for (const call of calls) {
      const chain = (call.chain || 'solana') as DexScreenerChain;
      if (!callsByChain.has(chain)) {
        callsByChain.set(chain, []);
      }
      callsByChain.get(chain)!.push(call);
    }

    // Fetch prices for each chain
    const tokenDataMap = new Map<string, any>();

    for (const chain of SUPPORTED_CHAINS) {
      const chainCalls = callsByChain.get(chain);
      if (!chainCalls || chainCalls.length === 0) continue;

      const tokenAddresses = Array.from(new Set(chainCalls.map((c) => c.token_address)));
      console.log(`[Telegram] Fetching ${tokenAddresses.length} tokens for ${chain}`);

      const chainTokenData = await getMultipleTokensData(tokenAddresses, chain);

      // Merge into main map with chain prefix to avoid collisions
      for (const [addr, data] of Array.from(chainTokenData.entries())) {
        tokenDataMap.set(`${chain}:${addr.toLowerCase()}`, data);
      }
    }

    // Update each call
    const updates: Array<Promise<void> | PromiseLike<void>> = [];
    const affectedChannelIds = new Set<string>();
    let athsUpdated = 0;
    let updateErrors = 0;

    for (const call of calls) {
      const chain = (call.chain || 'solana') as DexScreenerChain;
      const tokenData = tokenDataMap.get(`${chain}:${call.token_address.toLowerCase()}`);

      if (!tokenData) {
        console.log(`[Telegram] Token not found: ${call.token_address} (${chain})`);
        continue;
      }

      const currentMcap = tokenData.marketCap;
      const currentPrice = tokenData.price;
      const currentMultiplier = calculateMultiplier(call.entry_market_cap, currentMcap);

      // Check if we have a new ATH
      // ATH must always be >= entry
      const currentAth = Math.max(call.ath_market_cap || 0, call.entry_market_cap || 0);
      const isNewATH = currentMcap > currentAth;
      const athMcap = isNewATH ? currentMcap : currentAth;
      const athPrice = isNewATH ? currentPrice : (call.ath_market_cap && call.ath_market_cap >= (call.entry_market_cap || 0)) ? call.ath_price : call.entry_price;
      const athTimestamp = isNewATH ? new Date().toISOString() : call.ath_timestamp;
      const athMultiplier = Math.max(1, calculateMultiplier(call.entry_market_cap, athMcap || 0));
      const isWin = athMultiplier >= 2;

      if (isNewATH) {
        athsUpdated++;
        console.log(
          `[Telegram] 📈 New ATH for ${call.token_symbol || call.token_address.substring(0, 10)}: ${athMultiplier.toFixed(2)}x`
        );
      }

      // Update call
      const updatePromise = supabase
        .from('telegram_calls')
        .update({
          current_market_cap: currentMcap,
          current_price: currentPrice,
          ath_market_cap: athMcap,
          ath_price: athPrice,
          ath_timestamp: athTimestamp,
          current_multiplier: Math.round(currentMultiplier * 100) / 100,
          ath_multiplier: Math.round(athMultiplier * 100) / 100,
          is_win: isWin,
          last_price_update: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', call.id)
        .then(({ error }) => {
          if (error) {
            updateErrors++;
            console.error(`[Telegram] Failed to update call ${call.id}:`, error);
          }
        });

      updates.push(updatePromise);
      affectedChannelIds.add(call.channel_id);
    }

    // Wait for all call updates
    await Promise.all(updates);

    // OHLCV Enhancement: For tokens with significant price movement, check real ATH via candles
    const ohlcvCandidates = calls.filter((call) => {
      const chain = (call.chain || 'solana') as DexScreenerChain;
      const tokenData = tokenDataMap.get(`${chain}:${call.token_address.toLowerCase()}`);
      if (!tokenData) return false;
      const currentMcap = tokenData.marketCap;
      const prevAth = call.ath_market_cap || 0;
      return prevAth > 0 && currentMcap > prevAth * 1.2;
    });

    const ohlcvBatch = ohlcvCandidates.slice(0, 10);
    let ohlcvEnhanced = 0;

    for (const call of ohlcvBatch) {
      try {
        const chain = (call.chain || 'solana') as string;
        const geckoNetwork = toGeckoNetwork(chain) || (chain === 'solana' ? 'solana' as GeckoTerminalNetwork : null);
        if (!geckoNetwork) continue;

        const entryTime = call.entry_timestamp
          ? Math.floor(new Date(call.entry_timestamp).getTime() / 1000)
          : undefined;

        const ohlcvResult = await getOHLCVData(call.token_address, geckoNetwork, entryTime);
        await rateLimitDelay();

        if (ohlcvResult && ohlcvResult.athPrice > 0) {
          const dexChain = (call.chain || 'solana') as DexScreenerChain;
          const tokenData = tokenDataMap.get(`${dexChain}:${call.token_address.toLowerCase()}`)!;
          const currentPrice = tokenData.price;
          if (currentPrice > 0) {
            const ohlcvAthMcap = Math.round(tokenData.marketCap * (ohlcvResult.athPrice / currentPrice));
            const existingAth = call.ath_market_cap || 0;

            if (ohlcvAthMcap > existingAth) {
              const athMultiplier = calculateMultiplier(call.entry_market_cap, ohlcvAthMcap);
              const isWin = athMultiplier >= 2;

              await supabase
                .from('telegram_calls')
                .update({
                  ath_market_cap: ohlcvAthMcap,
                  ath_price: ohlcvResult.athPrice,
                  ath_timestamp: new Date(ohlcvResult.athTimestamp * 1000).toISOString(),
                  ath_multiplier: Math.round(athMultiplier * 100) / 100,
                  is_win: isWin,
                })
                .eq('id', call.id);

              ohlcvEnhanced++;
              console.log(`[Telegram] 🔍 OHLCV ATH for ${call.token_symbol || call.token_address.substring(0, 10)}: ${athMultiplier.toFixed(2)}x`);
            }
          }
        }
      } catch (err) {
        console.log(`[Telegram] OHLCV check failed for ${call.token_address}`);
      }
    }

    if (ohlcvEnhanced > 0) {
      console.log(`[Telegram] 🔍 OHLCV enhanced ${ohlcvEnhanced}/${ohlcvBatch.length} ATHs`);
    }

    // Check for expired monitoring
    const now = new Date().toISOString();
    const { data: expiredCalls, error: expiredError } = await supabase
      .from('telegram_calls')
      .select('id')
      .eq('status', 'active')
      .eq('is_auto_detected', true)
      .lt('monitoring_until', now);

    let expiredCount = 0;
    if (!expiredError && expiredCalls && expiredCalls.length > 0) {
      expiredCount = expiredCalls.length;
      console.log(`[Telegram] ${expiredCount} auto-detected calls have expired monitoring window`);
    }

    // Update channel stats for affected channels
    for (const channelId of Array.from(affectedChannelIds)) {
      // Get all calls for this channel
      const { data: channelCalls } = await supabase
        .from('telegram_calls')
        .select('*')
        .eq('channel_id', channelId);

      if (channelCalls && channelCalls.length > 0) {
        const stats = calculateChannelStats(channelCalls);

        await supabase
          .from('telegram_channels')
          .update({
            total_calls: stats.total_calls,
            winning_calls: stats.winning_calls,
            winrate: stats.winrate,
            avg_multiplier: stats.avg_multiplier,
            best_multiplier: stats.best_multiplier,
            updated_at: new Date().toISOString(),
          })
          .eq('id', channelId);
      }
    }

    const duration = Date.now() - startTime;

    // Update price log
    if (priceLogId) {
      await updatePriceLog(supabase, priceLogId, {
        callsUpdated: calls.length,
        athsUpdated,
        expiredMonitoring: expiredCount,
        errors: updateErrors,
        status: 'completed',
      });
    }

    console.log(`[Telegram] ✅ Price update completed in ${duration}ms`);
    console.log(`[Telegram] Results: ${calls.length} calls updated, ${athsUpdated} new ATHs, ${affectedChannelIds.size} channels affected`);

    return NextResponse.json({
      message: 'Telegram prices updated successfully',
      updated: calls.length,
      athsUpdated,
      channelsUpdated: affectedChannelIds.size,
      expiredMonitoring: expiredCount,
      errors: updateErrors,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Telegram] Price update cron failed: ${errorMsg}`);

    return NextResponse.json({ error: 'Internal server error', message: errorMsg }, { status: 500 });
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
