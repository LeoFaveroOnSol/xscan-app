import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getMultipleTokensData } from '@/lib/api/dexscreener';
import { calculateMultiplier, calculateKOLStats } from '@/lib/utils/calculations';
import { automationLog, AUTOMATION_CONFIG } from '@/lib/automation/config';
import { getOHLCVData, toGeckoNetwork, rateLimitDelay, GeckoTerminalNetwork } from '@/lib/api/geckoterminal';

// This endpoint should be called by a cron job (e.g., Vercel Cron)
// Configure in vercel.json:
// { "crons": [{ "path": "/api/cron/update-prices", "schedule": "*/15 * * * *" }] }

/**
 * Create a price update log entry
 */
async function createPriceLog(supabase: any) {
  const { data, error } = await supabase
    .from('scan_logs')
    .insert({
      scan_type: 'prices',
      status: 'running',
    })
    .select('id')
    .single();

  if (error) {
    automationLog('error', 'Failed to create price log', error);
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
    .from('scan_logs')
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

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret (REQUIRED)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    automationLog('info', '💰 Starting price update cron job');

    const supabase = createServiceClient();

    // Create price log
    const priceLogId = await createPriceLog(supabase);

    // Get all active calls that should be monitored
    // For auto-detected calls, only update if within monitoring window
    const now = new Date().toISOString();

    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('*')
      .eq('status', 'active')
      .or(`is_auto_detected.eq.false,monitoring_until.is.null,monitoring_until.gte.${now}`);

    if (callsError) {
      automationLog('error', 'Error fetching calls:', callsError);

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
      automationLog('info', 'No active calls to update');

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

    automationLog('info', `Found ${calls.length} active calls to update`);

    // Get unique token addresses
    const tokenAddresses = Array.from(new Set(calls.map((c) => c.token_address)));

    // Fetch current prices from DexScreener
    const tokenDataMap = await getMultipleTokensData(tokenAddresses);

    // Update each call
    const updates: Array<Promise<void> | PromiseLike<void>> = [];
    const affectedKolIds = new Set<string>();
    let athsUpdated = 0;
    let updateErrors = 0;

    for (const call of calls) {
      const tokenData = tokenDataMap.get(call.token_address);

      if (!tokenData) {
        // Token not found - might be rugged or delisted
        // Check if liquidity is 0, mark as rugged
        automationLog('debug', `Token not found: ${call.token_address}`);
        continue;
      }

      const currentMcap = tokenData.marketCap;
      const currentPrice = tokenData.price;
      const currentMultiplier = calculateMultiplier(call.entry_market_cap, currentMcap);

      // Check if we have a new ATH (ATH must always be >= entry)
      const currentAth = Math.max(call.ath_market_cap || 0, call.entry_market_cap || 0);
      const isNewATH = currentMcap > currentAth;
      const athMcap = isNewATH ? currentMcap : currentAth;
      const athPrice = isNewATH ? currentPrice : (call.ath_market_cap && call.ath_market_cap >= (call.entry_market_cap || 0)) ? call.ath_price : call.entry_price;
      const athTimestamp = isNewATH ? new Date().toISOString() : call.ath_timestamp;
      const athMultiplier = Math.max(1, calculateMultiplier(call.entry_market_cap, athMcap || 0));
      const isWin = athMultiplier >= AUTOMATION_CONFIG.WIN_THRESHOLD;

      if (isNewATH) {
        athsUpdated++;
        automationLog(
          'info',
          `📈 New ATH for ${call.token_symbol || call.token_address.substring(0, 10)}: ${athMultiplier.toFixed(2)}x`
        );
      }

      // Update call
      const updatePromise = supabase
        .from('calls')
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
            automationLog('error', `Failed to update call ${call.id}:`, error);
          }
        });

      updates.push(updatePromise);
      affectedKolIds.add(call.kol_id);
    }

    // Wait for all call updates
    await Promise.all(updates);

    // OHLCV Enhancement: For tokens with significant price movement, check real ATH via candles
    // Only for tokens where current spot > previous ATH by >20% (likely missed spikes between crons)
    const ohlcvCandidates = calls.filter((call) => {
      const tokenData = tokenDataMap.get(call.token_address);
      if (!tokenData) return false;
      const currentMcap = tokenData.marketCap;
      const prevAth = call.ath_market_cap || 0;
      // Token had significant upward movement - might have spiked higher between cron runs
      return prevAth > 0 && currentMcap > prevAth * 1.2;
    });

    // Limit to 10 OHLCV calls per cron run to respect rate limits (30 req/min, each token = ~2 requests)
    const ohlcvBatch = ohlcvCandidates.slice(0, 10);
    let ohlcvEnhanced = 0;

    for (const call of ohlcvBatch) {
      try {
        const chain = (call as any).chain || 'ethereum';
        const geckoNetwork = toGeckoNetwork(chain) || (chain === 'solana' ? 'solana' as GeckoTerminalNetwork : null);
        if (!geckoNetwork) continue;

        const entryTime = call.entry_timestamp
          ? Math.floor(new Date(call.entry_timestamp).getTime() / 1000)
          : undefined;

        const ohlcvResult = await getOHLCVData(call.token_address, geckoNetwork, entryTime);
        await rateLimitDelay();

        if (ohlcvResult && ohlcvResult.athPrice > 0) {
          // Calculate OHLCV-based ATH mcap using price ratio
          const tokenData = tokenDataMap.get(call.token_address)!;
          const currentPrice = tokenData.price;
          if (currentPrice > 0) {
            const ohlcvAthMcap = Math.round(tokenData.marketCap * (ohlcvResult.athPrice / currentPrice));
            const existingAth = call.ath_market_cap || 0;

            if (ohlcvAthMcap > existingAth) {
              const athMultiplier = calculateMultiplier(call.entry_market_cap, ohlcvAthMcap);
              const isWin = athMultiplier >= AUTOMATION_CONFIG.WIN_THRESHOLD;

              await supabase
                .from('calls')
                .update({
                  ath_market_cap: ohlcvAthMcap,
                  ath_price: ohlcvResult.athPrice,
                  ath_timestamp: new Date(ohlcvResult.athTimestamp * 1000).toISOString(),
                  ath_multiplier: Math.round(athMultiplier * 100) / 100,
                  is_win: isWin,
                })
                .eq('id', call.id);

              ohlcvEnhanced++;
              automationLog('info', `🔍 OHLCV ATH for ${call.token_symbol || call.token_address.substring(0, 10)}: ${athMultiplier.toFixed(2)}x (was ${calculateMultiplier(call.entry_market_cap, existingAth).toFixed(2)}x)`);
            }
          }
        }
      } catch (err) {
        automationLog('debug', `OHLCV check failed for ${call.token_address}:`, err);
      }
    }

    if (ohlcvEnhanced > 0) {
      automationLog('info', `🔍 OHLCV enhanced ${ohlcvEnhanced}/${ohlcvBatch.length} ATHs`);
    }

    // Check for expired monitoring and stop tracking those
    const { data: expiredCalls, error: expiredError } = await supabase
      .from('calls')
      .select('id')
      .eq('status', 'active')
      .eq('is_auto_detected', true)
      .lt('monitoring_until', now);

    let expiredCount = 0;
    if (!expiredError && expiredCalls && expiredCalls.length > 0) {
      expiredCount = expiredCalls.length;
      automationLog('info', `${expiredCount} auto-detected calls have expired monitoring window`);

      // Optionally mark them as no longer actively monitored
      // For now, we'll just not update their prices anymore (handled by the query above)
    }

    // Update KOL stats for affected KOLs
    for (const kolId of Array.from(affectedKolIds)) {
      // Get all calls for this KOL
      const { data: kolCalls } = await supabase
        .from('calls')
        .select('*')
        .eq('kol_id', kolId);

      if (kolCalls && kolCalls.length > 0) {
        const stats = calculateKOLStats(kolCalls);

        await supabase
          .from('kols')
          .update({
            total_calls: stats.total_calls,
            winning_calls: stats.winning_calls,
            winrate: stats.winrate,
            avg_multiplier: stats.avg_multiplier,
            best_multiplier: stats.best_multiplier,
            updated_at: new Date().toISOString(),
          })
          .eq('id', kolId);
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

    automationLog('info', `✅ Price update completed in ${duration}ms`);
    automationLog('info', `Results: ${calls.length} calls updated, ${athsUpdated} new ATHs, ${affectedKolIds.size} KOLs affected`);

    return NextResponse.json({
      message: 'Prices updated successfully',
      updated: calls.length,
      athsUpdated,
      kolsUpdated: affectedKolIds.size,
      expiredMonitoring: expiredCount,
      errors: updateErrors,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    automationLog('error', `Price update cron failed: ${errorMsg}`);

    return NextResponse.json({ error: 'Internal server error', message: errorMsg }, { status: 500 });
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
