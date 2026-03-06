'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { Search, Trophy, TrendingUp, Target, Zap, Share2, X, ChevronDown } from 'lucide-react';

type CompareMode = 'kol' | 'telegram';

interface SearchResult {
  id: string;
  twitter_handle?: string;
  channel_username?: string;
  display_name: string;
  profile_image_url: string | null;
}

interface EntityData {
  id: string;
  twitter_handle?: string;
  channel_username?: string;
  display_name: string;
  profile_image_url: string | null;
  total_calls: number;
  winning_calls: number;
  winrate: number;
  avg_multiplier: number;
  best_multiplier: number;
  calls: any[];
}

interface TokenInCommon {
  token_address: string;
  token_symbol: string;
  kol1_entry_mcap: number;
  kol1_multiplier: number;
  kol2_entry_mcap: number;
  kol2_multiplier: number;
}

interface CompareData {
  kol1: EntityData;
  kol2: EntityData;
  tokensInCommon: TokenInCommon[];
}

function getHandle(entity: SearchResult | EntityData, mode: CompareMode): string {
  return mode === 'telegram' ? (entity.channel_username || '') : (entity.twitter_handle || '');
}

function EntitySelector({
  label,
  value,
  onChange,
  otherHandle,
  mode,
}: {
  label: string;
  value: string;
  onChange: (handle: string) => void;
  otherHandle: string;
  mode: CompareMode;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const endpoint = mode === 'telegram' ? '/api/telegram/search' : '/api/kols/search';
        const res = await fetch(`${endpoint}?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(
          Array.isArray(data)
            ? data.filter((k: any) => {
                const h = mode === 'telegram' ? k.channel_username : k.twitter_handle;
                return h !== otherHandle;
              })
            : []
        );
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, otherHandle, mode]);

  const placeholder = mode === 'telegram' ? 'Select Channel...' : 'Select KOL...';
  const searchPlaceholder = mode === 'telegram' ? 'Search channel...' : 'Search KOL...';

  return (
    <div ref={ref} className="relative w-full">
      <label className="block text-xs text-[#666] mb-1.5 font-medium">{label}</label>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full h-10 px-3 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] transition-colors text-left"
      >
        <Search className="w-3.5 h-3.5 text-[#666] shrink-0" />
        <span className={cn('flex-1 text-sm truncate', value ? 'text-white' : 'text-[#666]')}>
          {value ? (mode === 'telegram' ? value : `@${value}`) : placeholder}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-[#666] shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-white/[0.08] bg-[#0a0a0c] shadow-xl max-h-64 overflow-hidden">
          <div className="p-2 border-b border-white/[0.06]">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-8 px-2 text-sm bg-white/[0.04] rounded border border-white/[0.08] outline-none focus:border-primary/50 text-white placeholder:text-[#555]"
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {loading && <div className="px-3 py-2 text-xs text-[#666]">Searching...</div>}
            {!loading && results.length === 0 && <div className="px-3 py-2 text-xs text-[#666]">No results</div>}
            {results.map((item) => {
              const handle = mode === 'telegram' ? item.channel_username! : item.twitter_handle!;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onChange(handle);
                    setOpen(false);
                    setQuery('');
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-white/[0.04] transition-colors text-left"
                >
                  {item.profile_image_url ? (
                    <Image src={item.profile_image_url} alt="" width={24} height={24} className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/[0.08]" />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm text-white truncate">{item.display_name || handle}</div>
                    <div className="text-xs text-[#666]">
                      {mode === 'telegram' ? handle : `@${handle}`}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBar({
  label,
  val1,
  val2,
  format,
  icon: Icon,
}: {
  label: string;
  val1: number;
  val2: number;
  format: (n: number) => string;
  icon: any;
}) {
  const max = Math.max(val1, val2, 0.01);
  const w1 = (val1 / max) * 100;
  const w2 = (val2 / max) * 100;
  const winner = val1 > val2 ? 1 : val2 > val1 ? 2 : 0;

  return (
    <div className="py-3">
      <div className="flex items-center justify-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5 text-[#666]" />
        <span className="text-xs font-medium text-[#888]">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className={cn('text-sm font-semibold w-20 text-right tabular-nums', winner === 1 ? 'text-primary' : 'text-white')}>
          {format(val1)}
          {winner === 1 && <span className="ml-1 text-[10px]">👑</span>}
        </span>
        <div className="flex-1 flex gap-1 h-5">
          <div className="flex-1 flex justify-end">
            <div
              className={cn('h-full rounded-l transition-all duration-500', winner === 1 ? 'bg-primary/60' : 'bg-white/[0.15]')}
              style={{ width: `${w1}%` }}
            />
          </div>
          <div className="flex-1">
            <div
              className={cn('h-full rounded-r transition-all duration-500', winner === 2 ? 'bg-primary/60' : 'bg-white/[0.15]')}
              style={{ width: `${w2}%` }}
            />
          </div>
        </div>
        <span className={cn('text-sm font-semibold w-20 tabular-nums', winner === 2 ? 'text-primary' : 'text-white')}>
          {winner === 2 && <span className="mr-1 text-[10px]">👑</span>}
          {format(val2)}
        </span>
      </div>
    </div>
  );
}

function formatMcap(n: number): string {
  if (!n) return '-';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function ModeToggle({ mode, onChange }: { mode: CompareMode; onChange: (m: CompareMode) => void }) {
  return (
    <div className="inline-flex rounded-lg bg-white/[0.06] p-0.5">
      {(['kol', 'telegram'] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={cn(
            'px-4 py-1.5 rounded-md text-xs font-medium transition-colors',
            mode === m ? 'bg-primary/20 text-primary' : 'text-[#888] hover:text-white'
          )}
        >
          {m === 'kol' ? 'KOL' : 'Telegram'}
        </button>
      ))}
    </div>
  );
}

function ComparePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<CompareMode>((searchParams.get('type') as CompareMode) || 'kol');
  const [handle1, setHandle1] = useState(searchParams.get('kol1') || searchParams.get('ch1') || '');
  const [handle2, setHandle2] = useState(searchParams.get('kol2') || searchParams.get('ch2') || '');
  const [data, setData] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchComparison = useCallback(
    async (h1: string, h2: string, m: CompareMode) => {
      if (!h1 || !h2) return;
      setLoading(true);
      setError('');
      try {
        const url =
          m === 'telegram'
            ? `/api/compare/telegram?ch1=${encodeURIComponent(h1)}&ch2=${encodeURIComponent(h2)}`
            : `/api/compare?kol1=${encodeURIComponent(h1)}&kol2=${encodeURIComponent(h2)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Comparison failed');
        setData(await res.json());
      } catch {
        setError('Failed to load comparison');
      }
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    const type = (searchParams.get('type') as CompareMode) || 'kol';
    const h1 = type === 'telegram' ? searchParams.get('ch1') || '' : searchParams.get('kol1') || '';
    const h2 = type === 'telegram' ? searchParams.get('ch2') || '' : searchParams.get('kol2') || '';
    setMode(type);
    if (h1 && h2) {
      setHandle1(h1);
      setHandle2(h2);
      fetchComparison(h1, h2, type);
    }
  }, [searchParams, fetchComparison]);

  const buildUrl = (m: CompareMode, h1: string, h2: string) => {
    if (m === 'telegram') return `/compare?type=telegram&ch1=${h1}&ch2=${h2}`;
    return `/compare?kol1=${h1}&kol2=${h2}`;
  };

  const handleSelect = (side: 1 | 2, handle: string) => {
    const newH1 = side === 1 ? handle : handle1;
    const newH2 = side === 2 ? handle : handle2;
    if (side === 1) setHandle1(handle);
    else setHandle2(handle);
    if (newH1 && newH2) {
      router.push(buildUrl(mode, newH1, newH2), { scroll: false });
      fetchComparison(newH1, newH2, mode);
    }
  };

  const handleModeChange = (m: CompareMode) => {
    setMode(m);
    setHandle1('');
    setHandle2('');
    setData(null);
    setError('');
    router.push(`/compare?type=${m}`, { scroll: false });
  };

  const displayHandle = (entity: EntityData) => {
    if (mode === 'telegram') return entity.channel_username || entity.twitter_handle || '';
    return entity.twitter_handle || '';
  };

  const formatHandle = (entity: EntityData) => {
    const h = displayHandle(entity);
    return mode === 'telegram' ? h : `@${h}`;
  };

  const shareOnX = () => {
    if (!data) return;
    const { kol1, kol2 } = data;
    const h1 = displayHandle(kol1);
    const h2 = displayHandle(kol2);
    const prefix = mode === 'telegram' ? '📢' : '🔍';
    const label1 = mode === 'telegram' ? h1 : `@${h1}`;
    const label2 = mode === 'telegram' ? h2 : `@${h2}`;
    const url = `https://xscan.wtf${buildUrl(mode, h1, h2)}`;
    const text = `${prefix} ${label1} vs ${label2} on XSCAN\n\nWin rate: ${kol1.winrate?.toFixed(0)}% vs ${kol2.winrate?.toFixed(0)}%\nAvg: ${kol1.avg_multiplier?.toFixed(1)}x vs ${kol2.avg_multiplier?.toFixed(1)}x\nBest: ${kol1.best_multiplier?.toFixed(1)}x vs ${kol2.best_multiplier?.toFixed(1)}x\n\nFull comparison 👇\n${url}`;
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const selectorLabel1 = mode === 'telegram' ? 'Channel 1' : 'KOL 1';
  const selectorLabel2 = mode === 'telegram' ? 'Channel 2' : 'KOL 2';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-1">
          {mode === 'telegram' ? 'Channel Comparison' : 'KOL Comparison'}
        </h1>
        <p className="text-sm text-[#666] mb-4">
          {mode === 'telegram' ? 'Compare two Telegram channels side-by-side' : 'Compare two KOLs side-by-side'}
        </p>
        <ModeToggle mode={mode} onChange={handleModeChange} />
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <EntitySelector label={selectorLabel1} value={handle1} onChange={(h) => handleSelect(1, h)} otherHandle={handle2} mode={mode} />
        <EntitySelector label={selectorLabel2} value={handle2} onChange={(h) => handleSelect(2, h)} otherHandle={handle1} mode={mode} />
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && <div className="text-center py-10 text-red-400 text-sm">{error}</div>}

      {data && !loading && (
        <>
          {/* Profiles */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[data.kol1, data.kol2].map((entity) => (
              <div key={entity.id} className="flex flex-col items-center p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                {entity.profile_image_url ? (
                  <Image src={entity.profile_image_url} alt="" width={56} height={56} className="w-14 h-14 rounded-full mb-2" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-white/[0.08] mb-2" />
                )}
                <div className="font-semibold text-sm truncate max-w-full">
                  {entity.display_name || displayHandle(entity)}
                </div>
                <div className="text-xs text-[#666]">{formatHandle(entity)}</div>
              </div>
            ))}
          </div>

          {/* Stats Comparison */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 mb-6 divide-y divide-white/[0.06]">
            <StatBar label="Total Calls" val1={data.kol1.total_calls} val2={data.kol2.total_calls} format={(n) => String(n)} icon={Target} />
            <StatBar label="Win Rate" val1={data.kol1.winrate} val2={data.kol2.winrate} format={(n) => `${n?.toFixed(0)}%`} icon={Trophy} />
            <StatBar label="Avg Multiplier" val1={data.kol1.avg_multiplier} val2={data.kol2.avg_multiplier} format={(n) => `${n?.toFixed(1)}x`} icon={TrendingUp} />
            <StatBar label="Best Multiplier" val1={data.kol1.best_multiplier} val2={data.kol2.best_multiplier} format={(n) => `${n?.toFixed(1)}x`} icon={Zap} />
          </div>

          {/* Recent Calls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[data.kol1, data.kol2].map((entity) => (
              <div key={entity.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <h3 className="text-sm font-semibold mb-3">{formatHandle(entity)} — Last 10 Calls</h3>
                <div className="space-y-1.5">
                  {entity.calls.length === 0 && <div className="text-xs text-[#666]">No calls</div>}
                  {entity.calls.map((call: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-white/[0.02]">
                      <span className="text-white font-medium truncate max-w-[120px]">{call.token_symbol || call.token_address?.slice(0, 8)}</span>
                      <span className={cn('font-semibold tabular-nums', (call.ath_multiplier || 0) >= 2 ? 'text-primary' : 'text-red-400')}>
                        {call.ath_multiplier && call.ath_multiplier > 1
                          ? `${call.ath_multiplier.toFixed(1)}x`
                          : call.current_multiplier && call.current_multiplier < 1
                            ? `-${((1 - call.current_multiplier) * 100).toFixed(0)}%`
                            : call.ath_multiplier ? `${call.ath_multiplier.toFixed(1)}x` : '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Tokens in Common */}
          {data.tokensInCommon.length > 0 && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 mb-6">
              <h3 className="text-sm font-semibold mb-3">Tokens in Common ({data.tokensInCommon.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[#666] border-b border-white/[0.06]">
                      <th className="text-left py-2 font-medium">Token</th>
                      <th className="text-right py-2 font-medium">{formatHandle(data.kol1)}</th>
                      <th className="text-right py-2 font-medium">{formatHandle(data.kol2)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tokensInCommon.map((t, i) => (
                      <tr key={i} className="border-b border-white/[0.04]">
                        <td className="py-2 text-white font-medium">{t.token_symbol || t.token_address?.slice(0, 8)}</td>
                        <td className="py-2 text-right">
                          <span className={cn('font-semibold', (t.kol1_multiplier || 0) >= (t.kol2_multiplier || 0) ? 'text-primary' : 'text-white')}>
                            {t.kol1_multiplier?.toFixed(1)}x
                          </span>
                          <span className="text-[#555] ml-1">({formatMcap(t.kol1_entry_mcap)})</span>
                        </td>
                        <td className="py-2 text-right">
                          <span className={cn('font-semibold', (t.kol2_multiplier || 0) >= (t.kol1_multiplier || 0) ? 'text-primary' : 'text-white')}>
                            {t.kol2_multiplier?.toFixed(1)}x
                          </span>
                          <span className="text-[#555] ml-1">({formatMcap(t.kol2_entry_mcap)})</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Share Button */}
          <div className="flex justify-center">
            <button
              onClick={shareOnX}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition-colors text-sm font-medium"
            >
              <Share2 className="w-4 h-4" />
              Share on X
            </button>
          </div>
        </>
      )}

      {!data && !loading && !error && (
        <div className="text-center py-20 text-[#555] text-sm">
          {mode === 'telegram' ? 'Select two channels above to compare them' : 'Select two KOLs above to compare them'}
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <ComparePageInner />
    </Suspense>
  );
}
