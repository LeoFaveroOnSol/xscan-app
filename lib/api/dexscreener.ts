import type { TokenData } from '@/types/database';

const DEXSCREENER_API_BASE = 'https://api.dexscreener.com';

// Chain ID mapping for DexScreener API
export type DexScreenerChain = 'solana' | 'bsc' | 'base' | 'ethereum';

const CHAIN_ID_MAP: Record<DexScreenerChain, string> = {
  solana: 'solana',
  bsc: 'bsc',
  base: 'base',
  ethereum: 'ethereum',
};

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  info?: {
    imageUrl?: string;
    header?: string;
    openGraph?: string;
    websites?: Array<{ label: string; url: string }>;
    socials?: Array<{ type: string; url: string }>;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  marketCap: number;
  pairCreatedAt: number;
}

interface DexScreenerResponse {
  schemaVersion: string;
  pairs: DexScreenerPair[] | null;
}

/**
 * Fetch token data from DexScreener
 * Note: /tokens/v1/{chain}/ returns array directly, not {pairs: [...]}
 * @param address - Token contract address
 * @param chain - Blockchain network (default: 'solana')
 */
export async function getTokenData(address: string, chain: DexScreenerChain = 'solana'): Promise<TokenData | null> {
  try {
    const chainId = CHAIN_ID_MAP[chain];
    const response = await fetch(
      `${DEXSCREENER_API_BASE}/tokens/v1/${chainId}/${address}`,
      {
        next: { revalidate: 60 }, // Cache for 60 seconds
      }
    );

    if (!response.ok) {
      console.error(`DexScreener API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // API returns array directly for /tokens/v1/ endpoint
    const pairs: DexScreenerPair[] = Array.isArray(data) ? data : (data.pairs || []);

    if (!pairs || pairs.length === 0) {
      return null;
    }

    // Get the pair with highest liquidity
    const pair = pairs.reduce((best, current) => {
      return (current.liquidity?.usd || 0) > (best.liquidity?.usd || 0) ? current : best;
    });

    return {
      address: pair.baseToken.address,
      symbol: pair.baseToken.symbol,
      name: pair.baseToken.name,
      price: parseFloat(pair.priceUsd) || 0,
      marketCap: pair.marketCap || pair.fdv || 0,
      liquidity: pair.liquidity?.usd || 0,
      priceChange24h: pair.priceChange?.h24 || 0,
      volume24h: pair.volume?.h24 || 0,
      imageUrl: pair.info?.imageUrl || undefined,
    };
  } catch (error) {
    console.error('Error fetching token data from DexScreener:', error);
    return null;
  }
}

/**
 * Fetch multiple tokens data
 * Note: /tokens/v1/{chain}/ returns array directly, not {pairs: [...]}
 * @param addresses - Array of token contract addresses
 * @param chain - Blockchain network (default: 'solana')
 */
export async function getMultipleTokensData(addresses: string[], chain: DexScreenerChain = 'solana'): Promise<Map<string, TokenData>> {
  const results = new Map<string, TokenData>();
  const chainId = CHAIN_ID_MAP[chain];

  // DexScreener allows batch requests (comma-separated addresses)
  // But limit to 30 at a time
  const batchSize = 30;
  const batches: string[][] = [];

  for (let i = 0; i < addresses.length; i += batchSize) {
    batches.push(addresses.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    try {
      const addressList = batch.join(',');
      const response = await fetch(
        `${DEXSCREENER_API_BASE}/tokens/v1/${chainId}/${addressList}`,
        {
          next: { revalidate: 60 },
        }
      );

      if (!response.ok) continue;

      const data = await response.json();

      // API returns array directly for /tokens/v1/ endpoint
      const pairs: DexScreenerPair[] = Array.isArray(data) ? data : (data.pairs || []);

      if (pairs && pairs.length > 0) {
        // Group pairs by base token address
        const pairsByToken = new Map<string, DexScreenerPair[]>();

        for (const pair of pairs) {
          const addr = pair.baseToken.address;
          if (!pairsByToken.has(addr)) {
            pairsByToken.set(addr, []);
          }
          pairsByToken.get(addr)!.push(pair);
        }

        // Get best pair for each token
        for (const [addr, tokenPairs] of Array.from(pairsByToken.entries())) {
          const bestPair = tokenPairs.reduce((best, current) => {
            return (current.liquidity?.usd || 0) > (best.liquidity?.usd || 0) ? current : best;
          });

          results.set(addr, {
            address: bestPair.baseToken.address,
            symbol: bestPair.baseToken.symbol,
            name: bestPair.baseToken.name,
            price: parseFloat(bestPair.priceUsd) || 0,
            marketCap: bestPair.marketCap || bestPair.fdv || 0,
            liquidity: bestPair.liquidity?.usd || 0,
            priceChange24h: bestPair.priceChange?.h24 || 0,
            volume24h: bestPair.volume?.h24 || 0,
            imageUrl: bestPair.info?.imageUrl || undefined,
          });
        }
      }

      // Small delay between batches to avoid rate limiting
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error('Error fetching batch token data:', error);
    }
  }

  return results;
}

/**
 * Search for tokens by name or symbol
 */
export async function searchTokens(query: string): Promise<TokenData[]> {
  try {
    const response = await fetch(
      `${DEXSCREENER_API_BASE}/latest/dex/search?q=${encodeURIComponent(query)}`,
      {
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      return [];
    }

    const data: DexScreenerResponse = await response.json();

    if (!data.pairs) return [];

    // Filter for Solana pairs only and deduplicate by address
    const seen = new Set<string>();
    const results: TokenData[] = [];

    for (const pair of data.pairs) {
      if (pair.chainId !== 'solana') continue;
      if (seen.has(pair.baseToken.address)) continue;
      seen.add(pair.baseToken.address);

      results.push({
        address: pair.baseToken.address,
        symbol: pair.baseToken.symbol,
        name: pair.baseToken.name,
        price: parseFloat(pair.priceUsd) || 0,
        marketCap: pair.marketCap || pair.fdv || 0,
        liquidity: pair.liquidity?.usd || 0,
        priceChange24h: pair.priceChange?.h24 || 0,
        volume24h: pair.volume?.h24 || 0,
      });
    }

    return results.slice(0, 10); // Return top 10 results
  } catch (error) {
    console.error('Error searching tokens:', error);
    return [];
  }
}
