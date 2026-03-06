/**
 * GeckoTerminal API client for EVM chains historical price data
 * FREE API - No API key required!
 * Supports: BSC, Base, Ethereum, and 250+ other networks
 * Docs: https://apiguide.geckoterminal.com/
 *
 * Note: GeckoTerminal requires POOL address, not token address
 * We first need to find the pool for a token, then get OHLCV
 */

const GECKOTERMINAL_API_BASE = 'https://api.geckoterminal.com/api/v2';

// Network identifiers for GeckoTerminal
export type GeckoTerminalNetwork = 'bsc' | 'base' | 'eth' | 'solana';

const NETWORK_MAP: Record<string, GeckoTerminalNetwork> = {
  bsc: 'bsc',
  base: 'base',
  ethereum: 'eth',
  solana: 'solana',
};

interface GeckoTerminalPoolResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      base_token_price_usd: string;
      quote_token_price_usd: string;
      base_token_price_native_currency: string;
      address: string;
      name: string;
      pool_created_at: string;
      fdv_usd: string;
      market_cap_usd: string | null;
      price_change_percentage: {
        h1: string;
        h24: string;
      };
      transactions: {
        h1: { buys: number; sells: number };
        h24: { buys: number; sells: number };
      };
      volume_usd: {
        h1: string;
        h24: string;
      };
      reserve_in_usd: string;
    };
    relationships: {
      base_token: { data: { id: string } };
      quote_token: { data: { id: string } };
      dex: { data: { id: string } };
    };
  }[];
}

interface GeckoTerminalOHLCVResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      ohlcv_list: Array<[number, number, number, number, number, number]>;
      // [timestamp, open, high, low, close, volume]
    };
  };
}

interface GeckoTerminalTokenResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      address: string;
      name: string;
      symbol: string;
      decimals: number;
      image_url: string | null;
      coingecko_coin_id: string | null;
      price_usd: string;
      fdv_usd: string;
      total_reserve_in_usd: string;
      volume_usd: {
        h24: string;
      };
      market_cap_usd: string | null;
    };
    relationships: {
      top_pools: {
        data: Array<{ id: string; type: string }>;
      };
    };
  };
  included?: Array<{
    id: string;
    type: string;
    attributes: {
      address: string;
      name: string;
    };
  }>;
}

/**
 * Convert chain to GeckoTerminal network
 */
export function toGeckoNetwork(chain: string): GeckoTerminalNetwork | null {
  return NETWORK_MAP[chain] || null;
}

interface PoolInfo {
  id: string;
  type: string;
  attributes: {
    base_token_price_usd: string;
    quote_token_price_usd: string;
    address: string;
    name: string;
  };
  relationships: {
    base_token: { data: { id: string } };
    quote_token: { data: { id: string } };
  };
}

interface GeckoTerminalTokenWithPoolsResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      address: string;
      name: string;
      symbol: string;
      price_usd: string;
    };
    relationships: {
      top_pools: {
        data: Array<{ id: string; type: string }>;
      };
    };
  };
  included?: PoolInfo[];
}

/**
 * Get token info and find the best pool for OHLCV
 * Also determines if token is base or quote in the pool (needed for price inversion)
 */
export async function getTokenInfo(
  address: string,
  network: GeckoTerminalNetwork
): Promise<{
  price: number;
  poolAddress: string;
  symbol: string;
  name: string;
  isQuoteToken: boolean; // If true, OHLCV prices need to be inverted
} | null> {
  try {
    console.log(`[GeckoTerminal] Fetching token info for ${address} on ${network}`);

    const response = await fetch(
      `${GECKOTERMINAL_API_BASE}/networks/${network}/tokens/${address}?include=top_pools`,
      {
        headers: {
          'accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`[GeckoTerminal] Token API error: ${response.status}`);
      return null;
    }

    const data: GeckoTerminalTokenWithPoolsResponse = await response.json();

    if (!data.data) {
      console.log(`[GeckoTerminal] No token data for ${address}`);
      return null;
    }

    const token = data.data;
    const topPools = token.relationships?.top_pools?.data;

    if (!topPools || topPools.length === 0) {
      console.log(`[GeckoTerminal] No pools found for ${address}`);
      return null;
    }

    // Get the first (best) pool - format is "network_poolAddress"
    const poolId = topPools[0].id;
    const poolAddress = poolId.split('_')[1];

    // Check if our token is the quote token (not base) in the pool
    // If so, we need to invert OHLCV prices
    let isQuoteToken = false;
    const normalizedAddress = address.toLowerCase();

    if (data.included) {
      const poolData = data.included.find(p => p.id === poolId);
      if (poolData) {
        const quoteTokenId = poolData.relationships?.quote_token?.data?.id;
        // quoteTokenId format: "network_address"
        if (quoteTokenId && quoteTokenId.toLowerCase().includes(normalizedAddress)) {
          isQuoteToken = true;
          console.log(`[GeckoTerminal] Token ${token.attributes.symbol} is QUOTE token in pool ${poolData.attributes.name}`);
        } else {
          console.log(`[GeckoTerminal] Token ${token.attributes.symbol} is BASE token in pool ${poolData.attributes.name}`);
        }
      }
    }

    return {
      price: parseFloat(token.attributes.price_usd) || 0,
      poolAddress,
      symbol: token.attributes.symbol,
      name: token.attributes.name,
      isQuoteToken,
    };
  } catch (error) {
    console.error('[GeckoTerminal] Error fetching token info:', error);
    return null;
  }
}

/**
 * Get historical price by finding OHLCV candle closest to timestamp
 *
 * @param address - EVM token address
 * @param network - Network (bsc, base, eth)
 * @param unixTime - Unix timestamp for the price point
 */
export async function getHistoricalPrice(
  address: string,
  network: GeckoTerminalNetwork,
  unixTime: number
): Promise<{ price: number; timestamp: number } | null> {
  try {
    // First, get the pool address for this token
    const tokenInfo = await getTokenInfo(address, network);

    if (!tokenInfo || !tokenInfo.poolAddress) {
      console.log(`[GeckoTerminal] Could not find pool for ${address}`);
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    const timeRangeHours = (now - unixTime) / 3600;

    // Choose timeframe: 1-min candles for precision on recent data
    let timeframe = 'day';
    let aggregate = 1;

    if (timeRangeHours < 6) {
      timeframe = 'minute';
      aggregate = 1;
    } else if (timeRangeHours < 24) {
      timeframe = 'minute';
      aggregate = 15;
    } else if (timeRangeHours < 168) { // 7 days
      timeframe = 'hour';
      aggregate = 1;
    } else if (timeRangeHours < 720) { // 30 days
      timeframe = 'hour';
      aggregate = 4;
    }

    console.log(`[GeckoTerminal] Fetching OHLCV (${timeframe}/${aggregate}) for pool ${tokenInfo.poolAddress} on ${network}`);

    // Use before_timestamp to get data around our target time
    // Add some buffer to make sure we capture the time we need
    const beforeTimestamp = unixTime + (24 * 60 * 60); // 1 day after target

    const response = await fetch(
      `${GECKOTERMINAL_API_BASE}/networks/${network}/pools/${tokenInfo.poolAddress}/ohlcv/${timeframe}?aggregate=${aggregate}&before_timestamp=${beforeTimestamp}&limit=1000&currency=usd`,
      {
        headers: {
          'accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`[GeckoTerminal] OHLCV API error: ${response.status}`);
      return null;
    }

    const data: GeckoTerminalOHLCVResponse = await response.json();

    if (!data.data?.attributes?.ohlcv_list || data.data.attributes.ohlcv_list.length === 0) {
      console.log(`[GeckoTerminal] No OHLCV data for ${address}`);
      return null;
    }

    const candles = data.data.attributes.ohlcv_list;
    console.log(`[GeckoTerminal] Got ${candles.length} candles (isQuoteToken: ${tokenInfo.isQuoteToken})`);

    // Find candle closest to our target timestamp
    let closestCandle = candles[0];
    let closestDiff = Math.abs(closestCandle[0] - unixTime);

    for (const candle of candles) {
      const diff = Math.abs(candle[0] - unixTime);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestCandle = candle;
      }
    }

    // Use open price of closest candle
    // OHLCV returns base token price. If our token is quote, we need to invert
    let historicalPrice = closestCandle[1]; // open price
    if (tokenInfo.isQuoteToken && historicalPrice > 0) {
      historicalPrice = 1 / historicalPrice;
    }
    const candleTimestamp = closestCandle[0];

    console.log(`[GeckoTerminal] Historical price for ${tokenInfo.symbol}: $${historicalPrice} at ${new Date(candleTimestamp * 1000).toISOString()}`);

    return {
      price: historicalPrice,
      timestamp: candleTimestamp,
    };
  } catch (error) {
    console.error('[GeckoTerminal] Error fetching historical price:', error);
    return null;
  }
}

/**
 * Get OHLCV data to find the all-time high since a specific time
 *
 * @param address - EVM token address
 * @param network - Network (bsc, base, eth)
 * @param fromUnixTime - Start time (entry timestamp)
 */
export async function getOHLCVData(
  address: string,
  network: GeckoTerminalNetwork,
  fromUnixTime?: number
): Promise<{
  athPrice: number;
  athTimestamp: number;
} | null> {
  try {
    // First, get the pool address for this token
    const tokenInfo = await getTokenInfo(address, network);

    if (!tokenInfo || !tokenInfo.poolAddress) {
      console.log(`[GeckoTerminal] Could not find pool for ${address}`);
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    const from = fromUnixTime || now - (180 * 24 * 60 * 60);
    const timeRangeHours = (now - from) / 3600;

    // Choose timeframe: 1-min candles for precision on recent data
    let timeframe = 'day';
    let aggregate = 1;

    if (timeRangeHours < 6) {
      timeframe = 'minute';
      aggregate = 1;
    } else if (timeRangeHours < 24) {
      timeframe = 'minute';
      aggregate = 15;
    } else if (timeRangeHours < 168) { // 7 days
      timeframe = 'hour';
      aggregate = 1;
    } else if (timeRangeHours < 720) { // 30 days
      timeframe = 'hour';
      aggregate = 4;
    }

    console.log(`[GeckoTerminal] Fetching OHLCV (${timeframe}/${aggregate}) for ATH from pool ${tokenInfo.poolAddress} on ${network}`);

    const response = await fetch(
      `${GECKOTERMINAL_API_BASE}/networks/${network}/pools/${tokenInfo.poolAddress}/ohlcv/${timeframe}?aggregate=${aggregate}&limit=1000&currency=usd`,
      {
        headers: {
          'accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`[GeckoTerminal] OHLCV API error: ${response.status}`);
      return null;
    }

    const data: GeckoTerminalOHLCVResponse = await response.json();

    if (!data.data?.attributes?.ohlcv_list || data.data.attributes.ohlcv_list.length === 0) {
      console.log(`[GeckoTerminal] No OHLCV data for ${address}`);
      return null;
    }

    const candles = data.data.attributes.ohlcv_list;
    console.log(`[GeckoTerminal] Got ${candles.length} candles for ATH calculation (isQuoteToken: ${tokenInfo.isQuoteToken})`);

    // Find the highest price (using high value from OHLCV)
    // Only consider candles AFTER our fromUnixTime
    // NOTE: If token is quote, we need to invert prices
    // For quote tokens: high becomes 1/low, low becomes 1/high
    let athPrice = 0;
    let athTimestamp = 0;

    for (const candle of candles) {
      const [timestamp, , high, low] = candle; // [timestamp, open, high, low, close, volume]

      // Only consider candles after entry time
      if (timestamp >= from) {
        let priceHigh: number;
        if (tokenInfo.isQuoteToken && low > 0) {
          // For quote token, the ATH is when base token price is LOWEST (1/low)
          priceHigh = 1 / low;
        } else {
          priceHigh = high;
        }

        if (priceHigh > athPrice) {
          athPrice = priceHigh;
          athTimestamp = timestamp;
        }
      }
    }

    if (athPrice === 0) {
      console.log(`[GeckoTerminal] No candles found after entry time for ${address}`);
      return null;
    }

    console.log(`[GeckoTerminal] ATH for ${tokenInfo.symbol}: $${athPrice} at ${new Date(athTimestamp * 1000).toISOString()}`);

    return {
      athPrice,
      athTimestamp,
    };
  } catch (error) {
    console.error('[GeckoTerminal] Error fetching OHLCV data:', error);
    return null;
  }
}

/**
 * Delay to respect rate limits (30 req/min)
 * Using 3 seconds to be safe with 2 API calls per token
 */
export async function rateLimitDelay(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 3000)); // ~20 req/min to be very safe
}

/**
 * Get both historical price and ATH in a single optimized call
 * This reduces API calls from 4 to 2 per token
 */
export async function getHistoricalAndATH(
  address: string,
  network: GeckoTerminalNetwork,
  entryUnixTime: number
): Promise<{
  entryPrice: number;
  entryTimestamp: number;
  athPrice: number;
  athTimestamp: number;
} | null> {
  try {
    // First, get the pool address for this token (1 API call)
    const tokenInfo = await getTokenInfo(address, network);

    if (!tokenInfo || !tokenInfo.poolAddress) {
      console.log(`[GeckoTerminal] Could not find pool for ${address}`);
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    const timeRangeHours = (now - entryUnixTime) / 3600;

    // Choose timeframe: 1-min candles for precision on recent data
    let timeframe = 'day';
    let aggregate = 1;

    if (timeRangeHours < 6) {
      timeframe = 'minute';
      aggregate = 1;
    } else if (timeRangeHours < 24) {
      timeframe = 'minute';
      aggregate = 15;
    } else if (timeRangeHours < 168) { // 7 days
      timeframe = 'hour';
      aggregate = 1;
    } else if (timeRangeHours < 720) { // 30 days
      timeframe = 'hour';
      aggregate = 4;
    } else if (timeRangeHours < 2160) { // 90 days
      timeframe = 'day';
      aggregate = 1;
    }

    console.log(`[GeckoTerminal] Fetching OHLCV for ${tokenInfo.symbol} (${tokenInfo.isQuoteToken ? 'QUOTE' : 'BASE'}) from pool ${tokenInfo.poolAddress}`);

    // Single OHLCV call with maximum data (1 API call)
    const response = await fetch(
      `${GECKOTERMINAL_API_BASE}/networks/${network}/pools/${tokenInfo.poolAddress}/ohlcv/${timeframe}?aggregate=${aggregate}&limit=1000&currency=usd`,
      {
        headers: {
          'accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`[GeckoTerminal] OHLCV API error: ${response.status}`);
      return null;
    }

    const data: GeckoTerminalOHLCVResponse = await response.json();

    if (!data.data?.attributes?.ohlcv_list || data.data.attributes.ohlcv_list.length === 0) {
      console.log(`[GeckoTerminal] No OHLCV data for ${address}`);
      return null;
    }

    const candles = data.data.attributes.ohlcv_list;
    console.log(`[GeckoTerminal] Got ${candles.length} candles for ${tokenInfo.symbol}`);

    // Find entry price (candle closest to entry time)
    let closestCandle = candles[0];
    let closestDiff = Math.abs(closestCandle[0] - entryUnixTime);

    for (const candle of candles) {
      const diff = Math.abs(candle[0] - entryUnixTime);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestCandle = candle;
      }
    }

    // Calculate entry price
    let entryPrice = closestCandle[1]; // open price
    if (tokenInfo.isQuoteToken && entryPrice > 0) {
      entryPrice = 1 / entryPrice;
    }

    // Find ATH since entry
    let athPrice = 0;
    let athTimestamp = 0;

    for (const candle of candles) {
      const [timestamp, , high, low] = candle;

      // Only consider candles after entry time
      if (timestamp >= entryUnixTime) {
        let priceHigh: number;
        if (tokenInfo.isQuoteToken && low > 0) {
          priceHigh = 1 / low;
        } else {
          priceHigh = high;
        }

        if (priceHigh > athPrice) {
          athPrice = priceHigh;
          athTimestamp = timestamp;
        }
      }
    }

    // If no ATH found after entry, use entry as ATH
    if (athPrice === 0) {
      athPrice = entryPrice;
      athTimestamp = closestCandle[0];
    }

    console.log(`[GeckoTerminal] ${tokenInfo.symbol}: Entry $${entryPrice.toExponential(4)}, ATH $${athPrice.toExponential(4)}`);

    return {
      entryPrice,
      entryTimestamp: closestCandle[0],
      athPrice,
      athTimestamp,
    };
  } catch (error) {
    console.error('[GeckoTerminal] Error fetching historical and ATH:', error);
    return null;
  }
}
