import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { isApifyConfigured } from '@/lib/services/twitter';
import { validateAdminSessionFromRequest } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  // SECURITY: Always require admin authentication
  const isAdmin = validateAdminSessionFromRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  const debug: Record<string, unknown> = {};

  // Only show boolean flags for env — never expose values
  debug.env = {
    SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    APIFY_TOKEN: !!process.env.APIFY_API_TOKEN,
    BIRDEYE_KEY: !!process.env.BIRDEYE_API_KEY,
    CRON_SECRET: !!process.env.CRON_SECRET,
  };

  debug.apifyConfigured = isApifyConfigured();

  // Basic DB health check — no raw records
  try {
    const supabase = await createAdminClient();

    const { count: kolCount } = await supabase
      .from('kols')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: callCount } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true });

    const { count: tgCallCount } = await supabase
      .from('telegram_calls')
      .select('*', { count: 'exact', head: true });

    debug.counts = {
      kols: kolCount || 0,
      calls: callCount || 0,
      telegram_calls: tgCallCount || 0,
    };
  } catch (error) {
    debug.dbError = 'Connection failed';
  }

  return NextResponse.json(debug, { status: 200 });
}
