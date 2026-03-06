'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const recentSearches = [
    '@ansem',
    '@cryptogems',
    '@solanalegend',
  ];

  const trendingKOLs = [
    { name: 'Ansem', handle: '@ansem', winrate: 78 },
    { name: 'CryptoGems', handle: '@cryptogems', winrate: 72 },
    { name: 'SolanaLegend', handle: '@solanalegend', winrate: 69 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="mobile-search mb-6">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search KOLs, tokens..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mobile-search-input"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Recent Searches */}
        {!query && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
              Recent Searches
            </h3>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search) => (
                <button
                  key={search}
                  onClick={() => setQuery(search)}
                  className="mobile-chip"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Trending KOLs */}
        {!query && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
              Trending KOLs
            </h3>
            <div className="mobile-card">
              {trendingKOLs.map((kol, index) => (
                <div
                  key={kol.handle}
                  className="mobile-list-item mobile-card-pressable"
                >
                  <div className="mobile-avatar mr-3">
                    <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {kol.name[0]}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{kol.name}</p>
                    <p className="text-sm text-muted-foreground">{kol.handle}</p>
                  </div>
                  <div className="mobile-chip mobile-chip-primary">
                    {kol.winrate}% WR
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {query && (
          <div>
            <p className="text-sm text-muted-foreground text-center py-8">
              Searching for &quot;{query}&quot;...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
