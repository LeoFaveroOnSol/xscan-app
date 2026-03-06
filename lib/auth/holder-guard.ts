import * as crypto from 'crypto';

/**
 * Verify a holder token issued by /api/holder/auth
 * Format: wallet.expiry.hmac
 * Returns true if valid and not expired
 */
export function verifyHolderToken(token: string): boolean {
  if (!token) return false;

  const secret = process.env.HOLDER_ACCESS_SECRET;
  if (!secret) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [wallet, expiryStr, providedHmac] = parts;
  const expiry = parseInt(expiryStr, 10);

  // Check expiry
  if (isNaN(expiry) || expiry < Date.now()) return false;

  // Verify HMAC
  const payload = `${wallet}.${expiryStr}`;
  const expectedHmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  // Constant-time comparison
  if (expectedHmac.length !== providedHmac.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedHmac, 'hex'),
      Buffer.from(providedHmac, 'hex')
    );
  } catch {
    return false;
  }
}
