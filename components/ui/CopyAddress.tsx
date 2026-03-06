'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { truncateAddress } from '@/lib/utils/formatters';
import { Copy, Check } from 'lucide-react';

interface CopyAddressProps {
  address: string;
  showFull?: boolean;
  startChars?: number;
  endChars?: number;
  className?: string;
}

export default function CopyAddress({
  address,
  showFull = false,
  startChars = 4,
  endChars = 4,
  className,
}: CopyAddressProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayAddress = showFull ? address : truncateAddress(address, startChars, endChars);

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-1.5 font-mono text-sm text-muted-foreground hover:text-foreground transition-colors',
        className
      )}
      title={address}
    >
      <span>{displayAddress}</span>
      {copied ? (
        <Check className="w-3.5 h-3.5 text-success" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
