import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchTweets, filterTweetsByTime, filterPotentialCallTweets } from '@/lib/automation/TwitterScraper';
import { processTweetsForKol, getMonitoredKols, updateLastScan } from '@/lib/automation/AutoCallProcessor';
import { automationLog } from '@/lib/automation/config';

// Create Supabase admin client
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Create a scan log entry
 */
async function createScanLog(scanType: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('scan_logs')
    .insert({
      scan_type: scanType,
      status: 'running',
    })
    .select('id')
    .single();

  if (error) {
    automationLog('error', 'Failed to create scan log', error);
    return null;
  }

  return data.id;
}

/**
 * Update scan log with results
 */
async function updateScanLog(
  logId: string,
  results: {
    kolsScanned: number;
    tweetsFound: number;
    callsCreated: number;
    callsSkipped: number;
    errors: number;
    details?: any;
    errorMessage?: string;
    status: 'completed' | 'failed';
  }
) {
  const supabase = getSupabaseAdmin();

  await supabase
    .from('scan_logs')
    .update({
      completed_at: new Date().toISOString(),
      kols_scanned: results.kolsScanned,
      tweets_found: results.tweetsFound,
      calls_created: results.callsCreated,
      calls_skipped: results.callsSkipped,
      errors: results.errors,
      details: results.details,
      error_message: results.errorMessage,
      status: results.status,
    })
    .eq('id', logId);
}

/**
 * Main tweet scanning cron job
 * Scans tweets from all monitored KOLs and processes detected contract addresses
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    automationLog('info', '🚀 Starting tweet scan cron job');

    // Create scan log
    const scanLogId = await createScanLog('tweets');

    // Get all monitored KOLs
    const monitoredKols = await getMonitoredKols();

    if (monitoredKols.length === 0) {
      automationLog('info', 'No monitored KOLs found');

      if (scanLogId) {
        await updateScanLog(scanLogId, {
          kolsScanned: 0,
          tweetsFound: 0,
          callsCreated: 0,
          callsSkipped: 0,
          errors: 0,
          status: 'completed',
        });
      }

      return NextResponse.json({
        message: 'No monitored KOLs',
        kolsScanned: 0,
        tweetsFound: 0,
        callsCreated: 0,
      });
    }

    automationLog('info', `Found ${monitoredKols.length} monitored KOLs`);

    // Aggregate results
    let totalTweetsFound = 0;
    let totalCallsCreated = 0;
    let totalCallsSkipped = 0;
    let totalErrors = 0;
    const detailedResults: any[] = [];

    // Process each KOL
    for (const kol of monitoredKols) {
      automationLog('info', `Scanning @${kol.twitter_handle}...`);

      try {
        // Fetch tweets
        const scrapedTweets = await fetchTweets(kol.twitter_handle);

        if (!scrapedTweets.success) {
          automationLog('warn', `Failed to fetch tweets for @${kol.twitter_handle}: ${scrapedTweets.error}`);
          totalErrors++;
          continue;
        }

        // Filter to tweets since last scan (default to 1 hour ago if no last scan)
        const lastScanTime = kol.last_scan_at
          ? new Date(kol.last_scan_at)
          : new Date(Date.now() - 60 * 60 * 1000);

        const newTweets = filterTweetsByTime(scrapedTweets.tweets, lastScanTime);

        // Filter to tweets with potential CAs
        const callTweets = filterPotentialCallTweets(newTweets);

        totalTweetsFound += callTweets.length;

        automationLog('info', `@${kol.twitter_handle}: ${callTweets.length} potential call tweets found`);

        if (callTweets.length > 0) {
          // Process tweets and create calls
          const processingResult = await processTweetsForKol(callTweets, kol.id);

          totalCallsCreated += processingResult.created;
          totalCallsSkipped += processingResult.skipped;
          totalErrors += processingResult.errors;

          detailedResults.push({
            kol: kol.twitter_handle,
            tweetsFound: callTweets.length,
            callsCreated: processingResult.created,
            callsSkipped: processingResult.skipped,
            errors: processingResult.errors,
          });
        }

        // Update last scan timestamp
        await updateLastScan(kol.id);

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        automationLog('error', `Error processing @${kol.twitter_handle}: ${errorMsg}`);
        totalErrors++;
      }
    }

    const duration = Date.now() - startTime;

    // Update scan log
    if (scanLogId) {
      await updateScanLog(scanLogId, {
        kolsScanned: monitoredKols.length,
        tweetsFound: totalTweetsFound,
        callsCreated: totalCallsCreated,
        callsSkipped: totalCallsSkipped,
        errors: totalErrors,
        details: detailedResults,
        status: 'completed',
      });
    }

    automationLog('info', `✅ Tweet scan completed in ${duration}ms`);
    automationLog('info', `Results: ${totalCallsCreated} calls created, ${totalCallsSkipped} skipped, ${totalErrors} errors`);

    return NextResponse.json({
      message: 'Tweet scan completed',
      kolsScanned: monitoredKols.length,
      tweetsFound: totalTweetsFound,
      callsCreated: totalCallsCreated,
      callsSkipped: totalCallsSkipped,
      errors: totalErrors,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    automationLog('error', `Tweet scan cron failed: ${errorMsg}`);

    return NextResponse.json({
      error: 'Tweet scan failed',
      message: errorMsg,
    }, { status: 500 });
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
