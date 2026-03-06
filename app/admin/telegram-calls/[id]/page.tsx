import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import MultiplierBadge from '@/components/ui/MultiplierBadge';
import CopyAddress from '@/components/ui/CopyAddress';
import { formatMarketCap, formatTimeAgo } from '@/lib/utils/formatters';
import { ArrowLeft, ExternalLink, Check, X, Clock, TrendingUp, DollarSign, Hash, MessageSquare } from 'lucide-react';
import { notFound } from 'next/navigation';

const CHAIN_COLORS: Record<string, string> = {
  sol: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  eth: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  base: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  bsc: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  arb: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

async function getCall(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('telegram_calls')
    .select('*, telegram_channels(channel_username, display_name, profile_image_url)')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

function formatPrice(price: number | null) {
  if (!price) return '-';
  if (price < 0.000001) return `$${price.toExponential(4)}`;
  if (price < 0.01) return `$${price.toFixed(8)}`;
  if (price < 1) return `$${price.toFixed(6)}`;
  return `$${price.toFixed(4)}`;
}

export default async function TelegramCallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const call = await getCall(id);

  if (!call) {
    notFound();
  }

  const channel = call.telegram_channels;

  return (
    <div>
      <Link
        href="/admin/telegram-calls"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Telegram Calls
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              {call.token_symbol || 'Unknown Token'}
            </h1>
            {call.chain && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${CHAIN_COLORS[call.chain] || 'bg-muted text-muted-foreground border-border'}`}>
                {call.chain.toUpperCase()}
              </span>
            )}
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
            <Badge variant={call.status === 'active' ? 'success' : call.status === 'rugged' ? 'danger' : 'warning'} size="sm">
              {call.status}
            </Badge>
          </div>
          {call.token_name && (
            <p className="text-muted-foreground mt-1">{call.token_name}</p>
          )}
        </div>

        <div className="flex gap-2">
          {call.message_url && (
            <a
              href={call.message_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              View Original Call
            </a>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">{formatMarketCap(call.entry_market_cap)}</p>
              <p className="text-xs text-muted-foreground">Entry MCap</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">{formatMarketCap(call.current_market_cap)}</p>
              <p className="text-xs text-muted-foreground">Current MCap</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <MultiplierBadge value={call.ath_multiplier} />
              <p className="text-xs text-muted-foreground">ATH Multiplier</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {call.current_multiplier != null ? `${Number(call.current_multiplier).toFixed(2)}x` : '-'}
              </p>
              <p className="text-xs text-muted-foreground">Current Multiplier</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Details */}
        <Card>
          <CardHeader>
            <CardTitle>Token Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Address</dt>
                <dd><CopyAddress address={call.token_address} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Symbol</dt>
                <dd className="font-medium">{call.token_symbol || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Name</dt>
                <dd>{call.token_name || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Chain</dt>
                <dd>{call.chain?.toUpperCase() || '-'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Channel Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Channel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Channel</dt>
                <dd>
                  {channel ? (
                    <a
                      href={`https://t.me/${channel.channel_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {channel.display_name || channel.channel_username}
                    </a>
                  ) : '-'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Username</dt>
                <dd>@{channel?.channel_username || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Auto Detected</dt>
                <dd>{call.is_auto_detected ? 'Yes' : 'No'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Message ID</dt>
                <dd className="font-mono text-sm">{call.message_id || '-'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Price Data */}
        <Card>
          <CardHeader>
            <CardTitle>Price Data</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Entry Price</dt>
                <dd className="font-mono">{formatPrice(call.entry_price)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Current Price</dt>
                <dd className="font-mono">{formatPrice(call.current_price)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">ATH Price</dt>
                <dd className="font-mono">{formatPrice(call.ath_price)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">ATH MCap</dt>
                <dd>{formatMarketCap(call.ath_market_cap)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Last Milestone</dt>
                <dd>{call.last_milestone_notified ? `${call.last_milestone_notified}x` : '-'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Timestamps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Timestamps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Entry</dt>
                <dd className="text-sm">{formatDate(call.entry_timestamp)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">ATH</dt>
                <dd className="text-sm">{formatDate(call.ath_timestamp)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Detected</dt>
                <dd className="text-sm">{formatDate(call.detected_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Last Price Update</dt>
                <dd className="text-sm">{formatDate(call.last_price_update)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Created</dt>
                <dd className="text-sm">{formatDate(call.created_at)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Message Text */}
      {call.message_text && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Original Message</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground bg-background rounded-lg p-4 border border-border">
              {call.message_text}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {call.notes && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{call.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
