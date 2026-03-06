import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

// Helper function to recalculate KOL stats after call updates
async function recalculateKOLStats(supabase: SupabaseClient, kolId: string) {
  // Fetch all calls for this KOL
  const { data: calls } = await supabase
    .from('calls')
    .select('ath_multiplier')
    .eq('kol_id', kolId);

  if (!calls || calls.length === 0) {
    // If no calls, reset KOL stats to zero
    await supabase
      .from('kols')
      .update({
        total_calls: 0,
        winning_calls: 0,
        winrate: 0,
        avg_multiplier: 0,
        best_multiplier: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', kolId);
    return;
  }

  const totalCalls = calls.length;
  const winningCalls = calls.filter((c) => c.ath_multiplier >= 2).length;
  const winrate = (winningCalls / totalCalls) * 100;
  const avgMultiplier = calls.reduce((sum, c) => sum + c.ath_multiplier, 0) / totalCalls;
  const bestMultiplier = Math.max(...calls.map((c) => c.ath_multiplier));

  // Update KOL stats
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
}

// GET - Fetch Call by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();

    const { data: call, error } = await supabase
      .from('calls')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    return NextResponse.json({ call });
  } catch (error) {
    console.error('Error in GET /api/admin/calls/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update Call
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createAdminClient();

    // Fetch existing call with all fields (needed for recalculation)
    const { data: existingCall, error: fetchError } = await supabase
      .from('calls')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingCall) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    // Calculate new multipliers based on entry_market_cap
    const newEntryMcap = body.entry_market_cap;
    const athMcap = existingCall.ath_market_cap || newEntryMcap;
    const currentMcap = existingCall.current_market_cap || newEntryMcap;

    // Recalculate multipliers
    const athMultiplier = newEntryMcap > 0 ? athMcap / newEntryMcap : 0;
    const currentMultiplier = newEntryMcap > 0 ? currentMcap / newEntryMcap : 0;
    const isWin = athMultiplier >= 2;

    // Update Call with recalculated values
    const { data, error } = await supabase
      .from('calls')
      .update({
        kol_id: body.kol_id,
        token_address: body.token_address,
        token_symbol: body.token_symbol,
        entry_market_cap: newEntryMcap,
        entry_timestamp: body.entry_timestamp,
        tweet_url: body.tweet_url,
        notes: body.notes,
        // Recalculated fields
        ath_multiplier: Math.round(athMultiplier * 100) / 100,
        current_multiplier: Math.round(currentMultiplier * 100) / 100,
        is_win: isWin,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating Call:', error);
      return NextResponse.json({ error: 'Failed to update call' }, { status: 500 });
    }

    // Recalculate KOL stats after call update
    const oldKolId = existingCall.kol_id;
    const newKolId = body.kol_id;

    // Always recalculate the new KOL's stats
    await recalculateKOLStats(supabase, newKolId);

    // If KOL changed, also recalculate the old KOL's stats
    if (oldKolId !== newKolId) {
      await recalculateKOLStats(supabase, oldKolId);
    }

    return NextResponse.json({ call: data, message: 'Call updated successfully' });
  } catch (error) {
    console.error('Error in PUT /api/admin/calls/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove Call
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();

    // Fetch existing call to get kol_id for stats recalculation
    const { data: existingCall, error: fetchError } = await supabase
      .from('calls')
      .select('kol_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingCall) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    const kolId = existingCall.kol_id;

    // Delete Call
    const { error } = await supabase
      .from('calls')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting Call:', error);
      return NextResponse.json({ error: 'Failed to delete call' }, { status: 500 });
    }

    // Recalculate KOL stats after deletion
    await recalculateKOLStats(supabase, kolId);

    return NextResponse.json({ message: 'Call deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/calls/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
