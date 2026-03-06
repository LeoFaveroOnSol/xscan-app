import { NextRequest, NextResponse } from 'next/server';
import { validateAdminSessionFromRequest } from '@/lib/auth/admin';
import { createServiceClient } from '@/lib/supabase/server';

function getPeriodDate(period: string): Date | null {
  const now = new Date();
  switch (period) {
    case '7d': return new Date(now.getTime() - 7 * 86400000);
    case '30d': return new Date(now.getTime() - 30 * 86400000);
    case '90d': return new Date(now.getTime() - 90 * 86400000);
    default: return null;
  }
}

async function fetchAllRows(supabase: any, since: Date | null) {
  const PAGE_SIZE = 1000;
  const allRows: any[] = [];
  let offset = 0;

  while (true) {
    let query = supabase
      .from('page_views')
      .select('path, referrer, country, device, session_id, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (since) {
      query = query.gte('created_at', since.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;

    allRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allRows;
}

export async function GET(request: NextRequest) {
  if (!validateAdminSessionFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '7d';
  const since = getPeriodDate(period);
  const supabase = createServiceClient();

  try {
    // Get real count
    let countQuery = supabase.from('page_views').select('*', { count: 'exact', head: true });
    if (since) {
      countQuery = countQuery.gte('created_at', since.toISOString());
    }
    const { count: totalViews } = await countQuery;

    // Fetch all rows with pagination
    const views = await fetchAllRows(supabase, since);

    const uniqueSessions = new Set(views.map((v: any) => v.session_id)).size;

    const pageCounts = new Map<string, number>();
    const refCounts = new Map<string, number>();
    const countryCounts = new Map<string, number>();
    const deviceCounts = new Map<string, number>();
    const dayCounts = new Map<string, number>();

    for (const v of views) {
      pageCounts.set(v.path, (pageCounts.get(v.path) || 0) + 1);
      if (v.referrer) refCounts.set(v.referrer, (refCounts.get(v.referrer) || 0) + 1);
      if (v.country) countryCounts.set(v.country, (countryCounts.get(v.country) || 0) + 1);
      deviceCounts.set(v.device, (deviceCounts.get(v.device) || 0) + 1);
      const day = v.created_at.slice(0, 10);
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
    }

    const sortMap = (m: Map<string, number>, limit = 10) =>
      Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([name, count]) => ({ name, count }));

    const viewsByDay = Array.from(dayCounts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    const kolCounts = new Map<string, number>();
    for (const v of views) {
      const match = v.path.match(/^\/kol\/([^/?]+)/);
      if (match) kolCounts.set(match[1], (kolCounts.get(match[1]) || 0) + 1);
    }

    return NextResponse.json({
      totalViews: totalViews ?? views.length,
      uniqueSessions,
      topPages: sortMap(pageCounts),
      viewsByDay,
      topReferrers: sortMap(refCounts),
      topCountries: sortMap(countryCounts),
      deviceBreakdown: sortMap(deviceCounts),
      topKols: sortMap(kolCounts),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
