'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { RefreshCw, Zap, DollarSign, ImageIcon, MessageCircle, Plus, History, ChevronDown, Calculator } from 'lucide-react';

interface TelegramChannel {
  id: string;
  channel_username: string;
  display_name: string | null;
  full_history_scanned: boolean;
}

export default function AutomationControls() {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [channels, setChannels] = useState<TelegramChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);

  // Fetch channels on mount
  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const response = await fetch('/api/admin/telegram/channels');
      const data = await response.json();
      if (data.channels) {
        setChannels(data.channels);
      }
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    }
  };

  const triggerScan = async (type: 'tweets' | 'prices' | 'images' | 'telegram' | 'telegram-seed' | 'telegram-prices' | 'telegram-images' | 'telegram-backfill' | 'telegram-backfill-evm' | 'telegram-recalculate' | 'all') => {
    setLoading(type);
    setResult(null);

    try {
      // Handle different scan types
      if (type === 'images') {
        const response = await fetch('/api/cron/update-images', {
          method: 'POST',
        });
        const data = await response.json();
        setResult(data);
      } else if (type === 'telegram') {
        const response = await fetch('/api/cron/scan-telegram', {
          method: 'POST',
        });
        const data = await response.json();
        setResult(data);
      } else if (type === 'telegram-seed') {
        const response = await fetch('/api/admin/telegram/seed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const data = await response.json();
        setResult(data);
      } else if (type === 'telegram-prices') {
        const response = await fetch('/api/cron/update-telegram-prices', {
          method: 'POST',
        });
        const data = await response.json();
        setResult(data);
      } else if (type === 'telegram-images') {
        const response = await fetch('/api/cron/update-telegram-images', {
          method: 'POST',
        });
        const data = await response.json();
        setResult(data);
      } else if (type === 'telegram-backfill') {
        const url = selectedChannel === 'all'
          ? '/api/telegram/backfill-entry-prices'
          : `/api/telegram/backfill-entry-prices?channel_id=${selectedChannel}`;
        const response = await fetch(url, {
          method: 'POST',
        });
        const data = await response.json();
        setResult(data);
      } else if (type === 'telegram-backfill-evm') {
        const url = selectedChannel === 'all'
          ? '/api/telegram/backfill-evm'
          : `/api/telegram/backfill-evm?channel_id=${selectedChannel}`;
        const response = await fetch(url, {
          method: 'POST',
        });
        const data = await response.json();
        setResult(data);
      } else if (type === 'telegram-recalculate') {
        const url = selectedChannel === 'all'
          ? '/api/telegram/recalculate-stats'
          : `/api/telegram/recalculate-stats?channel_id=${selectedChannel}`;
        const response = await fetch(url, {
          method: 'POST',
        });
        const data = await response.json();
        setResult(data);
      } else {
        const response = await fetch('/api/automation/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type }),
        });
        const data = await response.json();
        setResult(data);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setResult({ error: `Failed to trigger scan: ${msg}` });
    } finally {
      setLoading(null);
    }
  };

  const getSelectedChannelName = () => {
    if (selectedChannel === 'all') return 'All Channels';
    const channel = channels.find(c => c.id === selectedChannel);
    return channel ? `@${channel.channel_username}` : 'Select Channel';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => triggerScan('tweets')}
          disabled={loading !== null}
          className="gap-2"
        >
          {loading === 'tweets' ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          Scan Tweets
        </Button>

        <Button
          variant="outline"
          onClick={() => triggerScan('prices')}
          disabled={loading !== null}
          className="gap-2"
        >
          {loading === 'prices' ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <DollarSign className="w-4 h-4" />
          )}
          Update Prices
        </Button>

        <Button
          variant="outline"
          onClick={() => triggerScan('images')}
          disabled={loading !== null}
          className="gap-2"
        >
          {loading === 'images' ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <ImageIcon className="w-4 h-4" />
          )}
          Update Images
        </Button>

        <Button
          variant="secondary"
          onClick={() => triggerScan('all')}
          disabled={loading !== null}
          className="gap-2"
        >
          {loading === 'all' ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Run All
        </Button>
      </div>

      {/* Telegram Section */}
      <div className="pt-4 border-t border-border/50">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Telegram Channels</h4>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => triggerScan('telegram-seed')}
            disabled={loading !== null}
            className="gap-2"
          >
            {loading === 'telegram-seed' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Seed Channels
          </Button>

          <Button
            onClick={() => triggerScan('telegram')}
            disabled={loading !== null}
            className="gap-2"
          >
            {loading === 'telegram' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <MessageCircle className="w-4 h-4" />
            )}
            Scan Telegram
          </Button>

          <Button
            variant="outline"
            onClick={() => triggerScan('telegram-prices')}
            disabled={loading !== null}
            className="gap-2"
          >
            {loading === 'telegram-prices' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <DollarSign className="w-4 h-4" />
            )}
            Update TG Prices
          </Button>

          <Button
            variant="outline"
            onClick={() => triggerScan('telegram-images')}
            disabled={loading !== null}
            className="gap-2"
          >
            {loading === 'telegram-images' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <ImageIcon className="w-4 h-4" />
            )}
            Update TG Images
          </Button>
        </div>

        {/* Backfill Section with Channel Selector */}
        <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-medium">Backfill Prices</h5>
            {/* Channel Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowChannelDropdown(!showChannelDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-background border border-border hover:bg-muted transition-colors"
              >
                <span className="max-w-[150px] truncate">{getSelectedChannelName()}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showChannelDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showChannelDropdown && (
                <div className="absolute right-0 top-full mt-1 w-[200px] max-h-[300px] overflow-y-auto rounded-lg bg-background border border-border shadow-lg z-10">
                  <button
                    onClick={() => {
                      setSelectedChannel('all');
                      setShowChannelDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${
                      selectedChannel === 'all' ? 'bg-primary/10 text-primary' : ''
                    }`}
                  >
                    All Channels
                  </button>
                  {channels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => {
                        setSelectedChannel(channel.id);
                        setShowChannelDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between ${
                        selectedChannel === channel.id ? 'bg-primary/10 text-primary' : ''
                      }`}
                    >
                      <span className="truncate">@{channel.channel_username}</span>
                      {!channel.full_history_scanned && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500">new</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() => triggerScan('telegram-backfill')}
              disabled={loading !== null}
              className="gap-2"
            >
              {loading === 'telegram-backfill' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <History className="w-4 h-4" />
              )}
              Backfill SOL
            </Button>

            <Button
              variant="outline"
              onClick={() => triggerScan('telegram-backfill-evm')}
              disabled={loading !== null}
              className="gap-2 border-orange-500/50 text-orange-500 hover:bg-orange-500/10"
            >
              {loading === 'telegram-backfill-evm' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <History className="w-4 h-4" />
              )}
              Backfill BSC/Base
            </Button>

            <Button
              variant="outline"
              onClick={() => triggerScan('telegram-recalculate')}
              disabled={loading !== null}
              className="gap-2 border-green-500/50 text-green-500 hover:bg-green-500/10"
            >
              {loading === 'telegram-recalculate' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Calculator className="w-4 h-4" />
              )}
              Recalc Stats
            </Button>
          </div>

          {selectedChannel !== 'all' && (
            <p className="text-xs text-muted-foreground mt-2">
              Backfill will only run for: {getSelectedChannelName()}
            </p>
          )}
        </div>
      </div>

      {result && (
        <div className={`p-4 rounded-lg text-sm ${
          result.error ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
        }`}>
          <pre className="whitespace-pre-wrap overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
