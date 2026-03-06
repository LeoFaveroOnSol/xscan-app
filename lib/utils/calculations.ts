import type { Call, KOL } from '@/types/database';

/**
 * A "win" is defined as ATH multiplier >= 2x (token doubled from entry)
 */
export const WIN_THRESHOLD = 2;

/**
 * Calculate winrate percentage from calls
 */
export function calculateWinrate(calls: Call[]): number {
  if (calls.length === 0) return 0;
  const wins = calls.filter((c) => c.ath_multiplier >= WIN_THRESHOLD).length;
  return (wins / calls.length) * 100;
}

/**
 * Calculate multiplier from entry and current/ATH market cap
 */
export function calculateMultiplier(entryMcap: number, currentMcap: number): number {
  if (entryMcap <= 0) return 0;
  return currentMcap / entryMcap;
}

/**
 * Calculate average multiplier from calls
 */
export function calculateAvgMultiplier(calls: Call[]): number {
  if (calls.length === 0) return 0;
  const sum = calls.reduce((acc, c) => acc + c.ath_multiplier, 0);
  return sum / calls.length;
}

/**
 * Find the best (highest) multiplier from calls
 */
export function calculateBestMultiplier(calls: Call[]): number {
  if (calls.length === 0) return 0;
  return Math.max(...calls.map((c) => c.ath_multiplier));
}

/**
 * Determine if a call is a win
 */
export function isWinningCall(call: Call): boolean {
  return call.ath_multiplier >= WIN_THRESHOLD;
}

/**
 * Calculate all stats for a KOL from their calls
 */
export function calculateKOLStats(calls: Call[]): {
  total_calls: number;
  winning_calls: number;
  winrate: number;
  avg_multiplier: number;
  best_multiplier: number;
} {
  const total_calls = calls.length;
  const winning_calls = calls.filter((c) => c.ath_multiplier >= WIN_THRESHOLD).length;
  const winrate = total_calls > 0 ? (winning_calls / total_calls) * 100 : 0;
  const avg_multiplier = calculateAvgMultiplier(calls);
  const best_multiplier = calculateBestMultiplier(calls);

  return {
    total_calls,
    winning_calls,
    winrate: Math.round(winrate * 100) / 100,
    avg_multiplier: Math.round(avg_multiplier * 100) / 100,
    best_multiplier: Math.round(best_multiplier * 100) / 100,
  };
}

/**
 * Get performance tier based on winrate
 */
export function getPerformanceTier(winrate: number): 'elite' | 'good' | 'average' | 'poor' {
  if (winrate >= 70) return 'elite';
  if (winrate >= 50) return 'good';
  if (winrate >= 30) return 'average';
  return 'poor';
}

/**
 * Get color class for multiplier
 */
export function getMultiplierColor(multiplier: number): string {
  if (multiplier >= 10) return 'text-yellow-400'; // 10x+
  if (multiplier >= 5) return 'text-green-400'; // 5x+
  if (multiplier >= 2) return 'text-green-500'; // 2x+
  if (multiplier >= 1) return 'text-muted'; // 1x-2x
  return 'text-danger'; // < 1x (loss)
}

/**
 * Sort KOLs by various metrics
 */
export function sortKOLs(
  kols: KOL[],
  sortBy: 'winrate' | 'avg_multiplier' | 'total_calls' | 'best_multiplier' = 'winrate',
  order: 'asc' | 'desc' = 'desc'
): KOL[] {
  return [...kols].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    return order === 'desc' ? bVal - aVal : aVal - bVal;
  });
}
