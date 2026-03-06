import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getMultipleTokensData } from '@/lib/api/dexscreener';
import { verifyCronAuth } from '@/lib/auth/cron-guard';

interface CallRecord {
  id: string;
  kol_id: string;
  token_address: string;
  token_symbol: string | null;
  entry_market_cap: number | null;
  entry_price: number | null;
  current_market_cap: number | null;
  current_price: number | null;
  ath_price: number | null;
  ath_market_cap: number | null;
}

/**
 * Fix ATH values for all calls
 * This ensures ATH is at least equal to current values
 * GET /api/calls/fix-ath
 */
export async function GET(request: NextRequest) {
  const denied = verifyCronAuth(request);
  if (denied) return denied;

  try {
    const supabase = await createAdminClient();

    // Get all calls
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('id, kol_id, token_address, token_symbol, entry_market_cap, entry_price, current_market_cap, current_price, ath_price, ath_market_cap');

    if (callsError || !calls || calls.length === 0) {
      return NextResponse.json({
        success: false,
        error: callsError?.message || 'No calls found'
      });
    }

    // Get unique addresses and fetch current data
    const addresses = Array.from(new Set(calls.map((c: CallRecord) => c.token_address)));
    const tokenDataMap = await getMultipleTokensData(addresses);

    let fixed = 0;
    let skipped = 0;
    const results: Array<{ address: string; symbol: string | null; status: string; details?: string }> = [];

    for (const call of calls as CallRecord[]) {
      const tokenData = tokenDataMap.get(call.token_address);

      if (!tokenData) {
        skipped++;
        results.push({
          address: call.token_address,
          symbol: call.token_symbol,
          status: 'skipped',
          details: 'No current data available'
        });
        continue;
      }

      const currentPrice = tokenData.price || 0;
      const currentMcap = tokenData.marketCap || 0;
      const entryPrice = call.entry_price || null;
      const entryMcap = call.entry_market_cap || currentMcap;

      // Calculate what ATH should be (at minimum, the max of entry and current)
      const athPrice = Math.max(call.ath_price || 0, currentPrice, entryPrice || 0);
      const athMcap = Math.max(call.ath_market_cap || 0, currentMcap, entryMcap);

      // Calculate multiplier
      const athMultiplier = entryPrice && entryPrice > 0 ? athPrice / entryPrice : 1;
      const currentMultiplier = entryPrice && entryPrice > 0 ? currentPrice / entryPrice : 1;

      // Update call with corrected values
      const updateData: Record<string, unknown> = {
        // Ensure entry values are set
        entry_price: call.entry_price || null,
        entry_price_missing: !call.entry_price ? true : undefined,
        entry_market_cap: call.entry_market_cap || currentMcap,
        // Update current values
        current_price: currentPrice,
        current_market_cap: currentMcap,
        current_multiplier: Math.round(currentMultiplier * 100) / 100,
        // Fix ATH values
        ath_price: athPrice,
        ath_market_cap: athMcap,
        ath_multiplier: Math.round(athMultiplier * 100) / 100,
        // Set win status
        is_win: athMultiplier >= 2,
        // Update timestamps
        last_price_update: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Always update token image if available from DexScreener
      if (tokenData.imageUrl) {
        updateData.token_image_url = tokenData.imageUrl;
      }
      // Update token name/symbol if missing
      if (tokenData.symbol) {
        updateData.token_symbol = tokenData.symbol;
      }
      if (tokenData.name) {
        updateData.token_name = tokenData.name;
      }

      // Only update ATH timestamp if we're setting a new ATH
      if (athPrice > (call.ath_price || 0)) {
        updateData.ath_timestamp = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('calls')
        .update(updateData)
        .eq('id', call.id);

      if (updateError) {
        results.push({
          address: call.token_address,
          symbol: call.token_symbol,
          status: 'error',
          details: updateError.message
        });
      } else {
        fixed++;
        results.push({
          address: call.token_address,
          symbol: call.token_symbol,
          status: 'fixed',
          details: `Entry: $${entryMcap.toFixed(0)} | Current: $${currentMcap.toFixed(0)} | ATH: $${athMcap.toFixed(0)} | Mult: ${athMultiplier.toFixed(2)}x`
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
      fixed,
      skipped,
      results,
    });
  } catch (error) {
    console.error('[Fix ATH] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
