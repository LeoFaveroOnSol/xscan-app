"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

interface LockedSectionProps {
  requiredAmount: number;
  tokenSymbol: string;
  buyLink?: string;
  children: React.ReactNode;
}

export default function LockedSection({
  requiredAmount,
  tokenSymbol,
  buyLink = "/docs/token",
  children,
}: LockedSectionProps) {
  // TODO: Implement actual token balance checking when $XSCAN launches
  // For now, always show locked state
  
  return (
    <div className="relative">
      {/* Blurred Content */}
      <div className="blur-[6px] pointer-events-none select-none">
        {children}
      </div>

      {/* Lock Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-2xl border border-border/50">
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          {/* Lock Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(0,255,136,0.15)]">
            <Lock className="w-8 h-8 text-primary" />
          </div>

          {/* Text */}
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">
              Hold {requiredAmount.toLocaleString()} {tokenSymbol} to unlock
            </h3>
            <p className="text-sm text-muted-foreground">
              Connect wallet to verify holdings
            </p>
          </div>

          {/* Buy Button */}
          <Link
            href={buyLink}
            className="mt-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-black font-semibold text-sm hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all duration-300 hover:-translate-y-0.5"
          >
            Buy {tokenSymbol}
          </Link>
        </div>
      </div>
    </div>
  );
}
