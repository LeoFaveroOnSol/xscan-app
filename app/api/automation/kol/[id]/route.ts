import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { automationLog } from '@/lib/automation/config';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/automation/kol/[id]
 * Get automation status for a specific KOL
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();

    const { data: kol, error } = await supabase
      .from('kols')
      .select('id, twitter_handle, is_auto_monitored, last_scan_at')
      .eq('id', id)
      .single();

    if (error || !kol) {
      return NextResponse.json({ error: 'KOL not found' }, { status: 404 });
    }

    // Get auto-detected calls for this KOL
    const { count: autoCallsCount } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('kol_id', id)
      .eq('is_auto_detected', true);

    return NextResponse.json({
      kol: {
        id: kol.id,
        twitter_handle: kol.twitter_handle,
        is_auto_monitored: kol.is_auto_monitored,
        last_scan_at: kol.last_scan_at,
      },
      stats: {
        autoDetectedCalls: autoCallsCount || 0,
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    automationLog('error', `Failed to get KOL automation status: ${errorMsg}`);
    return NextResponse.json({ error: 'Failed to get KOL automation status' }, { status: 500 });
  }
}

/**
 * PATCH /api/automation/kol/[id]
 * Toggle automation for a specific KOL
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { is_auto_monitored } = body;

    if (typeof is_auto_monitored !== 'boolean') {
      return NextResponse.json({ error: 'is_auto_monitored must be a boolean' }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Update KOL
    const { data: kol, error } = await supabase
      .from('kols')
      .update({
        is_auto_monitored,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, twitter_handle, is_auto_monitored')
      .single();

    if (error) {
      automationLog('error', `Failed to update KOL automation: ${error.message}`);
      return NextResponse.json({ error: 'Failed to update KOL' }, { status: 500 });
    }

    if (!kol) {
      return NextResponse.json({ error: 'KOL not found' }, { status: 404 });
    }

    automationLog(
      'info',
      `Automation ${is_auto_monitored ? 'enabled' : 'disabled'} for @${kol.twitter_handle}`
    );

    return NextResponse.json({
      message: `Automation ${is_auto_monitored ? 'enabled' : 'disabled'} for @${kol.twitter_handle}`,
      kol,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    automationLog('error', `Failed to toggle KOL automation: ${errorMsg}`);
    return NextResponse.json({ error: 'Failed to toggle automation' }, { status: 500 });
  }
}
