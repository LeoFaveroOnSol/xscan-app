/**
 * Sanitize string input to prevent XSS attacks
 * Removes or escapes potentially dangerous characters
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input) return '';

  return input
    // Remove null bytes
    .replace(/\0/g, '')
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    // Remove potential script injections
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

/**
 * Sanitize for database storage (less strict, preserves more characters)
 * Use this for text that will be stored and displayed later
 */
export function sanitizeForStorage(input: string | null | undefined): string {
  if (!input) return '';

  return input
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove potential script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=/gi, '')
    // Remove javascript: and data: protocols
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .trim();
}

/**
 * Validate and sanitize Twitter handle
 */
export function sanitizeTwitterHandle(handle: string | null | undefined): string {
  if (!handle) return '';

  // Remove @ if present and only allow valid characters
  return handle
    .replace(/^@/, '')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .slice(0, 15); // Twitter handles max 15 chars
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitize URL - only allow http/https protocols
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return '';

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}
