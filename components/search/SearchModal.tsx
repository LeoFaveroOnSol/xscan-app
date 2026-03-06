'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, User, Coins, TrendingUp, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface SearchResult {
  type: 'kol' | 'token' | 'channel';
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  image?: string;
  stats?: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          // This would need to be handled by parent
        }
      }
      
      if (!isOpen) return;

      // Escape to close
      if (e.key === 'Escape') {
        onClose();
      }

      // Arrow navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, results.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      }

      // Enter to select
      if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        router.push(results[selectedIndex].href);
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, results, selectedIndex, router]);

  // Debounced search
  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      // Check if it looks like a contract address
      const isContract = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(searchQuery) || 
                         /^0x[a-fA-F0-9]{40}$/.test(searchQuery);

      if (isContract) {
        // Direct token lookup
        setResults([{
          type: 'token',
          id: searchQuery,
          title: 'View Token',
          subtitle: `${searchQuery.slice(0, 8)}...${searchQuery.slice(-6)}`,
          href: `/token/${searchQuery}`,
          stats: 'Contract Address',
        }]);
        setLoading(false);
        return;
      }

      // Search KOLs from API
      const response = await fetch(`/api/kols?search=${encodeURIComponent(searchQuery)}&limit=5`);
      const data = await response.json();

      const kolResults: SearchResult[] = (data.kols || []).map((kol: any) => ({
        type: 'kol' as const,
        id: kol.id,
        title: kol.display_name || `@${kol.twitter_handle}`,
        subtitle: `@${kol.twitter_handle}`,
        href: `/kol/${kol.twitter_handle}`,
        image: kol.profile_image_url,
        stats: `${kol.winrate?.toFixed(0) || 0}% WR · ${kol.total_calls || 0} calls`,
      }));

      // Also search for tokens if query looks like a symbol (3-10 chars, uppercase-ish)
      let tokenResults: SearchResult[] = [];
      if (searchQuery.length >= 2 && searchQuery.length <= 10) {
        try {
          // Search DexScreener for token
          const dexRes = await fetch(
            `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(searchQuery)}`
          );
          const dexData = await dexRes.json();
          
          const pairs = dexData.pairs || [];
          const seenTokens = new Set<string>();
          
          for (const pair of pairs.slice(0, 3)) {
            const addr = pair.baseToken?.address;
            if (!addr || seenTokens.has(addr)) continue;
            seenTokens.add(addr);
            
            tokenResults.push({
              type: 'token',
              id: addr,
              title: pair.baseToken?.symbol || '???',
              subtitle: pair.baseToken?.name,
              href: `/token/${addr}`,
              stats: `$${formatNumber(pair.marketCap || pair.fdv || 0)} · ${pair.chainId?.toUpperCase()}`,
            });
          }
        } catch (e) {
          // Ignore DexScreener errors
        }
      }

      setResults([...kolResults, ...tokenResults]);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, search]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-lg">
        <div className="mx-4 bg-[#0a0a0c] border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-border/50">
            <Search className="w-5 h-5 text-primary" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search KOLs, tokens, or paste contract..."
              className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
              autoComplete="off"
              spellCheck={false}
            />
            {loading ? (
              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
            ) : query ? (
              <button 
                onClick={() => setQuery('')}
                className="p-1 hover:bg-white/10 rounded-md transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            ) : null}
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto">
            {results.length > 0 ? (
              <div className="p-2">
                {results.map((result, index) => (
                  <Link
                    key={`${result.type}-${result.id}`}
                    href={result.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl transition-colors',
                      index === selectedIndex 
                        ? 'bg-primary/10 border border-primary/30' 
                        : 'hover:bg-white/5'
                    )}
                  >
                    {/* Icon/Image */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {result.image ? (
                        <img 
                          src={result.image} 
                          alt={result.title}
                          className="w-full h-full object-cover"
                        />
                      ) : result.type === 'kol' ? (
                        <User className="w-5 h-5 text-primary" />
                      ) : (
                        <Coins className="w-5 h-5 text-primary" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate">{result.title}</span>
                        {result.type === 'kol' && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/20 text-primary rounded">
                            KOL
                          </span>
                        )}
                        {result.type === 'token' && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-purple-500/20 text-purple-400 rounded">
                            TOKEN
                          </span>
                        )}
                      </div>
                      {result.subtitle && (
                        <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                      )}
                      {result.stats && (
                        <p className="text-xs text-muted-foreground/70">{result.stats}</p>
                      )}
                    </div>

                    {/* Arrow */}
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            ) : query.length >= 2 && !loading ? (
              <div className="p-8 text-center">
                <Search className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-muted-foreground">No results found</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Try a different search term
                </p>
              </div>
            ) : !query ? (
              <div className="p-6">
                <p className="text-sm text-muted-foreground mb-4">Quick actions</p>
                <div className="space-y-2">
                  <Link
                    href="/leaderboard"
                    onClick={onClose}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <span>View Leaderboard</span>
                  </Link>
                  <Link
                    href="/apply"
                    onClick={onClose}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <User className="w-5 h-5 text-primary" />
                    <span>Apply as KOL</span>
                  </Link>
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded border border-border bg-white/5">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded border border-border bg-white/5">↵</kbd>
                select
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-white/5">esc</kbd>
              close
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

function formatNumber(num: number): string {
  if (!num) return '0';
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(0) + 'K';
  return num.toString();
}
