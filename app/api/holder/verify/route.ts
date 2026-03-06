import { NextRequest, NextResponse } from 'next/server';
import { getTokenBalance } from '@/lib/solana/token-balance';

const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/**
 * GET /api/holder/verify?wallet=<address>
 * Check if a wallet holds enough XSCAN tokens for premium access
 */
export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet');

  if (!wallet || !SOLANA_ADDRESS_REGEX.test(wallet)) {
    return NextResponse.json(
      { error: 'Invalid wallet address' },
      { status: 400 }
    );
  }

  if (!process.env.XSCAN_TOKEN_MINT) {
    return NextResponse.json(
      { error: 'Token gate not configured yet' },
      { status: 503 }
    );
  }

  try {
    const result = await getTokenBalance(wallet);

    return NextResponse.json({
      wallet: result.wallet,
      balance: result.uiBalance,
      threshold: result.threshold,
      isHolder: result.isHolder,
      perks: result.isHolder ? {
        realTimeAlerts: true,
        advancedFilters: true,
        fullHistory: true,
        walletTracker: true,
        apiAccess: true,
        holderGroup: 'https://t.me/+xscan_holders', // placeholder
      } : null,
    });
  } catch (error) {
    console.error('Token balance check failed:', error);
    return NextResponse.json(
      { error: 'Failed to verify balance' },
      { status: 500 }
    );
  }
}
