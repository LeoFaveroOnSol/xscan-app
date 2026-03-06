'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import MultiplierBadge from '@/components/ui/MultiplierBadge';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { formatPercent, formatTwitterHandle, getTwitterUrl } from '@/lib/utils/formatters';
import { getPerformanceTier } from '@/lib/utils/calculations';
import { cn } from '@/lib/utils/cn';
import type { KOL } from '@/types/database';
import { ExternalLink, Trophy, TrendingUp, Target, Zap, CheckCircle2 } from 'lucide-react';

interface KOLLeaderboardProps {
  kols: KOL[];
  isLoading?: boolean;
}

type SortField = 'winrate' | 'avg_multiplier' | 'total_calls' | 'best_multiplier';
type SortOrder = 'asc' | 'desc';

export default function KOLLeaderboard({ kols, isLoading }: KOLLeaderboardProps) {
  const [sortField, setSortField] = useState<SortField>('winrate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedKols = [...kols].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Trophy className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Trophy className="w-5 h-5 text-amber-600" />;
    return <span className="text-muted w-5 text-center">{rank}</span>;
  };

  const getTierBadge = (winrate: number) => {
    const tier = getPerformanceTier(winrate);
    const variants = {
      elite: 'success',
      good: 'primary',
      average: 'warning',
      poor: 'danger',
    } as const;
    const labels = {
      elite: 'Elite',
      good: 'Good',
      average: 'Average',
      poor: 'Poor',
    };
    return <Badge variant={variants[tier]} size="sm">{labels[tier]}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="h-6 w-32 bg-card-hover rounded animate-pulse" />
        </div>
        {[...Array(5)].map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (kols.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <TrendingUp className="w-12 h-12 text-muted mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No KOLs yet</h3>
        <p className="text-muted-foreground">
          Be the first to apply as a KOL and start tracking your calls!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="w-16">#</TableHead>
            <TableHead>KOL</TableHead>
            <TableHead
              sortable
              sorted={sortField === 'winrate' ? sortOrder : null}
              onClick={() => handleSort('winrate')}
            >
              <Target className="w-4 h-4 mr-1" />
              Winrate
            </TableHead>
            <TableHead
              sortable
              sorted={sortField === 'avg_multiplier' ? sortOrder : null}
              onClick={() => handleSort('avg_multiplier')}
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Avg Multi
            </TableHead>
            <TableHead
              sortable
              sorted={sortField === 'best_multiplier' ? sortOrder : null}
              onClick={() => handleSort('best_multiplier')}
            >
              <Zap className="w-4 h-4 mr-1" />
              Best Call
            </TableHead>
            <TableHead
              sortable
              sorted={sortField === 'total_calls' ? sortOrder : null}
              onClick={() => handleSort('total_calls')}
            >
              Calls
            </TableHead>
            <TableHead className="w-20">Tier</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedKols.map((kol, index) => (
            <TableRow key={kol.id}>
              <TableCell className="font-medium">
                <div className="flex items-center justify-center">
                  {getRankIcon(index + 1)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Link href={`/kol/${kol.twitter_handle}`}>
                    <Avatar
                      src={kol.profile_image_url}
                      alt={kol.display_name || kol.twitter_handle}
                      size="md"
                    />
                  </Link>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/kol/${kol.twitter_handle}`}
                        className="font-semibold hover:text-primary transition-colors"
                      >
                        {kol.display_name || kol.twitter_handle}
                      </Link>
                      {kol.is_verified && (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatTwitterHandle(kol.twitter_handle)}</span>
                      <a
                        href={getTwitterUrl(kol.twitter_handle)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    'font-semibold',
                    kol.winrate >= 70 ? 'text-success' : kol.winrate >= 50 ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {formatPercent(kol.winrate)}
                </span>
              </TableCell>
              <TableCell>
                <MultiplierBadge value={kol.avg_multiplier} />
              </TableCell>
              <TableCell>
                <MultiplierBadge value={kol.best_multiplier} />
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground">{kol.total_calls}</span>
              </TableCell>
              <TableCell>{getTierBadge(kol.winrate)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
