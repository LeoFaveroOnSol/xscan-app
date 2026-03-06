'use client';

import { useRouter } from 'next/navigation';

interface Token {
  address: string;
  symbol: string;
  name: string;
  image: string | null;
  entryMc: number;
  athMc: number;
  athMultiplier: number;
  currentMc: number;
  currentMultiplier: number;
  firstCalled: string;
  callers: number;
  sources: string[];
}

function formatMcap(value: number | null) {
  if (!value) return '-';
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatMultiplier(value: number | null) {
  if (!value || value <= 0) return '-';
  return `${value.toFixed(1)}x`;
}

function timeAgo(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return 'just now';
}

export default function TokensTable({ tokens }: { tokens: Token[] }) {
  const router = useRouter();

  return (
    <div className="premium-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Token</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Entry MC</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">ATH MC</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">ATH</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Callers</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">First Called</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Source</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => (
              <tr
                key={token.address}
                onClick={() => router.push(`/token/${token.address}`)}
                className="border-b border-white/[0.03] hover:bg-white/[0.04] transition-colors cursor-pointer group"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {token.image ? (
                      <img src={token.image} alt={token.symbol} className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-xs font-bold">
                        {token.symbol?.slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <span className="font-medium group-hover:text-primary transition-colors">{token.symbol}</span>
                      {token.name && token.name !== token.symbol && (
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">{token.name}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-sm">{formatMcap(token.entryMc)}</td>
                <td className="px-4 py-3 text-right text-sm">{formatMcap(token.athMc)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-sm font-medium ${token.athMultiplier >= 2 ? 'text-emerald-400' : token.athMultiplier >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {formatMultiplier(token.athMultiplier)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-sm">{token.callers}</td>
                <td className="px-4 py-3 text-right text-sm text-muted-foreground">{timeAgo(token.firstCalled)}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {token.sources.includes('tg') && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">TG</span>
                    )}
                    {token.sources.includes('kol') && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">KOL</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
