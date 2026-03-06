import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// In-memory rate limit: session_id:path -> timestamp
const recentHits = new Map<string, number>();

// Clean up every 60s
setInterval(() => {
  const cutoff = Date.now() - 30000;
  recentHits.forEach((ts, key) => {
    if (ts < cutoff) recentHits.delete(key);
  });
}, 60000);

function parseDevice(ua: string): string {
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone/i.test(ua)) return 'mobile';
  return 'desktop';
}

function parseBrowser(ua: string): string {
  if (/firefox/i.test(ua)) return 'Firefox';
  if (/edg/i.test(ua)) return 'Edge';
  if (/chrome/i.test(ua)) return 'Chrome';
  if (/safari/i.test(ua)) return 'Safari';
  if (/opera|opr/i.test(ua)) return 'Opera';
  return 'Other';
}

function hashSession(ip: string, ua: string): string {
  return crypto.createHash('sha256').update(`${ip}:${ua}`).digest('hex').slice(0, 16);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const path = body.path;
    if (!path || typeof path !== 'string') {
      return new NextResponse(null, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') || '0.0.0.0';
    const ua = request.headers.get('user-agent') || '';
    const session_id = hashSession(ip, ua);

    // Rate limit: 1 per path per 30s
    const dedupKey = `${session_id}:${path}`;
    const now = Date.now();
    if (recentHits.has(dedupKey) && now - recentHits.get(dedupKey)! < 30000) {
      return new NextResponse(null, { status: 200 });
    }
    recentHits.set(dedupKey, now);

    const country = request.headers.get('x-vercel-ip-country') || null;

    const supabase = createServiceClient();
    await supabase.from('page_views').insert({
      path: path.slice(0, 500),
      referrer: body.referrer?.slice(0, 500) || null,
      country,
      device: parseDevice(ua),
      browser: parseBrowser(ua),
      session_id,
      utm_source: body.utm_source?.slice(0, 200) || null,
      utm_medium: body.utm_medium?.slice(0, 200) || null,
      utm_campaign: body.utm_campaign?.slice(0, 200) || null,
    });

    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
