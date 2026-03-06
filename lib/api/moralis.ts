/**
 * Moralis API client for EVM chains historical price data
 * Supports: BSC, Base, Ethereum
 * Docs: https://docs.moralis.io/web3-data-api/evm/reference/get-token-price
 */

const MORALIS_API_BASE = 'https://deep-index.moralis.io/api/v2.2';

// Chain mapping for Moralis API
export type MoralisChain = 'bsc' | 'base' | 'eth';

const CHAIN_HEX_MAP: Record<MoralisChain, string> = {
  bsc: '0x38',      // BSC Mainnet
  base: '0x2105',   // Base Mainnet
  eth: '0x1',       // Ethereum Mainnet
};

interface MoralisPriceResponse {
  tokenName: string;
  tokenSymbol: string;
  tokenLogo: string;
  tokenDecimals: string;
  nativePrice: {
    value: string;
    decimals: number;
    name: string;
    symbol: string;
    address: string;
  };
  usdPrice: number;
  usdPriceFormatted: string;
  exchangeName: string;
  exchangeAddress: string;
  tokenAddress: string;
  priceLastChangedAtBlock: string;
  blockTimestamp: string;
  possibleSpam: boolean;
  verifiedContract: boolean;
  pairAddress: string;
  pairTotalLiquidityUsd: string;
}

interface MoralisOHLCVItem {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface MoralisOHLCVResponse {
  result: MoralisOHLCVItem[];
  cursor?: string;
  page_size: number;
}

/**
 * Check if Moralis API is configured
 */
export function isMoralisConfigured(): boolean {
  return !!process.env.MORALIS_API_KEY;
}

/**
 * Convert our chain type to Moralis chain
 */
export function toMoralisChain(chain: string): MoralisChain | null {
  if (chain === 'bsc') return 'bsc';
  if (chain === 'base') return 'base';
  if (chain === 'ethereum') return 'eth';
  return null;
}

/**
 * Get current token price from Moralis
 */
export async function getTokenPrice(
  address: string,
  chain: MoralisChain
): Promise<{ price: number; symbol: string; name: string } | null> {
  const apiKey = process.env.MORALIS_API_KEY;

  if (!apiKey) {
    console.warn('[Moralis] API key not configured');
    return null;
  }

  try {
    const chainHex = CHAIN_HEX_MAP[chain];
    const response = await fetch(
      `${MORALIS_API_BASE}/erc20/${address}/price?chain=${chainHex}`,
      {
        headers: {
          'accept': 'application/json',
          'X-API-Key': apiKey,
        },
      }
    );

    if (!response.ok) {
      console.error(`[Moralis] API error: ${response.status}`);
      return null;
    }

    const data: MoralisPriceResponse = await response.json();

    return {
      price: data.usdPrice,
      symbol: data.tokenSymbol,
      name: data.tokenName,
    };
  } catch (error) {
    console.error('[Moralis] Error fetching token price:', error);
    return null;
  }
}

/**
 * Get historical price at a specific timestamp using OHLCV data
 * Moralis provides OHLCV candles that we can use to find price at a specific time
 *
 * @param address - EVM token address
 * @param chain - Chain (bsc, base, eth)
 * @param unixTime - Unix timestamp for the price point
 */
export async function getHistoricalPrice(
  address: string,
  chain: MoralisChain,
  unixTime: number
): Promise<{ price: number; timestamp: number } | null> {
  const apiKey = process.env.MORALIS_API_KEY;

  if (!apiKey) {
    console.warn('[Moralis] API key not configured');
    return null;
  }

  try {
    const chainHex = CHAIN_HEX_MAP[chain];
    const targetDate = new Date(unixTime * 1000);

    // Get price at specific block/time using the price endpoint with to_block
    // First, we need to find the block number closest to our timestamp
    // For simplicity, we'll use OHLCV data and find the closest candle

    const fromDate = new Date(unixTime * 1000);
    fromDate.setHours(fromDate.getHours() - 1); // 1 hour before
    const toDate = new Date(unixTime * 1000);
    toDate.setHours(toDate.getHours() + 1); // 1 hour after

    console.log(`[Moralis] Fetching historical price for ${address} on ${chain} at ${targetDate.toISOString()}`);

    const response = await fetch(
      `${MORALIS_API_BASE}/erc20/${address}/ohlcv?chain=${chainHex}&timeframe=hour&fromDate=${fromDate.toISOString()}&toDate=${toDate.toISOString()}&limit=10`,
      {
        headers: {
          'accept': 'application/json',
          'X-API-Key': apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Moralis] OHLCV API error: ${response.status} - ${errorText}`);
      return null;
    }

    const data: MoralisOHLCVResponse = await response.json();

    if (!data.result || data.result.length === 0) {
      console.log(`[Moralis] No OHLCV data for ${address} on ${chain}`);
      return null;
    }

    // Find the candle closest to our target time
    let closestCandle = data.result[0];
    let closestDiff = Math.abs(new Date(closestCandle.timestamp).getTime() - unixTime * 1000);

    for (const candle of data.result) {
      const diff = Math.abs(new Date(candle.timestamp).getTime() - unixTime * 1000);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestCandle = candle;
      }
    }

    // Use the open price of the closest candle as the historical price
    const historicalPrice = closestCandle.open;
    const candleTimestamp = Math.floor(new Date(closestCandle.timestamp).getTime() / 1000);

    console.log(`[Moralis] Historical price for ${address}: $${historicalPrice} at ${new Date(candleTimestamp * 1000).toISOString()}`);

    return {
      price: historicalPrice,
      timestamp: candleTimestamp,
    };
  } catch (error) {
    console.error('[Moralis] Error fetching historical price:', error);
    return null;
  }
}

/**
 * Get OHLCV data to find the all-time high since a specific time
 *
 * @param address - EVM token address
 * @param chain - Chain (bsc, base, eth)
 * @param fromUnixTime - Start time (entry timestamp)
 */
export async function getOHLCVData(
  address: string,
  chain: MoralisChain,
  fromUnixTime?: number
): Promise<{
  athPrice: number;
  athTimestamp: number;
} | null> {
  const apiKey = process.env.MORALIS_API_KEY;

  if (!apiKey) {
    console.warn('[Moralis] API key not configured');
    return null;
  }

  try {
    const chainHex = CHAIN_HEX_MAP[chain];
    const now = Math.floor(Date.now() / 1000);
    const from = fromUnixTime || now - (180 * 24 * 60 * 60); // Default 180 days

    const fromDate = new Date(from * 1000);
    const toDate = new Date(now * 1000);

    // Calculate time range to determine best timeframe
    const timeRangeHours = (now - from) / 3600;

    // Choose timeframe based on time range
    let timeframe = 'day';
    if (timeRangeHours < 24) {
      timeframe = 'hour';
    } else if (timeRangeHours < 168) { // 7 days
      timeframe = 'hour';
    } else if (timeRangeHours < 720) { // 30 days
      timeframe = 'hour';
    }

    console.log(`[Moralis] Fetching OHLCV for ${address} on ${chain} from ${fromDate.toISOString()} with timeframe ${timeframe}`);

    const response = await fetch(
      `${MORALIS_API_BASE}/erc20/${address}/ohlcv?chain=${chainHex}&timeframe=${timeframe}&fromDate=${fromDate.toISOString()}&toDate=${toDate.toISOString()}&limit=1000`,
      {
        headers: {
          'accept': 'application/json',
          'X-API-Key': apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Moralis] OHLCV API error: ${response.status} - ${errorText}`);
      return null;
    }

    const data: MoralisOHLCVResponse = await response.json();

    if (!data.result || data.result.length === 0) {
      console.log(`[Moralis] No OHLCV data for ${address} on ${chain}`);
      return null;
    }

    console.log(`[Moralis] Got ${data.result.length} candles for ${address} on ${chain}`);

    // Find the highest price (using high value from OHLCV)
    let athPrice = 0;
    let athTimestamp = 0;

    for (const candle of data.result) {
      if (candle.high > athPrice) {
        athPrice = candle.high;
        athTimestamp = Math.floor(new Date(candle.timestamp).getTime() / 1000);
      }
    }

    console.log(`[Moralis] ATH for ${address} on ${chain}: $${athPrice} at ${new Date(athTimestamp * 1000).toISOString()}`);

    return {
      athPrice,
      athTimestamp,
    };
  } catch (error) {
    console.error('[Moralis] Error fetching OHLCV data:', error);
    return null;
  }
}
