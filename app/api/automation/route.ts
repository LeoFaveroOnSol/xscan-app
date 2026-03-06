import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { automationLog } from '@/lib/automation/config';
import { verifyCronAuth } from '@/lib/auth/cron-guard';

/**
 * GET /api/automation
 * Get automation status and statistics
 */
export async function GET(request: NextRequest) {
  const denied = verifyCronAuth(request);
  if (denied) return denied;

  try {
    const supabase = await createAdminClient();

    // Get monitored KOLs count
    const { count: monitoredCount } = await supabase
      .from('kols')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('is_auto_monitored', true);

    // Get total active KOLs
    const { count: totalKolsCount } = await supabase
      .from('kols')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get auto-detected calls count
    const { count: autoDetectedCount } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('is_auto_detected', true);

    // Get recent scan logs
    const { data: recentScans } = await supabase
      .from('scan_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10);

    // Get last tweet scan
    const { data: lastTweetScan } = await supabase
      .from('scan_logs')
      .select('*')
      .eq('scan_type', 'tweets')
      .eq('status', 'completed')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    // Get last price update
    const { data: lastPriceUpdate } = await supabase
      .from('scan_logs')
      .select('*')
      .eq('scan_type', 'prices')
      .eq('status', 'completed')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    // Get calls being actively monitored
    const now = new Date().toISOString();
    const { count: activeMonitoringCount } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('is_auto_detected', true)
      .gte('monitoring_until', now);

    return NextResponse.json({
      status: 'ok',
      stats: {
        monitoredKols: monitoredCount || 0,
        totalKols: totalKolsCount || 0,
        autoDetectedCalls: autoDetectedCount || 0,
        activelyMonitoredCalls: activeMonitoringCount || 0,
      },
      lastScans: {
        tweets: lastTweetScan || null,
        prices: lastPriceUpdate || null,
      },
      recentScans: recentScans || [],
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    automationLog('error', `Failed to get automation status: ${errorMsg}`);
    return NextResponse.json({ error: 'Failed to get automation status' }, { status: 500 });
  }
}
