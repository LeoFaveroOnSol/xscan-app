import { NextRequest, NextResponse } from 'next/server';
import { createAnonClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q') || '';
    const supabase = createAnonClient();

    let query = supabase
      .from('telegram_channels')
      .select('id, channel_username, display_name, profile_image_url')
      .eq('is_active', true)
      .order('total_calls', { ascending: false })
      .limit(20);

    if (q.length > 0) {
      const sanitizedQ = q.replace(/[%_\\]/g, '\\$&').slice(0, 50);
      query = query.or(`channel_username.ilike.%${sanitizedQ}%,display_name.ilike.%${sanitizedQ}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/telegram/search:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
