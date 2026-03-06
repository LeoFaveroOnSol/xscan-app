import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getMultipleTokensData } from '@/lib/api/dexscreener';
import { getHistoricalPrice, getOHLCVData, isBirdeyeConfigured } from '@/lib/api/birdeye';
import { verifyCronAuth } from '@/lib/auth/cron-guard';

interface CallRecord {
  id: string;
  kol_id: string;
  token_address: string;
  token_symbol: string | null;
  token_name: string | null;
  entry_timestamp: string;
  entry_price: number | null;
  entry_market_cap: number | null;
}

// Default supply for pump.fun tokens (1 billion)
const PUMP_FUN_SUPPLY = 1_000_000_000;

/**
 * Recalculate all call data with accurate historical prices
 * - Fetches entry price from Birdeye at the exact tweet timestamp
 * - Calculates entry market cap using price × supply
 * - Fetches ATH from Birdeye OHLCV data
 * - Updates current prices from DexScreener
 *
 * GET /api/calls/recalculate
 */
export async function GET(request: NextRequest) {
  const denied = verifyCronAuth(request);
  if (denied) return denied;

  try {
    if (!isBirdeyeConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Birdeye API key not configured'
      }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Get all calls
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('id, kol_id, token_address, token_symbol, token_name, entry_timestamp, entry_price, entry_market_cap')
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('entry_timestamp', { ascending: false });

    if (callsError || !calls || calls.length === 0) {
      return NextResponse.json({
        success: false,
        error: callsError?.message || 'No calls found'
      });
    }

    // Get unique addresses and fetch current data from DexScreener
    const addresses = Array.from(new Set(calls.map((c: CallRecord) => c.token_address)));
    const tokenDataMap = await getMultipleTokensData(addresses);

    console.log(`[Recalculate] Processing ${calls.length} calls`);

    let updated = 0;
    let errors = 0;
    let deleted = 0;
    const results: Array<{
      address: string;
      symbol: string | null;
      status: string;
      details?: string;
    }> = [];

    for (const call of calls as CallRecord[]) {
      try {
        const tokenData = tokenDataMap.get(call.token_address);

        // Delete calls with no token data (dead tokens)
        if (!tokenData) {
          // Check if token name/symbol is UNKNOWN - these are likely invalid
          if (!call.token_symbol || call.token_symbol === 'UNKNOWN' || !call.token_name) {
            const { error: deleteError } = await supabase
              .from('calls')
              .update({ is_deleted: true, updated_at: new Date().toISOString() })
              .eq('id', call.id);

            if (!deleteError) {
              deleted++;
              results.push({
                address: call.token_address,
                symbol: call.token_symbol,
                status: 'deleted',
                details: 'Unknown/dead token removed'
              });
            }
            continue;
          }

          results.push({
            address: call.token_address,
            symbol: call.token_symbol,
            status: 'skipped',
            details: 'No current data available'
          });
          continue;
        }

        // Get entry timestamp as unix time
        const entryDate = new Date(call.entry_timestamp);
        const entryUnixTime = Math.floor(entryDate.getTime() / 1000);

        // Fetch historical entry price from Birdeye
        const historicalData = await getHistoricalPrice(call.token_address, entryUnixTime);

        // Fetch ATH data from Birdeye OHLCV
        // Use entry timestamp as start time
        const athData = await getOHLCVData(call.token_address, entryUnixTime);

        // Determine prices
        const entryPrice = historicalData?.price || call.entry_price || null;
        const currentPrice = tokenData.price;

        // If no entry price available, mark as missing and skip multiplier calc
        if (!entryPrice) {
          await supabase
            .from('calls')
            .update({
              entry_price_missing: true,
              current_price: currentPrice,
              current_market_cap: tokenData.marketCap,
              token_symbol: tokenData.symbol || call.token_symbol,
              token_name: tokenData.name || call.token_name,
              last_price_update: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', call.id);
          results.push({
            address: call.token_address,
            symbol: call.token_symbol,
            status: 'skipped',
            details: 'No entry price available — marked entry_price_missing'
          });
          continue;
        }

        // Determine supply - use FDV/price if available, otherwise assume pump.fun supply
        const estimatedSupply = tokenData.marketCap > 0 && currentPrice > 0
          ? tokenData.marketCap / currentPrice
          : PUMP_FUN_SUPPLY;

        // Calculate market caps
        const entryMarketCap = entryPrice * estimatedSupply;
        const currentMarketCap = currentPrice * estimatedSupply;

        // Determine ATH
        let athPrice = athData?.athPrice || currentPrice;
        let athMarketCap = athPrice * estimatedSupply;
        let athTimestamp = athData?.athTimestamp
          ? new Date(athData.athTimestamp * 1000).toISOString()
          : new Date().toISOString();

        // Ensure ATH is at least current or entry (whichever is higher)
        if (currentPrice > athPrice) {
          athPrice = currentPrice;
          athMarketCap = currentMarketCap;
          athTimestamp = new Date().toISOString();
        }
        if (entryPrice > athPrice) {
          athPrice = entryPrice;
          athMarketCap = entryMarketCap;
          athTimestamp = call.entry_timestamp;
        }

        // Calculate multipliers
        const currentMultiplier = entryPrice > 0 ? currentPrice / entryPrice : 1;
        const athMultiplier = entryPrice > 0 ? athPrice / entryPrice : 1;

        // Update call
        const updateData: Record<string, unknown> = {
          // Entry data
          entry_price: entryPrice,
          entry_market_cap: Math.round(entryMarketCap),
          // Current data
          current_price: currentPrice,
          current_market_cap: Math.round(currentMarketCap),
          current_multiplier: Math.round(currentMultiplier * 100) / 100,
          // ATH data
          ath_price: athPrice,
          ath_market_cap: Math.round(athMarketCap),
          ath_multiplier: Math.round(athMultiplier * 100) / 100,
          ath_timestamp: athTimestamp,
          // Win status (2x or more from entry)
          is_win: athMultiplier >= 2,
          // Token info
          token_symbol: tokenData.symbol || call.token_symbol,
          token_name: tokenData.name || call.token_name,
          token_image_url: tokenData.imageUrl || null,
          // Timestamps
          last_price_update: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
          .from('calls')
          .update(updateData)
          .eq('id', call.id);

        if (updateError) {
          errors++;
          results.push({
            address: call.token_address,
            symbol: call.token_symbol,
            status: 'error',
            details: updateError.message
          });
        } else {
          updated++;
          results.push({
            address: call.token_address,
            symbol: tokenData.symbol || call.token_symbol,
            status: 'updated',
            details: `Entry: $${Math.round(entryMarketCap / 1000)}K | ATH: $${Math.round(athMarketCap / 1000)}K (${athMultiplier.toFixed(1)}x)`
          });
        }

        // Rate limiting - wait between Birdeye calls
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        errors++;
        results.push({
          address: call.token_address,
          symbol: call.token_symbol,
          status: 'error',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Recalculate KOL stats
    const kolIds = Array.from(new Set(calls.map((c: CallRecord) => c.kol_id).filter(Boolean)));
    for (const kolId of kolIds) {
      if (kolId) {
        await supabase.rpc('recalculate_kol_stats', { kol_uuid: kolId });
      }
    }

    return NextResponse.json({
      success: true,
      totalCalls: calls.length,
      updated,
      deleted,
      errors,
      results,
    });
  } catch (error) {
    console.error('[Recalculate] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
