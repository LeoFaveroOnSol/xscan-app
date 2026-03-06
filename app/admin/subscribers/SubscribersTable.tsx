'use client';

import { useState, useMemo } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import { formatTimeAgo } from '@/lib/utils/formatters';
import { Search } from 'lucide-react';

interface Subscriber {
  telegram_id: number;
  first_name: string;
  username: string;
  is_active: boolean;
  created_at: string;
  subscriptions: string[];
  channel_ids: string[];
}

interface Channel {
  id: number;
  name: string;
}

interface Props {
  subscribers: Subscriber[];
  channels: Channel[];
}

export default function SubscribersTable({ subscribers, channels }: Props) {
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    let result = subscribers;

    if (channelFilter !== 'all') {
      result = result.filter((s) => s.channel_ids.includes(channelFilter));
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.first_name.toLowerCase().includes(q) ||
          s.username.toLowerCase().includes(q) ||
          String(s.telegram_id).includes(q)
      );
    }

    return result;
  }, [subscribers, search, channelFilter]);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, username or Telegram ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="px-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="all">All Channels</option>
          {channels.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-muted-foreground mb-3">
        Showing {filtered.length} of {subscribers.length} subscribers
      </p>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-12">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Telegram ID</TableHead>
              <TableHead>Subscriptions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No subscribers found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((sub, idx) => (
                <TableRow key={sub.telegram_id}>
                  <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="font-medium">{sub.first_name || '-'}</TableCell>
                  <TableCell>
                    {sub.username ? (
                      <a
                        href={`https://t.me/${sub.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        @{sub.username}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{sub.telegram_id}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {sub.subscriptions.length > 0 ? (
                        sub.subscriptions.map((name) => (
                          <Badge key={name} variant="default" size="sm">
                            {name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">None</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {sub.is_active ? (
                      <Badge variant="success" size="sm">Active</Badge>
                    ) : (
                      <Badge variant="danger" size="sm">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {sub.created_at ? formatTimeAgo(sub.created_at) : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
