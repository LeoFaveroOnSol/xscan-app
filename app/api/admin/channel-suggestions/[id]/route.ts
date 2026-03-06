import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/channel-suggestions/[id]
 * Get a single suggestion
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from('channel_suggestions')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    return NextResponse.json({ suggestion: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/channel-suggestions/[id]
 * Approve or reject a suggestion
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createAdminClient();
    const body = await request.json();
    const { action, rejection_reason } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Get the suggestion
    const { data: suggestion, error: fetchError } = await supabase
      .from('channel_suggestions')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    if (suggestion.status !== 'pending') {
      return NextResponse.json(
        { error: `Suggestion already ${suggestion.status}` },
        { status: 400 }
      );
    }

    if (action === 'reject') {
      // Reject the suggestion
      const { error: updateError } = await supabase
        .from('channel_suggestions')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'admin',
          rejection_reason: rejection_reason || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Suggestion rejected',
      });
    }

    // Approve: Create the channel
    const cleanUsername = suggestion.channel_username.replace('@', '').replace('t.me/', '');

    // Check if channel already exists
    const { data: existingChannel } = await supabase
      .from('telegram_channels')
      .select('id')
      .eq('channel_username', cleanUsername)
      .single();

    if (existingChannel) {
      // Link to existing channel
      await supabase
        .from('channel_suggestions')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'admin',
          approved_channel_id: existingChannel.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id);

      return NextResponse.json({
        success: true,
        message: 'Channel already exists, suggestion approved',
        channel_id: existingChannel.id,
        already_existed: true,
      });
    }

    // Create new channel
    const { data: newChannel, error: createError } = await supabase
      .from('telegram_channels')
      .insert({
        channel_username: cleanUsername,
        display_name: suggestion.display_name || cleanUsername,
        description: suggestion.description || null,
        total_calls: 0,
        winning_calls: 0,
        winrate: 0,
        avg_multiplier: 0,
        best_multiplier: 0,
        is_verified: false,
        is_active: true,
        is_auto_monitored: true,
        full_history_scanned: false,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { error: 'Failed to create channel', message: createError.message },
        { status: 500 }
      );
    }

    // Update suggestion with approved status
    await supabase
      .from('channel_suggestions')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'admin',
        approved_channel_id: newChannel.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    return NextResponse.json({
      success: true,
      message: 'Channel created and suggestion approved',
      channel: newChannel,
      scan_required: true,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/channel-suggestions/[id]
 * Delete a suggestion
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createAdminClient();

    const { error } = await supabase
      .from('channel_suggestions')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
