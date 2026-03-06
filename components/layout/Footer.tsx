'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Book, FileText, HelpCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

// Custom Icons
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

export default function Footer() {
  const [isConnected, setIsConnected] = useState(true);
  const [blockHeight, setBlockHeight] = useState('');

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(navigator.onLine);
    };

    // Simulate block height
    setBlockHeight(Math.floor(Date.now() / 400).toLocaleString());

    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);
    checkConnection();

    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);

  return (
    <footer className="border-t border-border/40 mt-auto bg-background">
      {/* Decorative top line */}
      <div className="section-divider" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-5 group">
              <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center group-hover:border-primary/30 group-hover:shadow-[0_0_15px_rgba(0,255,136,0.15)] transition-all duration-300">
                <Image src="/logo.png" alt="XSCAN" width={28} height={28} className="w-7 h-7" />
              </div>
              <span className="font-bold text-xl tracking-tighter">XSCAN</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              Track the best crypto KOLs on Twitter/X with verified on-chain performance data.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://x.com/XScan_"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-card/50 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-card transition-all duration-300"
              >
                <TwitterIcon className="w-4 h-4" />
              </a>
              <a
                href="https://github.com/LeoFaveroOnSol/xscan-app"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-card/50 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-card transition-all duration-300"
              >
                <GithubIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-5 text-xs uppercase tracking-widest text-muted-foreground">Product</h3>
            <ul className="space-y-3.5">
              <li>
                <Link href="/" className="text-sm text-foreground/70 hover:text-primary transition-colors duration-300 link-hover">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link href="/apply" className="text-sm text-foreground/70 hover:text-primary transition-colors duration-300 link-hover">
                  Apply as KOL
                </Link>
              </li>
              <li>
                <Link href="/docs/token" className="text-sm text-foreground/70 hover:text-primary transition-colors duration-300 link-hover">
                  $XSCAN Token
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-5 text-xs uppercase tracking-widest text-muted-foreground">Resources</h3>
            <ul className="space-y-3.5">
              <li>
                <Link href="/docs" className="text-sm text-foreground/70 hover:text-primary transition-colors duration-300 flex items-center gap-2 link-hover">
                  <Book className="w-3.5 h-3.5" />
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-foreground/70 hover:text-primary transition-colors duration-300 flex items-center gap-2 link-hover">
                  <HelpCircle className="w-3.5 h-3.5" />
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/docs/how-it-works" className="text-sm text-foreground/70 hover:text-primary transition-colors duration-300 link-hover">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-5 text-xs uppercase tracking-widest text-muted-foreground">Legal</h3>
            <ul className="space-y-3.5">
              <li>
                <Link href="/privacy" className="text-sm text-foreground/70 hover:text-primary transition-colors duration-300 flex items-center gap-2 link-hover">
                  <FileText className="w-3.5 h-3.5" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/docs/side-wallets" className="text-sm text-foreground/70 hover:text-primary transition-colors duration-300 link-hover">
                  Side Wallet Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Status */}
          <div>
            <h3 className="font-semibold mb-5 text-xs uppercase tracking-widest text-muted-foreground">Status</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 text-sm">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-primary animate-pulse' : 'bg-danger'}`} />
                <span className="text-foreground/70">
                  {isConnected ? 'All systems operational' : 'Connection issues'}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <ZapIcon className="w-3.5 h-3.5 text-primary" />
                <span className="text-foreground/70">Solana Mainnet</span>
              </div>
              <div className="stat-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Last sync</span>
                  <span className="text-xs text-primary font-medium">Just now</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Block height</span>
                  <span className="text-xs font-mono text-foreground/70">~{blockHeight}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} XSCAN. All rights reserved.
            </p>
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-primary font-semibold">v1.0</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Built by{' '}
            <a
              href="https://x.com/leofaveroo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              @leofaveroo
            </a>
            {' '}on Solana. Not financial advice. DYOR.
          </p>
        </div>
      </div>
    </footer>
  );
}
