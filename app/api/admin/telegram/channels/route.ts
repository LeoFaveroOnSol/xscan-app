import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Add a new Telegram channel
 * POST /api/admin/telegram/channels
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const body = await request.json();

    const { channel_username, channel_name, description, channel_image_url } = body;

    if (!channel_username) {
      return NextResponse.json(
        { error: 'Channel username is required' },
        { status: 400 }
      );
    }

    const cleanUsername = channel_username.replace('@', '').replace('t.me/', '');

    // Check if already exists
    const { data: existing } = await supabase
      .from('telegram_channels')
      .select('id')
      .eq('channel_username', cleanUsername)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Channel already exists' },
        { status: 409 }
      );
    }

    // Insert channel
    const { data, error } = await supabase
      .from('telegram_channels')
      .insert({
        channel_username: cleanUsername,
        display_name: channel_name || cleanUsername,
        description: description || null,
        profile_image_url: channel_image_url || null,
        total_calls: 0,
        winning_calls: 0,
        winrate: 0,
        avg_multiplier: 0,
        best_multiplier: 0,
        is_verified: false,
        is_active: true,
        is_auto_monitored: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[Telegram] Error creating channel:', error);
      return NextResponse.json(
        { error: 'Failed to create channel', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      channel: data,
    });
  } catch (error) {
    console.error('[Telegram] Create channel error:', error);
    return NextResponse.json(
      { error: 'Failed to create channel', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Get all Telegram channels
 * GET /api/admin/telegram/channels
 */
export async function GET() {
  try {
    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from('telegram_channels')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch channels' },
        { status: 500 }
      );
    }

    return NextResponse.json({ channels: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch channels' },
      { status: 500 }
    );
  }
}
