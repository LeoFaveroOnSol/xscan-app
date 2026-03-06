'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { truncateAddress } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface WalletButtonProps {
  className?: string;
}

export default function WalletButton({ className }: WalletButtonProps) {
  const { publicKey, disconnect, connecting, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setShowDropdown(false);
  };

  if (!connected || !publicKey) {
    return (
      <button
        onClick={() => setVisible(true)}
        disabled={connecting}
        className={cn(
          'flex items-center gap-1.5 h-8 px-3 text-[13px] font-medium rounded-lg transition-all',
          'border border-primary/30 bg-primary/10 text-primary',
          'hover:bg-primary/20 hover:shadow-[0_0_15px_rgba(0,255,136,0.2)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
      >
        <Wallet className="w-3.5 h-3.5" />
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={cn(
          'flex items-center gap-1.5 h-8 px-3 text-[13px] font-medium rounded-lg transition-all',
          'border border-white/[0.06] bg-white/[0.02]',
          'hover:border-white/[0.1] hover:bg-white/[0.04]',
          className
        )}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span className="font-mono text-[13px]">{truncateAddress(publicKey.toBase58())}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showDropdown && 'rotate-180')} />
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden animate-fadeIn">
          <div className="p-3 border-b border-border">
            <p className="text-xs text-muted mb-1">Connected Wallet</p>
            <p className="font-mono text-sm">{truncateAddress(publicKey.toBase58(), 6, 6)}</p>
          </div>

          <div className="p-1">
            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-card-hover rounded-md transition-colors"
            >
              <Copy className="w-4 h-4 text-muted" />
              {copied ? 'Copied!' : 'Copy Address'}
            </button>

            <a
              href={`https://solscan.io/account/${publicKey.toBase58()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-card-hover rounded-md transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-muted" />
              View on Solscan
            </a>

            <button
              onClick={handleDisconnect}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-danger hover:bg-danger-muted rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
