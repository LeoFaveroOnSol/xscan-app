/**
 * XSCAN Automation Configuration
 *
 * Settings for automatic tweet scanning and call detection
 */

export const AUTOMATION_CONFIG = {
  // Tweet scanning intervals (in milliseconds)
  SCAN_INTERVAL_MS: 2 * 60 * 1000, // 2 minutes

  // Price tracking
  PRICE_UPDATE_INTERVAL_MS: 1 * 60 * 1000, // 1 minute for active calls
  ATH_MONITORING_HOURS: 48, // Monitor ATH for 48 hours after detection

  // Win threshold (multiplier)
  WIN_THRESHOLD: 2, // 2x = win

  // Nitter instances for RSS feeds (fallback list)
  NITTER_INSTANCES: [
    'https://nitter.net',
    'https://nitter.privacydev.net',
    'https://nitter.poast.org',
    'https://nitter.1d4.us',
  ],

  // Rate limiting
  REQUESTS_PER_MINUTE: 30,
  DELAY_BETWEEN_REQUESTS_MS: 2000, // 2 seconds between requests

  // Contract address detection
  SOLANA_ADDRESS_REGEX: /[1-9A-HJ-NP-Za-km-z]{32,44}/g,

  // Known addresses to ignore (stablecoins, wrapped tokens, etc.)
  IGNORED_ADDRESSES: [
    'So11111111111111111111111111111111111111112', // Wrapped SOL
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
    '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj', // stSOL
    'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', // mSOL
    'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn', // JitoSOL
    'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
    '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', // ETH (Wormhole)
    'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', // PYTH
    'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', // JUP
  ],

  // Minimum requirements for a valid token
  MIN_LIQUIDITY_USD: 1000, // Minimum $1k liquidity
  MIN_MARKET_CAP_USD: 5000, // Minimum $5k market cap
  MAX_MARKET_CAP_USD: 100_000_000, // Max $100M (ignore established tokens)

  // Tweet content filters
  CALL_KEYWORDS: [
    'ca:', 'ca :', 'contract:', 'address:',
    'buy', 'ape', 'gem', 'moon', 'pump',
    'call', 'entry', 'degen', '100x', '10x', '50x',
    'nfa', 'dyor', 'sol', 'solana'
  ],

  // Logging
  ENABLE_DEBUG_LOGS: true,
};

/**
 * Check if an address should be ignored
 */
export function isIgnoredAddress(address: string): boolean {
  return AUTOMATION_CONFIG.IGNORED_ADDRESSES.includes(address);
}

/**
 * Check if a token meets minimum requirements
 */
export function meetsMinimumRequirements(
  liquidity: number,
  marketCap: number
): boolean {
  return (
    liquidity >= AUTOMATION_CONFIG.MIN_LIQUIDITY_USD &&
    marketCap >= AUTOMATION_CONFIG.MIN_MARKET_CAP_USD &&
    marketCap <= AUTOMATION_CONFIG.MAX_MARKET_CAP_USD
  );
}

/**
 * Check if tweet content likely contains a call
 */
export function isLikelyCallTweet(content: string): boolean {
  const lowerContent = content.toLowerCase();
  return AUTOMATION_CONFIG.CALL_KEYWORDS.some(keyword =>
    lowerContent.includes(keyword.toLowerCase())
  );
}

/**
 * Get a random Nitter instance
 */
export function getRandomNitterInstance(): string {
  const instances = AUTOMATION_CONFIG.NITTER_INSTANCES;
  return instances[Math.floor(Math.random() * instances.length)];
}

/**
 * Logger utility for automation
 */
export function automationLog(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  data?: any
): void {
  if (level === 'debug' && !AUTOMATION_CONFIG.ENABLE_DEBUG_LOGS) {
    return;
  }

  const timestamp = new Date().toISOString();
  const prefix = `[XSCAN-AUTO ${timestamp}]`;

  switch (level) {
    case 'info':
      console.log(`${prefix} ℹ️ ${message}`, data || '');
      break;
    case 'warn':
      console.warn(`${prefix} ⚠️ ${message}`, data || '');
      break;
    case 'error':
      console.error(`${prefix} ❌ ${message}`, data || '');
      break;
    case 'debug':
      console.log(`${prefix} 🔍 ${message}`, data || '');
      break;
  }
}
