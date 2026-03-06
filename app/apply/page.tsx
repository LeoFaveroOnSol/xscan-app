import type { Metadata } from 'next';
import ApplicationForm from '@/components/forms/ApplicationForm';
import { TrendingUp, BadgeCheck, Shield, MessageSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Apply - XSCAN',
  description: 'Apply to become a tracked KOL or register your Telegram channel on XSCAN.',
};

export default function ApplyPage() {
  return (
    <div className="min-h-screen bg-[#09090b] relative">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/[0.015] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/[0.01] rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-[600px] mx-auto px-4 sm:px-6 py-12">
        {/* Gradient accent line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        {/* Hero Section */}
        <div className="text-center mb-10 pt-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">
            Join <span className="text-primary">XSCAN</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Get your calls tracked. Build your reputation on-chain.
          </p>
        </div>

        {/* Benefits - Compact badges with glow */}
        <div className="flex items-center justify-center gap-2 mb-10 flex-wrap">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-xs text-primary font-medium whitespace-nowrap shadow-[0_0_10px_rgba(0,255,136,0.15)] hover:shadow-[0_0_15px_rgba(0,255,136,0.25)] transition-shadow duration-300">
            <TrendingUp className="w-3 h-3" />
            Featured
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-xs text-primary font-medium whitespace-nowrap shadow-[0_0_10px_rgba(0,255,136,0.15)] hover:shadow-[0_0_15px_rgba(0,255,136,0.25)] transition-shadow duration-300">
            <BadgeCheck className="w-3 h-3" />
            Verified
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-xs text-primary font-medium whitespace-nowrap shadow-[0_0_10px_rgba(0,255,136,0.15)] hover:shadow-[0_0_15px_rgba(0,255,136,0.25)] transition-shadow duration-300">
            <Shield className="w-3 h-3" />
            On-chain
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-xs text-primary font-medium whitespace-nowrap shadow-[0_0_10px_rgba(0,255,136,0.15)] hover:shadow-[0_0_15px_rgba(0,255,136,0.25)] transition-shadow duration-300">
            <MessageSquare className="w-3 h-3" />
            Telegram
          </span>
        </div>

        {/* Application Form */}
        <ApplicationForm />
      </div>
    </div>
  );
}
