'use client';

import type { Call } from '@/types/database';

interface KOLBestCoinsProps {
  calls: Call[];
}

// Pedestal component for top 3 tokens
function TokenPedestal({ call, position, multiplier }: { call: Call; position: 1 | 2 | 3; multiplier: number }) {
  const heights = {
    1: 'h-[120px]',
    2: 'h-[90px]',
    3: 'h-[70px]',
  };

  const orders = {
    1: 'order-2',
    2: 'order-1',
    3: 'order-3',
  };

  const romanNumerals = {
    1: 'I',
    2: 'II',
    3: 'III',
  };

  return (
    <div className={`flex flex-col items-center ${orders[position]}`}>
      {/* Token Image */}
      <div className="mb-3">
        <div className="relative">
          {call.token_image_url ? (
            <img
              src={call.token_image_url}
              alt={call.token_symbol || ''}
              className="w-16 h-16 rounded-xl object-cover border border-white/[0.08]"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center overflow-hidden">
              <span className="text-2xl font-bold text-muted-foreground">
                {(call.token_symbol || '?')[0]}
              </span>
            </div>
          )}
          {/* Chain badges */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            <div className="w-4 h-4 rounded-full bg-[#9945FF] flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">S</span>
            </div>
          </div>
        </div>
      </div>

      {/* Token Info */}
      <h3 className="font-semibold text-sm mb-0.5">{call.token_symbol || 'Unknown'}</h3>
      <p className="text-xs text-primary font-bold mb-3">{multiplier.toFixed(1)}x ATH</p>

      {/* Pedestal */}
      <div className={`w-24 ${heights[position]} relative`}>
        {/* Top cap */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-28 h-2 bg-primary/80 rounded-t-sm" />

        {/* Body */}
        <div className="w-full h-full bg-gradient-to-b from-[#0d2810] to-[#081408] border-2 border-primary/40 flex items-center justify-center">
          <span className="text-3xl font-bold text-primary/60">{romanNumerals[position]}</span>
        </div>

        {/* Base */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-28 h-2 bg-primary/60 rounded-b-sm" />
      </div>
    </div>
  );
}

export default function KOLBestCoins({ calls }: KOLBestCoinsProps) {
  // Filter out unknown tokens and sort by ATH multiplier (descending) and get top 3 with multiplier > 1
  const sortedCalls = [...calls]
    .filter(c => {
      const name = (c.token_name || '').toLowerCase();
      const symbol = (c.token_symbol || '').toLowerCase();
      const isValidToken = name !== 'unknown' && symbol !== 'unknown' && name !== '' && symbol !== '';
      return isValidToken && c.ath_multiplier && c.ath_multiplier > 1;
    })
    .sort((a, b) => (b.ath_multiplier || 0) - (a.ath_multiplier || 0));

  // Get unique top 3 (no duplicates)
  const topCalls = sortedCalls.slice(0, 3);

  if (topCalls.length === 0) {
    return null;
  }

  // Only show if we have at least 1 call
  // For positions with no call, we'll skip them
  const positions: (1 | 2 | 3)[] = [1, 2, 3];

  return (
    <section className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <h2 className="text-xl font-bold">Best Coins</h2>
        <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-white/[0.05]">by ATH</span>
      </div>

      {/* Pedestal Layout */}
      <div className="flex items-end justify-center gap-8">
        {positions.map((position) => {
          const callIndex = position - 1;
          const call = topCalls[callIndex];

          if (!call) return null;

          return (
            <TokenPedestal
              key={call.id}
              call={call}
              position={position}
              multiplier={call.ath_multiplier || 1}
            />
          );
        })}
      </div>
    </section>
  );
}
