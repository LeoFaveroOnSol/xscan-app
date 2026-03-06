import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getTokenData } from '@/lib/api/dexscreener';
import { calculateMultiplier } from '@/lib/utils/calculations';

interface CallInput {
  token_address: string;
  token_symbol?: string;
  entry_timestamp: string;
  entry_market_cap: number;
  ath_market_cap?: number;
  current_market_cap?: number;
  tweet_url?: string;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const body = await request.json();

    const { kol_id, calls } = body;

    // Handle single call or bulk calls
    const callsToProcess: CallInput[] = Array.isArray(calls) ? calls : [body];

    if (!kol_id) {
      return NextResponse.json({ error: 'kol_id is required' }, { status: 400 });
    }

    // Verify KOL exists
    const { data: kol, error: kolError } = await supabase
      .from('kols')
      .select('id')
      .eq('id', kol_id)
      .single();

    if (kolError || !kol) {
      return NextResponse.json({ error: 'KOL not found' }, { status: 404 });
    }

    let created = 0;
    let skipped = 0;
    let errors: string[] = [];

    for (const call of callsToProcess) {
      try {
        if (!call.token_address || !call.entry_market_cap) {
          skipped++;
          continue;
        }

        // Check if call already exists
        const { data: existing } = await supabase
          .from('calls')
          .select('id')
          .eq('kol_id', kol_id)
          .eq('token_address', call.token_address)
          .single();

        if (existing) {
          skipped++;
          continue;
        }

        // Try to fetch current token data
        let tokenData = null;
        try {
          tokenData = await getTokenData(call.token_address);
        } catch (e) {
          // Token might be rugged or delisted
          console.warn(`Could not fetch token data for ${call.token_address}`);
        }

        // Use provided values or defaults
        const entryMcap = call.entry_market_cap;
        const athMcap = call.ath_market_cap || entryMcap;
        const currentMcap = call.current_market_cap || tokenData?.marketCap || athMcap;

        // Calculate multipliers
        const currentMultiplier = calculateMultiplier(entryMcap, currentMcap);
        const athMultiplier = calculateMultiplier(entryMcap, athMcap);

        // Determine status
        let status: 'active' | 'rugged' | 'delisted' = 'active';
        if (!tokenData) {
          // If we can't fetch token data, it might be rugged
          status = currentMcap < entryMcap * 0.1 ? 'rugged' : 'delisted';
        }

        const { error: insertError } = await supabase.from('calls').insert({
          kol_id,
          token_address: call.token_address,
          token_symbol: call.token_symbol || tokenData?.symbol || null,
          token_name: tokenData?.name || null,
          entry_market_cap: entryMcap,
          entry_price: null,
          entry_timestamp: call.entry_timestamp || new Date().toISOString(),
          current_market_cap: currentMcap,
          current_price: tokenData?.price || null,
          ath_market_cap: athMcap,
          ath_price: null,
          ath_timestamp: call.entry_timestamp || new Date().toISOString(),
          current_multiplier: currentMultiplier,
          ath_multiplier: athMultiplier,
          is_win: athMultiplier >= 2,
          status,
          tweet_url: call.tweet_url || null,
          notes: call.notes || null,
          is_auto_detected: false,
          last_price_update: new Date().toISOString(),
        });

        if (insertError) {
          errors.push(`${call.token_address}: ${insertError.message}`);
        } else {
          created++;
        }

        // Small delay to avoid rate limits
        await new Promise((r) => setTimeout(r, 100));
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : 'Unknown error';
        errors.push(`${call.token_address}: ${errMsg}`);
      }
    }

    // Update KOL stats after importing calls
    await updateKOLStats(supabase, kol_id);

    return NextResponse.json({
      success: true,
      created,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      total: callsToProcess.length,
    });
  } catch (error) {
    console.error('Error in bulk calls import:', error);
    return NextResponse.json(
      { error: 'Failed to import calls' },
      { status: 500 }
    );
  }
}

async function updateKOLStats(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  kolId: string
) {
  try {
    const { data: calls } = await supabase
      .from('calls')
      .select('*')
      .eq('kol_id', kolId);

    if (!calls || calls.length === 0) return;

    const totalCalls = calls.length;
    const winningCalls = calls.filter((c) => c.is_win).length;
    const winrate = totalCalls > 0 ? (winningCalls / totalCalls) * 100 : 0;

    const multipliers = calls.map((c) => c.ath_multiplier || 1);
    const avgMultiplier = multipliers.reduce((a, b) => a + b, 0) / multipliers.length;
    const bestMultiplier = Math.max(...multipliers);

    await supabase
      .from('kols')
      .update({
        total_calls: totalCalls,
        winning_calls: winningCalls,
        winrate: Math.round(winrate * 100) / 100,
        avg_multiplier: Math.round(avgMultiplier * 100) / 100,
        best_multiplier: Math.round(bestMultiplier * 100) / 100,
        updated_at: new Date().toISOString(),
      })
      .eq('id', kolId);
  } catch (error) {
    console.error('Failed to update KOL stats:', error);
  }
}
