'use client';

import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

interface Props {
  handle: string;
  compact?: boolean;
}

export default function DeletionRateBadge({ handle, compact = true }: Props) {
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/kols/${handle}/deleted-tweets`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.deletionRate !== undefined) setRate(data.deletionRate);
      })
      .catch(() => {});
  }, [handle]);

  if (rate === null) return null;

  const color = rate < 10 ? 'text-green-400 bg-green-500/15 border-green-500/20'
    : rate <= 30 ? 'text-yellow-400 bg-yellow-500/15 border-yellow-500/20'
    : 'text-red-400 bg-red-500/15 border-red-500/20';

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${color}`}
        title={`${rate}% of CA tweets deleted`}
      >
        <Trash2 className="w-2.5 h-2.5" />
        {rate}%
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border ${color}`}>
      <Trash2 className="w-3 h-3" />
      {rate}% deleted
    </span>
  );
}
