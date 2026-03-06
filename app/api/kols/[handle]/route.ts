import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createServiceClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;
    const supabase = createServiceClient();

    // Fetch KOL by twitter handle
    const { data: kol, error: kolError } = await supabase
      .from('kols')
      .select('*')
      .eq('twitter_handle', handle.replace('@', ''))
      .eq('is_active', true)
      .single();

    if (kolError || !kol) {
      return NextResponse.json({ error: 'KOL not found' }, { status: 404 });
    }

    const includeDeleted = request.nextUrl.searchParams.get('include_deleted') === 'true';

    // Fetch calls for this KOL
    let callsQuery = supabase
      .from('calls')
      .select('*')
      .eq('kol_id', kol.id)
      .order('entry_timestamp', { ascending: false });

    if (!includeDeleted) {
      callsQuery = callsQuery.eq('is_deleted', false);
    }

    const { data: calls, error: callsError } = await callsQuery;

    if (callsError) {
      console.error('Error fetching calls:', callsError);
    }

    const allCalls = calls || [];
    const activeCalls = allCalls.filter(c => !c.is_deleted);
    const deletedCalls = allCalls.filter(c => c.is_deleted);

    return NextResponse.json({
      kol,
      calls: activeCalls,
      deletedCalls: includeDeleted ? deletedCalls : [],
    });
  } catch (error) {
    console.error('Error in GET /api/kols/[handle]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH - Update a KOL's profile (for manual overrides like profile image)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;
    const body = await request.json();
    const supabase = await createAdminClient();
    const cleanHandle = handle.replace('@', '');

    // Get existing KOL
    const { data: kol, error: fetchError } = await supabase
      .from('kols')
      .select('*')
      .eq('twitter_handle', cleanHandle)
      .single();

    if (fetchError || !kol) {
      return NextResponse.json({ error: 'KOL not found' }, { status: 404 });
    }

    // Allowed fields to update manually
    const allowedFields = ['display_name', 'bio', 'profile_image_url', 'wallet_address'];
    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updateData.updated_at = new Date().toISOString();

    const { data: updated, error: updateError } = await supabase
      .from('kols')
      .update(updateData)
      .eq('id', kol.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating KOL:', updateError);
      return NextResponse.json({ error: 'Failed to update KOL' }, { status: 500 });
    }

    return NextResponse.json({ kol: updated, message: 'KOL updated successfully' });
  } catch (error) {
    console.error('Error in PATCH /api/kols/[handle]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
