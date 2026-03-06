'use client';

import { useRef, useState } from 'react';
import type { KOL, Call } from '@/types/database';

interface KOLFlexCardProps {
  kol: KOL;
  calls: Call[];
  onClose: () => void;
}

export default function KOLFlexCard({ kol, calls, onClose }: KOLFlexCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  // Get top 3 calls by ATH multiplier
  const topCalls = [...calls]
    .filter(c => c.ath_multiplier > 1)
    .sort((a, b) => (b.ath_multiplier || 0) - (a.ath_multiplier || 0))
    .slice(0, 3);

  // Calculate stats
  const winningCalls = calls.filter(c => c.is_win).length;
  const avgMultiplier = kol.avg_multiplier.toFixed(2);
  const bestMultiplier = kol.best_multiplier.toFixed(2);
  const xscore = (kol.winrate / 10).toFixed(2);

  const downloadCard = async () => {
    if (!cardRef.current) return;
    setDownloading(true);

    try {
      // Dynamic import html2canvas
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#09090b',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const link = document.createElement('a');
      link.download = `${kol.twitter_handle}-flex.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to download card:', error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      {/* Overlay click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 flex flex-col items-center gap-4">
        {/* The Card */}
        <div
          ref={cardRef}
          className="w-[400px] rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #0f1614 0%, #09090b 100%)' }}
        >
          {/* Header */}
          <div className="p-6 pb-4">
            {/* XSCAN Logo */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-sm font-bold text-black">X</span>
                </div>
                <span className="text-lg font-bold">XSCAN</span>
              </div>
              <span className="text-xs text-muted-foreground">xscan.wtf</span>
            </div>

            {/* Profile Section */}
            <div className="flex items-center gap-4 mb-6">
              <img
                src={kol.profile_image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${kol.twitter_handle}`}
                alt={kol.display_name || kol.twitter_handle}
                className="w-20 h-20 rounded-full object-cover border-2 border-primary/30"
              />
              <div>
                <h2 className="text-xl font-bold">{kol.display_name || kol.twitter_handle}</h2>
                <p className="text-muted-foreground">@{kol.twitter_handle}</p>
                <span className="inline-flex mt-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-primary/20 text-primary border border-primary/30">
                  VERIFIED KOL
                </span>
              </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">XSCORE</p>
                <p className="text-2xl font-bold text-primary">{xscore}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">WINRATE</p>
                <p className="text-2xl font-bold text-primary">+{kol.winrate.toFixed(0)}%</p>
              </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">CALLS</p>
                <p className="font-bold">
                  <span className="text-primary">{winningCalls}</span>
                  <span className="text-muted-foreground">/{kol.total_calls}</span>
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">BEST</p>
                <p className="font-bold text-primary">{bestMultiplier}x</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">AVG</p>
                <p className="font-bold">{avgMultiplier}x</p>
              </div>
            </div>
          </div>

          {/* Top Calls Section */}
          {topCalls.length > 0 && (
            <div className="px-6 pb-6">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">TOP CALLS</p>
              <div className="space-y-2">
                {topCalls.map((call, index) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      {call.token_image_url ? (
                        <img
                          src={call.token_image_url}
                          alt={call.token_symbol || ''}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center">
                          <span className="text-xs font-bold text-muted-foreground">
                            {(call.token_symbol || '?')[0]}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-sm">{call.token_symbol || 'TOKEN'}</p>
                        <p className="text-[10px] text-muted-foreground">
                          ${((call.entry_market_cap || 0) / 1000).toFixed(0)}K entry
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{(call.ath_multiplier || 1).toFixed(1)}x</p>
                      <p className="text-[10px] text-muted-foreground">ATH</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Track your favorite KOLs</span>
              <span className="text-primary font-medium">xscan.wtf</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={downloadCard}
            disabled={downloading}
            className="px-6 py-2.5 rounded-lg bg-primary text-black font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {downloading ? 'Downloading...' : 'Download PNG'}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg border border-white/[0.1] text-white font-medium hover:bg-white/[0.05] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
