'use client';

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import MultiplierBadge from '@/components/ui/MultiplierBadge';
import CopyAddress from '@/components/ui/CopyAddress';
import { formatMarketCap, formatTimeAgo, getDexScreenerUrl, truncateAddress } from '@/lib/utils/formatters';
import type { Call } from '@/types/database';
import { ExternalLink, Check, X, TrendingUp } from 'lucide-react';

interface KOLCallHistoryProps {
  calls: Call[];
}

export default function KOLCallHistory({ calls }: KOLCallHistoryProps) {
  if (calls.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <TrendingUp className="w-12 h-12 text-muted mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No calls yet</h3>
        <p className="text-muted-foreground">
          This KOL hasn&apos;t made any tracked calls yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold">Call History</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead>Token</TableHead>
            <TableHead>Entry MCap</TableHead>
            <TableHead>ATH MCap</TableHead>
            <TableHead>Multiplier</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-16">Links</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.map((call) => (
            <TableRow key={call.id}>
              <TableCell>
                <div>
                  <div className="font-semibold">{call.token_symbol || 'Unknown'}</div>
                  <div className="text-xs text-muted-foreground">
                    <CopyAddress address={call.token_address} />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground">{formatMarketCap(call.entry_market_cap)}</span>
              </TableCell>
              <TableCell>
                {call.ath_market_cap ? (
                  <span>{formatMarketCap(call.ath_market_cap)}</span>
                ) : (
                  <span className="text-muted">-</span>
                )}
              </TableCell>
              <TableCell>
                <MultiplierBadge value={call.ath_multiplier} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
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
                  {call.status === 'rugged' && (
                    <Badge variant="danger" size="sm">
                      Rugged
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground">{formatTimeAgo(call.entry_timestamp)}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <a
                    href={getDexScreenerUrl(call.token_address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                    title="View on DexScreener"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  {call.tweet_url && (
                    <a
                      href={call.tweet_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title="View Tweet"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
