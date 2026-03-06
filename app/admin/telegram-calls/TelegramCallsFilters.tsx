'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface Channel {
  id: string;
  channel_username: string;
  display_name: string | null;
}

export default function TelegramCallsFilters({ channels }: { channels: Channel[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const channelFilter = searchParams.get('channel') || '';
  const chainFilter = searchParams.get('chain') || '';
  const statusFilter = searchParams.get('status') || '';

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`/admin/telegram-calls?${params.toString()}`);
  }

  function clearFilters() {
    router.push('/admin/telegram-calls');
  }

  const hasFilters = channelFilter || chainFilter || statusFilter;

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
        <label className="block text-xs text-muted-foreground mb-1">Status</label>
        <select
          value={statusFilter}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="rugged">Rugged</option>
          <option value="delisted">Delisted</option>
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
