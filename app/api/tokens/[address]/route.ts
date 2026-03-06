import { NextRequest, NextResponse } from 'next/server';
import { getTokenData } from '@/lib/api/dexscreener';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    if (!address || address.length < 32) {
      return NextResponse.json({ error: 'Invalid token address' }, { status: 400 });
    }

    const tokenData = await getTokenData(address);

    if (!tokenData) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    return NextResponse.json({ token: tokenData });
  } catch (error) {
    console.error('Error in GET /api/tokens/[address]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
