import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getTwitterData, isApifyConfigured } from '@/lib/services/twitter';
import { getTokenData } from '@/lib/api/dexscreener';
import { verifyCronAuth } from '@/lib/auth/cron-guard';

/**
 * Sync KOL data from Twitter
 * - Fetches profile (photo, bio, followers)
 * - Fetches last 100 tweets
 * - Extracts and creates calls from detected contracts
 */

// GET handler — requires auth
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ handle: string }> }
) {
  const denied = verifyCronAuth(request);
  if (denied) return denied;
  return syncKOL(request, context);
}

// POST handler — requires auth
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ handle: string }> }
) {
  const denied = verifyCronAuth(request);
  if (denied) return denied;
  return syncKOL(request, context);
}

async function syncKOL(
  request: NextRequest,
  context: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await context.params;

    if (!handle) {
      return NextResponse.json({ error: 'Handle is required' }, { status: 400 });
    }

    if (!isApifyConfigured()) {
      return NextResponse.json(
        { error: 'Twitter integration not configured' },
        { status: 503 }
      );
    }

    const supabase = await createAdminClient();
    const cleanHandle = handle.replace('@', '');

    // Check if KOL exists
    const { data: kol, error: kolError } = await supabase
      .from('kols')
      .select('*')
      .eq('twitter_handle', cleanHandle)
      .single();

    if (kolError || !kol) {
      return NextResponse.json({ error: 'KOL not found' }, { status: 404 });
    }

    console.log(`[Sync] Starting sync for @${cleanHandle}`);

    // Fetch Twitter data (profile + 200 tweets to get more history)
    const twitterData = await getTwitterData(cleanHandle, 200);

    // Log tweet date range for debugging
    if (twitterData.tweets.length > 0) {
      const oldestTweet = twitterData.tweets[twitterData.tweets.length - 1];
      const newestTweet = twitterData.tweets[0];
      console.log(`[Sync] Tweet date range: ${newestTweet.createdAt} to ${oldestTweet.createdAt}`);
      console.log(`[Sync] Found ${twitterData.contractsFound.length} contracts in ${twitterData.tweets.length} tweets`);
    }

    // Update KOL profile
    const { error: updateError } = await supabase
      .from('kols')
      .update({
        display_name: twitterData.profile.displayName || kol.display_name,
        bio: twitterData.profile.bio || kol.bio,
        profile_image_url: twitterData.profile.profileImageUrl || kol.profile_image_url,
        follower_count: twitterData.profile.followersCount || kol.follower_count,
        is_verified: twitterData.profile.isVerified,
        last_scan_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', kol.id);

    if (updateError) {
      console.error('[Sync] Failed to update KOL profile:', updateError);
    }

    // Process contracts found
    let callsCreated = 0;
    let callsSkipped = 0;
    const callsDetails: Array<{ address: string; status: string; symbol?: string }> = [];

    for (const contract of twitterData.contractsFound) {
      // Check if call already exists
      const { data: existingCall } = await supabase
        .from('calls')
        .select('id')
        .eq('kol_id', kol.id)
        .eq('token_address', contract.contractAddress)
        .single();

      if (existingCall) {
        callsSkipped++;
        callsDetails.push({ address: contract.contractAddress, status: 'skipped' });
        continue;
      }

      // Get token data from DexScreener
      let tokenData = null;
      try {
        tokenData = await getTokenData(contract.contractAddress);
      } catch (tokenError) {
        console.warn(`[Sync] Failed to get token data for ${contract.contractAddress}`);
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
        console.error(`[Sync] Failed to create call:`, callError);
        callsDetails.push({ address: contract.contractAddress, status: 'error' });
      } else {
        callsCreated++;
        callsDetails.push({
          address: contract.contractAddress,
          status: 'created',
          symbol: tokenData?.symbol,
        });
      }

      // Small delay to avoid rate limiting DexScreener
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Update KOL stats
    await updateKOLStats(supabase, kol.id);

    console.log(`[Sync] Completed for @${cleanHandle}: ${callsCreated} created, ${callsSkipped} skipped`);

    // Get date range info
    const dateRange = twitterData.tweets.length > 0
      ? {
          newest: twitterData.tweets[0].createdAt,
          oldest: twitterData.tweets[twitterData.tweets.length - 1].createdAt,
        }
      : null;

    return NextResponse.json({
      success: true,
      profile: {
        displayName: twitterData.profile.displayName,
        bio: twitterData.profile.bio,
        profileImageUrl: twitterData.profile.profileImageUrl,
        followersCount: twitterData.profile.followersCount,
        isVerified: twitterData.profile.isVerified,
      },
      sync: {
        tweetsScanned: twitterData.tweets.length,
        tweetDateRange: dateRange,
        contractsFound: twitterData.contractsFound.length,
        contractAddresses: twitterData.contractsFound.map(c => ({
          address: c.contractAddress,
          timestamp: c.timestamp,
        })),
        callsCreated,
        callsSkipped,
      },
      calls: callsDetails,
    });
  } catch (error) {
    console.error('[Sync] Error:', error);
    return NextResponse.json(
      { error: 'Sync failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Update KOL statistics based on their calls
 */
async function updateKOLStats(supabase: Awaited<ReturnType<typeof createAdminClient>>, kolId: string) {
  try {
    // Get all calls for this KOL
    const { data: calls } = await supabase
      .from('calls')
      .select('*')
      .eq('kol_id', kolId);

    if (!calls || calls.length === 0) return;

    const totalCalls = calls.length;
    const winningCalls = calls.filter((c) => c.is_win).length;
    const winrate = totalCalls > 0 ? (winningCalls / totalCalls) * 100 : 0;

    const multipliers = calls.map((c) => c.ath_multiplier || 1);
    const avgMultiplier = multipliers.reduce((a, b) => a + b, 0) / multipliers.length;
    const bestMultiplier = Math.max(...multipliers);

    await supabase
      .from('kols')
      .update({
        total_calls: totalCalls,
        winning_calls: winningCalls,
        winrate: Math.round(winrate * 100) / 100,
        avg_multiplier: Math.round(avgMultiplier * 100) / 100,
        best_multiplier: Math.round(bestMultiplier * 100) / 100,
        updated_at: new Date().toISOString(),
      })
      .eq('id', kolId);
  } catch (error) {
    console.error('[Sync] Failed to update KOL stats:', error);
  }
}
