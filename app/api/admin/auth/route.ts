import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCredentials, createAdminSession, clearAdminSession, validateAdminSessionFromRequest } from '@/lib/auth/admin';
import { checkRateLimit, getClientIP, LOGIN_RATE_LIMIT } from '@/lib/security/rate-limit';

// POST - Login
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(`login:${clientIP}`, LOGIN_RATE_LIMIT);
    
    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.blockedUntil || rateLimit.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { 
          error: 'Too many login attempts. Please try again later.',
          retryAfter,
        },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
          },
        }
      );
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    if (!verifyAdminCredentials(username, password)) {
      // Add delay to prevent timing attacks
      await new Promise((r) => setTimeout(r, 1000 + Math.random() * 500));
      return NextResponse.json(
        { 
          error: 'Invalid credentials',
          attemptsRemaining: rateLimit.remaining,
        },
        { 
          status: 401,
          headers: {
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          },
        }
      );
    }

    await createAdminSession();

    return NextResponse.json({ success: true, message: 'Logged in successfully' });
  } catch (error) {
    console.error('Error in admin login:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Check session status
export async function GET(request: NextRequest) {
  try {
    const isValid = validateAdminSessionFromRequest(request);
    return NextResponse.json({ authenticated: isValid });
  } catch (error) {
    console.error('Error checking admin session:', error);
    return NextResponse.json({ authenticated: false });
  }
}

// DELETE - Logout
export async function DELETE() {
  try {
    await clearAdminSession();
    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error in admin logout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
