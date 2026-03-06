import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient, createAnonClient } from '@/lib/supabase/server';
import type { TelegramChannel } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAnonClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sortBy') || 'winrate';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    let query = supabase
      .from('telegram_channels')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    if (search) {
      const sanitizedSearch = search.replace(/[%_\\]/g, '\\$&').slice(0, 50);
      query = query.or(`channel_username.ilike.%${sanitizedSearch}%,display_name.ilike.%${sanitizedSearch}%`);
    }

    const validSortFields = ['winrate', 'avg_multiplier', 'total_calls', 'best_multiplier', 'member_count'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'winrate';

    query = query
      .order(sortField, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching Telegram channels:', error);
      return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
    }

    return NextResponse.json({
      channels: data as TelegramChannel[],
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error in GET /api/telegram/channels:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient();

    const body = await request.json();

    const { channel_username, channel_id, display_name, description, profile_image_url, member_count } = body;

    if (!channel_username) {
      return NextResponse.json({ error: 'Channel username is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('telegram_channels')
      .insert({
        channel_username: channel_username.replace('@', ''),
        channel_id,
        display_name,
        description,
        profile_image_url,
        member_count: member_count || 0,
        total_calls: 0,
        winning_calls: 0,
        winrate: 0,
        avg_multiplier: 0,
        best_multiplier: 0,
        is_verified: false,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating Telegram channel:', error);
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Channel with this username already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 });
    }

    return NextResponse.json({ channel: data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/telegram/channels:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
