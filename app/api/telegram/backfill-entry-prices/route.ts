import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyCronAuth } from '@/lib/auth/cron-guard';
import {
  getHistoricalPrice as getBirdeyeHistoricalPrice,
  getOHLCVData as getBirdeyeOHLCVData,
  isBirdeyeConfigured
} from '@/lib/api/birdeye';
import {
  getHistoricalPrice as getGeckoHistoricalPrice,
  getOHLCVData as getGeckoOHLCVData,
  toGeckoNetwork,
  rateLimitDelay as geckoRateLimitDelay
} from '@/lib/api/geckoterminal';
import { getTokenData, DexScreenerChain } from '@/lib/api/dexscreener';

const MILESTONES = [2, 3, 5, 10, 20, 50, 100];
function getHighestMilestoneTier(multiplier: number): number {
  let highest = 0;
  for (const m of MILESTONES) {
    if (multiplier >= m) highest = m;
  }
  return highest;
}

interface TelegramCallRecord {
  id: string;
  token_address: string;
  token_symbol: string | null;
  chain: string | null;
  entry_timestamp: string;
  entry_price: number | null;
  entry_market_cap: number | null;
  current_market_cap: number | null;
  channel_id: string;
}

/**
 * Backfill entry prices and ATH for Telegram calls
 * - Solana: Uses Birdeye API
 * - BSC/Base/Ethereum: Uses GeckoTerminal API (FREE, no key required!)
 *
 * GET /api/telegram/backfill-entry-prices?channel_id=xxx (optional)
 * POST /api/telegram/backfill-entry-prices?channel_id=xxx (optional)
 */
export async function GET(request: NextRequest) {
  const denied = verifyCronAuth(request);
  if (denied) return denied;

  try {
    const supabase = await createAdminClient();

    // Parse channel_id from query params
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channel_id');

    // Build query for telegram calls
    let query = supabase
      .from('telegram_calls')
      .select('id, token_address, token_symbol, chain, entry_timestamp, entry_price, entry_market_cap, current_market_cap, channel_id')
      .eq('status', 'active');

    // Filter by channel if specified
    if (channelId) {
      query = query.eq('channel_id', channelId);
    }

    const { data: calls, error: callsError } = await query.order('entry_timestamp', { ascending: false });

    if (callsError || !calls || calls.length === 0) {
      return NextResponse.json({
        success: false,
        error: callsError?.message || 'No telegram calls found'
      });
    }

    console.log(`[Telegram Backfill] Processing ${calls.length} calls${channelId ? ` for channel ${channelId}` : ' (all channels)'}`);

    // Get channel name for the response if filtering
    let channelName: string | null = null;
    if (channelId) {
      const { data: channel } = await supabase
        .from('telegram_channels')
        .select('channel_username')
        .eq('id', channelId)
        .single();
      channelName = channel?.channel_username || null;
    }

    // Check API configurations
    const birdeyeReady = isBirdeyeConfigured();
    // GeckoTerminal is always ready - no API key required!
    const geckoTerminalReady = true;

    console.log(`[Telegram Backfill] APIs configured - Birdeye: ${birdeyeReady}, GeckoTerminal: ${geckoTerminalReady} (free)`);

    let updated = 0;
    let skipped = 0;
    let deleted = 0;
    let errors = 0;
    const results: Array<{
      address: string;
      symbol: string | null;
      chain: string;
      status: string;
      entryTimestamp?: string;
      historicalPrice?: number;
      athPrice?: number;
      error?: string;
    }> = [];

    // Collect channel IDs BEFORE processing (since calls may be deleted)
    const affectedChannelIds = new Set<string>();
    for (const call of calls) {
      if ((call as { channel_id?: string }).channel_id) {
        affectedChannelIds.add((call as { channel_id: string }).channel_id);
      }
    }

    for (const call of calls as TelegramCallRecord[]) {
      try {
        const chain = call.chain || 'solana';
        const entryDate = new Date(call.entry_timestamp);
        const unixTime = Math.floor(entryDate.getTime() / 1000);

        console.log(`[Telegram Backfill] Processing ${call.token_symbol || call.token_address.slice(0, 8)} on ${chain}`);

        let historicalData: { price: number; timestamp: number } | null = null;
        let ohlcvData: { athPrice: number; athTimestamp: number } | null = null;

        // Use appropriate API based on chain
        if (chain === 'solana') {
          // Solana: Use Birdeye
          if (!birdeyeReady) {
            skipped++;
            results.push({
              address: call.token_address,
              symbol: call.token_symbol,
              chain,
              status: 'skipped_no_api',
              error: 'Birdeye API not configured for Solana'
            });
            continue;
          }

          // Skip if entry_timestamp is before August 2023 (Birdeye data limit)
          const august2023 = new Date('2023-08-01').getTime() / 1000;
          if (unixTime < august2023) {
            skipped++;
            results.push({
              address: call.token_address,
              symbol: call.token_symbol,
              chain,
              status: 'skipped_too_old',
              entryTimestamp: call.entry_timestamp,
              error: 'Entry timestamp is before August 2023 (Birdeye data limit)'
            });
            continue;
          }

          historicalData = await getBirdeyeHistoricalPrice(call.token_address, unixTime);
          ohlcvData = await getBirdeyeOHLCVData(call.token_address, unixTime);

        } else {
          // EVM chains (BSC, Base, Ethereum): Use GeckoTerminal (FREE!)
          const geckoNetwork = toGeckoNetwork(chain);

          if (!geckoNetwork) {
            skipped++;
            results.push({
              address: call.token_address,
              symbol: call.token_symbol,
              chain,
              status: 'skipped_unsupported_chain',
              error: `Unsupported chain: ${chain}`
            });
            continue;
          }

          historicalData = await getGeckoHistoricalPrice(call.token_address, geckoNetwork, unixTime);
          ohlcvData = await getGeckoOHLCVData(call.token_address, geckoNetwork, unixTime);

          // Respect GeckoTerminal rate limits (30 req/min)
          await geckoRateLimitDelay();
        }

        // Get current price from DexScreener
        const dexChain = chain as DexScreenerChain;
        const currentData = await getTokenData(call.token_address, dexChain);

        // If no historical data available, delete the call to not affect channel score
        if (!historicalData) {
          console.log(`[Telegram Backfill] No historical data for ${call.token_symbol || call.token_address.slice(0, 8)} - deleting call`);

          const { error: deleteError } = await supabase
            .from('telegram_calls')
            .delete()
            .eq('id', call.id);

          if (deleteError) {
            errors++;
            results.push({
              address: call.token_address,
              symbol: call.token_symbol,
              chain,
              status: 'delete_failed',
              entryTimestamp: call.entry_timestamp,
              error: deleteError.message
            });
          } else {
            deleted++;
            results.push({
              address: call.token_address,
              symbol: call.token_symbol,
              chain,
              status: 'deleted_no_historical_data',
              entryTimestamp: call.entry_timestamp,
              error: 'No historical price data available - deleted to preserve channel score'
            });
          }
          continue;
        }

        if (!currentData) {
          skipped++;
          results.push({
            address: call.token_address,
            symbol: call.token_symbol,
            chain,
            status: 'skipped_no_current_data',
            entryTimestamp: call.entry_timestamp,
            error: 'No current price data available'
          });
          continue;
        }

        // Calculate entry market cap from historical price
        let entryMarketCap = call.entry_market_cap;
        if (historicalData && currentData && currentData.price > 0) {
          entryMarketCap = currentData.marketCap * (historicalData.price / currentData.price);
        }

        // Determine ATH values - ATH must be >= entry price
        const entryPrice = historicalData?.price || 0;

        // Start with entry as ATH (minimum possible ATH)
        let athPrice = entryPrice;
        let athMarketCap = entryMarketCap || 0;
        let athTimestamp = call.entry_timestamp;

        // Check if OHLCV shows a higher price since entry
        if (ohlcvData && ohlcvData.athPrice > athPrice) {
          athPrice = ohlcvData.athPrice;
          athTimestamp = new Date(ohlcvData.athTimestamp * 1000).toISOString();
          if (currentData && currentData.price > 0) {
            athMarketCap = currentData.marketCap * (ohlcvData.athPrice / currentData.price);
          }
        }

        // Check if current price is the new ATH
        if (currentData && currentData.price > athPrice) {
          athPrice = currentData.price;
          athMarketCap = currentData.marketCap;
          athTimestamp = new Date().toISOString();
        }

        // Calculate multipliers
        const currentMultiplier = entryMarketCap && currentData && entryMarketCap > 0
          ? currentData.marketCap / entryMarketCap
          : 1;

        const athMultiplier = entryMarketCap && athMarketCap && entryMarketCap > 0
          ? athMarketCap / entryMarketCap
          : 1;

        // Safety: ATH multiplier can never be less than 1
        const safeAthMultiplier = Math.max(1, athMultiplier);

        // Update call with historical data
        const updateData: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };

        if (historicalData) {
          updateData.entry_price = historicalData.price;
        }
        if (entryMarketCap) {
          updateData.entry_market_cap = Math.round(entryMarketCap);
        }
        if (currentData) {
          updateData.current_market_cap = currentData.marketCap;
          updateData.current_price = currentData.price;
          updateData.token_image_url = currentData.imageUrl || null;
        }

        // ATH market cap must be at least entry market cap
        const safeAthMarketCap = Math.max(athMarketCap, entryMarketCap || 0);
        if (safeAthMarketCap > 0) {
          updateData.ath_market_cap = Math.round(safeAthMarketCap);
          updateData.ath_price = athPrice;
          updateData.ath_timestamp = athTimestamp;
        }

        updateData.current_multiplier = Math.round(currentMultiplier * 100) / 100;
        updateData.ath_multiplier = Math.round(safeAthMultiplier * 100) / 100;
        updateData.is_win = safeAthMultiplier >= 2;
        // Prevent monitor from firing achievements for backfilled data
        updateData.last_milestone_notified = getHighestMilestoneTier(safeAthMultiplier);
        updateData.last_price_update = new Date().toISOString();

        const { error: updateError } = await supabase
          .from('telegram_calls')
          .update(updateData)
          .eq('id', call.id);

        if (updateError) {
          errors++;
          results.push({
            address: call.token_address,
            symbol: call.token_symbol,
            chain,
            status: 'error',
            error: updateError.message,
          });
        } else {
          updated++;
          results.push({
            address: call.token_address,
            symbol: call.token_symbol,
            chain,
            status: historicalData ? 'updated_with_historical' : 'updated_with_current',
            entryTimestamp: call.entry_timestamp,
            historicalPrice: historicalData?.price,
            athPrice: athPrice,
          });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        errors++;
        results.push({
          address: call.token_address,
          symbol: call.token_symbol,
          chain: call.chain || 'solana',
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Recalculate channel stats (channel IDs collected before processing)
    for (const channelId of Array.from(affectedChannelIds)) {
      const { data: channelCalls } = await supabase
        .from('telegram_calls')
        .select('ath_multiplier, is_win')
        .eq('channel_id', channelId);

      if (channelCalls && channelCalls.length > 0) {
        const totalCalls = channelCalls.length;
        const winningCalls = channelCalls.filter(c => c.is_win).length;
        const avgMultiplier = channelCalls.reduce((acc, c) => acc + (c.ath_multiplier || 0), 0) / totalCalls;
        const bestMultiplier = Math.max(...channelCalls.map(c => c.ath_multiplier || 0));

        await supabase
          .from('telegram_channels')
          .update({
            total_calls: totalCalls,
            winning_calls: winningCalls,
            winrate: Math.round((winningCalls / totalCalls) * 100 * 100) / 100,
            avg_multiplier: Math.round(avgMultiplier * 100) / 100,
            best_multiplier: Math.round(bestMultiplier * 100) / 100,
            updated_at: new Date().toISOString(),
          })
          .eq('id', channelId);
      }
    }

    return NextResponse.json({
      success: true,
      totalCalls: calls.length,
      updated,
      skipped,
      deleted,
      errors,
      channelsUpdated: affectedChannelIds.size,
      ...(channelId && { filteredByChannel: channelName || channelId }),
      apisConfigured: {
        birdeye: birdeyeReady,
        geckoTerminal: geckoTerminalReady,
      },
      results,
    });
  } catch (error) {
    console.error('[Telegram Backfill] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
