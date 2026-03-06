import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createAnonClient } from '@/lib/supabase/server';
import type { KOL } from '@/types/database';
import { sanitizeForStorage, sanitizeTwitterHandle, sanitizeUrl } from '@/lib/utils/sanitize';
import { validateAdminSessionFromRequest } from '@/lib/auth/admin';

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
      .from('kols')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    if (search) {
      // Sanitize search input to prevent SQL injection
      const sanitizedSearch = search.replace(/[%_\\]/g, '\\$&').slice(0, 50);
      query = query.or(`twitter_handle.ilike.%${sanitizedSearch}%,display_name.ilike.%${sanitizedSearch}%`);
    }

    const validSortFields = ['winrate', 'avg_multiplier', 'total_calls', 'best_multiplier'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'winrate';

    query = query
      .order(sortField, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching KOLs:', error);
      return NextResponse.json({ error: 'Failed to fetch KOLs' }, { status: 500 });
    }

    return NextResponse.json({
      kols: data as KOL[],
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error in GET /api/kols:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // SECURITY: Admin authentication required to create KOLs
  if (!validateAdminSessionFromRequest(request)) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 401 }
    );
  }

  try {
    const supabase = await createAdminClient();
    const body = await request.json();

    const { twitter_handle, display_name, bio, profile_image_url, follower_count, wallet_address } = body;

    if (!twitter_handle) {
      return NextResponse.json({ error: 'Twitter handle is required' }, { status: 400 });
    }

    // Sanitize all inputs
    const sanitizedHandle = sanitizeTwitterHandle(twitter_handle);
    if (!sanitizedHandle) {
      return NextResponse.json({ error: 'Invalid Twitter handle' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('kols')
      .insert({
        twitter_handle: sanitizedHandle,
        display_name: display_name ? sanitizeForStorage(display_name) : null,
        bio: bio ? sanitizeForStorage(bio) : null,
        profile_image_url: profile_image_url ? sanitizeUrl(profile_image_url) : null,
        follower_count: follower_count || 0,
        wallet_address: wallet_address || null,
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
      console.error('Error creating KOL:', error);
      if (error.code === '23505') {
        return NextResponse.json({ error: 'KOL with this Twitter handle already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to create KOL' }, { status: 500 });
    }

    return NextResponse.json({ kol: data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/kols:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
