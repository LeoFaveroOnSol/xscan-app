import { NextRequest, NextResponse } from 'next/server';
import { isXscanHolder } from '@/lib/solana/token-balance';
import { PublicKey } from '@solana/web3.js';
import * as crypto from 'crypto';

const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/**
 * POST /api/holder/auth
 * Wallet signs a message → we verify balance → return holder_token
 * 
 * For MVP: just verify wallet has enough tokens and return access secret.
 * For production: add signature verification (wallet must sign a challenge).
 * 
 * Body: { wallet: string, signature?: string, message?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet } = body;

    if (!wallet || !SOLANA_ADDRESS_REGEX.test(wallet)) {
      return NextResponse.json({ error: 'Invalid wallet' }, { status: 400 });
    }

    if (!process.env.XSCAN_TOKEN_MINT) {
      return NextResponse.json({ error: 'Token gate not active' }, { status: 503 });
    }

    // Validate it's a real pubkey
    try {
      new PublicKey(wallet);
    } catch {
      return NextResponse.json({ error: 'Invalid Solana address' }, { status: 400 });
    }

    const holder = await isXscanHolder(wallet);

    if (!holder) {
      return NextResponse.json({
        error: 'Insufficient balance',
        message: 'You need at least 100,000 XSCAN tokens for premium access',
        isHolder: false,
      }, { status: 403 });
    }

    // Generate a time-limited holder token (valid 24h)
    // Format: wallet.expiry.hmac
    const expiry = Date.now() + 24 * 60 * 60 * 1000;
    const payload = `${wallet}.${expiry}`;
    const secret = process.env.HOLDER_ACCESS_SECRET || '';
    const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const holderToken = `${payload}.${hmac}`;

    return NextResponse.json({
      isHolder: true,
      holderToken,
      expiresAt: new Date(expiry).toISOString(),
      perks: [
        'Real-time calls (no 15min delay)',
        'Advanced filters',
        'Full call history',
        'Wallet tracker access',
        'API access',
        'Holder-only Telegram group',
      ],
    });
  } catch (error) {
    console.error('Holder auth error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
