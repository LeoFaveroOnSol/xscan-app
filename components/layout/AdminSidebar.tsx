'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { LayoutDashboard, Users, TrendingUp, FileText, Bot, LogOut, Upload, Power, MessageSquare, Inbox, PhoneCall, Award, UserCheck, Map, Kanban, BarChart3 } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/manual', label: 'Manual Import', icon: Upload },
  { href: '/admin/kols', label: 'KOLs', icon: Users },
  { href: '/admin/calls', label: 'Calls', icon: TrendingUp },
  { href: '/admin/telegram', label: 'Telegram', icon: MessageSquare },
  { href: '/admin/telegram-calls', label: 'TG Calls', icon: PhoneCall },
  { href: '/admin/achievements', label: 'Achievements', icon: Award },
  { href: '/admin/subscribers', label: 'Subscribers', icon: UserCheck },
  { href: '/admin/suggestions', label: 'Suggestions', icon: Inbox },
  { href: '/admin/applications', label: 'Applications', icon: FileText },
  { href: '/admin/automation', label: 'Automation', icon: Bot },
  { href: '/admin/mindmap', label: 'Mind Map', icon: Map },
  { href: '/admin/mission-control', label: 'Mission Control', icon: Kanban },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
      router.push('/admin/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-lg">X</span>
          </div>
          <span className="text-xl font-bold">XSCAN</span>
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Admin</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname?.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card-hover'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-card-hover transition-colors"
        >
          <LogOut className="w-5 h-5" />
          View Site
        </Link>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
        >
          <Power className="w-5 h-5" />
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </aside>
  );
}
