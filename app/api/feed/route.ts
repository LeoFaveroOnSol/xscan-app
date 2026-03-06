import { NextRequest, NextResponse } from 'next/server';
import { createAnonClient } from '@/lib/supabase/server';
import { verifyHolderToken } from '@/lib/auth/holder-guard';

// Free users see calls with a 15-minute delay; holders see real-time
const FREE_DELAY_MINUTES = 5;

export async function GET(request: NextRequest) {
  try {
    const supabase = createAnonClient();
    const { searchParams } = new URL(request.url);

    const chain = searchParams.get('chain') || 'all';
    const timeFilter = searchParams.get('time') || '24h';
    const minMultiplier = parseFloat(searchParams.get('min_multiplier') || '0');
    const holderToken = searchParams.get('holder_token') || '';

    const isHolder = verifyHolderToken(holderToken);

    // Calculate time cutoff
    const now = new Date();
    const timeMap: Record<string, number> = {
      '1h': 1, '6h': 6, '24h': 24, '7d': 168,
    };
    const hours = timeMap[timeFilter] || 24;
    const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();

    // Free users: only show calls older than 15 minutes
    const delayCutoff = isHolder
      ? new Date().toISOString()
      : new Date(now.getTime() - FREE_DELAY_MINUTES * 60 * 1000).toISOString();

    let query = supabase
      .from('telegram_calls')
      .select('*, telegram_channels(display_name, channel_username, profile_image_url)')
      .gte('entry_timestamp', cutoff)
      .lte('entry_timestamp', delayCutoff)
      .order('entry_timestamp', { ascending: false })
      .limit(isHolder ? 200 : 100);

    if (chain !== 'all') {
      query = query.eq('chain', chain);
    }
    if (minMultiplier > 0) {
      query = query.gte('current_multiplier', minMultiplier);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Feed query error:', error);
      return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 });
    }

    return NextResponse.json({
      calls: data || [],
      filters: { chain, time: timeFilter, min_multiplier: minMultiplier },
      timestamp: now.toISOString(),
      holder: isHolder,
      delay: isHolder ? 0 : FREE_DELAY_MINUTES,
    });
  } catch (error) {
    console.error('Error in GET /api/feed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
