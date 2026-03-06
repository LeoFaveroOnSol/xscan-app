import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { formatPercent, formatTimeAgo, formatNumber } from '@/lib/utils/formatters';
import { Plus, Edit, MessageSquare, Radio, CheckCircle, Clock } from 'lucide-react';

async function getTelegramChannels() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('telegram_channels')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching Telegram channels:', error);
    return [];
  }

  return data || [];
}

async function getTelegramStats() {
  const supabase = await createClient();

  const [channelsResult, callsResult] = await Promise.all([
    supabase.from('telegram_channels').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('telegram_calls').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ]);

  return {
    activeChannels: channelsResult.count || 0,
    totalCalls: callsResult.count || 0,
  };
}

export default async function AdminTelegramPage() {
  const [channels, stats] = await Promise.all([
    getTelegramChannels(),
    getTelegramStats(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-500" />
            Telegram Channels
          </h1>
          <p className="text-muted-foreground">Manage Telegram channels for call tracking</p>
        </div>
        <Link href="/admin/telegram/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Channel
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold">{stats.activeChannels}</p>
            <p className="text-xs text-muted-foreground">Active Channels</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold">{stats.totalCalls}</p>
            <p className="text-xs text-muted-foreground">Total Calls Detected</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Channel</TableHead>
              <TableHead>Calls</TableHead>
              <TableHead>Winrate</TableHead>
              <TableHead>Avg Multi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Full Scan</TableHead>
              <TableHead>Last Scan</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {channels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No Telegram channels yet. Add your first channel to start tracking.
                </TableCell>
              </TableRow>
            ) : (
              channels.map((channel) => (
                <TableRow key={channel.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={channel.profile_image_url}
                        alt={channel.display_name || channel.channel_username}
                        size="sm"
                      />
                      <div>
                        <div className="font-medium">
                          {channel.display_name || channel.channel_username}
                        </div>
                        <a
                          href={`https://t.me/${channel.channel_username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-primary"
                        >
                          @{channel.channel_username}
                        </a>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{channel.total_calls || 0}</TableCell>
                  <TableCell>{formatPercent(channel.winrate)}</TableCell>
                  <TableCell>{channel.avg_multiplier ? `${channel.avg_multiplier.toFixed(2)}x` : '-'}</TableCell>
                  <TableCell>
                    {channel.is_active ? (
                      <Badge variant="success" size="sm">Active</Badge>
                    ) : (
                      <Badge variant="danger" size="sm">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {channel.full_history_scanned ? (
                      <span className="flex items-center gap-1 text-green-500">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs">Done</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-yellow-500">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs">Pending</span>
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {channel.last_scan_at ? formatTimeAgo(channel.last_scan_at) : 'Never'}
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/telegram/${channel.id}`}>
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
