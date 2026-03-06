import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createAnonClient } from '@/lib/supabase/server';
import { verifyHolderToken } from '@/lib/auth/holder-guard';
import { getTokenData } from '@/lib/api/dexscreener';
import { calculateMultiplier } from '@/lib/utils/calculations';

// Free users see calls with a 15-minute delay
const FREE_DELAY_MINUTES = 5;

export async function GET(request: NextRequest) {
  try {
    const supabase = createAnonClient();
    const { searchParams } = new URL(request.url);

    const kolId = searchParams.get('kol_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const holderToken = searchParams.get('holder_token') || '';
    const isHolder = verifyHolderToken(holderToken);

    const offset = (page - 1) * limit;

    // Free users: only see calls older than 15 minutes
    const delayCutoff = isHolder
      ? new Date().toISOString()
      : new Date(Date.now() - FREE_DELAY_MINUTES * 60 * 1000).toISOString();

    let query = supabase
      .from('calls')
      .select('*, kols(twitter_handle, display_name, profile_image_url)', { count: 'exact' })
      .or('is_deleted.is.null,is_deleted.eq.false')
      .lte('entry_timestamp', delayCutoff);

    if (kolId) {
      query = query.eq('kol_id', kolId);
    }

    query = query
      .order('entry_timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching calls:', error);
      return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 });
    }

    return NextResponse.json({
      calls: data || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error in GET /api/calls:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Admin auth check
    const authHeader = request.headers.get('authorization');
    const secret = process.env.CRON_SECRET;
    if (!secret || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createAdminClient();

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { kol_id, token_address, entry_market_cap, entry_timestamp, tweet_url, notes } = body;

    if (!kol_id || !token_address || !entry_market_cap) {
      return NextResponse.json(
        { error: 'kol_id, token_address, and entry_market_cap are required' },
        { status: 400 }
      );
    }

    // Fetch token data from DexScreener
    const tokenData = await getTokenData(String(token_address));

    // Calculate initial multiplier (will be updated via cron)
    const currentMcap = tokenData?.marketCap || Number(entry_market_cap);
    const multiplier = calculateMultiplier(Number(entry_market_cap), currentMcap);

    const { data, error } = await supabase
      .from('calls')
      .insert({
        kol_id,
        token_address,
        token_symbol: tokenData?.symbol || null,
        token_name: tokenData?.name || null,
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
        tweet_url,
        notes,
        last_price_update: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating call:', error);
      return NextResponse.json({ error: 'Failed to create call' }, { status: 500 });
    }

    return NextResponse.json({ call: data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/calls:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
