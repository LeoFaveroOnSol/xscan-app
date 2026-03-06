import { NextRequest, NextResponse } from 'next/server';

/**
 * Verify CRON_SECRET for protected API routes.
 * Returns null if authorized, or a 401 NextResponse if not.
 * 
 * Usage:
 *   const denied = verifyCronAuth(request);
 *   if (denied) return denied;
 */
export function verifyCronAuth(request: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;

  // CRON_SECRET MUST be configured — block all requests if missing
  if (!cronSecret) {
    console.error('[Auth] CRON_SECRET not configured — blocking request');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null; // authorized
}
