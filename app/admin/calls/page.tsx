import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import MultiplierBadge from '@/components/ui/MultiplierBadge';
import CopyAddress from '@/components/ui/CopyAddress';
import { formatMarketCap, formatTimeAgo, truncateAddress } from '@/lib/utils/formatters';
import { Plus, Edit, Check, X } from 'lucide-react';

async function getCalls() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('calls')
    .select('*, kols(twitter_handle, display_name)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching calls:', error);
    return [];
  }

  return data || [];
}

export default async function AdminCallsPage() {
  const calls = await getCalls();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Manage Calls</h1>
          <p className="text-muted-foreground">Add and manage token calls</p>
        </div>
        <Link href="/admin/calls/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Call
          </Button>
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Token</TableHead>
              <TableHead>KOL</TableHead>
              <TableHead>Entry MCap</TableHead>
              <TableHead>ATH Multi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No calls yet. Add your first call to get started.
                </TableCell>
              </TableRow>
            ) : (
              calls.map((call: any) => (
                <TableRow key={call.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{call.token_symbol || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {truncateAddress(call.token_address, 4, 4)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      @{call.kols?.twitter_handle}
                    </span>
                  </TableCell>
                  <TableCell>{formatMarketCap(call.entry_market_cap)}</TableCell>
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
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatTimeAgo(call.entry_timestamp)}
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/calls/${call.id}`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
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
