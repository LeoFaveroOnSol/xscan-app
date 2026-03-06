import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import MultiplierBadge from '@/components/ui/MultiplierBadge';
import CopyAddress from '@/components/ui/CopyAddress';
import { formatMarketCap, formatTimeAgo } from '@/lib/utils/formatters';
import { Award, Trophy, TrendingUp, ExternalLink } from 'lucide-react';

const ITEMS_PER_PAGE = 50;

const CHAIN_COLORS: Record<string, string> = {
  sol: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  eth: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  base: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  bsc: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  arb: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

const TIER_COLORS: Record<number, string> = {
  2: 'text-green-400',
  3: 'text-green-400',
  5: 'text-orange-400',
  10: 'text-red-400',
  20: 'text-pink-400',
  50: 'text-yellow-400',
  100: 'text-yellow-300',
};

const TIER_EMOJI: Record<number, string> = {
  2: '☝️',
  3: '☝️',
  5: '🔥',
  10: '🚀',
  20: '💎',
  50: '👑',
  100: '🏆',
};

export default async function AdminAchievementsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page as string) || 1);
  const channelFilter = (params.channel as string) || '';
  const chainFilter = (params.chain as string) || '';
  const tierFilter = (params.tier as string) || '';

  const offset = (page - 1) * ITEMS_PER_PAGE;
  const limit = ITEMS_PER_PAGE;

  const supabase = await createClient();

  // Fetch channels for filter
  const { data: channels } = await supabase
    .from('telegram_channels')
    .select('id, channel_username, display_name')
    .order('display_name', { ascending: true });

  // Build query
  let query = supabase
    .from('telegram_achievements')
    .select('*, telegram_channels(channel_username, display_name, profile_image_url)', { count: 'exact' })
    .order('sent_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (channelFilter) {
    query = query.eq('channel_id', channelFilter);
  }
  if (chainFilter) {
    query = query.eq('chain', chainFilter);
  }
  if (tierFilter) {
    query = query.eq('milestone_tier', parseInt(tierFilter));
  }

  const { data: achievements, count, error } = await query;

  if (error) {
    console.error('Error fetching achievements:', error);
  }

  // Stats
  const [totalResult, topResult] = await Promise.all([
    supabase.from('telegram_achievements').select('*', { count: 'exact', head: true }),
    supabase.from('telegram_achievements').select('display_multiplier').order('display_multiplier', { ascending: false }).limit(1),
  ]);

  const totalAchievements = totalResult.count || 0;
  const topMultiplier = topResult.data?.[0]?.display_multiplier || 0;
  const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE);

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams();
    const merged = { channel: channelFilter, chain: chainFilter, tier: tierFilter, ...overrides };
    Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, v); });
    return `/admin/achievements?${p.toString()}`;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-500" />
            Achievements
          </h1>
          <p className="text-muted-foreground">Achievement milestones sent to Telegram</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold">{totalAchievements}</p>
            <p className="text-xs text-muted-foreground">Total Achievements</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold">{topMultiplier > 0 ? `${topMultiplier}x` : '-'}</p>
            <p className="text-xs text-muted-foreground">Top Achievement</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <AchievementsFilters channels={channels || []} />

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Token</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Chain</TableHead>
              <TableHead>Achievement</TableHead>
              <TableHead>ATH Multi</TableHead>
              <TableHead>Entry MCap</TableHead>
              <TableHead>ATH MCap</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!achievements || achievements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No achievements found.
                </TableCell>
              </TableRow>
            ) : (
              achievements.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{a.token_symbol || 'Unknown'}</div>
                      <CopyAddress address={a.token_address} />
                    </div>
                  </TableCell>
                  <TableCell>
                    {a.telegram_channels ? (
                      <a
                        href={`https://t.me/${a.telegram_channels.channel_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:text-primary transition-colors"
                      >
                        {a.telegram_channels.display_name || a.telegram_channels.channel_username}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {a.chain ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${CHAIN_COLORS[a.chain] || 'bg-muted text-muted-foreground border-border'}`}>
                        {a.chain.toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`text-lg font-bold ${TIER_COLORS[a.milestone_tier] || 'text-green-400'}`}>
                      {TIER_EMOJI[a.milestone_tier] || '☝️'} {a.display_multiplier}x
                    </span>
                  </TableCell>
                  <TableCell>
                    <MultiplierBadge value={a.ath_multiplier} />
                  </TableCell>
                  <TableCell>{formatMarketCap(a.entry_market_cap)}</TableCell>
                  <TableCell>{formatMarketCap(a.ath_market_cap)}</TableCell>
                  <TableCell>
                    <Badge variant={a.milestone_tier >= 10 ? 'success' : 'default'} size="sm">
                      {a.milestone_tier}x tier
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatTimeAgo(a.sent_at)}
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

// Inline filter component import
import AchievementsFilters from './AchievementsFilters';
