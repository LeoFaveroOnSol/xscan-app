import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import KOLProfileSidebar from '@/components/kol/KOLProfileSidebar';
import KOLBestCoins from '@/components/kol/KOLBestCoins';
import KOLTokensGrid from '@/components/kol/KOLTokensGrid';
import DeletedTweetsSection from '@/components/kol/DeletedTweetsSection';
import type { Metadata } from 'next';
import { getTwitterData, isApifyConfigured } from '@/lib/services/twitter';
import { getTokenData } from '@/lib/api/dexscreener';

// Force dynamic rendering to always get fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ handle: string }>;
}

// Sync KOL data if not updated in the last 6 hours
async function maybeSyncKOL(kolId: string, handle: string, lastScanAt: string | null) {
  try {
    // Check if we should sync (no scan in last 6 hours)
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const lastScan = lastScanAt ? new Date(lastScanAt) : null;

    if (lastScan && lastScan > sixHoursAgo) {
      console.log(`[KOL Page] @${handle} was synced recently, skipping`);
      return;
    }

    if (!isApifyConfigured()) {
      console.log('[KOL Page] Apify not configured, skipping sync');
      return;
    }

    console.log(`[KOL Page] Starting background sync for @${handle}`);

    const supabase = await createAdminClient();

    // Fetch Twitter data
    const twitterData = await getTwitterData(handle, 100);

    // Update KOL profile
    await supabase
      .from('kols')
      .update({
        display_name: twitterData.profile.displayName,
        bio: twitterData.profile.bio,
        profile_image_url: twitterData.profile.profileImageUrl,
        follower_count: twitterData.profile.followersCount,
        is_verified: twitterData.profile.isVerified,
        last_scan_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', kolId);

    // Process contracts
    let callsCreated = 0;
    for (const contract of twitterData.contractsFound) {
      // Check if call exists
      const { data: existingCall } = await supabase
        .from('calls')
        .select('id')
        .eq('kol_id', kolId)
        .eq('token_address', contract.contractAddress)
        .single();

      if (existingCall) continue;

      // Get token data
      let tokenData = null;
      try {
        tokenData = await getTokenData(contract.contractAddress);
      } catch (e) {
        console.warn(`[KOL Page] Failed to get token data for ${contract.contractAddress}`);
      }

      // Create call
      const { error } = await supabase.from('calls').insert({
        kol_id: kolId,
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

      if (!error) callsCreated++;

      // Small delay
      await new Promise(r => setTimeout(r, 200));
    }

    // Update KOL stats
    const { data: allCalls } = await supabase
      .from('calls')
      .select('*')
      .eq('kol_id', kolId);

    if (allCalls && allCalls.length > 0) {
      const totalCalls = allCalls.length;
      const winningCalls = allCalls.filter(c => c.is_win).length;
      const winrate = (winningCalls / totalCalls) * 100;
      const multipliers = allCalls.map(c => c.ath_multiplier || 1);
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
        })
        .eq('id', kolId);
    }

    console.log(`[KOL Page] Sync complete for @${handle}: ${callsCreated} new calls`);
  } catch (error) {
    console.error(`[KOL Page] Sync failed for @${handle}:`, error);
  }
}

async function getKOLData(handle: string) {
  const supabase = await createAdminClient();
  const cleanHandle = handle.replace('@', '');

  const { data: kol, error: kolError } = await supabase
    .from('kols')
    .select('*')
    .eq('twitter_handle', cleanHandle)
    .eq('is_active', true)
    .single();

  if (kolError || !kol) {
    return null;
  }

  // Sync KOL data if needed (runs before fetching calls so we get updated data)
  await maybeSyncKOL(kol.id, cleanHandle, kol.last_scan_at);

  const { data: calls } = await supabase
    .from('calls')
    .select('*')
    .eq('kol_id', kol.id)
    .order('entry_timestamp', { ascending: false });

  // Keep all calls (even unknown tokens - they may be rugged but still tracked)
  const filteredCalls = calls || [];

  // Separate deleted and active calls
  const activeCalls = filteredCalls.filter(c => !c.is_deleted);
  const deletedCalls = filteredCalls.filter(c => c.is_deleted);

  return { kol, calls: activeCalls, deletedCalls };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const data = await getKOLData(handle);

  if (!data) {
    return {
      title: 'KOL Not Found - XSCAN',
    };
  }

  return {
    title: `${data.kol.display_name || data.kol.twitter_handle} - XSCAN`,
    description: `View ${data.kol.twitter_handle}'s crypto call performance. Winrate: ${data.kol.winrate.toFixed(1)}%, Total Calls: ${data.kol.total_calls}`,
  };
}

export default async function KOLProfilePage({ params }: Props) {
  const { handle } = await params;
  const data = await getKOLData(handle);

  if (!data) {
    notFound();
  }

  const { kol, calls, deletedCalls } = data;

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        {/* Main Layout - Sidebar + Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Profile */}
          <KOLProfileSidebar kol={kol} totalCalls={calls.length} calls={calls} />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Best Coins Pedestal */}
            <KOLBestCoins calls={calls} />

            {/* Deleted Tweets Tracker */}
            <DeletedTweetsSection handle={kol.twitter_handle} />

            {/* All Tokens Grid */}
            <KOLTokensGrid calls={calls} deletedCalls={deletedCalls} />
          </div>
        </div>
      </div>
    </div>
  );
}
