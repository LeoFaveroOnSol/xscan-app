import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Clean a telegram channel - keep only specified calls
 * POST /api/admin/telegram/clean-channel
 * Body: { channel_username: string, keep_symbols: string[] }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createAdminClient();
    const body = await request.json();
    const { channel_username, keep_symbols } = body;

    if (!channel_username || !keep_symbols || !Array.isArray(keep_symbols)) {
      return NextResponse.json({
        success: false,
        error: 'Missing channel_username or keep_symbols array'
      }, { status: 400 });
    }

    // 1. Find channel
    const { data: channel, error: channelError } = await supabase
      .from('telegram_channels')
      .select('id, channel_username, display_name')
      .or(`channel_username.ilike.%${channel_username.replace(/[%_\\]/g, '\\$&').slice(0, 50)}%,display_name.ilike.%${channel_username.replace(/[%_\\]/g, '\\$&').slice(0, 50)}%`)
      .single();

    if (channelError || !channel) {
      return NextResponse.json({
        success: false,
        error: `Channel not found: ${channel_username}`
      }, { status: 404 });
    }

    // 2. Get all calls for this channel
    const { data: calls } = await supabase
      .from('telegram_calls')
      .select('id, token_symbol, token_name')
      .eq('channel_id', channel.id);

    if (!calls || calls.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No calls found for this channel'
      });
    }

    // 3. Find calls to keep (case-insensitive match)
    const keepSymbolsLower = keep_symbols.map(s => s.toLowerCase());
    const callsToKeep = calls.filter(c =>
      keepSymbolsLower.some(symbol =>
        c.token_symbol?.toLowerCase().includes(symbol) ||
        c.token_name?.toLowerCase().includes(symbol)
      )
    );

    if (callsToKeep.length === 0) {
      return NextResponse.json({
        success: false,
        error: `No calls found matching: ${keep_symbols.join(', ')}`
      });
    }

    const keepIds = callsToKeep.map(c => c.id);
    const callsToDelete = calls.filter(c => !keepIds.includes(c.id));

    // 4. Delete calls not in keep list
    if (callsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('telegram_calls')
        .delete()
        .eq('channel_id', channel.id)
        .not('id', 'in', `(${keepIds.join(',')})`);

      if (deleteError) {
        return NextResponse.json({
          success: false,
          error: deleteError.message
        }, { status: 500 });
      }
    }

    // 5. Recalculate channel stats
    const { data: remainingCalls } = await supabase
      .from('telegram_calls')
      .select('ath_multiplier, is_win')
      .eq('channel_id', channel.id);

    if (remainingCalls && remainingCalls.length > 0) {
      const totalCalls = remainingCalls.length;
      const winningCalls = remainingCalls.filter(c => c.is_win).length;
      const avgMultiplier = remainingCalls.reduce((acc, c) => acc + (c.ath_multiplier || 1), 0) / totalCalls;
      const bestMultiplier = Math.max(...remainingCalls.map(c => c.ath_multiplier || 1));
      const winrate = Math.round((winningCalls / totalCalls) * 100 * 100) / 100;

      await supabase
        .from('telegram_channels')
        .update({
          total_calls: totalCalls,
          winning_calls: winningCalls,
          winrate,
          avg_multiplier: Math.round(avgMultiplier * 100) / 100,
          best_multiplier: Math.round(bestMultiplier * 100) / 100,
          updated_at: new Date().toISOString(),
        })
        .eq('id', channel.id);
    }

    return NextResponse.json({
      success: true,
      channel: channel.display_name || channel.channel_username,
      deleted: callsToDelete.length,
      kept: callsToKeep.map(c => c.token_symbol),
      deletedCalls: callsToDelete.map(c => c.token_symbol),
    });
  } catch (error) {
    console.error('[Clean Channel] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
