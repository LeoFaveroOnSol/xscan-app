// Solana Contract Address Extraction

// Solana addresses are base58 encoded and typically 32-44 characters
// They use characters: 1-9, A-H, J-N, P-Z, a-k, m-z (no 0, I, O, l)
const SOLANA_ADDRESS_REGEX = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;

// Known token addresses to ignore (common tokens, not memecoins)
const IGNORED_ADDRESSES = new Set([
  // Native SOL
  'So11111111111111111111111111111111111111112',
  // USDC
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  // USDT
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  // BONK
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  // RAY (Raydium)
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  // SRM (Serum)
  'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
  // ORCA
  'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
  // MNGO (Mango)
  'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac',
  // JUP (Jupiter)
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  // PYTH
  'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
  // W (Wormhole)
  '85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ',
  // WEN
  'WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk',
  // Token Program
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  // Token 2022 Program
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
  // Associated Token Program
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  // System Program
  '11111111111111111111111111111111',
  // Pump.fun Program
  '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
  // Raydium AMM
  '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
  // Metaplex
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
]);

// Common URL patterns that might contain base58-looking strings but aren't contracts
const URL_PATTERNS = [
  /https?:\/\/[^\s]+/g,
  /t\.co\/[a-zA-Z0-9]+/g,
  /twitter\.com\/[a-zA-Z0-9_]+/g,
  /x\.com\/[a-zA-Z0-9_]+/g,
];

export interface ExtractedContract {
  address: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Validates if a string is a valid Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  // Check length
  if (address.length < 32 || address.length > 44) {
    return false;
  }

  // Check characters (base58)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  if (!base58Regex.test(address)) {
    return false;
  }

  // Check if it's an ignored address
  if (IGNORED_ADDRESSES.has(address)) {
    return false;
  }

  return true;
}

/**
 * Removes URLs from text to avoid false positives
 */
function removeUrls(text: string): string {
  let cleaned = text;
  for (const pattern of URL_PATTERNS) {
    cleaned = cleaned.replace(pattern, ' ');
  }
  return cleaned;
}

/**
 * Extracts potential Solana contract addresses from text
 */
export function extractContractAddresses(text: string): ExtractedContract[] {
  const contracts: ExtractedContract[] = [];
  const seen = new Set<string>();

  // Remove URLs first to avoid false positives
  const cleanedText = removeUrls(text);

  // Find all potential addresses
  const matches = cleanedText.match(SOLANA_ADDRESS_REGEX) || [];

  for (const match of matches) {
    // Skip if already seen
    if (seen.has(match)) continue;
    seen.add(match);

    // Validate and determine confidence
    if (isValidSolanaAddress(match)) {
      // Higher confidence for addresses that look more like token mints
      // Token mints typically end with "pump" patterns or have specific lengths
      let confidence: 'high' | 'medium' | 'low' = 'medium';

      // Most token addresses are 43-44 characters
      if (match.length >= 43) {
        confidence = 'high';
      }

      // Lower confidence for very short matches
      if (match.length < 40) {
        confidence = 'low';
      }

      contracts.push({
        address: match,
        confidence,
      });
    }
  }

  return contracts;
}

/**
 * Check if text likely contains a crypto call (mentions of CA, contract, token, etc.)
 */
export function looksLikeCryptoCall(text: string): boolean {
  const lowerText = text.toLowerCase();

  const callIndicators = [
    'ca:',
    'ca ',
    'contract:',
    'contract ',
    'token:',
    'mint:',
    'address:',
    'ape',
    'aped',
    'aping',
    'buy',
    'buying',
    'bought',
    'entry',
    'degen',
    'pump',
    'moon',
    'gem',
    '100x',
    '10x',
    '50x',
    '1000x',
    'send it',
    'sendit',
    'letsgo',
    "let's go",
    'nfa',
    'dyor',
    'early',
    'ez',
    'bullish',
    'solana',
    '$sol',
    'memecoin',
    'meme coin',
  ];

  return callIndicators.some((indicator) => lowerText.includes(indicator));
}

/**
 * Extract contracts with context - returns only high-confidence calls
 */
export function extractCallsFromTweet(
  tweetId: string,
  tweetText: string,
  tweetUrl: string,
  timestamp: string
): {
  address: string;
  tweetId: string;
  tweetUrl: string;
  tweetText: string;
  timestamp: string;
  confidence: 'high' | 'medium' | 'low';
}[] {
  const contracts = extractContractAddresses(tweetText);
  const looksLikeCall = looksLikeCryptoCall(tweetText);

  return contracts.map((contract) => ({
    address: contract.address,
    tweetId,
    tweetUrl,
    tweetText,
    timestamp,
    // Boost confidence if the tweet looks like a crypto call
    confidence: looksLikeCall && contract.confidence === 'medium' ? 'high' : contract.confidence,
  }));
}
