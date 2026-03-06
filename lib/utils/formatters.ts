/**
 * Format a number as currency (USD)
 */
export function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

/**
 * Format a number as market cap
 */
export function formatMarketCap(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

/**
 * Format multiplier (e.g., 2.5x)
 */
export function formatMultiplier(value: number): string {
  if (value >= 100) {
    return `${Math.round(value)}x`;
  }
  if (value >= 10) {
    return `${value.toFixed(1)}x`;
  }
  return `${value.toFixed(2)}x`;
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a large number with commas
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Truncate a Solana address for display
 */
export function truncateAddress(address: string, startChars: number = 4, endChars: number = 4): string {
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format Twitter handle (ensure @ prefix)
 */
export function formatTwitterHandle(handle: string): string {
  if (handle.startsWith('@')) return handle;
  return `@${handle}`;
}

/**
 * Get Twitter profile URL
 */
export function getTwitterUrl(handle: string): string {
  const cleanHandle = handle.replace('@', '');
  return `https://x.com/${cleanHandle}`;
}

/**
 * Get Solscan token URL
 */
export function getSolscanTokenUrl(address: string): string {
  return `https://solscan.io/token/${address}`;
}

/**
 * Get Solscan wallet URL
 */
export function getSolscanWalletUrl(address: string): string {
  return `https://solscan.io/account/${address}`;
}

/**
 * Get DexScreener URL
 */
export function getDexScreenerUrl(address: string): string {
  return `https://dexscreener.com/solana/${address}`;
}

/**
 * Get Birdeye URL
 */
export function getBirdeyeUrl(address: string): string {
  return `https://birdeye.so/token/${address}?chain=solana`;
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
  return past.toLocaleDateString();
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date and time
 */
export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
