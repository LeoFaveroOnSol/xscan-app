'use client';

import { useState } from 'react';
import { Search, ExternalLink, Copy, Check, MessageCircle } from 'lucide-react';
import type { TelegramCall } from '@/types/database';
import { getDexScreenerUrl } from '@/lib/utils/formatters';

interface TelegramTokensGridProps {
  calls: TelegramCall[];
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

function TokenCard({ call }: { call: TelegramCall }) {
  const [copied, setCopied] = useState(false);

  const formatMcap = (value: number | null) => {
    if (!value) return '$0';
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  const copyContract = () => {
    navigator.clipboard.writeText(call.token_address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const profitPercent = call.entry_market_cap && call.ath_market_cap && call.entry_market_cap > 0
    ? ((call.ath_market_cap - call.entry_market_cap) / call.entry_market_cap) * 100
    : 0;

  const currentProfitPercent = call.entry_market_cap && call.current_market_cap && call.entry_market_cap > 0
    ? ((call.current_market_cap - call.entry_market_cap) / call.entry_market_cap) * 100
    : 0;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-4 hover:border-blue-500/20 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Token Image */}
          <div className="w-12 h-12 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center overflow-hidden">
            {call.token_image_url ? (
              <img
                src={call.token_image_url}
                alt={call.token_symbol || 'Token'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <span className={`text-lg font-bold text-muted-foreground ${call.token_image_url ? 'hidden' : ''}`}>
              {(call.token_symbol || '?')[0]}
            </span>
          </div>

          {/* Token Info */}
          <div>
            <h3 className="font-semibold">{call.token_symbol || 'UNKNOWN'}</h3>
            <p className="text-xs text-muted-foreground">{call.token_name || 'Unknown Token'}</p>
            {/* Chain badge */}
            <div className="flex items-center gap-1 mt-1">
              <div className="w-3.5 h-3.5 rounded-full bg-[#9945FF] flex items-center justify-center">
                <span className="text-[7px] font-bold text-white">S</span>
              </div>
            </div>
          </div>
        </div>

        {/* Address Badge with Copy */}
        <button
          onClick={copyContract}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors cursor-pointer"
          title="Copy contract address"
        >
          <span className="text-[10px] text-muted-foreground font-mono">{truncateAddress(call.token_address)}</span>
          {copied ? (
            <Check className="w-3 h-3 text-green-500" />
          ) : (
            <Copy className="w-3 h-3 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <p className="text-[10px] text-muted-foreground mb-0.5">ENTRY MC</p>
          <p className="text-sm font-semibold">{formatMcap(call.entry_market_cap)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground mb-0.5">CURRENT MC</p>
          <p className="text-sm font-semibold">{formatMcap(call.current_market_cap)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground mb-0.5">ATH MC</p>
          <p className="text-sm font-semibold">{formatMcap(call.ath_market_cap)}</p>
        </div>
      </div>

      {/* Profit/Loss Row */}
      <div className="flex items-center justify-between mb-3 px-2 py-1.5 rounded bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">CURRENT:</span>
          <span className={`text-xs font-medium ${currentProfitPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {currentProfitPercent >= 0 ? '+' : ''}{currentProfitPercent.toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">ATH:</span>
          <span className={`text-xs font-medium ${profitPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(0)}%
          </span>
          {call.ath_multiplier > 1 && (
            <span className="text-xs text-blue-400 font-medium">
              ({call.ath_multiplier.toFixed(1)}x)
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
        <span className="text-xs text-muted-foreground">{formatDateTime(call.entry_timestamp)}</span>
        <div className="flex items-center gap-2">
          {call.message_url && (
            <a
              href={call.message_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-blue-400 transition-colors"
              title="View message"
            >
              <TelegramIcon className="w-4 h-4" />
            </a>
          )}
          <a
            href={getDexScreenerUrl(call.token_address)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-blue-400 transition-colors"
            title="View on DexScreener"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default function TelegramTokensGrid({ calls }: TelegramTokensGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'wins' | 'losses'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'ath'>('recent');

  let filteredCalls = [...calls];

  if (searchQuery) {
    filteredCalls = filteredCalls.filter(c =>
      c.token_symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.token_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.token_address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (filter === 'wins') {
    filteredCalls = filteredCalls.filter(c => c.is_win);
  } else if (filter === 'losses') {
    filteredCalls = filteredCalls.filter(c => !c.is_win);
  }

  if (sortBy === 'ath') {
    filteredCalls.sort((a, b) => (b.ath_multiplier || 0) - (a.ath_multiplier || 0));
  } else {
    filteredCalls.sort((a, b) => new Date(b.entry_timestamp).getTime() - new Date(a.entry_timestamp).getTime());
  }

  return (
    <section>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold">All Tokens ({calls.length})</h2>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-white/[0.03] border border-white/[0.06] outline-none focus:border-blue-500/30 transition-colors"
            />
          </div>

          {/* Filter Dropdown */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'wins' | 'losses')}
            className="px-3 py-2 text-sm rounded-lg bg-white/[0.03] border border-white/[0.06] outline-none focus:border-blue-500/30 transition-colors cursor-pointer"
          >
            <option value="all">All Tokens</option>
            <option value="wins">Wins Only</option>
            <option value="losses">Losses Only</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'ath')}
            className="px-3 py-2 text-sm rounded-lg bg-white/[0.03] border border-white/[0.06] outline-none focus:border-blue-500/30 transition-colors cursor-pointer"
          >
            <option value="recent">Recent</option>
            <option value="ath">ATH</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {filteredCalls.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCalls.map((call) => (
            <TokenCard key={call.id} call={call} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 rounded-xl border border-white/[0.06] bg-[#111113]">
          <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No tokens found</p>
        </div>
      )}
    </section>
  );
}
