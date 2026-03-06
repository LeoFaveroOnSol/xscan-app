import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

const ADMIN_COOKIE_NAME = 'xscan_admin_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// In-memory session store (kept for backward compat, but middleware now uses HMAC)
const validSessions = new Map<string, { expiresAt: number }>();

// Generate a secure session token
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Sign a token with HMAC-SHA256 using SESSION_SECRET.
 * Returns "token.hmac" format that Edge middleware can validate.
 */
function signToken(token: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET not set in environment variables');
  }
  const hmac = crypto.createHmac('sha256', secret).update(token).digest('hex');
  return `${token}.${hmac}`;
}

/**
 * Extract the raw token from a signed cookie value ("token.hmac" -> "token").
 */
function extractToken(signedValue: string): string | null {
  const dotIndex = signedValue.lastIndexOf('.');
  if (dotIndex === -1) return null;
  return signedValue.substring(0, dotIndex);
}

// Timing-safe string comparison helper
function timingSafeCompare(input: string, expected: string): boolean {
  const maxLen = Math.max(input.length, expected.length, 64);
  const a = Buffer.from(input.padEnd(maxLen, '\0'));
  const b = Buffer.from(expected.padEnd(maxLen, '\0'));
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// Verify admin credentials (username + password)
export function verifyAdminCredentials(username: string, password: string): boolean {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminUsername || !adminPassword) {
    console.error('ADMIN_USERNAME or ADMIN_PASSWORD not set in environment variables');
    return false;
  }
  
  if (!username || !password) {
    return false;
  }
  
  const usernameMatch = timingSafeCompare(username.trim(), adminUsername.trim());
  const passwordMatch = timingSafeCompare(password.trim(), adminPassword.trim());
  
  return usernameMatch && passwordMatch;
}

// Backward compat — password-only check
export function verifyAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || !password) return false;
  return timingSafeCompare(password, adminPassword);
}

// Create admin session with HMAC-signed cookie
export async function createAdminSession(): Promise<string> {
  const cookieStore = await cookies();
  const randomPart = generateSessionToken();
  const expiresAt = Date.now() + SESSION_DURATION;
  // Token format: "randomhex.expiresAt" — expiry is embedded so Edge middleware can check it
  const token = `${randomPart}.${expiresAt}`;
  const signedCookie = signToken(token);
  
  // Also store in memory for server-side validation
  validSessions.set(token, { expiresAt });
  
  // Set signed cookie
  cookieStore.set(ADMIN_COOKIE_NAME, signedCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_DURATION / 1000,
    path: '/',
  });
  
  // Clear gate cookie after successful login
  cookieStore.delete('xscan_admin_gate');
  
  cleanupExpiredSessions();
  
  return token;
}

// Validate admin session from cookies - validates HMAC signature + expiry
export async function validateAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);

    if (!sessionCookie?.value) return false;

    const token = extractToken(sessionCookie.value);
    if (!token) return false;

    // Verify HMAC
    const secret = process.env.SESSION_SECRET;
    if (!secret) return false;
    const expectedHmac = crypto.createHmac('sha256', secret).update(token).digest('hex');
    const providedHmac = sessionCookie.value.substring(sessionCookie.value.lastIndexOf('.') + 1);
    if (!crypto.timingSafeEqual(Buffer.from(expectedHmac), Buffer.from(providedHmac))) return false;

    // Check expiry from token
    const tokenParts = token.split('.');
    if (tokenParts.length >= 2) {
      const expiresAt = parseInt(tokenParts[tokenParts.length - 1], 10);
      if (!isNaN(expiresAt) && expiresAt < Date.now()) return false;
    }

    return true;
  } catch {
    return false;
  }
}

// Validate admin session from request (for API routes)
export function validateAdminSessionFromRequest(request: NextRequest): boolean {
  try {
    const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME);

    if (!sessionCookie?.value) return false;

    const token = extractToken(sessionCookie.value);
    if (!token) return false;

    // Verify HMAC
    const secret = process.env.SESSION_SECRET;
    if (!secret) return false;
    const expectedHmac = crypto.createHmac('sha256', secret).update(token).digest('hex');
    const providedHmac = sessionCookie.value.substring(sessionCookie.value.lastIndexOf('.') + 1);
    if (!crypto.timingSafeEqual(Buffer.from(expectedHmac), Buffer.from(providedHmac))) return false;

    // Check expiry from token
    const tokenParts = token.split('.');
    if (tokenParts.length >= 2) {
      const expiresAt = parseInt(tokenParts[tokenParts.length - 1], 10);
      if (!isNaN(expiresAt) && expiresAt < Date.now()) return false;
    }

    return true;
  } catch {
    return false;
  }
}

// Clear admin session
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);
  
  // Remove from memory store
  if (sessionCookie?.value) {
    const token = extractToken(sessionCookie.value);
    if (token) validSessions.delete(token);
  }
  
  // Remove cookie
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

// Cleanup expired sessions (called periodically)
function cleanupExpiredSessions(): void {
  const now = Date.now();
  let cleaned = 0;
  
  // Use Array.from for compatibility
  const entries = Array.from(validSessions.entries());
  for (const [token, session] of entries) {
    if (session.expiresAt < now) {
      validSessions.delete(token);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`[Auth] Cleaned up ${cleaned} expired sessions`);
  }
}

// Run cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
}
