/**
 * Auto Call Processor
 *
 * Processes detected contract addresses and creates call entries
 */

import { createClient } from '@supabase/supabase-js';
import { getTokenData } from '@/lib/api/dexscreener';
import { detectPrimaryContract } from './ContractDetector';
import {
  AUTOMATION_CONFIG,
  meetsMinimumRequirements,
  automationLog,
} from './config';
import type { Tweet } from './TwitterScraper';

// Create Supabase client for server-side operations
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface ProcessedCall {
  kolId: string;
  kolHandle: string;
  tokenAddress: string;
  tokenSymbol: string | null;
  tokenName: string | null;
  entryMarketCap: number;
  entryPrice: number;
  tweetId: string;
  tweetUrl: string;
  tweetTimestamp: Date;
  success: boolean;
  error?: string;
}

export interface ProcessingResult {
  processed: number;
  created: number;
  skipped: number;
  errors: number;
  details: ProcessedCall[];
}

/**
 * Check if a call already exists for this tweet
 */
async function callExistsForTweet(tweetId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { data } = await supabase
    .from('calls')
    .select('id')
    .eq('tweet_id', tweetId)
    .single();

  return !!data;
}

/**
 * Check if a call exists for this KOL + token combination (within last 24h)
 */
async function recentCallExists(
  kolId: string,
  tokenAddress: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const oneDayAgo = new Date();
  oneDayAgo.setHours(oneDayAgo.getHours() - 24);

  const { data } = await supabase
    .from('calls')
    .select('id')
    .eq('kol_id', kolId)
    .eq('token_address', tokenAddress)
    .gte('entry_timestamp', oneDayAgo.toISOString())
    .single();

  return !!data;
}

/**
 * Get KOL ID by Twitter handle
 */
async function getKolByHandle(handle: string): Promise<{ id: string } | null> {
  const supabase = getSupabaseAdmin();

  const { data } = await supabase
    .from('kols')
    .select('id')
    .eq('twitter_handle', handle.replace('@', ''))
    .eq('is_active', true)
    .eq('is_auto_monitored', true)
    .single();

  return data;
}

/**
 * Create a new call entry in the database
 */
async function createCall(
  kolId: string,
  tokenAddress: string,
  tokenData: {
    symbol: string;
    name: string;
    price: number;
    marketCap: number;
    liquidity: number;
  },
  tweet: Tweet
): Promise<{ success: boolean; callId?: string; error?: string }> {
  const supabase = getSupabaseAdmin();

  try {
    const { data, error } = await supabase
      .from('calls')
      .insert({
        kol_id: kolId,
        token_address: tokenAddress,
        token_symbol: tokenData.symbol,
        token_name: tokenData.name,
        entry_market_cap: tokenData.marketCap,
        entry_price: tokenData.price,
        entry_timestamp: tweet.timestamp.toISOString(),
        current_market_cap: tokenData.marketCap,
        current_price: tokenData.price,
        ath_market_cap: tokenData.marketCap,
        ath_price: tokenData.price,
        ath_timestamp: tweet.timestamp.toISOString(),
        current_multiplier: 1,
        ath_multiplier: 1,
        is_win: false,
        status: 'active',
        tweet_url: tweet.url,
        tweet_id: tweet.id,
        detected_at: new Date().toISOString(),
        is_auto_detected: true,
        last_price_update: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    return { success: true, callId: data.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    automationLog('error', `Failed to create call: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

/**
 * Process a single tweet for potential calls
 */
export async function processTweet(
  tweet: Tweet,
  kolId: string
): Promise<ProcessedCall | null> {
  automationLog('debug', `Processing tweet ${tweet.id} from @${tweet.authorHandle}`);

  // Detect contract address
  const detected = detectPrimaryContract(tweet.text);

  if (!detected) {
    automationLog('debug', `No CA detected in tweet ${tweet.id}`);
    return null;
  }

  const tokenAddress = detected.address;
  automationLog('info', `Detected CA ${tokenAddress.substring(0, 10)}... in tweet from @${tweet.authorHandle}`);

  // Check if call already exists for this tweet
  const tweetExists = await callExistsForTweet(tweet.id);
  if (tweetExists) {
    automationLog('debug', `Call already exists for tweet ${tweet.id}`);
    return {
      kolId,
      kolHandle: tweet.authorHandle,
      tokenAddress,
      tokenSymbol: null,
      tokenName: null,
      entryMarketCap: 0,
      entryPrice: 0,
      tweetId: tweet.id,
      tweetUrl: tweet.url,
      tweetTimestamp: tweet.timestamp,
      success: false,
      error: 'Call already exists for this tweet',
    };
  }

  // Check for recent duplicate (same KOL + token within 24h)
  const recentExists = await recentCallExists(kolId, tokenAddress);
  if (recentExists) {
    automationLog('debug', `Recent call exists for this KOL + token`);
    return {
      kolId,
      kolHandle: tweet.authorHandle,
      tokenAddress,
      tokenSymbol: null,
      tokenName: null,
      entryMarketCap: 0,
      entryPrice: 0,
      tweetId: tweet.id,
      tweetUrl: tweet.url,
      tweetTimestamp: tweet.timestamp,
      success: false,
      error: 'Recent call already exists for this token',
    };
  }

  // Fetch token data from DexScreener
  const tokenData = await getTokenData(tokenAddress);

  if (!tokenData) {
    automationLog('warn', `Token not found on DexScreener: ${tokenAddress}`);
    return {
      kolId,
      kolHandle: tweet.authorHandle,
      tokenAddress,
      tokenSymbol: null,
      tokenName: null,
      entryMarketCap: 0,
      entryPrice: 0,
      tweetId: tweet.id,
      tweetUrl: tweet.url,
      tweetTimestamp: tweet.timestamp,
      success: false,
      error: 'Token not found on DexScreener',
    };
  }

  // Check minimum requirements
  if (!meetsMinimumRequirements(tokenData.liquidity, tokenData.marketCap)) {
    automationLog('debug', `Token doesn't meet minimum requirements: ${tokenData.symbol}`);
    return {
      kolId,
      kolHandle: tweet.authorHandle,
      tokenAddress,
      tokenSymbol: tokenData.symbol,
      tokenName: tokenData.name,
      entryMarketCap: tokenData.marketCap,
      entryPrice: tokenData.price,
      tweetId: tweet.id,
      tweetUrl: tweet.url,
      tweetTimestamp: tweet.timestamp,
      success: false,
      error: `Token doesn't meet requirements (Liq: $${tokenData.liquidity}, MC: $${tokenData.marketCap})`,
    };
  }

  // Create the call
  const result = await createCall(kolId, tokenAddress, tokenData, tweet);

  if (result.success) {
    automationLog('info', `✅ Created call for ${tokenData.symbol} (${tokenAddress.substring(0, 10)}...) from @${tweet.authorHandle}`);
  }

  return {
    kolId,
    kolHandle: tweet.authorHandle,
    tokenAddress,
    tokenSymbol: tokenData.symbol,
    tokenName: tokenData.name,
    entryMarketCap: tokenData.marketCap,
    entryPrice: tokenData.price,
    tweetId: tweet.id,
    tweetUrl: tweet.url,
    tweetTimestamp: tweet.timestamp,
    success: result.success,
    error: result.error,
  };
}

/**
 * Process multiple tweets for a KOL
 */
export async function processTweetsForKol(
  tweets: Tweet[],
  kolId: string
): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    processed: 0,
    created: 0,
    skipped: 0,
    errors: 0,
    details: [],
  };

  for (const tweet of tweets) {
    result.processed++;

    const processed = await processTweet(tweet, kolId);

    if (processed) {
      result.details.push(processed);

      if (processed.success) {
        result.created++;
      } else if (processed.error?.includes('already exists')) {
        result.skipped++;
      } else {
        result.errors++;
      }
    }

    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return result;
}

/**
 * Get all monitored KOLs
 */
export async function getMonitoredKols(): Promise<Array<{ id: string; twitter_handle: string; last_scan_at: string | null }>> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('kols')
    .select('id, twitter_handle, last_scan_at')
    .eq('is_active', true)
    .eq('is_auto_monitored', true);

  if (error) {
    automationLog('error', 'Failed to fetch monitored KOLs', error);
    return [];
  }

  return data || [];
}

/**
 * Update last scan timestamp for a KOL
 */
export async function updateLastScan(kolId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  await supabase
    .from('kols')
    .update({ last_scan_at: new Date().toISOString() })
    .eq('id', kolId);
}
