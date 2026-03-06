'use client';

import { useRef, useState } from 'react';
import type { TelegramChannel, TelegramCall } from '@/types/database';

interface TelegramFlexCardProps {
  channel: TelegramChannel;
  calls: TelegramCall[];
  onClose: () => void;
}

export default function TelegramFlexCard({ channel, calls, onClose }: TelegramFlexCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  // Get top 3 calls by ATH multiplier
  const topCalls = [...calls]
    .filter(c => c.ath_multiplier > 1)
    .sort((a, b) => (b.ath_multiplier || 0) - (a.ath_multiplier || 0))
    .slice(0, 3);

  // Calculate stats
  const winningCalls = calls.filter(c => c.is_win).length;
  const avgMultiplier = channel.avg_multiplier.toFixed(2);
  const bestMultiplier = channel.best_multiplier.toFixed(2);
  const xscore = (channel.winrate / 10).toFixed(2);

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
      link.download = `${channel.channel_username}-flex.png`;
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
          style={{ background: 'linear-gradient(180deg, #0c1929 0%, #09090b 100%)' }}
        >
          {/* Header */}
          <div className="p-6 pb-4">
            {/* XSCAN Logo */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </div>
                <span className="text-lg font-bold">XSCAN</span>
              </div>
              <span className="text-xs text-muted-foreground">xscan.wtf</span>
            </div>

            {/* Profile Section */}
            <div className="flex items-center gap-4 mb-6">
              <img
                src={channel.profile_image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${channel.channel_username}`}
                alt={channel.display_name || channel.channel_username}
                className="w-20 h-20 rounded-full object-cover border-2 border-blue-500/30"
              />
              <div>
                <h2 className="text-xl font-bold">{channel.display_name || channel.channel_username}</h2>
                <p className="text-muted-foreground">@{channel.channel_username}</p>
                <span className="inline-flex mt-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  TELEGRAM CHANNEL
                </span>
              </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">XSCORE</p>
                <p className="text-2xl font-bold text-blue-400">{xscore}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">WINRATE</p>
                <p className="text-2xl font-bold text-blue-400">+{channel.winrate.toFixed(0)}%</p>
              </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">CALLS</p>
                <p className="font-bold">
                  <span className="text-blue-400">{winningCalls}</span>
                  <span className="text-muted-foreground">/{channel.total_calls}</span>
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">BEST</p>
                <p className="font-bold text-blue-400">{bestMultiplier}x</p>
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
                      <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center">
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
                      <p className="font-bold text-blue-400">{(call.ath_multiplier || 1).toFixed(1)}x</p>
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
              <span>Track your favorite channels</span>
              <span className="text-blue-400 font-medium">xscan.wtf</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={downloadCard}
            disabled={downloading}
            className="px-6 py-2.5 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-500/90 transition-colors disabled:opacity-50"
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
