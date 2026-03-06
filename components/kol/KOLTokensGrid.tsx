'use client';

import { useState } from 'react';
import { Search, ExternalLink, Copy, Check, Trash2, Eye, EyeOff } from 'lucide-react';
import type { Call } from '@/types/database';
import { getDexScreenerUrl } from '@/lib/utils/formatters';

interface KOLTokensGridProps {
  calls: Call[];
  deletedCalls?: Call[];
}

function TokenCard({ call, isDeleted = false }: { call: Call; isDeleted?: boolean }) {
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

  // Format date/time
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

  // Calculate profit percentage from entry to ATH
  const profitPercent = call.entry_market_cap && call.ath_market_cap && call.entry_market_cap > 0
    ? ((call.ath_market_cap - call.entry_market_cap) / call.entry_market_cap) * 100
    : 0;

  // Calculate current profit/loss from entry
  const currentProfitPercent = call.entry_market_cap && call.current_market_cap && call.entry_market_cap > 0
    ? ((call.current_market_cap - call.entry_market_cap) / call.entry_market_cap) * 100
    : 0;

  return (
    <div className={`rounded-xl border p-4 transition-all ${
      isDeleted
        ? 'border-red-500/20 bg-red-950/20 hover:border-red-500/30 opacity-80'
        : 'border-white/[0.06] bg-[#111113] hover:border-white/[0.1]'
    }`}>
      {/* Deleted Badge */}
      {isDeleted && (
        <div className="flex items-center gap-1.5 mb-3 px-2 py-1 rounded bg-red-500/10 border border-red-500/20 w-fit">
          <Trash2 className="w-3 h-3 text-red-400" />
          <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">Deleted Tweet</span>
        </div>
      )}
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
                  // Fallback to letter if image fails to load
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
            <span className="text-xs text-primary font-medium">
              ({call.ath_multiplier.toFixed(1)}x)
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
        <span className="text-xs text-muted-foreground">{formatDateTime(call.entry_timestamp)}</span>
        <div className="flex items-center gap-2">
          {call.tweet_url && (
            <a
              href={call.tweet_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              title="View tweet"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          )}
          <a
            href={getDexScreenerUrl(call.token_address)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
            title="View on DexScreener"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default function KOLTokensGrid({ calls, deletedCalls = [] }: KOLTokensGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'wins' | 'losses'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'ath'>('recent');
  const [showDeleted, setShowDeleted] = useState(false);

  // Combine calls with deleted if toggle is on
  const baseCalls = showDeleted ? [...calls, ...deletedCalls] : calls;

  let filteredCalls = [...baseCalls];

  // Apply search
  if (searchQuery) {
    filteredCalls = filteredCalls.filter(c =>
      c.token_symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.token_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.token_address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Apply filter
  if (filter === 'wins') {
    filteredCalls = filteredCalls.filter(c => c.is_win);
  } else if (filter === 'losses') {
    filteredCalls = filteredCalls.filter(c => !c.is_win);
  }

  // Apply sort - default to most recent first
  if (sortBy === 'ath') {
    filteredCalls.sort((a, b) => (b.ath_multiplier || 0) - (a.ath_multiplier || 0));
  } else {
    filteredCalls.sort((a, b) => new Date(b.entry_timestamp).getTime() - new Date(a.entry_timestamp).getTime());
  }

  return (
    <section>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold">
          All Tokens ({calls.length}{showDeleted && deletedCalls.length > 0 ? ` + ${deletedCalls.length} deleted` : ''})
        </h2>

        <div className="flex items-center gap-3">
          {/* Deleted Toggle */}
          {deletedCalls.length > 0 && (
            <button
              onClick={() => setShowDeleted(!showDeleted)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors whitespace-nowrap ${
                showDeleted
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-white/[0.03] border-white/[0.06] text-muted-foreground hover:bg-white/[0.06]'
              }`}
              title={showDeleted ? 'Hide deleted tweets' : 'Show deleted tweets'}
            >
              {showDeleted ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{deletedCalls.length}</span>
            </button>
          )}

          {/* Search */}
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-white/[0.03] border border-white/[0.06] outline-none focus:border-primary/30 transition-colors"
            />
          </div>

          {/* Filter Dropdown */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'wins' | 'losses')}
            className="px-3 py-2 text-sm rounded-lg bg-white/[0.03] border border-white/[0.06] outline-none focus:border-primary/30 transition-colors cursor-pointer"
          >
            <option value="all">All Tokens</option>
            <option value="wins">Wins Only</option>
            <option value="losses">Losses Only</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'ath')}
            className="px-3 py-2 text-sm rounded-lg bg-white/[0.03] border border-white/[0.06] outline-none focus:border-primary/30 transition-colors cursor-pointer"
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
            <TokenCard key={call.id} call={call} isDeleted={call.is_deleted} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 rounded-xl border border-white/[0.06] bg-[#111113]">
          <p className="text-muted-foreground">No tokens found</p>
        </div>
      )}
    </section>
  );
}
