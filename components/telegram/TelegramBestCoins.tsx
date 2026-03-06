'use client';

import type { TelegramCall } from '@/types/database';

interface TelegramBestCoinsProps {
  calls: TelegramCall[];
}

function TokenPedestal({ call, position, multiplier }: { call: TelegramCall; position: 1 | 2 | 3; multiplier: number }) {
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
          {/* Chain badge */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            <div className="w-4 h-4 rounded-full bg-[#9945FF] flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">S</span>
            </div>
          </div>
        </div>
      </div>

      {/* Token Info */}
      <h3 className="font-semibold text-sm mb-0.5">{call.token_symbol || 'Unknown'}</h3>
      <p className="text-xs text-blue-400 font-bold mb-3">{multiplier.toFixed(1)}x ATH</p>

      {/* Pedestal */}
      <div className={`w-24 ${heights[position]} relative`}>
        {/* Top cap */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-28 h-2 bg-blue-500/80 rounded-t-sm" />

        {/* Body */}
        <div className="w-full h-full bg-gradient-to-b from-[#0d1628] to-[#080d14] border-2 border-blue-500/40 flex items-center justify-center">
          <span className="text-3xl font-bold text-blue-500/60">{romanNumerals[position]}</span>
        </div>

        {/* Base */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-28 h-2 bg-blue-500/60 rounded-b-sm" />
      </div>
    </div>
  );
}

export default function TelegramBestCoins({ calls }: TelegramBestCoinsProps) {
  const sortedCalls = [...calls]
    .filter(c => c.ath_multiplier && c.ath_multiplier > 1)
    .sort((a, b) => (b.ath_multiplier || 0) - (a.ath_multiplier || 0));

  const topCalls = sortedCalls.slice(0, 3);

  if (topCalls.length === 0) {
    return null;
  }

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
