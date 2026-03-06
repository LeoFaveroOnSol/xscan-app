import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_COOKIE_NAME = 'xscan_admin_session';
const API_SECRET_HEADER = 'x-api-secret';

// Routes that require admin authentication for write operations
const PROTECTED_WRITE_ROUTES = [
  '/api/telegram',
  '/api/kols',
  '/api/calls',
  '/api/tokens',
  '/api/twitter',
  '/api/automation',
];

// Public write routes — these accept POST without admin auth (e.g. public forms)
const PUBLIC_WRITE_ROUTES = [
  '/api/applications',
];

// Routes that are completely public (read-only GET)
const PUBLIC_READ_ROUTES = [
  '/api/kols',
  '/api/telegram/calls',
  '/api/telegram/channels',
  '/api/tokens',
];

// Rate limit config for public read routes: 60 req/min per IP
// NOTE: In-memory rate limiting has limited effectiveness in serverless (Vercel)
// because each cold start gets a fresh Map. It still helps against sustained
// bursts within a single instance. For production-grade limiting, migrate to
// @upstash/ratelimit + Redis when budget allows.
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 60;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Cleanup rate limit entries every 2 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((entry, key) => {
      if (entry.resetAt < now) rateLimitStore.delete(key);
    });
  }, 2 * 60 * 1000);
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  let entry = rateLimitStore.get(ip);
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }
  entry.count++;
  rateLimitStore.set(ip, entry);
  return {
    allowed: entry.count <= RATE_LIMIT_MAX,
    remaining: Math.max(0, RATE_LIMIT_MAX - entry.count),
  };
}

// Stricter rate limit for write endpoints (applications, analytics)
const WRITE_RATE_LIMIT_MAX = 10; // 10 req/min
function checkWriteRateLimit(ip: string): { allowed: boolean } {
  const key = `w:${ip}`;
  const now = Date.now();
  let entry = rateLimitStore.get(key);
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }
  entry.count++;
  rateLimitStore.set(key, entry);
  return { allowed: entry.count <= WRITE_RATE_LIMIT_MAX };
}

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

/**
 * Validate HMAC-signed session cookie (Edge-compatible).
 * Cookie format: "token.hmac" where hmac = HMAC-SHA256(token, SESSION_SECRET)
 */
async function validateSessionCookie(cookieValue: string): Promise<boolean> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    console.error('[Middleware] SESSION_SECRET not set — all sessions rejected');
    return false;
  }

  const dotIndex = cookieValue.lastIndexOf('.');
  if (dotIndex === -1) return false;

  const token = cookieValue.substring(0, dotIndex);
  const providedHmac = cookieValue.substring(dotIndex + 1);

  if (!token || !providedHmac) return false;

  // Check expiry encoded in token: "randomhex.expiresAt"
  const tokenParts = token.split('.');
  if (tokenParts.length >= 2) {
    const expiresAt = parseInt(tokenParts[tokenParts.length - 1], 10);
    if (!isNaN(expiresAt) && expiresAt < Date.now()) return false;
  }

  try {
    const encoder = new TextEncoder();
    const keyBuf = new ArrayBuffer(secret.length);
    new Uint8Array(keyBuf).set(encoder.encode(secret));
    const key = await crypto.subtle.importKey(
      'raw',
      keyBuf,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const tokenBuf = new ArrayBuffer(token.length);
    new Uint8Array(tokenBuf).set(encoder.encode(token));
    const signature = await crypto.subtle.sign('HMAC', key, tokenBuf);
    const expectedHmac = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Constant-time comparison
    if (expectedHmac.length !== providedHmac.length) return false;
    let mismatch = 0;
    for (let i = 0; i < expectedHmac.length; i++) {
      mismatch |= expectedHmac.charCodeAt(i) ^ providedHmac.charCodeAt(i);
    }
    return mismatch === 0;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // --- Rate limit public read routes ---
  const isPublicRead = method === 'GET' && PUBLIC_READ_ROUTES.some(route => pathname.startsWith(route));
  if (isPublicRead) {
    const ip = getClientIP(request);
    const rl = checkRateLimit(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Remaining', String(rl.remaining));
    return response;
  }

  // --- Admin page routes ---
  if (pathname.startsWith('/admin')) {
    const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME);
    const hasValidSession = sessionCookie?.value && await validateSessionCookie(sessionCookie.value);

    // Gate: require secret key to even access login page
    // Access via /admin/login?key=SECRET — sets a cookie so subsequent nav works
    const ADMIN_PATH_SECRET = process.env.ADMIN_PATH_SECRET;
    const ADMIN_GATE_COOKIE = 'xscan_admin_gate';
    const gateKey = request.nextUrl.searchParams.get('key');
    const gateCookie = request.cookies.get(ADMIN_GATE_COOKIE);

    if (ADMIN_PATH_SECRET && !hasValidSession) {
      // If correct key is provided, set gate cookie and continue
      if (gateKey === ADMIN_PATH_SECRET) {
        const response = pathname === '/admin/login'
          ? NextResponse.next()
          : NextResponse.redirect(new URL('/admin/login', request.url));
        response.cookies.set(ADMIN_GATE_COOKIE, ADMIN_PATH_SECRET, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 3600, // 1 hour to complete login
          path: '/',
        });
        return response;
      }

      // No valid gate cookie? Return 404 — admin doesn't "exist"
      if (!gateCookie?.value || gateCookie.value !== ADMIN_PATH_SECRET) {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
      }
    }

    // Standard auth check: redirect to login if not authenticated
    if (pathname !== '/admin/login' && !hasValidSession) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // --- Admin API routes ---
  if (pathname.startsWith('/api/admin') && pathname !== '/api/admin/auth') {
    const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME);
    if (!sessionCookie?.value || !(await validateSessionCookie(sessionCookie.value))) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to admin panel.' },
        { status: 401 }
      );
    }
  }

  // --- Cron routes ---
  if (pathname.startsWith('/api/cron')) {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid cron secret.' },
        { status: 401 }
      );
    }
  }

  // --- Debug routes ---
  if (pathname.startsWith('/api/debug')) {
    const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME);
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev && (!sessionCookie?.value || !(await validateSessionCookie(sessionCookie.value)))) {
      return NextResponse.json(
        { error: 'Debug routes are restricted.' },
        { status: 403 }
      );
    }
  }

  // --- Protect write operations ---
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const isPublicWrite = PUBLIC_WRITE_ROUTES.some(route => pathname.startsWith(route));

    // Rate limit public write routes
    if (isPublicWrite) {
      const ip = getClientIP(request);
      const wrl = checkWriteRateLimit(ip);
      if (!wrl.allowed) {
        return NextResponse.json(
          { error: 'Too many requests. Try again later.' },
          { status: 429, headers: { 'Retry-After': '60' } }
        );
      }
    }
    const isProtectedRoute = !isPublicWrite && PROTECTED_WRITE_ROUTES.some(route => pathname.startsWith(route));
    if (isProtectedRoute) {
      const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME);
      const apiSecret = request.headers.get(API_SECRET_HEADER);
      const envApiSecret = process.env.API_SECRET;

      // Allow if valid signed session
      if (sessionCookie?.value && await validateSessionCookie(sessionCookie.value)) {
        return NextResponse.next();
      }

      // Allow if valid API secret
      if (envApiSecret && apiSecret === envApiSecret) {
        return NextResponse.next();
      }

      return NextResponse.json(
        { error: 'Unauthorized. Admin authentication or API secret required for write operations.' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/:path*',
  ],
};
