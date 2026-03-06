import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getRecentTweets, isApifyConfigured } from '@/lib/services/twitter';
import { getTokenData } from '@/lib/api/dexscreener';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('[Cron] CRON_SECRET not configured');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isApifyConfigured()) {
    return NextResponse.json({ error: 'Apify not configured' }, { status: 503 });
  }

  const supabase = createServiceClient();
  const startTime = Date.now();

  // Create scan log
  const { data: scanLog, error: scanLogError } = await supabase
    .from('scan_logs')
    .insert({
      scan_type: 'tweets',
      started_at: new Date().toISOString(),
      status: 'running',
      kols_scanned: 0,
      tweets_found: 0,
      calls_created: 0,
      calls_skipped: 0,
      errors: 0,
    })
    .select()
    .single();

  if (scanLogError) {
    console.error('[Cron] Failed to create scan log:', scanLogError);
  }

  const logId = scanLog?.id;

  try {
    // Get all active KOLs that are monitored
    const { data: kols, error: kolsError } = await supabase
      .from('kols')
      .select('id, twitter_handle, display_name')
      .eq('is_active', true)
      .eq('is_auto_monitored', true);

    if (kolsError) {
      throw new Error(`Failed to fetch KOLs: ${kolsError.message}`);
    }

    if (!kols || kols.length === 0) {
      console.log('[Cron] No KOLs to scan');

      if (logId) {
        await supabase
          .from('scan_logs')
          .update({
            completed_at: new Date().toISOString(),
            status: 'completed',
            details: { message: 'No KOLs to scan' },
          })
          .eq('id', logId);
      }

      return NextResponse.json({ message: 'No KOLs to scan', scanned: 0 });
    }

    console.log(`[Cron] Scanning ${kols.length} KOLs`);

    let totalTweetsFound = 0;
    let totalCallsCreated = 0;
    let totalCallsSkipped = 0;
    let totalErrors = 0;
    const details: Record<string, unknown> = {};

    for (const kol of kols) {
      try {
        console.log(`[Cron] Scanning @${kol.twitter_handle}`);

        // Fetch last 5 tweets
        const { tweets, contractsFound } = await getRecentTweets(kol.twitter_handle, 5);
        totalTweetsFound += tweets.length;

        details[kol.twitter_handle] = {
          tweets: tweets.length,
          contracts: contractsFound.length,
        };

        // Process each contract found
        for (const contract of contractsFound) {
          // Check if this call already exists
          const { data: existingCall } = await supabase
            .from('calls')
            .select('id')
            .eq('kol_id', kol.id)
            .eq('token_address', contract.contractAddress)
            .single();

          if (existingCall) {
            console.log(`[Cron] Call already exists for ${contract.contractAddress}`);
            totalCallsSkipped++;
            continue;
          }

          // Get token data from DexScreener
          let tokenData = null;
          try {
            tokenData = await getTokenData(contract.contractAddress);
          } catch (tokenError) {
            console.warn(`[Cron] Failed to get token data for ${contract.contractAddress}`);
          }

          // Create the call
          const { error: callError } = await supabase.from('calls').insert({
            kol_id: kol.id,
            token_address: contract.contractAddress,
            token_symbol: tokenData?.symbol || null,
            token_name: tokenData?.name || null,
            entry_market_cap: tokenData?.marketCap || 0,
            entry_price: tokenData?.price || null,
            entry_timestamp: contract.timestamp,
            current_market_cap: tokenData?.marketCap || null,
            current_price: tokenData?.price || null,
            current_multiplier: 1,
            ath_multiplier: 1,
            is_win: false,
            status: 'active',
            tweet_url: contract.tweetUrl,
            tweet_id: contract.tweetId,
            detected_at: new Date().toISOString(),
            is_auto_detected: true,
            notes: contract.tweetText.substring(0, 500),
          });

          if (callError) {
            console.error(`[Cron] Failed to create call:`, callError);
            totalErrors++;
          } else {
            console.log(`[Cron] Created call for ${contract.contractAddress}`);
            totalCallsCreated++;
          }
        }

        // Update last scan time for KOL
        await supabase
          .from('kols')
          .update({ last_scan_at: new Date().toISOString() })
          .eq('id', kol.id);

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (kolError) {
        console.error(`[Cron] Error scanning @${kol.twitter_handle}:`, kolError);
        totalErrors++;
        details[kol.twitter_handle] = {
          error: kolError instanceof Error ? kolError.message : 'Unknown error',
        };
      }
    }

    const duration = Date.now() - startTime;

    // Update scan log
    if (logId) {
      await supabase
        .from('scan_logs')
        .update({
          completed_at: new Date().toISOString(),
          status: totalErrors > 0 ? 'completed' : 'completed',
          kols_scanned: kols.length,
          tweets_found: totalTweetsFound,
          calls_created: totalCallsCreated,
          calls_skipped: totalCallsSkipped,
          errors: totalErrors,
          details,
        })
        .eq('id', logId);
    }

    console.log(`[Cron] Scan completed in ${duration}ms`);
    console.log(`[Cron] KOLs: ${kols.length}, Tweets: ${totalTweetsFound}, Calls created: ${totalCallsCreated}, Skipped: ${totalCallsSkipped}, Errors: ${totalErrors}`);

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      summary: {
        kolsScanned: kols.length,
        tweetsFound: totalTweetsFound,
        callsCreated: totalCallsCreated,
        callsSkipped: totalCallsSkipped,
        errors: totalErrors,
      },
      details,
    });
  } catch (error) {
    console.error('[Cron] Scan failed:', error);

    // Update scan log with error
    if (logId) {
      await supabase
        .from('scan_logs')
        .update({
          completed_at: new Date().toISOString(),
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', logId);
    }

    return NextResponse.json(
      { error: 'Scan failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
