import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient, createAnonClient } from '@/lib/supabase/server';
import { verifyHolderToken } from '@/lib/auth/holder-guard';
import { getTokenData } from '@/lib/api/dexscreener';
import { calculateMultiplier } from '@/lib/utils/calculations';

const FREE_DELAY_MINUTES = 5;

export async function GET(request: NextRequest) {
  try {
    const supabase = createAnonClient();
    const { searchParams } = new URL(request.url);

    const channelId = searchParams.get('channel_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const holderToken = searchParams.get('holder_token') || '';
    const isHolder = verifyHolderToken(holderToken);

    const offset = (page - 1) * limit;

    const delayCutoff = isHolder
      ? new Date().toISOString()
      : new Date(Date.now() - FREE_DELAY_MINUTES * 60 * 1000).toISOString();

    let query = supabase
      .from('telegram_calls')
      .select('*, telegram_channels(channel_username, display_name, profile_image_url)', { count: 'exact' })
      .lte('entry_timestamp', delayCutoff);

    if (channelId) {
      query = query.eq('channel_id', channelId);
    }

    query = query
      .order('entry_timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching Telegram calls:', error);
      return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 });
    }

    return NextResponse.json({
      calls: data || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error in GET /api/telegram/calls:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient();

    const body = await request.json();

    const { channel_id, token_address, entry_market_cap, entry_timestamp, message_url, message_text, notes } = body;

    if (!channel_id || !token_address || !entry_market_cap) {
      return NextResponse.json(
        { error: 'channel_id, token_address, and entry_market_cap are required' },
        { status: 400 }
      );
    }

    // Fetch token data from DexScreener
    const tokenData = await getTokenData(token_address);

    // Calculate initial multiplier
    const currentMcap = tokenData?.marketCap || entry_market_cap;
    const multiplier = calculateMultiplier(entry_market_cap, currentMcap);

    const { data, error } = await supabase
      .from('telegram_calls')
      .insert({
        channel_id,
        token_address,
        token_symbol: tokenData?.symbol || null,
        token_name: tokenData?.name || null,
        token_image_url: tokenData?.imageUrl || null,
        entry_market_cap,
        entry_price: tokenData?.price || null,
        entry_timestamp: entry_timestamp || new Date().toISOString(),
        current_market_cap: currentMcap,
        current_price: tokenData?.price || null,
        ath_market_cap: currentMcap,
        ath_price: tokenData?.price || null,
        ath_timestamp: new Date().toISOString(),
        current_multiplier: multiplier,
        ath_multiplier: multiplier,
        is_win: multiplier >= 2,
        status: 'active',
        message_url,
        message_text,
        notes,
        last_price_update: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating Telegram call:', error);
      return NextResponse.json({ error: 'Failed to create call' }, { status: 500 });
    }

    return NextResponse.json({ call: data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/telegram/calls:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
