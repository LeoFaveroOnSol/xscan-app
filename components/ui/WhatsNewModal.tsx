'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Sparkles, TrendingUp, Bell, BarChart3, Globe, Zap } from 'lucide-react';

// ===== CONFIGURE NEW FEATURES HERE =====
const CURRENT_VERSION = '2.0';

interface Feature {
  icon: React.ReactNode;
  tag?: string;
  tagColor?: string;
  title: string;
  description: string;
  preview?: string; // optional image/gif URL
}

const features: Feature[] = [
  {
    icon: <Sparkles className="w-8 h-8" />,
    tag: 'NEW',
    tagColor: 'bg-primary/20 text-primary',
    title: 'XSCAN v2.0 is here',
    description: 'We completely revamped the platform. New design, new features, and way more data to help you find the best calls before everyone else.',
  },
  {
    icon: <Globe className="w-8 h-8" />,
    tag: 'TELEGRAM',
    tagColor: 'bg-blue-500/20 text-blue-400',
    title: 'Telegram Channel Tracking',
    description: 'We now track 20+ Telegram alpha channels in real-time. See which channels call winners consistently — not just Twitter KOLs.',
  },
  {
    icon: <BarChart3 className="w-8 h-8" />,
    tag: 'DATA',
    tagColor: 'bg-purple-500/20 text-purple-400',
    title: 'Token Explorer',
    description: 'Browse all tokens called across KOLs and Telegram channels. See who called first, entry market cap, ATH multiplier, and current performance — all in one place.',
  },
  {
    icon: <TrendingUp className="w-8 h-8" />,
    tag: 'SCORES',
    tagColor: 'bg-yellow-500/20 text-yellow-400',
    title: 'Revamped XSCAN Score',
    description: 'Our scoring algorithm now factors in win rate, average multiplier, call frequency, and consistency. The leaderboard actually means something now.',
  },
  {
    icon: <Bell className="w-8 h-8" />,
    tag: 'ALERTS',
    tagColor: 'bg-red-500/20 text-red-400',
    title: 'Real-time Alerts Bot',
    description: 'Get instant Telegram alerts when top KOLs or channels make a new call. Join @xscancalls to never miss an alpha call again.',
  },
  {
    icon: <Zap className="w-8 h-8" />,
    tag: 'SOON',
    tagColor: 'bg-orange-500/20 text-orange-400',
    title: 'More coming...',
    description: 'Wallet tracking, KOL comparison tools, portfolio PNL cards, and API access. We\'re just getting started. Follow @XScan_ for updates.',
  },
];
// ========================================

export default function WhatsNewModal() {
  const [open, setOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('xscan-whats-new');
    if (seen !== CURRENT_VERSION) {
      // Small delay so page loads first
      const t = setTimeout(() => setOpen(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = useCallback(() => {
    setOpen(false);
    localStorage.setItem('xscan-whats-new', CURRENT_VERSION);
  }, []);

  const goTo = useCallback((next: number) => {
    if (animating) return;
    setDirection(next > slide ? 'right' : 'left');
    setAnimating(true);
    setTimeout(() => {
      setSlide(next);
      setAnimating(false);
    }, 200);
  }, [slide, animating]);

  const next = useCallback(() => {
    if (slide < features.length - 1) goTo(slide + 1);
    else dismiss();
  }, [slide, goTo, dismiss]);

  const prev = useCallback(() => {
    if (slide > 0) goTo(slide - 1);
  }, [slide, goTo]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, next, prev, dismiss]);

  if (!open) return null;

  const f = features[slide];
  const isLast = slide === features.length - 1;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fadeIn"
        onClick={dismiss}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#111113] border border-[#1a1a1f] rounded-2xl shadow-2xl shadow-primary/5 animate-slideUp overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="relative p-8 pt-10">
          {/* Version badge */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">What&apos;s New</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              v{CURRENT_VERSION}
            </span>
          </div>

          {/* Slide content */}
          <div
            className={`transition-all duration-200 ${
              animating
                ? `opacity-0 ${direction === 'right' ? 'translate-x-4' : '-translate-x-4'}`
                : 'opacity-100 translate-x-0'
            }`}
          >
            {/* Icon + Tag */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                {f.icon}
              </div>
              {f.tag && (
                <span className={`text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-full ${f.tagColor}`}>
                  {f.tag}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-white mb-3">
              {f.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-zinc-400 leading-relaxed mb-2">
              {f.description}
            </p>

            {/* Preview image (optional) */}
            {f.preview && (
              <div className="mt-4 rounded-xl overflow-hidden border border-[#1a1a1f]">
                <img src={f.preview} alt={f.title} className="w-full" />
              </div>
            )}
          </div>
        </div>

        {/* Footer: dots + navigation */}
        <div className="relative px-8 pb-6 flex items-center justify-between">
          {/* Dots */}
          <div className="flex gap-1.5">
            {features.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === slide
                    ? 'w-6 bg-primary'
                    : 'w-1.5 bg-zinc-700 hover:bg-zinc-500'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {slide > 0 && (
              <button
                onClick={prev}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={next}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                isLast
                  ? 'bg-primary text-black hover:bg-primary/90'
                  : 'bg-white/5 text-white hover:bg-white/10'
              }`}
            >
              {isLast ? 'Get Started' : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Skip link */}
        <div className="px-8 pb-5 text-center">
          <button
            onClick={dismiss}
            className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Skip — don&apos;t show again
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>
    </div>
  );
}
