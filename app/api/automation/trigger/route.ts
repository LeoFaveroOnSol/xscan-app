import { NextRequest, NextResponse } from 'next/server';
import { automationLog } from '@/lib/automation/config';
import { verifyCronAuth } from '@/lib/auth/cron-guard';

/**
 * POST /api/automation/trigger
 * Manually trigger automation scans
 */
export async function POST(request: NextRequest) {
  const denied = verifyCronAuth(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const { type } = body;

    if (!type || !['tweets', 'prices', 'all'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "tweets", "prices", or "all"' },
        { status: 400 }
      );
    }

    const cronSecret = process.env.CRON_SECRET;
    const baseUrl = request.nextUrl.origin;

    const results: { tweets?: any; prices?: any } = {};

    // Trigger tweet scan
    if (type === 'tweets' || type === 'all') {
      automationLog('info', 'Manually triggering tweet scan...');
      try {
        const tweetResponse = await fetch(`${baseUrl}/api/cron/scan-tweets`, {
          method: 'POST',
          headers: {
            'Authorization': cronSecret ? `Bearer ${cronSecret}` : '',
          },
        });
        results.tweets = await tweetResponse.json();
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.tweets = { error: errorMsg };
      }
    }

    // Trigger price update
    if (type === 'prices' || type === 'all') {
      automationLog('info', 'Manually triggering price update...');
      try {
        const priceResponse = await fetch(`${baseUrl}/api/cron/update-prices`, {
          method: 'POST',
          headers: {
            'Authorization': cronSecret ? `Bearer ${cronSecret}` : '',
          },
        });
        results.prices = await priceResponse.json();
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.prices = { error: errorMsg };
      }
    }

    return NextResponse.json({
      message: 'Automation triggered',
      type,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    automationLog('error', `Failed to trigger automation: ${errorMsg}`);
    return NextResponse.json({ error: 'Failed to trigger automation' }, { status: 500 });
  }
}
