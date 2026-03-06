import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getMultipleTokensData } from '@/lib/api/dexscreener';

/**
 * POST /api/cron/update-images
 * Update token images for all calls from DexScreener
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret for automated calls
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Allow manual triggers from admin panel (they have session cookie)
      const sessionCookie = request.cookies.get('xscan_admin_session');
      if (!sessionCookie?.value) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const supabase = createServiceClient();

    // Get all calls that need image update (no image or null)
    const { data: calls, error: fetchError } = await supabase
      .from('calls')
      .select('id, token_address, token_image_url')
      .or('token_image_url.is.null,token_image_url.eq.')
      .limit(500);

    if (fetchError) {
      throw new Error(`Failed to fetch calls: ${fetchError.message}`);
    }

    if (!calls || calls.length === 0) {
      return NextResponse.json({
        message: 'No calls need image updates',
        updated: 0,
        duration: Date.now() - startTime,
      });
    }

    // Get unique token addresses
    const uniqueAddresses = Array.from(new Set(calls.map((c) => c.token_address)));

    // Fetch token data from DexScreener
    const tokenDataMap = await getMultipleTokensData(uniqueAddresses);

    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Update calls with images
    for (const call of calls) {
      const tokenData = tokenDataMap.get(call.token_address);

      if (tokenData?.imageUrl) {
        const { error: updateError } = await supabase
          .from('calls')
          .update({ token_image_url: tokenData.imageUrl })
          .eq('id', call.id);

        if (updateError) {
          errors.push(`${call.token_address}: ${updateError.message}`);
        } else {
          updated++;
        }
      } else {
        skipped++;
      }
    }

    const duration = Date.now() - startTime;

    // Log the scan
    await supabase.from('scan_logs').insert({
      scan_type: 'images',
      status: 'completed',
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: duration,
      calls_created: updated,
      calls_skipped: skipped,
      error_message: errors.length > 0 ? errors.slice(0, 5).join('; ') : null,
    });

    return NextResponse.json({
      message: 'Image update completed',
      totalCalls: calls.length,
      uniqueTokens: uniqueAddresses.length,
      updated,
      skipped,
      errors: errors.length,
      duration,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    // Log the error
    const supabase = createServiceClient();
    await supabase.from('scan_logs').insert({
      scan_type: 'images',
      status: 'failed',
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      error_message: errorMsg,
    });

    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
