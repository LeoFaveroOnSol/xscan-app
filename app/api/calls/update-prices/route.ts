import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getMultipleTokensData } from '@/lib/api/dexscreener';
import { verifyCronAuth } from '@/lib/auth/cron-guard';

interface CallRecord {
  id: string;
  kol_id: string;
  token_address: string;
  token_symbol: string | null;
  token_name: string | null;
  token_image_url: string | null;
  entry_market_cap: number | null;
  entry_price: number | null;
  ath_price: number | null;
  ath_market_cap: number | null;
  ath_multiplier: number | null;
}

/**
 * Update prices and data for all calls
 * Also tracks ATH (All-Time High) by comparing with stored values
 * GET /api/calls/update-prices
 */
export async function GET(request: NextRequest) {
  const denied = verifyCronAuth(request);
  if (denied) return denied;

  try {
    const supabase = await createAdminClient();

    // Get all unique token addresses from calls (include ATH fields)
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('id, kol_id, token_address, token_symbol, token_name, token_image_url, entry_market_cap, entry_price, ath_price, ath_market_cap, ath_multiplier');

    if (callsError || !calls || calls.length === 0) {
      return NextResponse.json({
        success: false,
        error: callsError?.message || 'No calls found'
      });
    }

    // Get unique addresses
    const addresses = Array.from(new Set(calls.map((c: CallRecord) => c.token_address)));
    console.log(`[Update Prices] Fetching data for ${addresses.length} tokens`);

    // Fetch token data from DexScreener
    const tokenDataMap = await getMultipleTokensData(addresses);
    console.log(`[Update Prices] Got data for ${tokenDataMap.size} tokens`);

    // Update each call with current data
    let updated = 0;
    let athUpdated = 0;
    let errors = 0;
    const results: Array<{ address: string; status: string; data?: unknown }> = [];

    for (const call of calls as CallRecord[]) {
      const tokenData = tokenDataMap.get(call.token_address);

      if (!tokenData) {
        results.push({ address: call.token_address, status: 'not_found' });
        continue;
      }

      // Calculate multiplier
      const entryPrice = call.entry_price || 0;
      const currentPrice = tokenData.price || 0;
      const currentMultiplier = entryPrice > 0 ? currentPrice / entryPrice : 1;

      // Check if this is a new ATH
      const previousAthPrice = call.ath_price || 0;
      const isNewAth = currentPrice > previousAthPrice;

      // Update call
      const updateData: Record<string, unknown> = {
        current_price: currentPrice,
        current_market_cap: tokenData.marketCap,
        current_multiplier: Math.round(currentMultiplier * 100) / 100,
        last_price_update: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // If token symbol/name/image was missing, add it now
      if (!call.token_symbol && tokenData.symbol) {
        updateData.token_symbol = tokenData.symbol;
      }
      if (!call.token_name && tokenData.name) {
        updateData.token_name = tokenData.name;
      }
      if (!call.token_image_url && tokenData.imageUrl) {
        updateData.token_image_url = tokenData.imageUrl;
      }
      // If entry price is missing, flag it (don't use current price as fallback)
      if (!call.entry_price) {
        updateData.entry_price_missing = true;
      }
      // If entry market cap was 0, set it to current
      if (!call.entry_market_cap && tokenData.marketCap > 0) {
        updateData.entry_market_cap = tokenData.marketCap;
      }

      // Update ATH if current price is higher
      if (isNewAth && currentPrice > 0) {
        const athMultiplier = entryPrice > 0 ? currentPrice / entryPrice : 1;
        updateData.ath_price = currentPrice;
        updateData.ath_market_cap = tokenData.marketCap;
        updateData.ath_timestamp = new Date().toISOString();
        updateData.ath_multiplier = Math.round(athMultiplier * 100) / 100;
        // is_win = true if ATH multiplier >= 2x
        updateData.is_win = athMultiplier >= 2;
        athUpdated++;
      }

      const { error: updateError } = await supabase
        .from('calls')
        .update(updateData)
        .eq('id', call.id);

      if (updateError) {
        errors++;
        results.push({ address: call.token_address, status: 'error', data: updateError.message });
      } else {
        updated++;
        results.push({
          address: call.token_address,
          status: isNewAth ? 'updated_with_ath' : 'updated',
          data: {
            symbol: tokenData.symbol,
            name: tokenData.name,
            price: currentPrice,
            marketCap: tokenData.marketCap,
            currentMultiplier: Math.round(currentMultiplier * 100) / 100,
            isNewAth,
            athPrice: isNewAth ? currentPrice : previousAthPrice,
          }
        });
      }
    }

    // Recalculate KOL stats after updating calls
    const kolIds = Array.from(new Set(calls.map((c: CallRecord) => c.kol_id).filter(Boolean)));
    for (const kolId of kolIds) {
      if (kolId) {
        await supabase.rpc('recalculate_kol_stats', { kol_uuid: kolId });
      }
    }

    return NextResponse.json({
      success: true,
      totalCalls: calls.length,
      tokensFound: tokenDataMap.size,
      updated,
      athUpdated,
      errors,
      results,
    });
  } catch (error) {
    console.error('[Update Prices] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
