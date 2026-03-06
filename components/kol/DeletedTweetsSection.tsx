'use client';

import { useState, useEffect } from 'react';
import { Trash2, ChevronDown, ChevronUp, AlertTriangle, ExternalLink, Copy, Check } from 'lucide-react';

interface DeletedTweet {
  ca: string;
  chain: string;
  tokenSymbol: string | null;
  tokenName: string | null;
  content: string | null;
  tweetTime: string | null;
  likes: number;
  retweets: number;
  athMultiplier: number | null;
  currentMultiplier: number | null;
  marketCapAtCall: number | null;
  currentMarketCap: number | null;
}

interface DeletedTweetsData {
  totalWithCA: number;
  deletedWithCA: number;
  deletionRate: number;
  deletedTweets: DeletedTweet[];
}

function getDeletionColor(rate: number) {
  if (rate < 10) return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', bar: 'bg-green-500' };
  if (rate <= 30) return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', bar: 'bg-yellow-500' };
  return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', bar: 'bg-red-500' };
}

function formatMcap(value: number | null) {
  if (!value) return '—';
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return '—'; }
}

function getTokenVerdict(tweet: DeletedTweet): { label: string; color: string } {
  const mult = tweet.currentMultiplier;
  if (mult === null || mult === undefined) return { label: 'Unknown', color: 'text-muted-foreground' };
  if (mult <= 0.1) return { label: '🔴 Rugged (-90%+)', color: 'text-red-400' };
  if (mult <= 0.5) return { label: '📉 Down bad (-50%+)', color: 'text-orange-400' };
  if (mult <= 0.9) return { label: '📉 Down', color: 'text-yellow-400' };
  if (mult <= 1.5) return { label: '➡️ Flat', color: 'text-muted-foreground' };
  return { label: `🟢 ${mult.toFixed(1)}x`, color: 'text-green-400' };
}

function DeletedTweetCard({ tweet }: { tweet: DeletedTweet }) {
  const [copied, setCopied] = useState(false);
  const verdict = getTokenVerdict(tweet);

  const copyCA = () => {
    navigator.clipboard.writeText(tweet.ca);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-3 rounded-lg bg-[#0d0d0e] border border-white/[0.06] hover:border-red-500/20 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-white text-sm">
              {tweet.tokenSymbol || 'Unknown Token'}
            </span>
            {tweet.tokenName && (
              <span className="text-xs text-muted-foreground truncate">{tweet.tokenName}</span>
            )}
          </div>
          {/* CA */}
          <div className="flex items-center gap-1.5 mb-2">
            <code className="text-xs text-muted-foreground font-mono">
              {tweet.ca.slice(0, 6)}...{tweet.ca.slice(-4)}
            </code>
            <button onClick={copyCA} className="text-muted-foreground hover:text-white transition-colors">
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            </button>
            <a
              href={`https://dexscreener.com/solana/${tweet.ca}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-white transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          {/* Content preview */}
          {tweet.content && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{tweet.content}</p>
          )}
          {/* Meta row */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">{formatDate(tweet.tweetTime)}</span>
            {tweet.marketCapAtCall && (
              <span className="text-muted-foreground">MC: {formatMcap(tweet.marketCapAtCall)}</span>
            )}
            <span className={verdict.color}>{verdict.label}</span>
          </div>
        </div>
        {/* Engagement */}
        <div className="text-right text-xs text-muted-foreground shrink-0">
          <div>❤️ {tweet.likes}</div>
          <div>🔁 {tweet.retweets}</div>
        </div>
      </div>
    </div>
  );
}

export default function DeletedTweetsSection({ handle }: { handle: string }) {
  const [data, setData] = useState<DeletedTweetsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch(`/api/kols/${handle}/deleted-tweets`)
      .then(res => {
        if (!res.ok) throw new Error('API error');
        return res.json();
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [handle]);

  if (loading) {
    return (
      <div className="mt-6 p-4 rounded-xl bg-[#111113] border border-white/[0.06] animate-pulse">
        <div className="h-6 w-48 bg-white/5 rounded" />
        <div className="h-4 w-32 bg-white/5 rounded mt-2" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mt-6 p-4 rounded-xl bg-[#111113] border border-white/[0.06]">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>Deleted tweets data temporarily unavailable</span>
        </div>
      </div>
    );
  }

  if (data.totalWithCA === 0) return null;

  const colors = getDeletionColor(data.deletionRate);

  return (
    <div className="mt-6">
      {/* Header Card */}
      <div className={`p-4 rounded-xl bg-[#111113] border ${colors.border}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trash2 className={`w-5 h-5 ${colors.text}`} />
            <h3 className="font-semibold text-white">Deleted Tweets</h3>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${colors.bg} ${colors.text}`}>
            {data.deletionRate}% deleted
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm mb-3">
          <span className="text-muted-foreground">
            <span className="text-white font-medium">{data.deletedWithCA}</span> of{' '}
            <span className="text-white font-medium">{data.totalWithCA}</span> CA tweets deleted
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className={`h-full rounded-full ${colors.bar} transition-all duration-500`}
            style={{ width: `${Math.min(data.deletionRate, 100)}%` }}
          />
        </div>

        {/* Expand toggle */}
        {data.deletedTweets.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground hover:text-white transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Hide' : 'Show'} {data.deletedTweets.length} deleted tweet{data.deletedTweets.length !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Expanded list */}
      {expanded && data.deletedTweets.length > 0 && (
        <div className="mt-2 space-y-2">
          {data.deletedTweets.map((tweet, i) => (
            <DeletedTweetCard key={`${tweet.ca}-${i}`} tweet={tweet} />
          ))}
        </div>
      )}
    </div>
  );
}
