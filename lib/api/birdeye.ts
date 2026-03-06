/**
 * Birdeye API client for historical price data
 * Docs: https://docs.birdeye.so/docs/historical-price-unix
 */

const BIRDEYE_API_BASE = 'https://public-api.birdeye.so';

interface BirdeyeHistoricalPriceResponse {
  success: boolean;
  data: {
    value: number;
    updateUnixTime: number;
    priceChange24h: number | null;
  };
}

interface BirdeyeTokenOverviewResponse {
  success: boolean;
  data: {
    address: string;
    decimals: number;
    symbol: string;
    name: string;
    extensions: {
      coingeckoId?: string;
      website?: string;
      twitter?: string;
    };
    logoURI: string;
    liquidity: number;
    price: number;
    history30mPrice: number;
    priceChange30mPercent: number;
    history1hPrice: number;
    priceChange1hPercent: number;
    history2hPrice: number;
    priceChange2hPercent: number;
    history4hPrice: number;
    priceChange4hPercent: number;
    history6hPrice: number;
    priceChange6hPercent: number;
    history8hPrice: number;
    priceChange8hPercent: number;
    history12hPrice: number;
    priceChange12hPercent: number;
    history24hPrice: number;
    priceChange24hPercent: number;
    uniqueWallet30m: number;
    uniqueWallet1h: number;
    uniqueWallet2h: number;
    uniqueWallet4h: number;
    uniqueWallet8h: number;
    uniqueWallet24h: number;
    trade30m: number;
    trade1h: number;
    trade2h: number;
    trade4h: number;
    trade8h: number;
    trade24h: number;
    sell30m: number;
    sell1h: number;
    sell2h: number;
    sell4h: number;
    sell8h: number;
    sell24h: number;
    buy30m: number;
    buy1h: number;
    buy2h: number;
    buy4h: number;
    buy8h: number;
    buy24h: number;
    v30m: number;
    v1h: number;
    v2h: number;
    v4h: number;
    v8h: number;
    v24h: number;
    v30mUSD: number;
    v1hUSD: number;
    v2hUSD: number;
    v4hUSD: number;
    v8hUSD: number;
    v24hUSD: number;
    mc?: number;
    realMc?: number;
    holder?: number;
    supply?: number;
  };
}

interface BirdeyeOHLCVResponse {
  success: boolean;
  data: {
    items: Array<{
      address: string;
      unixTime: number;
      o: number; // open
      h: number; // high
      l: number; // low
      c: number; // close
      v: number; // volume
      type: string;
    }>;
  };
}

/**
 * Check if Birdeye API is configured
 */
export function isBirdeyeConfigured(): boolean {
  return !!process.env.BIRDEYE_API_KEY;
}

/**
 * Get historical price at a specific Unix timestamp
 * Note: Only supports Solana, data from August 2023 onward
 *
 * @param address - Solana token address
 * @param unixTime - Unix timestamp for the price point
 */
export async function getHistoricalPrice(
  address: string,
  unixTime: number
): Promise<{ price: number; timestamp: number } | null> {
  const apiKey = process.env.BIRDEYE_API_KEY;

  if (!apiKey) {
    console.warn('[Birdeye] API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `${BIRDEYE_API_BASE}/defi/historical_price_unix?address=${address}&unixtime=${unixTime}`,
      {
        headers: {
          'accept': 'application/json',
          'x-chain': 'solana',
          'X-API-KEY': apiKey,
        },
      }
    );

    if (!response.ok) {
      console.error(`[Birdeye] API error: ${response.status}`);
      return null;
    }

    const data: BirdeyeHistoricalPriceResponse = await response.json();

    if (!data.success || !data.data) {
      return null;
    }

    return {
      price: data.data.value,
      timestamp: data.data.updateUnixTime,
    };
  } catch (error) {
    console.error('[Birdeye] Error fetching historical price:', error);
    return null;
  }
}

/**
 * Get token overview including current price and market data
 *
 * @param address - Solana token address
 */
export async function getTokenOverview(address: string): Promise<{
  price: number;
  marketCap: number | null;
  liquidity: number;
  volume24h: number;
  priceChange24h: number;
  holders: number | null;
} | null> {
  const apiKey = process.env.BIRDEYE_API_KEY;

  if (!apiKey) {
    console.warn('[Birdeye] API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `${BIRDEYE_API_BASE}/defi/token_overview?address=${address}`,
      {
        headers: {
          'accept': 'application/json',
          'x-chain': 'solana',
          'X-API-KEY': apiKey,
        },
      }
    );

    if (!response.ok) {
      console.error(`[Birdeye] API error: ${response.status}`);
      return null;
    }

    const data: BirdeyeTokenOverviewResponse = await response.json();

    if (!data.success || !data.data) {
      return null;
    }

    return {
      price: data.data.price,
      marketCap: data.data.mc || data.data.realMc || null,
      liquidity: data.data.liquidity,
      volume24h: data.data.v24hUSD,
      priceChange24h: data.data.priceChange24hPercent,
      holders: data.data.holder || null,
    };
  } catch (error) {
    console.error('[Birdeye] Error fetching token overview:', error);
    return null;
  }
}

/**
 * Get OHLCV data to find the all-time high since a specific time
 * Uses hourly candles for better precision on recent tokens
 *
 * @param address - Solana token address
 * @param fromUnixTime - Start time (entry timestamp)
 */
export async function getOHLCVData(
  address: string,
  fromUnixTime?: number
): Promise<{
  athPrice: number;
  athTimestamp: number;
  athMarketCap: number | null;
} | null> {
  const apiKey = process.env.BIRDEYE_API_KEY;

  if (!apiKey) {
    console.warn('[Birdeye] API key not configured');
    return null;
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const from = fromUnixTime || now - (180 * 24 * 60 * 60);
    const to = now;

    // Calculate time range to determine best interval
    const timeRangeHours = (to - from) / 3600;

    // Choose interval based on time range:
    // - < 24 hours: 15m candles
    // - < 7 days: 1H candles
    // - < 30 days: 4H candles
    // - > 30 days: 1D candles
    let interval = '1D';
    if (timeRangeHours < 24) {
      interval = '15m';
    } else if (timeRangeHours < 168) { // 7 days
      interval = '1H';
    } else if (timeRangeHours < 720) { // 30 days
      interval = '4H';
    }

    console.log(`[Birdeye] Fetching OHLCV for ${address} from ${new Date(from * 1000).toISOString()} with interval ${interval}`);

    const response = await fetch(
      `${BIRDEYE_API_BASE}/defi/ohlcv?address=${address}&type=${interval}&time_from=${from}&time_to=${to}`,
      {
        headers: {
          'accept': 'application/json',
          'x-chain': 'solana',
          'X-API-KEY': apiKey,
        },
      }
    );

    if (!response.ok) {
      console.error(`[Birdeye] OHLCV API error: ${response.status}`);
      return null;
    }

    const data: BirdeyeOHLCVResponse = await response.json();

    if (!data.success || !data.data?.items || data.data.items.length === 0) {
      console.log(`[Birdeye] No OHLCV data for ${address}`);
      return null;
    }

    console.log(`[Birdeye] Got ${data.data.items.length} candles for ${address}`);

    // Find the highest price (using high value from OHLCV)
    let athPrice = 0;
    let athTimestamp = 0;

    for (const candle of data.data.items) {
      if (candle.h > athPrice) {
        athPrice = candle.h;
        athTimestamp = candle.unixTime;
      }
    }

    console.log(`[Birdeye] ATH for ${address}: $${athPrice} at ${new Date(athTimestamp * 1000).toISOString()}`);

    return {
      athPrice,
      athTimestamp,
      athMarketCap: null,
    };
  } catch (error) {
    console.error('[Birdeye] Error fetching OHLCV data:', error);
    return null;
  }
}

/**
 * Calculate market cap from price and supply
 * Note: Requires fetching supply separately
 */
export function calculateMarketCap(price: number, supply: number): number {
  return price * supply;
}
