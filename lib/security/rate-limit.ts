/**
 * Simple in-memory rate limiter
 * For production with multiple instances, use Redis (@upstash/ratelimit)
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
  blockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((entry, key) => {
      if (entry.resetAt < now && (!entry.blockedUntil || entry.blockedUntil < now)) {
        rateLimitStore.delete(key);
      }
    });
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  blockDurationMs?: number; // How long to block after limit exceeded
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  blockedUntil?: number;
}

/**
 * Check rate limit for a given identifier (e.g., IP address)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const { windowMs, maxRequests, blockDurationMs = 0 } = config;
  
  let entry = rateLimitStore.get(identifier);
  
  // Check if currently blocked
  if (entry?.blockedUntil && entry.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      blockedUntil: entry.blockedUntil,
    };
  }
  
  // Reset if window expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
  }
  
  entry.count++;
  
  // Check if limit exceeded
  if (entry.count > maxRequests) {
    if (blockDurationMs > 0) {
      entry.blockedUntil = now + blockDurationMs;
    }
    rateLimitStore.set(identifier, entry);
    
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      blockedUntil: entry.blockedUntil,
    };
  }
  
  rateLimitStore.set(identifier, entry);
  
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Get client IP from request
 */
export function getClientIP(request: Request): string {
  // Check common headers for proxied requests
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback
  return 'unknown';
}

/**
 * Login-specific rate limit config
 * 5 attempts per 15 minutes, then blocked for 30 minutes
 */
export const LOGIN_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000,      // 15 minutes
  maxRequests: 5,                 // 5 attempts
  blockDurationMs: 30 * 60 * 1000, // 30 minute block
};

/**
 * API rate limit config
 * 100 requests per minute
 */
export const API_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000,           // 1 minute
  maxRequests: 100,              // 100 requests
  blockDurationMs: 60 * 1000,    // 1 minute block
};
