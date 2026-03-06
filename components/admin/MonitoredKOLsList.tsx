'use client';

import { useState } from 'react';
import { Bot, Clock, RefreshCw } from 'lucide-react';

interface KOL {
  id: string;
  twitter_handle: string;
  display_name: string | null;
  is_auto_monitored: boolean;
  last_scan_at: string | null;
}

interface Props {
  initialKols: KOL[];
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function MonitoredKOLsList({ initialKols }: Props) {
  const [kols, setKols] = useState<KOL[]>(initialKols);
  const [loading, setLoading] = useState<string | null>(null);

  const toggleMonitoring = async (kolId: string, currentStatus: boolean) => {
    setLoading(kolId);

    try {
      const response = await fetch(`/api/automation/kol/${kolId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_auto_monitored: !currentStatus }),
      });

      if (response.ok) {
        setKols(prev =>
          prev.map(kol =>
            kol.id === kolId
              ? { ...kol, is_auto_monitored: !currentStatus }
              : kol
          )
        );
      }
    } catch (error) {
      console.error('Failed to toggle monitoring:', error);
    } finally {
      setLoading(null);
    }
  };

  if (kols.length === 0) {
    return <p className="text-muted-foreground text-sm">No KOLs added yet</p>;
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto">
      {kols.map((kol) => (
        <div
          key={kol.id}
          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              kol.is_auto_monitored ? 'bg-cyan-500/20' : 'bg-muted'
            }`}>
              <Bot className={`w-4 h-4 ${
                kol.is_auto_monitored ? 'text-cyan-500' : 'text-muted-foreground'
              }`} />
            </div>
            <div>
              <p className="font-medium text-sm">
                @{kol.twitter_handle}
              </p>
              {kol.is_auto_monitored && kol.last_scan_at && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimeAgo(kol.last_scan_at)}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => toggleMonitoring(kol.id, kol.is_auto_monitored)}
            disabled={loading === kol.id}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              kol.is_auto_monitored ? 'bg-cyan-500' : 'bg-muted-foreground/30'
            } ${loading === kol.id ? 'opacity-50' : ''}`}
          >
            {loading === kol.id ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCw className="w-3 h-3 animate-spin" />
              </div>
            ) : (
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  kol.is_auto_monitored ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
