import { ApifyClient } from 'apify-client';
import type {
  TwitterProfile,
  Tweet,
  ContractCall,
  TwitterData,
  ApifyTweetItem,
} from './types';
import { extractCallsFromTweet } from './contracts';

// Initialize Apify client
const getApifyClient = () => {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new Error('APIFY_API_TOKEN is not configured');
  }
  return new ApifyClient({ token });
};

// Actor ID for tweet scraping
// Using quacker/twitter-scraper which is more reliable
const TWEET_SCRAPER_ACTOR = 'quacker/twitter-scraper';

/**
 * Parse Apify tweet item to our Tweet format
 * Supports both apidojo/tweet-scraper and quacker/twitter-scraper formats
 */
function parseTweet(item: ApifyTweetItem): Tweet | null {
  try {
    // Skip noResults items
    if (item.noResults) return null;

    // quacker format uses different field names
    const tweetId = item.id_str || item.id?.toString() || item.tweetId;
    if (!tweetId) return null;

    const text = item.full_text || item.text || item.tweetText || '';
    const username = item.user?.screen_name || item.handle || item.username || '';

    // quacker format has createdAt as ISO string
    const createdAt = item.created_at || item.createdAt || new Date().toISOString();

    return {
      tweetId,
      text,
      createdAt,
      url: item.tweetUrl || (username ? `https://x.com/${username}/status/${tweetId}` : ''),
      likes: item.favorite_count || item.likeCount || 0,
      retweets: item.retweet_count || item.retweetCount || 0,
      replies: item.reply_count || item.replyCount || 0,
      views: item.views_count || item.viewCount || 0,
    };
  } catch (error) {
    console.error('Error parsing tweet:', error);
    return null;
  }
}

/**
 * Parse Apify user data to our TwitterProfile format
 * Supports both apidojo/tweet-scraper and quacker/twitter-scraper formats
 */
function parseProfile(item: ApifyTweetItem): TwitterProfile | null {
  try {
    // Skip noResults items
    if (item.noResults) return null;

    // quacker format has user info at top level
    const user = item.user;

    // Try quacker format first (user info at top level)
    if (item.handle || item.username) {
      return {
        userId: item.userId || '',
        username: item.handle || item.username || '',
        displayName: item.displayName || item.name || item.handle || '',
        bio: item.bio || item.description || '',
        profileImageUrl: item.profileImageUrl || item.avatar || '',
        followersCount: item.followersCount || item.followers || 0,
        followingCount: item.followingCount || item.following || 0,
        isVerified: item.isVerified || item.verified || false,
      };
    }

    // Fall back to apidojo format (user nested object)
    if (!user) return null;

    return {
      userId: user.id_str || '',
      username: user.screen_name || '',
      displayName: user.name || '',
      bio: user.description || '',
      profileImageUrl: user.profile_image_url_https?.replace('_normal', '_400x400') || '',
      followersCount: user.followers_count || 0,
      followingCount: user.friends_count || 0,
      isVerified: user.verified || false,
    };
  } catch (error) {
    console.error('Error parsing profile:', error);
    return null;
  }
}

/**
 * Fetch Twitter data using Apify
 * @param username Twitter username (without @)
 * @param tweetCount Number of tweets to fetch (default 100)
 */
export async function getTwitterData(
  username: string,
  tweetCount: number = 100
): Promise<TwitterData> {
  const client = getApifyClient();
  const cleanUsername = username.replace('@', '');

  console.log(`[Apify] Fetching data for @${cleanUsername} (${tweetCount} tweets)`);

  try {
    // Run the tweet scraper actor
    // quacker/twitter-scraper uses different input format
    const run = await client.actor(TWEET_SCRAPER_ACTOR).call({
      handles: [cleanUsername],
      tweetsDesired: tweetCount,
      proxyConfig: { useApifyProxy: true },
    });

    console.log(`[Apify] Run completed with ID: ${run.id}`);

    // Get results from the dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    console.log(`[Apify] Retrieved ${items.length} items`);

    // Parse profile from first tweet with user info
    let profile: TwitterProfile | null = null;
    const tweets: Tweet[] = [];
    const contractsFound: ContractCall[] = [];

    for (const item of items as ApifyTweetItem[]) {
      // Extract profile from first item with user data
      if (!profile && item.user) {
        profile = parseProfile(item);
      }

      // Parse tweet
      const tweet = parseTweet(item);
      if (tweet) {
        tweets.push(tweet);

        // Extract contracts from tweet
        const calls = extractCallsFromTweet(
          tweet.tweetId,
          tweet.text,
          tweet.url,
          tweet.createdAt
        );

        // Only add high/medium confidence calls
        for (const call of calls) {
          if (call.confidence !== 'low') {
            contractsFound.push({
              contractAddress: call.address,
              tweetId: call.tweetId,
              tweetUrl: call.tweetUrl,
              tweetText: call.tweetText,
              timestamp: call.timestamp,
            });
          }
        }
      }
    }

    // Create default profile if none found
    if (!profile) {
      profile = {
        userId: '',
        username: cleanUsername,
        displayName: cleanUsername,
        bio: '',
        profileImageUrl: '',
        followersCount: 0,
        followingCount: 0,
        isVerified: false,
      };
    }

    // Sort tweets by date (newest first)
    tweets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Sort contracts by timestamp (newest first)
    contractsFound.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    console.log(`[Apify] Parsed ${tweets.length} tweets, found ${contractsFound.length} contracts`);

    return {
      profile,
      tweets,
      contractsFound,
    };
  } catch (error) {
    console.error('[Apify] Error fetching Twitter data:', error);
    throw error;
  }
}

/**
 * Fetch only Twitter profile (cheaper, no tweets)
 * Uses fewer API credits by getting minimal tweet count
 */
export async function getTwitterProfile(username: string): Promise<TwitterProfile> {
  const client = getApifyClient();
  const cleanUsername = username.replace('@', '');

  console.log(`[Apify] Fetching profile for @${cleanUsername}`);

  try {
    // Fetch just 1 tweet to get profile data
    const run = await client.actor(TWEET_SCRAPER_ACTOR).call({
      startUrls: [`https://twitter.com/${cleanUsername}`],
      maxTweets: 1,
      addUserInfo: true,
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (items.length > 0) {
      const profile = parseProfile(items[0] as ApifyTweetItem);
      if (profile) {
        console.log(`[Apify] Profile fetched: ${profile.displayName} (@${profile.username})`);
        return profile;
      }
    }

    throw new Error(`Profile not found for @${cleanUsername}`);
  } catch (error) {
    console.error('[Apify] Error fetching profile:', error);
    throw error;
  }
}

/**
 * Fetch recent tweets for monitoring updates
 * @param username Twitter username
 * @param count Number of recent tweets (default 5)
 */
export async function getRecentTweets(
  username: string,
  count: number = 5
): Promise<{ tweets: Tweet[]; contractsFound: ContractCall[] }> {
  const client = getApifyClient();
  const cleanUsername = username.replace('@', '');

  console.log(`[Apify] Fetching ${count} recent tweets for @${cleanUsername}`);

  try {
    const run = await client.actor(TWEET_SCRAPER_ACTOR).call({
      startUrls: [`https://twitter.com/${cleanUsername}`],
      maxTweets: count,
      addUserInfo: true,
      scrapeTweetReplies: false,
      scrapeRetweets: false,
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    const tweets: Tweet[] = [];
    const contractsFound: ContractCall[] = [];

    for (const item of items as ApifyTweetItem[]) {
      const tweet = parseTweet(item);
      if (tweet) {
        tweets.push(tweet);

        const calls = extractCallsFromTweet(
          tweet.tweetId,
          tweet.text,
          tweet.url,
          tweet.createdAt
        );

        for (const call of calls) {
          if (call.confidence !== 'low') {
            contractsFound.push({
              contractAddress: call.address,
              tweetId: call.tweetId,
              tweetUrl: call.tweetUrl,
              tweetText: call.tweetText,
              timestamp: call.timestamp,
            });
          }
        }
      }
    }

    console.log(`[Apify] Found ${tweets.length} tweets, ${contractsFound.length} contracts`);

    return { tweets, contractsFound };
  } catch (error) {
    console.error('[Apify] Error fetching recent tweets:', error);
    throw error;
  }
}

/**
 * Check if Apify is properly configured
 */
export function isApifyConfigured(): boolean {
  return !!process.env.APIFY_API_TOKEN;
}
