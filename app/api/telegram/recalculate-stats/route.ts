import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyCronAuth } from '@/lib/auth/cron-guard';

/**
 * Recalculate stats for all telegram channels (or a specific one)
 * GET /api/telegram/recalculate-stats?channel_id=xxx (optional)
 */
export async function GET(request: NextRequest) {
  const denied = verifyCronAuth(request);
  if (denied) return denied;

  try {
    const supabase = await createAdminClient();

    // Parse channel_id from query params
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channel_id');

    // Get channels to update
    let channelsQuery = supabase
      .from('telegram_channels')
      .select('id, channel_username')
      .eq('is_active', true);

    if (channelId) {
      channelsQuery = channelsQuery.eq('id', channelId);
    }

    const { data: channels, error: channelsError } = await channelsQuery;

    if (channelsError || !channels || channels.length === 0) {
      return NextResponse.json({
        success: false,
        error: channelsError?.message || 'No channels found'
      });
    }

    console.log(`[Recalculate Stats] Processing ${channels.length} channels`);

    const results: Array<{
      channelId: string;
      username: string;
      totalCalls: number;
      winningCalls: number;
      winrate: number;
      avgMultiplier: number;
      bestMultiplier: number;
    }> = [];

    for (const channel of channels) {
      // Get all calls for this channel
      const { data: channelCalls } = await supabase
        .from('telegram_calls')
        .select('ath_multiplier, is_win')
        .eq('channel_id', channel.id)
        .eq('status', 'active');

      if (channelCalls && channelCalls.length > 0) {
        const totalCalls = channelCalls.length;
        const winningCalls = channelCalls.filter(c => c.is_win).length;
        const avgMultiplier = channelCalls.reduce((acc, c) => acc + (c.ath_multiplier || 1), 0) / totalCalls;
        const bestMultiplier = Math.max(...channelCalls.map(c => c.ath_multiplier || 1));
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

        results.push({
          channelId: channel.id,
          username: channel.channel_username,
          totalCalls,
          winningCalls,
          winrate,
          avgMultiplier: Math.round(avgMultiplier * 100) / 100,
          bestMultiplier: Math.round(bestMultiplier * 100) / 100,
        });

        console.log(`[Recalculate Stats] ${channel.channel_username}: ${totalCalls} calls, ${winrate}% winrate, ${avgMultiplier.toFixed(2)}x avg`);
      } else {
        // No calls - reset stats
        await supabase
          .from('telegram_channels')
          .update({
            total_calls: 0,
            winning_calls: 0,
            winrate: 0,
            avg_multiplier: 0,
            best_multiplier: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', channel.id);

        results.push({
          channelId: channel.id,
          username: channel.channel_username,
          totalCalls: 0,
          winningCalls: 0,
          winrate: 0,
          avgMultiplier: 0,
          bestMultiplier: 0,
        });
      }
    }

    return NextResponse.json({
      success: true,
      channelsUpdated: results.length,
      results,
    });
  } catch (error) {
    console.error('[Recalculate Stats] Error:', error);
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
