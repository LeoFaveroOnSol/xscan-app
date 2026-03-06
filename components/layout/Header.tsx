'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import WalletButton from '@/components/wallet/WalletButton';
import SearchModal from '@/components/search/SearchModal';
import PriceTicker from '@/components/layout/PriceTicker';
import { Menu, X, Search } from 'lucide-react';
import { useState, useEffect } from 'react';

// Navigation icons
function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function CoinsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  );
}

function UserPlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" x2="19" y1="8" y2="14" />
      <line x1="22" x2="16" y1="11" y2="11" />
    </svg>
  );
}

function HelpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/>
      <path d="M5 21h14"/>
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

function TokensIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v12" />
      <path d="M6 12h12" />
    </svg>
  );
}

function CompareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3h5v5" />
      <path d="M8 3H3v5" />
      <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" />
      <path d="m15 9 6-6" />
    </svg>
  );
}

const navLinks = [
  { href: '/leaderboard', label: 'Leaderboard', icon: TrophyIcon },
  { href: '/telegram', label: 'Telegram', icon: TelegramIcon },
  { href: '/holders', label: 'Holders', icon: CrownIcon },
  { href: '/tokens', label: 'Tokens', icon: TokensIcon },
  { href: '/compare', label: 'Compare', icon: CompareIcon },
  { href: '/docs/token', label: '$XSCAN', icon: CoinsIcon },
  { href: '/apply', label: 'Register', icon: UserPlusIcon },
  { href: '/faq', label: 'FAQ', icon: HelpIcon },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-[#09090b] border-b border-white/[0.04]">
      <div className="flex items-center h-12 px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-6">
          <Image src="/logo.png" alt="XSCAN" width={28} height={28} className="w-7 h-7" />
          <span className="font-semibold tracking-tight">XSCAN</span>
          <span className="px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 rounded border border-emerald-500/30 bg-emerald-500/10">
            v.2.0
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href ||
              (link.href !== '/' && pathname?.startsWith(link.href));
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium transition-colors rounded-md',
                  isActive
                    ? 'text-primary'
                    : 'text-[#888] hover:text-white'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Center Section - Search */}
        <div className="flex-1 hidden md:flex justify-center">
          <button 
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 h-8 px-4 min-w-[200px] text-[13px] text-[#666] rounded-lg border border-primary/30 bg-white/[0.02] shadow-[0_0_10px_rgba(0,255,136,0.1)] hover:shadow-[0_0_15px_rgba(0,255,136,0.2)] hover:border-primary/50 transition-all"
          >
            <Search className="w-3.5 h-3.5 text-primary" />
            <span>Search...</span>
            <kbd className="hidden lg:inline ml-2 px-1.5 py-0.5 text-[10px] text-muted-foreground rounded border border-border bg-white/5">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Price Ticker - Desktop */}
        <div className="hidden lg:flex items-center mr-4">
          <PriceTicker />
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 ml-auto md:ml-0">
          {/* Token Link */}
          <Link
            href="/docs/token"
            className="hidden sm:flex items-center gap-1.5 h-8 px-3 text-[13px] font-medium rounded-md bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
          >
            <CoinsIcon className="w-3.5 h-3.5" />
            <span>$XSCAN</span>
          </Link>

          {/* Wallet */}
          <div className="hidden md:block">
            <WalletButton />
          </div>

          {/* Mobile Menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-md border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 py-3 border-t border-white/[0.04] bg-[#09090b]">
          <button 
            onClick={() => {
              setMobileMenuOpen(false);
              setSearchOpen(true);
            }}
            className="flex items-center gap-2 w-full h-9 px-3 mb-3 rounded-md border border-white/[0.06] bg-white/[0.02] text-[#666] text-left"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="text-[13px]">Search KOLs, tokens...</span>
          </button>

          <nav className="space-y-0.5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href ||
                (link.href !== '/' && pathname?.startsWith(link.href));
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-[13px] font-medium rounded-md transition-colors',
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-[#888] hover:text-white hover:bg-white/[0.03]'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/docs/token"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between mt-3 px-3 py-2 rounded-md bg-primary/10 border border-primary/20"
          >
            <div className="flex items-center gap-2 text-[13px] font-medium">
              <CoinsIcon className="w-4 h-4 text-primary" />
              <span>$XSCAN</span>
            </div>
            <span className="text-[13px] font-semibold text-yellow-400">Coming Soon</span>
          </Link>

          <div className="mt-3">
            <WalletButton className="w-full justify-center" />
          </div>
        </div>
      )}

      {/* Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
