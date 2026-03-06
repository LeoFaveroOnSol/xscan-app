'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface TelegramCall {
  id: string;
  token_address: string;
  token_symbol: string | null;
  token_name: string | null;
  token_image_url: string | null;
  chain: string | null;
  entry_market_cap: number | null;
  current_market_cap: number | null;
  current_multiplier: number | null;
  ath_multiplier: number | null;
  entry_timestamp: string;
  telegram_channels?: {
    display_name: string | null;
    channel_username: string | null;
    profile_image_url: string | null;
  };
}

function formatMcap(n: number | null): string {
  if (!n) return '—';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getMultiplierColor(mult: number | null): string {
  if (!mult || mult < 1.5) return 'text-gray-400';
  if (mult < 2) return 'text-green-400';
  if (mult < 5) return 'text-green-300';
  if (mult < 10) return 'text-yellow-300';
  return 'text-purple-400';
}

function getGlowClass(mult: number | null): string {
  if (!mult || mult < 2) return '';
  if (mult < 5) return 'ring-1 ring-green-500/30';
  if (mult < 10) return 'ring-1 ring-yellow-500/40';
  return 'ring-1 ring-purple-500/50';
}

function getChainBadge(chain: string | null): { label: string; color: string } {
  switch (chain?.toLowerCase()) {
    case 'solana': return { label: 'SOL', color: 'bg-purple-600/30 text-purple-300' };
    case 'base': return { label: 'BASE', color: 'bg-blue-600/30 text-blue-300' };
    case 'ethereum': return { label: 'ETH', color: 'bg-gray-600/30 text-gray-300' };
    case 'bsc': return { label: 'BSC', color: 'bg-yellow-600/30 text-yellow-300' };
    default: return { label: chain || '?', color: 'bg-gray-600/30 text-gray-400' };
  }
}

export default function FeedClient() {
  const [calls, setCalls] = useState<TelegramCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [chain, setChain] = useState('all');
  const [time, setTime] = useState('24h');
  const [minMult, setMinMult] = useState('0');

  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch(`/api/feed?chain=${chain}&time=${time}&min_multiplier=${minMult}`);
      const data = await res.json();
      if (data.calls) setCalls(data.calls);
    } catch (e) {
      console.error('Feed fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [chain, time, minMult]);

  useEffect(() => {
    setLoading(true);
    fetchFeed();
    const interval = setInterval(fetchFeed, 30000);
    return () => clearInterval(interval);
  }, [fetchFeed]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-green-400">⚡</span> Live Feed
          </h1>
          <p className="text-gray-500">Real-time calls from Telegram channels</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6 p-4 bg-[#12121a] rounded-xl border border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase">Chain</span>
            {['all', 'solana', 'base', 'ethereum'].map(c => (
              <button
                key={c}
                onClick={() => setChain(c)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  chain === c
                    ? 'bg-green-600/20 text-green-400 border border-green-600/40'
                    : 'bg-gray-800 text-gray-400 hover:text-white border border-transparent'
                }`}
              >
                {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase">Time</span>
            {['1h', '6h', '24h', '7d'].map(t => (
              <button
                key={t}
                onClick={() => setTime(t)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  time === t
                    ? 'bg-green-600/20 text-green-400 border border-green-600/40'
                    : 'bg-gray-800 text-gray-400 hover:text-white border border-transparent'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase">Min</span>
            {['0', '2', '5', '10'].map(m => (
              <button
                key={m}
                onClick={() => setMinMult(m)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  minMult === m
                    ? 'bg-green-600/20 text-green-400 border border-green-600/40'
                    : 'bg-gray-800 text-gray-400 hover:text-white border border-transparent'
                }`}
              >
                {m === '0' ? 'All' : `${m}x+`}
              </button>
            ))}
          </div>
        </div>

        {/* Feed */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-400" />
          </div>
        ) : calls.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            No calls found for these filters
          </div>
        ) : (
          <div className="space-y-3">
            {calls.map(call => {
              const mult = call.ath_multiplier || call.current_multiplier;
              const chainBadge = getChainBadge(call.chain);
              return (
                <div
                  key={call.id}
                  className={`p-4 bg-[#12121a] rounded-xl border border-gray-800 hover:border-gray-700 transition-all ${getGlowClass(mult)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Token image */}
                      <div className="w-10 h-10 rounded-full bg-gray-800 flex-shrink-0 overflow-hidden">
                        {call.token_image_url ? (
                          <img src={call.token_image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600 text-lg">🪙</div>
                        )}
                      </div>
                      {/* Token info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white truncate">
                            {call.token_symbol || 'Unknown'}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${chainBadge.color}`}>
                            {chainBadge.label}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {call.telegram_channels?.display_name || 'Channel'} · {timeAgo(call.entry_timestamp)}
                        </div>
                      </div>
                    </div>
                    {/* Right side: multiplier + mcap */}
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className={`text-lg font-bold ${getMultiplierColor(mult)}`}>
                        {mult ? `${mult.toFixed(1)}x` : '—'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatMcap(call.entry_market_cap)} → {formatMcap(call.current_market_cap)}
                      </div>
                    </div>
                  </div>
                  {/* Footer */}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-gray-600 font-mono truncate">
                      {call.token_address}
                    </span>
                    <a
                      href={`https://dexscreener.com/${call.chain || 'solana'}/${call.token_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-green-500 hover:text-green-400"
                    >
                      Chart ↗
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Auto refresh indicator */}
        <div className="mt-6 text-center text-xs text-gray-600">
          Auto-refreshes every 30s · Showing up to 100 calls
        </div>
      </div>
    </div>
  );
}
