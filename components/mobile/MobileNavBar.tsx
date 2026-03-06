'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

// Chart/Stats Icon
function ChartIcon({ className, filled }: { className?: string; filled?: boolean }) {
  if (filled) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 3v18h18v-2H5V3H3zm14 4h-4v10h4V7zm-6 4H7v6h4v-6zm8-2h-2v8h2V9z" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}

// Settings/Gear Icon
function GearIcon({ className, filled }: { className?: string; filled?: boolean }) {
  if (filled) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM9.5 12a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0z" />
        <path fillRule="evenodd" clipRule="evenodd" d="M12 1a1 1 0 0 1 1 1v1.07a7.073 7.073 0 0 1 3.293 1.366l.757-.757a1 1 0 1 1 1.414 1.414l-.757.757A7.073 7.073 0 0 1 19.07 9H20a1 1 0 1 1 0 2h-.93a7.073 7.073 0 0 1-1.363 3.293l.757.757a1 1 0 0 1-1.414 1.414l-.757-.757A7.073 7.073 0 0 1 13 17.07V18a1 1 0 1 1-2 0v-.93a7.073 7.073 0 0 1-3.293-1.363l-.757.757a1 1 0 0 1-1.414-1.414l.757-.757A7.073 7.073 0 0 1 4.93 11H4a1 1 0 1 1 0-2h.93a7.073 7.073 0 0 1 1.363-3.293l-.757-.757A1 1 0 1 1 6.95 3.536l.757.757A7.073 7.073 0 0 1 11 2.93V2a1 1 0 0 1 1-1z" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

// Trophy Icon
function TrophyIcon({ className, filled }: { className?: string; filled?: boolean }) {
  if (filled) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 2a1 1 0 0 0-1 1v2.5a4.5 4.5 0 0 0 3.243 4.323A6.018 6.018 0 0 0 11 13.874V17H8.5a.5.5 0 0 0-.5.5V21a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-3.5a.5.5 0 0 0-.5-.5H13v-3.126a6.018 6.018 0 0 0 3.757-3.05A4.5 4.5 0 0 0 20 5.5V3a1 1 0 0 0-1-1H5z" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

// Clock/History Icon
function HistoryIcon({ className, filled }: { className?: string; filled?: boolean }) {
  if (filled) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 5a1 1 0 1 0-2 0v5a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V7z" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// Plus Icon for FAB
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

const navItems = [
  { href: '/leaderboard', label: 'Leaderboard', icon: ChartIcon },
  { href: '/profile', label: 'Settings', icon: GearIcon },
  { href: '/apply', label: '', icon: PlusIcon, isFab: true },
  { href: '/docs/token', label: 'Rewards', icon: TrophyIcon },
  { href: '/search', label: 'History', icon: HistoryIcon },
];

export default function MobileNavBar() {
  const pathname = usePathname();

  // Don't show on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="native-tab-bar">
      {navItems.map((item, index) => {
        const isActive = item.isFab ? false : (
          pathname === item.href ||
          (item.href !== '/' && pathname?.startsWith(item.href))
        );
        const Icon = item.icon;

        // FAB (Floating Action Button) - center button
        if (item.isFab) {
          return (
            <Link
              key={`fab-${index}`}
              href={item.href}
              className="native-fab"
            >
              <Icon className="native-fab-icon" />
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'native-tab-item',
              isActive && 'native-tab-item-active'
            )}
          >
            <Icon
              className="native-tab-icon"
              filled={isActive}
            />
            <span className="native-tab-label">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
