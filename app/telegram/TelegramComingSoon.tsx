'use client';

import Link from 'next/link';
import { Bell, ArrowLeft } from 'lucide-react';

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

// Fake channel data for blurred preview
const fakeChannels = [
  { name: 'Alpha Calls', handle: '@alphacalls', winrate: 72, calls: 156, multiplier: 4.2 },
  { name: 'Degen Alerts', handle: '@degenalerts', winrate: 68, calls: 234, multiplier: 3.8 },
  { name: 'Gem Hunter', handle: '@gemhunter', winrate: 65, calls: 189, multiplier: 5.1 },
  { name: 'Moon Signals', handle: '@moonsignals', winrate: 61, calls: 312, multiplier: 3.2 },
  { name: 'Crypto Insider', handle: '@cryptoinsider', winrate: 58, calls: 278, multiplier: 2.9 },
  { name: 'Early Alpha', handle: '@earlyalpha', winrate: 55, calls: 145, multiplier: 4.5 },
];

function FakeChannelCard({ channel, index }: { channel: typeof fakeChannels[0], index: number }) {
  return (
    <div 
      className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
          <TelegramIcon className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <div className="font-semibold text-sm">{channel.name}</div>
          <div className="text-xs text-muted-foreground">{channel.handle}</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-green-400 font-bold text-sm">{channel.winrate}%</div>
          <div className="text-[10px] text-muted-foreground">Win Rate</div>
        </div>
        <div>
          <div className="text-blue-400 font-bold text-sm">{channel.calls}</div>
          <div className="text-[10px] text-muted-foreground">Calls</div>
        </div>
        <div>
          <div className="text-purple-400 font-bold text-sm">{channel.multiplier}x</div>
          <div className="text-[10px] text-muted-foreground">Avg</div>
        </div>
      </div>
    </div>
  );
}

export default function TelegramComingSoon() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Blurred Preview Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-full max-w-6xl px-4 blur-[8px] opacity-30 scale-95">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {fakeChannels.map((channel, i) => (
              <FakeChannelCard key={i} channel={channel} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#09090b] via-transparent to-[#09090b] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-transparent to-[#09090b] pointer-events-none" />

      {/* Content */}
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="text-center px-4 max-w-md">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center border border-blue-500/20">
              <TelegramIcon className="w-10 h-10 text-blue-400" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Telegram Channels
          </h1>

          {/* V2 Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
            <span className="text-blue-400 text-sm font-medium">Coming in V2</span>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          </div>

          {/* Simple Description */}
          <p className="text-muted-foreground mb-8">
            Track Telegram call channels performance with win rates and multiplier stats.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08] transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <a
              href="https://x.com/XScan_"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 transition-colors text-sm font-medium text-white"
            >
              <Bell className="w-4 h-4" />
              Follow for Updates
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
