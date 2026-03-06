import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET - Fetch KOL by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();

    const { data: kol, error } = await supabase
      .from('kols')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !kol) {
      return NextResponse.json({ error: 'KOL not found' }, { status: 404 });
    }

    return NextResponse.json({ kol });
  } catch (error) {
    console.error('Error in GET /api/admin/kols/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update KOL
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createAdminClient();

    // Check if KOL exists
    const { data: existingKol, error: fetchError } = await supabase
      .from('kols')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingKol) {
      return NextResponse.json({ error: 'KOL not found' }, { status: 404 });
    }

    // Update KOL
    const { data, error } = await supabase
      .from('kols')
      .update({
        twitter_handle: body.twitter_handle,
        display_name: body.display_name,
        bio: body.bio,
        profile_image_url: body.profile_image_url,
        follower_count: body.follower_count ? parseInt(body.follower_count) : null,
        wallet_address: body.wallet_address,
        is_active: body.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating KOL:', error);
      return NextResponse.json({ error: 'Failed to update KOL' }, { status: 500 });
    }

    return NextResponse.json({ kol: data, message: 'KOL updated successfully' });
  } catch (error) {
    console.error('Error in PUT /api/admin/kols/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove KOL
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();

    // Check if KOL exists
    const { data: existingKol, error: fetchError } = await supabase
      .from('kols')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingKol) {
      return NextResponse.json({ error: 'KOL not found' }, { status: 404 });
    }

    // Delete associated calls first (if not using CASCADE)
    await supabase
      .from('calls')
      .delete()
      .eq('kol_id', id);

    // Delete KOL
    const { error } = await supabase
      .from('kols')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting KOL:', error);
      return NextResponse.json({ error: 'Failed to delete KOL' }, { status: 500 });
    }

    return NextResponse.json({ message: 'KOL deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/kols/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
