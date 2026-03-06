import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getTwitterData, isApifyConfigured } from '@/lib/services/twitter';
import { getTokenData } from '@/lib/api/dexscreener';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ application: data });
  } catch (error) {
    console.error('Error in GET /api/applications/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();
    const body = await request.json();

    const { status, rejection_reason } = body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get the application first
    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.status !== 'pending') {
      return NextResponse.json({ error: 'Application already processed' }, { status: 400 });
    }

    // Update application status
    const { error: updateError } = await supabase
      .from('applications')
      .update({
        status,
        rejection_reason: status === 'rejected' ? rejection_reason : null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating application:', updateError);
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
    }

    // If approved, create KOL entry and fetch Twitter data
    if (status === 'approved') {
      // Fetch Twitter data if Apify is configured
      let twitterData = null;
      if (isApifyConfigured()) {
        try {
          console.log(`[Application] Fetching Twitter data for @${application.twitter_handle}`);
          twitterData = await getTwitterData(application.twitter_handle, 100);
        } catch (twitterError) {
          console.error('Error fetching Twitter data:', twitterError);
          // Continue without Twitter data
        }
      }

      // Create KOL with Twitter data if available
      const { data: newKol, error: kolError } = await supabase.from('kols').insert({
        twitter_handle: application.twitter_handle,
        display_name: twitterData?.profile.displayName || application.display_name,
        bio: twitterData?.profile.bio || application.bio,
        profile_image_url: twitterData?.profile.profileImageUrl || null,
        wallet_address: application.wallet_address,
        follower_count: twitterData?.profile.followersCount || application.follower_count || 0,
        total_calls: 0,
        winning_calls: 0,
        winrate: 0,
        avg_multiplier: 0,
        best_multiplier: 0,
        is_verified: twitterData?.profile.isVerified || false,
        is_active: true,
        is_auto_monitored: true,
        last_scan_at: new Date().toISOString(),
      }).select().single();

      if (kolError) {
        console.error('Error creating KOL:', kolError);
        // Revert application status
        await supabase
          .from('applications')
          .update({ status: 'pending', reviewed_at: null })
          .eq('id', id);
        return NextResponse.json({ error: 'Failed to create KOL profile' }, { status: 500 });
      }

      // Create calls from detected contracts
      let callsCreated = 0;
      if (twitterData && newKol) {
        for (const contract of twitterData.contractsFound) {
          try {
            // Get token data
            let tokenData = null;
            try {
              tokenData = await getTokenData(contract.contractAddress);
            } catch {
              console.warn(`Failed to get token data for ${contract.contractAddress}`);
            }

            // Create call
            const { error: callError } = await supabase.from('calls').insert({
              kol_id: newKol.id,
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

            if (!callError) {
              callsCreated++;
            }

            // Small delay to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 100));
          } catch (callErr) {
            console.error('Error creating call:', callErr);
          }
        }

        console.log(`[Application] Created ${callsCreated} calls for @${application.twitter_handle}`);
      }

      return NextResponse.json({
        success: true,
        kol: newKol,
        sync: twitterData ? {
          profileFetched: true,
          tweetsScanned: twitterData.tweets.length,
          contractsFound: twitterData.contractsFound.length,
          callsCreated,
        } : null,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/applications/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
