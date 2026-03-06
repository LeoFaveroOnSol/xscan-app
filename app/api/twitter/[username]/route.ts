import { NextRequest, NextResponse } from 'next/server';
import { getTwitterData, getTwitterProfile, isApifyConfigured } from '@/lib/services/twitter';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    if (!isApifyConfigured()) {
      return NextResponse.json(
        { error: 'Twitter integration not configured' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const profileOnly = searchParams.get('profileOnly') === 'true';
    const tweetCount = parseInt(searchParams.get('tweets') || '100');

    if (profileOnly) {
      // Fetch only profile (cheaper)
      const profile = await getTwitterProfile(username);
      return NextResponse.json({ profile });
    }

    // Fetch full data (profile + tweets + contracts)
    const data = await getTwitterData(username, Math.min(tweetCount, 200));

    return NextResponse.json({
      profile: data.profile,
      tweets: data.tweets,
      contractsFound: data.contractsFound,
      summary: {
        totalTweets: data.tweets.length,
        totalContracts: data.contractsFound.length,
        uniqueContracts: Array.from(new Set(data.contractsFound.map((c) => c.contractAddress))).length,
      },
    });
  } catch (error) {
    console.error('Error fetching Twitter data:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: 'Twitter user not found' }, { status: 404 });
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
      }
    }

    return NextResponse.json({ error: 'Failed to fetch Twitter data' }, { status: 500 });
  }
}
