import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getHistoricalPrice, isBirdeyeConfigured } from '@/lib/api/birdeye';
import { getTokenData } from '@/lib/api/dexscreener';
import { verifyCronAuth } from '@/lib/auth/cron-guard';

interface CallRecord {
  id: string;
  token_address: string;
  token_symbol: string | null;
  entry_timestamp: string;
  entry_price: number | null;
  entry_market_cap: number | null;
}

/**
 * Backfill entry prices for calls using Birdeye historical data
 * This fetches the actual price at the time the KOL made the call
 *
 * GET /api/calls/backfill-entry-prices
 *
 * Note: Requires BIRDEYE_API_KEY environment variable
 * Birdeye only has data from August 2023 onwards
 */
export async function GET(request: NextRequest) {
  const denied = verifyCronAuth(request);
  if (denied) return denied;

  try {
    // Check if Birdeye is configured
    if (!isBirdeyeConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Birdeye API key not configured. Add BIRDEYE_API_KEY to your environment variables.',
        help: 'Get an API key from https://bds.birdeye.so'
      }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Get calls that need entry price backfill
    // Either entry_price is null/0 or we want to update all of them
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('id, token_address, token_symbol, entry_timestamp, entry_price, entry_market_cap')
      .order('entry_timestamp', { ascending: false });

    if (callsError || !calls || calls.length === 0) {
      return NextResponse.json({
        success: false,
        error: callsError?.message || 'No calls found'
      });
    }

    console.log(`[Backfill] Processing ${calls.length} calls`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const results: Array<{
      address: string;
      symbol: string | null;
      status: string;
      entryTimestamp?: string;
      historicalPrice?: number;
      error?: string;
    }> = [];

    for (const call of calls as CallRecord[]) {
      try {
        // Convert entry_timestamp to Unix time
        const entryDate = new Date(call.entry_timestamp);
        const unixTime = Math.floor(entryDate.getTime() / 1000);

        // Skip if entry_timestamp is before August 2023 (Birdeye data limit)
        const august2023 = new Date('2023-08-01').getTime() / 1000;
        if (unixTime < august2023) {
          skipped++;
          results.push({
            address: call.token_address,
            symbol: call.token_symbol,
            status: 'skipped_too_old',
            entryTimestamp: call.entry_timestamp,
            error: 'Entry timestamp is before August 2023 (Birdeye data limit)'
          });
          continue;
        }

        // Fetch historical price from Birdeye
        const historicalData = await getHistoricalPrice(call.token_address, unixTime);

        if (!historicalData || historicalData.price <= 0) {
          // Try to get current data from DexScreener as fallback
          const currentData = await getTokenData(call.token_address);

          if (currentData && !call.entry_price) {
            // Mark as missing — don't use current price as entry price
            const { error: updateError } = await supabase
              .from('calls')
              .update({
                entry_price_missing: true,
                updated_at: new Date().toISOString(),
              })
              .eq('id', call.id);

            if (!updateError) {
              updated++;
              results.push({
                address: call.token_address,
                symbol: call.token_symbol,
                status: 'updated_with_current',
                entryTimestamp: call.entry_timestamp,
                historicalPrice: currentData.price,
              });
            } else {
              errors++;
              results.push({
                address: call.token_address,
                symbol: call.token_symbol,
                status: 'error',
                error: updateError.message,
              });
            }
          } else {
            skipped++;
            results.push({
              address: call.token_address,
              symbol: call.token_symbol,
              status: 'skipped_no_data',
              entryTimestamp: call.entry_timestamp,
              error: 'No historical or current data available'
            });
          }
          continue;
        }

        // Update call with historical price
        // Note: We can't easily get historical market cap, so we keep current or estimate
        const { error: updateError } = await supabase
          .from('calls')
          .update({
            entry_price: historicalData.price,
            updated_at: new Date().toISOString(),
          })
          .eq('id', call.id);

        if (updateError) {
          errors++;
          results.push({
            address: call.token_address,
            symbol: call.token_symbol,
            status: 'error',
            error: updateError.message,
          });
        } else {
          updated++;
          results.push({
            address: call.token_address,
            symbol: call.token_symbol,
            status: 'updated_with_historical',
            entryTimestamp: call.entry_timestamp,
            historicalPrice: historicalData.price,
          });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        errors++;
        results.push({
          address: call.token_address,
          symbol: call.token_symbol,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalCalls: calls.length,
      updated,
      skipped,
      errors,
      results,
    });
  } catch (error) {
    console.error('[Backfill] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
