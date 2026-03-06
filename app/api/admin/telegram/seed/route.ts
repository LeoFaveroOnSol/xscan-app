import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getChannelInfo, isTelegramConfigured } from '@/lib/telegram/scanner';

// Default channels to seed
const DEFAULT_CHANNELS = [
  {
    channel_username: 'dustycalls',
    display_name: 'Dusty Calls',
    description: 'Solana token calls channel',
    is_auto_monitored: true,
  },
];

/**
 * Seed Telegram channels
 * POST /api/admin/telegram/seed
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const body = await request.json().catch(() => ({}));

    // Use provided channels or default
    const channelsToSeed = body.channels || DEFAULT_CHANNELS;

    const results = {
      created: 0,
      skipped: 0,
      errors: 0,
      channels: [] as any[],
    };

    for (const channelData of channelsToSeed) {
      const cleanUsername = channelData.channel_username.replace('@', '').replace('t.me/', '');

      // Check if already exists
      const { data: existing } = await supabase
        .from('telegram_channels')
        .select('id')
        .eq('channel_username', cleanUsername)
        .single();

      if (existing) {
        results.skipped++;
        results.channels.push({
          username: cleanUsername,
          status: 'skipped',
          reason: 'already exists',
        });
        continue;
      }

      // Try to get channel info from Telegram if configured
      let channelInfo = null;
      if (isTelegramConfigured()) {
        try {
          channelInfo = await getChannelInfo(cleanUsername);
        } catch (error) {
          console.log(`[Telegram] Could not fetch info for @${cleanUsername}:`, error);
        }
      }

      // Insert channel
      const { data, error } = await supabase
        .from('telegram_channels')
        .insert({
          channel_username: cleanUsername,
          channel_id: channelInfo?.id || null,
          display_name: channelInfo?.title || channelData.display_name || cleanUsername,
          description: channelInfo?.about || channelData.description || null,
          profile_image_url: channelInfo?.photo || channelData.profile_image_url || null,
          member_count: channelInfo?.participantsCount || channelData.member_count || 0,
          total_calls: 0,
          winning_calls: 0,
          winrate: 0,
          avg_multiplier: 0,
          best_multiplier: 0,
          is_verified: channelData.is_verified || false,
          is_active: true,
          is_auto_monitored: channelData.is_auto_monitored ?? true,
        })
        .select()
        .single();

      if (error) {
        console.error(`[Telegram] Error creating channel @${cleanUsername}:`, error);
        results.errors++;
        results.channels.push({
          username: cleanUsername,
          status: 'error',
          reason: error.message,
        });
      } else {
        results.created++;
        results.channels.push({
          username: cleanUsername,
          status: 'created',
          id: data.id,
        });
      }
    }

    return NextResponse.json({
      message: 'Telegram channels seeded',
      ...results,
    });
  } catch (error) {
    console.error('[Telegram] Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed channels', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
