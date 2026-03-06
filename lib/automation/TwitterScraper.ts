/**
 * Twitter Scraper using Nitter RSS feeds
 *
 * Since we don't have Twitter API access, we use Nitter instances
 * which provide RSS feeds for public Twitter accounts
 */

import {
  AUTOMATION_CONFIG,
  getRandomNitterInstance,
  automationLog,
} from './config';

export interface Tweet {
  id: string;
  text: string;
  timestamp: Date;
  url: string;
  authorHandle: string;
}

export interface ScrapedTweets {
  tweets: Tweet[];
  success: boolean;
  error?: string;
  source: string;
}

/**
 * Parse RSS XML to extract tweets
 */
function parseRSSFeed(xml: string, handle: string): Tweet[] {
  const tweets: Tweet[] = [];

  try {
    // Simple regex-based XML parsing (avoiding heavy dependencies)
    // Match <item> blocks
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let itemMatch;

    while ((itemMatch = itemRegex.exec(xml)) !== null) {
      const itemContent = itemMatch[1];

      // Extract title (tweet text)
      const titleMatch = itemContent.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/);
      const titleAlt = itemContent.match(/<title>([\s\S]*?)<\/title>/);
      const text = titleMatch?.[1] || titleAlt?.[1] || '';

      // Extract link (tweet URL)
      const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
      const url = linkMatch?.[1]?.trim() || '';

      // Extract pubDate
      const dateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const dateStr = dateMatch?.[1]?.trim() || '';
      const timestamp = dateStr ? new Date(dateStr) : new Date();

      // Extract tweet ID from URL
      const idMatch = url.match(/status\/(\d+)/);
      const id = idMatch?.[1] || `${Date.now()}-${Math.random()}`;

      // Clean up text (decode HTML entities)
      const cleanText = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n/g, ' ')
        .trim();

      if (cleanText && id) {
        tweets.push({
          id,
          text: cleanText,
          timestamp,
          url: url.replace(/nitter\.[^/]+/, 'x.com'), // Convert to X.com URL
          authorHandle: handle,
        });
      }
    }
  } catch (error) {
    automationLog('error', 'Failed to parse RSS feed', error);
  }

  return tweets;
}

/**
 * Fetch tweets from a single Nitter instance
 */
async function fetchFromNitter(
  handle: string,
  nitterInstance: string
): Promise<ScrapedTweets> {
  const cleanHandle = handle.replace('@', '');
  const rssUrl = `${nitterInstance}/${cleanHandle}/rss`;

  try {
    automationLog('debug', `Fetching RSS from ${rssUrl}`);

    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; XSCAN/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xml = await response.text();

    // Check if we got valid RSS
    if (!xml.includes('<rss') && !xml.includes('<feed')) {
      throw new Error('Invalid RSS response');
    }

    const tweets = parseRSSFeed(xml, cleanHandle);

    automationLog('info', `Fetched ${tweets.length} tweets for @${cleanHandle} from ${nitterInstance}`);

    return {
      tweets,
      success: true,
      source: nitterInstance,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    automationLog('warn', `Failed to fetch from ${nitterInstance}: ${errorMessage}`);

    return {
      tweets: [],
      success: false,
      error: errorMessage,
      source: nitterInstance,
    };
  }
}

/**
 * Fetch tweets for a Twitter handle, trying multiple Nitter instances
 */
export async function fetchTweets(handle: string): Promise<ScrapedTweets> {
  const instances = [...AUTOMATION_CONFIG.NITTER_INSTANCES];

  // Shuffle instances for load balancing
  for (let i = instances.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [instances[i], instances[j]] = [instances[j], instances[i]];
  }

  // Try each instance until one works
  for (const instance of instances) {
    const result = await fetchFromNitter(handle, instance);

    if (result.success && result.tweets.length > 0) {
      return result;
    }

    // Small delay before trying next instance
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // All instances failed
  automationLog('error', `All Nitter instances failed for @${handle}`);

  return {
    tweets: [],
    success: false,
    error: 'All Nitter instances unavailable',
    source: 'none',
  };
}

/**
 * Fetch tweets for multiple handles
 */
export async function fetchTweetsForMultipleHandles(
  handles: string[]
): Promise<Map<string, ScrapedTweets>> {
  const results = new Map<string, ScrapedTweets>();

  for (const handle of handles) {
    const result = await fetchTweets(handle);
    results.set(handle.replace('@', ''), result);

    // Rate limiting delay between handles
    await new Promise(resolve =>
      setTimeout(resolve, AUTOMATION_CONFIG.DELAY_BETWEEN_REQUESTS_MS)
    );
  }

  return results;
}

/**
 * Filter tweets to only those after a certain timestamp
 */
export function filterTweetsByTime(
  tweets: Tweet[],
  afterTimestamp: Date
): Tweet[] {
  return tweets.filter(tweet => tweet.timestamp > afterTimestamp);
}

/**
 * Filter tweets that likely contain calls (have potential CAs)
 */
export function filterPotentialCallTweets(tweets: Tweet[]): Tweet[] {
  const caRegex = AUTOMATION_CONFIG.SOLANA_ADDRESS_REGEX;

  return tweets.filter(tweet => {
    // Reset regex lastIndex
    caRegex.lastIndex = 0;
    return caRegex.test(tweet.text);
  });
}
