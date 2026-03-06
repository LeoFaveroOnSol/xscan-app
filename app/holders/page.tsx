'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import {
  Wallet, Shield, Zap, Clock, BarChart3, Bell, Users,
  Lock, Unlock, Crown, ExternalLink, ChevronRight, Sparkles,
  CheckCircle2, XCircle, Loader2, ArrowRight,
} from 'lucide-react';

interface HolderPerks {
  realTimeAlerts: boolean;
  advancedFilters: boolean;
  fullHistory: boolean;
  walletTracker: boolean;
  apiAccess: boolean;
  holderGroup: string;
}

interface VerifyResponse {
  wallet: string;
  balance: number;
  threshold: number;
  isHolder: boolean;
  perks: HolderPerks | null;
}

interface AuthResponse {
  isHolder: boolean;
  holderToken: string;
  expiresAt: string;
  perks: string[];
}

const PERKS = [
  {
    icon: Zap,
    title: 'Real-Time Calls',
    desc: 'See KOL calls the moment they happen — no 5-minute delay',
    free: '5 min delay',
    holder: 'Instant',
  },
  {
    icon: BarChart3,
    title: 'Advanced Filters',
    desc: 'Filter by chain, mcap range, winrate, and multiplier thresholds',
    free: 'Basic filters',
    holder: 'Full access',
  },
  {
    icon: Clock,
    title: 'Full Call History',
    desc: 'Access complete historical data — every call, every KOL, forever',
    free: '30 days',
    holder: 'Unlimited',
  },
  {
    icon: Bell,
    title: 'Custom Alerts',
    desc: 'Get instant Telegram notifications when your favorite KOLs call',
    free: '—',
    holder: 'Unlimited alerts',
  },
  {
    icon: Shield,
    title: 'Wallet Tracker',
    desc: 'Monitor whale & KOL wallets in real-time — see buys and sells as they happen',
    free: '—',
    holder: 'Track 10 wallets',
  },
  {
    icon: Users,
    title: 'Holder Community',
    desc: 'Exclusive Telegram group for XSCAN holders — alpha, networking, early features',
    free: '—',
    holder: 'VIP access',
  },
];

export default function HoldersPage() {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [status, setStatus] = useState<'idle' | 'checking' | 'holder' | 'not-holder' | 'error' | 'not-active'>('idle');
  const [balance, setBalance] = useState(0);
  const [threshold, setThreshold] = useState(100000);
  const [holderToken, setHolderToken] = useState<string | null>(null);
  const [perks, setPerks] = useState<string[]>([]);

  const verifyHolder = useCallback(async () => {
    if (!publicKey) return;
    setStatus('checking');

    try {
      const res = await fetch(`/api/holder/verify?wallet=${publicKey.toBase58()}`);
      const data: VerifyResponse = await res.json();

      if (res.status === 503) {
        setStatus('not-active');
        return;
      }

      setBalance(data.balance);
      setThreshold(data.threshold);

      if (data.isHolder) {
        // Get auth token
        const authRes = await fetch('/api/holder/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet: publicKey.toBase58() }),
        });
        const authData: AuthResponse = await authRes.json();

        if (authData.isHolder) {
          setHolderToken(authData.holderToken);
          setPerks(authData.perks);
          localStorage.setItem('xscan_holder_token', authData.holderToken);
          localStorage.setItem('xscan_holder_expires', authData.expiresAt);
          setStatus('holder');
        }
      } else {
        setStatus('not-holder');
      }
    } catch {
      setStatus('error');
    }
  }, [publicKey]);

  useEffect(() => {
    if (connected && publicKey) {
      verifyHolder();
    } else {
      setStatus('idle');
      setHolderToken(null);
    }
  }, [connected, publicKey, verifyHolder]);

  return (
    <div className="min-h-screen pt-4 pb-20">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 mb-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-4">
            <Crown className="w-4 h-4" />
            <span>Holder Benefits</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Hold <span className="text-primary">$XSCAN</span>, Get the Edge
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            100,000 tokens unlock real-time calls, advanced tools, and exclusive access. 
            While others wait, you trade.
          </p>
        </div>

        {/* Wallet Status Card */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl blur-xl" />
          <div className="relative bg-card border border-border rounded-2xl p-6 sm:p-8">
            {status === 'idle' && !connected && (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Wallet className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Connect your Solana wallet to verify your $XSCAN balance and unlock holder perks.
                </p>
                <button
                  onClick={() => setVisible(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-all hover:shadow-[0_0_30px_rgba(0,255,136,0.3)]"
                >
                  <Wallet className="w-5 h-5" />
                  Connect Wallet
                </button>
              </div>
            )}

            {status === 'checking' && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
                <h3 className="text-lg font-semibold">Verifying Balance...</h3>
                <p className="text-muted-foreground mt-1">Checking your $XSCAN holdings on-chain</p>
              </div>
            )}

            {status === 'holder' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center animate-pulse">
                  <Unlock className="w-8 h-8 text-primary" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-primary text-sm font-semibold">Verified Holder</span>
                </div>
                <h3 className="text-xl font-semibold mb-1">Welcome, Holder 👑</h3>
                <p className="text-muted-foreground mb-1">
                  Balance: <span className="text-white font-mono">{balance.toLocaleString()}</span> $XSCAN
                </p>
                <p className="text-xs text-muted mb-6">
                  All premium features are unlocked. Token refreshes every 24h.
                </p>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
                  <a
                    href="/feed"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/20 transition-all"
                  >
                    <Zap className="w-4 h-4" />
                    Live Feed
                  </a>
                  <a
                    href="/leaderboard"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm font-medium hover:bg-white/[0.06] transition-all"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Leaderboard
                  </a>
                  <a
                    href="https://t.me/+xscan_holders"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm font-medium hover:bg-white/[0.06] transition-all"
                  >
                    <Users className="w-4 h-4" />
                    TG Group
                  </a>
                </div>
              </div>
            )}

            {status === 'not-holder' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warning/10 border border-warning/20 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-warning" />
                </div>
                <h3 className="text-xl font-semibold mb-1">Not Enough $XSCAN</h3>
                <p className="text-muted-foreground mb-1">
                  Balance: <span className="text-white font-mono">{balance.toLocaleString()}</span> / {threshold.toLocaleString()} required
                </p>
                {/* Progress bar */}
                <div className="max-w-xs mx-auto mt-3 mb-5">
                  <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-warning to-primary transition-all"
                      style={{ width: `${Math.min(100, (balance / threshold) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted mt-1.5">
                    {((balance / threshold) * 100).toFixed(1)}% — need {(threshold - balance).toLocaleString()} more
                  </p>
                </div>
                <a
                  href="https://pump.fun"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-all hover:shadow-[0_0_30px_rgba(0,255,136,0.3)]"
                >
                  Buy $XSCAN
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            )}

            {status === 'not-active' && (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/[0.03] border border-border flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-muted" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  The $XSCAN token hasn&apos;t launched yet. Follow us for announcements.
                </p>
                <a
                  href="https://twitter.com/XScan_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 text-primary text-sm hover:underline"
                >
                  Follow @XScan_ <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center py-6">
                <XCircle className="w-12 h-12 mx-auto mb-3 text-danger" />
                <h3 className="text-lg font-semibold mb-1">Verification Failed</h3>
                <p className="text-muted-foreground mb-4">Something went wrong. Please try again.</p>
                <button
                  onClick={verifyHolder}
                  className="px-5 py-2.5 rounded-xl bg-white/[0.06] border border-border font-medium hover:bg-white/[0.1] transition-all"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Perks Grid */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-6 text-center">What Holders Get</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PERKS.map((perk) => {
              const Icon = perk.icon;
              const unlocked = status === 'holder';
              return (
                <div
                  key={perk.title}
                  className={`relative p-5 rounded-xl border transition-all ${
                    unlocked
                      ? 'bg-primary/[0.03] border-primary/20'
                      : 'bg-card border-border'
                  }`}
                >
                  {unlocked && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                    unlocked ? 'bg-primary/10' : 'bg-white/[0.03]'
                  }`}>
                    <Icon className={`w-5 h-5 ${unlocked ? 'text-primary' : 'text-muted'}`} />
                  </div>
                  <h3 className="font-semibold mb-1">{perk.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{perk.desc}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="px-2 py-0.5 rounded bg-white/[0.04] text-muted-foreground">
                      Free: {perk.free}
                    </span>
                    <ChevronRight className="w-3 h-3 text-muted" />
                    <span className={`px-2 py-0.5 rounded ${
                      unlocked ? 'bg-primary/15 text-primary' : 'bg-white/[0.04] text-muted-foreground'
                    }`}>
                      Holder: {perk.holder}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-6 text-center">FAQ</h2>
          <div className="space-y-3">
            {[
              {
                q: 'How do I become a holder?',
                a: 'Buy at least 100,000 $XSCAN tokens on pump.fun and connect your wallet here to verify.',
              },
              {
                q: 'How long does access last?',
                a: 'Your holder token is valid for 24 hours. Just revisit this page to refresh it. As long as you hold the tokens, you keep access.',
              },
              {
                q: 'What happens if I sell my tokens?',
                a: 'Your current session stays active until it expires (24h). After that, you\'ll need to re-verify. If your balance drops below 100k, premium access stops.',
              },
              {
                q: 'Is the 5-minute delay on all calls?',
                a: 'Yes — free users see all KOL and channel calls with a 5-minute delay. Holders see them the moment they\'re detected.',
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group bg-card border border-border rounded-xl overflow-hidden"
              >
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-medium hover:bg-card-hover transition-colors">
                  {item.q}
                  <ChevronRight className="w-4 h-4 text-muted transition-transform group-open:rotate-90" />
                </summary>
                <p className="px-5 pb-4 text-sm text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
