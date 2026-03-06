'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import type { KOL, Call } from '@/types/database';
import KOLFlexCard from './KOLFlexCard';
import WidgetEmbed from './WidgetEmbed';

// Twitter/X Icon
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// Telegram Icon
function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

// Solana Icon
function SolanaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.09 6.56a.71.71 0 0 0-.5-.21H4.19a.36.36 0 0 0-.25.61l3.13 3.14a.71.71 0 0 0 .5.21h15.4a.36.36 0 0 0 .25-.61l-3.13-3.14zM6.94 17.65a.71.71 0 0 1 .5-.21h15.4a.36.36 0 0 1 .26.61l-3.14 3.14a.71.71 0 0 1-.5.21H4.07a.36.36 0 0 1-.26-.61l3.13-3.14zM22.97 11.4H7.56a.71.71 0 0 0-.5.21l-3.13 3.14a.36.36 0 0 0 .25.61h15.4a.71.71 0 0 0 .5-.21l3.13-3.14a.36.36 0 0 0-.25-.61z"/>
    </svg>
  );
}

interface KOLProfileSidebarProps {
  kol: KOL;
  totalCalls: number;
  calls: Call[];
}

export default function KOLProfileSidebar({ kol, totalCalls, calls }: KOLProfileSidebarProps) {
  const [copied, setCopied] = useState(false);
  const [showFlexCard, setShowFlexCard] = useState(false);

  const copyWallet = () => {
    if (kol.wallet_address) {
      navigator.clipboard.writeText(kol.wallet_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Calculate stats
  const avgMultiplier = `${kol.avg_multiplier.toFixed(2)}x`;
  const bestMultiplier = `${kol.best_multiplier.toFixed(2)}x`;

  return (
    <div className="w-full lg:w-[420px] flex-shrink-0">
      {/* Profile Card */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-6">
        {/* Header with banner button */}
        <div className="flex items-center justify-between mb-6">
          <button className="px-3 py-1.5 text-xs font-medium rounded-lg border border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:bg-white/[0.04] transition-colors">
            kol banner
          </button>
          <button
            onClick={() => setShowFlexCard(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            FLEX
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" x2="12" y1="2" y2="15" />
            </svg>
          </button>
        </div>

        {/* Avatar */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <img
              src={kol.profile_image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${kol.twitter_handle}`}
              alt={kol.display_name || kol.twitter_handle}
              className="w-32 h-32 rounded-full object-cover border-2 border-white/10"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${kol.twitter_handle}`;
              }}
            />
          </div>
        </div>

        {/* Name */}
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold mb-2">{kol.display_name || kol.twitter_handle}</h1>
          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-primary/20 text-primary border border-primary/30">
            KOL
          </span>
        </div>

        {/* Wallet Address */}
        {kol.wallet_address && (
          <div className="flex justify-center mb-4">
            <button
              onClick={copyWallet}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] transition-colors"
            >
              <span className="text-sm text-muted-foreground font-mono">
                {truncateAddress(kol.wallet_address)}
              </span>
              <div className="flex items-center gap-1.5">
                <SolanaIcon className="w-4 h-4 text-[#9945FF]" />
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </div>
            </button>
          </div>
        )}

        {/* Social Links */}
        <div className="flex justify-center gap-3 mb-6">
          <a
            href={`https://x.com/${kol.twitter_handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all"
          >
            <XIcon className="w-5 h-5" />
          </a>
          <a
            href="#"
            className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all"
          >
            <TelegramIcon className="w-5 h-5" />
          </a>
        </div>

        {/* Widget Embed */}
        <div className="flex justify-center mb-4">
          <WidgetEmbed handle={kol.twitter_handle} />
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-4">
          <div className="text-center border-r border-white/[0.06]">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">XSCORE</p>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-2xl font-bold text-primary">{(kol.winrate / 10).toFixed(2)}</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">WINRATE</p>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-2xl font-bold text-primary">+{kol.winrate.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-4">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">TOKENS</p>
            <div className="flex items-center justify-center gap-1">
              <span className="text-primary font-bold">{kol.winning_calls || 0}</span>
              <span className="text-muted-foreground">/ {totalCalls}</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 text-center">MULTIPLIERS</p>
            <div className="flex justify-center gap-4">
              <div className="text-center">
                <p className="text-[9px] text-muted-foreground">BEST</p>
                <p className="font-bold">{bestMultiplier}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-muted-foreground">AVG</p>
                <p className="font-bold">{avgMultiplier}</p>
              </div>
            </div>
          </div>
        </div>

        {/* PNL Stats */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-4">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">ALL TIME PNL</p>
            <p className="text-lg font-bold text-muted-foreground">TBD</p>
            <p className="text-[9px] text-muted-foreground/60">wallet discovery</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">DEGENS PNL</p>
            <p className="text-lg font-bold text-muted-foreground">TBD</p>
            <p className="text-[9px] text-muted-foreground/60">coming soon</p>
          </div>
        </div>

        {/* Comments Section */}
        <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
          <span className="text-sm font-medium">Comments (0)</span>
          <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </button>
      </div>

      {/* Flex Card Modal */}
      {showFlexCard && (
        <KOLFlexCard kol={kol} calls={calls} onClose={() => setShowFlexCard(false)} />
      )}
    </div>
  );
}
