import Link from 'next/link';
import { Book, Coins, Flame, Users, BarChart3, Shield, HelpCircle, FileText, ChevronRight, Home, Bot } from 'lucide-react';

const sidebarItems = [
  {
    title: 'Getting Started',
    items: [
      { href: '/docs', label: 'Introduction', icon: Book },
      { href: '/docs/how-it-works', label: 'How It Works', icon: BarChart3 },
      { href: '/docs/bots', label: 'Bots & Commands', icon: Bot },
    ],
  },
  {
    title: 'For KOLs',
    items: [
      { href: '/docs/getting-listed', label: 'Getting Listed', icon: Users },
      { href: '/docs/scoring', label: 'Scoring System', icon: BarChart3 },
    ],
  },
  {
    title: 'Token',
    items: [
      { href: '/docs/token', label: '$XSCAN Token', icon: Coins },
      { href: '/docs/tokenomics', label: 'Tokenomics', icon: Flame },
    ],
  },
  {
    title: 'Security',
    items: [
      { href: '/docs/side-wallets', label: 'Side Wallet Detection', icon: Shield },
    ],
  },
  {
    title: 'Legal',
    items: [
      { href: '/privacy', label: 'Privacy Policy', icon: FileText },
      { href: '/faq', label: 'FAQ', icon: HelpCircle },
    ],
  },
];

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 flex-shrink-0 hidden lg:block">
        <div className="sticky top-0 h-screen overflow-y-auto p-6">
          {/* Back to home */}
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 text-sm"
          >
            <Home className="w-4 h-4" />
            Back to XSCAN
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Book className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">Docs</span>
          </div>

          {/* Navigation */}
          <nav className="space-y-6">
            {sidebarItems.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {section.title}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
                        >
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
