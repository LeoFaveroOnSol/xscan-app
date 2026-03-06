'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface Channel {
  id: string;
  channel_username: string;
  display_name: string | null;
}

export default function AchievementsFilters({ channels }: { channels: Channel[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const channelFilter = searchParams.get('channel') || '';
  const chainFilter = searchParams.get('chain') || '';
  const tierFilter = searchParams.get('tier') || '';

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`/admin/achievements?${params.toString()}`);
  }

  function clearFilters() {
    router.push('/admin/achievements');
  }

  const hasFilters = channelFilter || chainFilter || tierFilter;

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <div>
        <label className="block text-xs text-muted-foreground mb-1">Channel</label>
        <select
          value={channelFilter}
          onChange={(e) => updateFilter('channel', e.target.value)}
          className="px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">All Channels</option>
          {channels.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.display_name || ch.channel_username}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-muted-foreground mb-1">Chain</label>
        <select
          value={chainFilter}
          onChange={(e) => updateFilter('chain', e.target.value)}
          className="px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">All Chains</option>
          <option value="sol">Solana</option>
          <option value="eth">Ethereum</option>
          <option value="base">Base</option>
          <option value="bsc">BSC</option>
          <option value="arb">Arbitrum</option>
        </select>
      </div>

      <div>
        <label className="block text-xs text-muted-foreground mb-1">Milestone Tier</label>
        <select
          value={tierFilter}
          onChange={(e) => updateFilter('tier', e.target.value)}
          className="px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">All Tiers</option>
          <option value="2">☝️ 2x</option>
          <option value="3">☝️ 3x</option>
          <option value="5">🔥 5x</option>
          <option value="10">🚀 10x</option>
          <option value="20">💎 20x</option>
          <option value="50">👑 50x</option>
          <option value="100">🏆 100x</option>
        </select>
      </div>

      {hasFilters && (
        <div className="flex items-end">
          <button
            onClick={clearFilters}
            className="px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-card-hover transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
