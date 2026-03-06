'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Bell, Settings } from 'lucide-react';

export default function MobileHeader() {
  const pathname = usePathname();

  // Don't show on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  // Get page title based on route
  const getTitle = () => {
    if (pathname === '/') return 'XSCAN';
    if (pathname === '/leaderboard') return 'Leaderboard';
    if (pathname === '/search') return 'Search';
    if (pathname?.startsWith('/docs/token')) return '$XSCAN';
    if (pathname === '/profile') return 'Profile';
    if (pathname === '/apply') return 'Register';
    if (pathname === '/faq') return 'FAQ';
    if (pathname?.startsWith('/kol/')) return 'KOL Profile';
    return 'XSCAN';
  };

  const showLogo = pathname === '/';

  return (
    <header className="mobile-header">
      <div className="mobile-header-inner">
        {/* Left - Logo or Back */}
        <div className="flex items-center gap-2">
          {showLogo ? (
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="XSCAN" width={28} height={28} className="w-7 h-7" />
              <span className="font-semibold text-lg tracking-tight">XSCAN</span>
            </Link>
          ) : (
            <h1 className="font-semibold text-lg">{getTitle()}</h1>
          )}
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-1">
          <button className="mobile-header-button">
            <Bell className="w-5 h-5" />
            {/* Notification badge */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          </button>
          <button className="mobile-header-button">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
