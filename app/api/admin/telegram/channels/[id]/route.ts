import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Get a single Telegram channel
 * GET /api/admin/telegram/channels/[id]
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from('telegram_channels')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ channel: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch channel' },
      { status: 500 }
    );
  }
}

/**
 * Update a Telegram channel
 * PATCH /api/admin/telegram/channels/[id]
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createAdminClient();
    const body = await request.json();

    const { display_name, description, is_active, is_auto_monitored } = body;

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (display_name !== undefined) updateData.display_name = display_name || null;
    if (description !== undefined) updateData.description = description || null;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (is_auto_monitored !== undefined) updateData.is_auto_monitored = is_auto_monitored;

    const { data, error } = await supabase
      .from('telegram_channels')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update channel', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ channel: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update channel' },
      { status: 500 }
    );
  }
}

/**
 * Delete a Telegram channel
 * DELETE /api/admin/telegram/channels/[id]
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createAdminClient();

    // First delete all calls for this channel (cascade should handle this, but be explicit)
    await supabase
      .from('telegram_calls')
      .delete()
      .eq('channel_id', id);

    // Then delete the channel
    const { error } = await supabase
      .from('telegram_channels')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete channel', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete channel' },
      { status: 500 }
    );
  }
}
