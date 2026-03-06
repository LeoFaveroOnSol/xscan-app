import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import MultiplierBadge from '@/components/ui/MultiplierBadge';
import CopyAddress from '@/components/ui/CopyAddress';
import { formatMarketCap, formatTimeAgo } from '@/lib/utils/formatters';
import { PhoneCall, Check, X, ExternalLink, Trophy, Hash } from 'lucide-react';
import TelegramCallsFilters from './TelegramCallsFilters';

const ITEMS_PER_PAGE = 50;

const CHAIN_COLORS: Record<string, string> = {
  sol: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  eth: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  base: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  bsc: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  arb: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

const STATUS_VARIANTS: Record<string, 'success' | 'danger' | 'warning' | 'default'> = {
  active: 'success',
  rugged: 'danger',
  delisted: 'warning',
};

export default async function AdminTelegramCallsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page as string) || 1);
  const channelFilter = (params.channel as string) || '';
  const chainFilter = (params.chain as string) || '';
  const statusFilter = (params.status as string) || '';

  const offset = (page - 1) * ITEMS_PER_PAGE;
  const limit = ITEMS_PER_PAGE;

  const supabase = await createClient();

  // Fetch channels for filter dropdown
  const { data: channels } = await supabase
    .from('telegram_channels')
    .select('id, channel_username, display_name')
    .order('display_name', { ascending: true });

  // Build query
  let query = supabase
    .from('telegram_calls')
    .select('*, telegram_channels(channel_username, display_name, profile_image_url)', { count: 'exact' })
    .order('entry_timestamp', { ascending: false })
    .range(offset, offset + limit - 1);

  if (channelFilter) {
    query = query.eq('channel_id', channelFilter);
  }
  if (chainFilter) {
    query = query.eq('chain', chainFilter);
  }
  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data: calls, count, error } = await query;

  if (error) {
    console.error('Error fetching telegram calls:', error);
  }

  // Stats
  const [totalResult, winsResult] = await Promise.all([
    supabase.from('telegram_calls').select('*', { count: 'exact', head: true }),
    supabase.from('telegram_calls').select('*', { count: 'exact', head: true }).eq('is_win', true),
  ]);

  const totalCalls = totalResult.count || 0;
  const totalWins = winsResult.count || 0;
  const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE);

  // Build filter URL helper for pagination
  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams();
    const merged = { channel: channelFilter, chain: chainFilter, status: statusFilter, ...overrides };
    Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, v); });
    return `/admin/telegram-calls?${p.toString()}`;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PhoneCall className="w-6 h-6 text-green-500" />
            Telegram Calls
          </h1>
          <p className="text-muted-foreground">Calls detected from Telegram channels</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold">{totalCalls}</p>
            <p className="text-xs text-muted-foreground">Total Calls</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold">{totalWins}</p>
            <p className="text-xs text-muted-foreground">Wins</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <TelegramCallsFilters channels={channels || []} />

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Token</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Chain</TableHead>
              <TableHead>Entry MCap</TableHead>
              <TableHead>ATH Multi</TableHead>
              <TableHead>Current Multi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Win</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-10">Link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!calls || calls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  No telegram calls found.
                </TableCell>
              </TableRow>
            ) : (
              calls.map((call: any) => (
                <TableRow key={call.id}>
                  <TableCell>
                    <Link href={`/admin/telegram-calls/${call.id}`} className="hover:text-primary">
                      <div className="font-medium">{call.token_symbol || 'Unknown'}</div>
                    </Link>
                    <CopyAddress address={call.token_address} />
                  </TableCell>
                  <TableCell>
                    {call.telegram_channels ? (
                      <a
                        href={`https://t.me/${call.telegram_channels.channel_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:text-primary transition-colors"
                      >
                        {call.telegram_channels.display_name || call.telegram_channels.channel_username}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {call.chain ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${CHAIN_COLORS[call.chain] || 'bg-muted text-muted-foreground border-border'}`}>
                        {call.chain.toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{formatMarketCap(call.entry_market_cap)}</TableCell>
                  <TableCell>
                    <MultiplierBadge value={call.ath_multiplier} />
                  </TableCell>
                  <TableCell>
                    {call.current_multiplier != null ? (
                      <span className={`font-medium ${call.current_multiplier >= 1 ? 'text-green-500' : 'text-red-500'}`}>
                        {call.current_multiplier.toFixed(2)}x
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[call.status] || 'default'} size="sm">
                      {call.status || 'unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {call.is_win ? (
                      <Badge variant="success" size="sm">
                        <Check className="w-3 h-3 mr-1" />
                        Win
                      </Badge>
                    ) : (
                      <Badge variant="danger" size="sm">
                        <X className="w-3 h-3 mr-1" />
                        Loss
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatTimeAgo(call.entry_timestamp)}
                  </TableCell>
                  <TableCell>
                    {call.message_url ? (
                      <a
                        href={call.message_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground/30">
                        <ExternalLink className="w-4 h-4" />
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({count} results)
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={buildUrl({ page: String(page - 1) })}>
                <Button variant="secondary" size="sm">
                  Previous
                </Button>
              </Link>
            )}
            {page < totalPages && (
              <Link href={buildUrl({ page: String(page + 1) })}>
                <Button variant="secondary" size="sm">
                  Next
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
