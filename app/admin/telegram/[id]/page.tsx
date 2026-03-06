'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { ArrowLeft, Save, AlertCircle, Loader2, RefreshCw, Trash2, History } from 'lucide-react';

interface ChannelData {
  id: string;
  channel_username: string;
  display_name: string | null;
  description: string | null;
  profile_image_url: string | null;
  member_count: number;
  total_calls: number;
  winning_calls: number;
  winrate: number;
  avg_multiplier: number;
  best_multiplier: number;
  is_active: boolean;
  is_auto_monitored: boolean;
  full_history_scanned: boolean;
  last_scanned_message_id: number | null;
  last_scan_at: string | null;
  created_at: string;
}

export default function EditTelegramChannelPage() {
  const router = useRouter();
  const params = useParams();
  const channelId = params.id as string;

  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    display_name: '',
    description: '',
    is_active: true,
    is_auto_monitored: true,
  });

  useEffect(() => {
    fetchChannel();
  }, [channelId]);

  const fetchChannel = async () => {
    try {
      const response = await fetch(`/api/admin/telegram/channels/${channelId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch channel');
      }

      setChannel(data.channel);
      setFormData({
        display_name: data.channel.display_name || '',
        description: data.channel.description || '',
        is_active: data.channel.is_active,
        is_auto_monitored: data.channel.is_auto_monitored,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch channel');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/telegram/channels/${channelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update channel');
      }

      setSuccess('Channel updated successfully');
      setChannel(data.channel);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update channel');
    } finally {
      setIsSaving(false);
    }
  };

  const handleForceFullScan = async () => {
    if (!confirm('This will reset the scan history and scan ALL messages from this channel. This may take a while. Continue?')) {
      return;
    }

    setError(null);
    setSuccess(null);
    setIsScanning(true);

    try {
      const response = await fetch(`/api/admin/telegram/channels/${channelId}/rescan`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger rescan');
      }

      setSuccess(`Full scan triggered. Found ${data.contractsFound} contracts in ${data.messagesScanned} messages. ${data.callsCreated} new calls created.`);
      fetchChannel(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger rescan');
    } finally {
      setIsScanning(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this channel? This will also delete all associated calls. This action cannot be undone.')) {
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/telegram/channels/${channelId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete channel');
      }

      router.push('/admin/telegram');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete channel');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Channel not found</p>
        <Link href="/admin/telegram" className="text-primary hover:underline mt-2 inline-block">
          Back to Telegram Channels
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin/telegram"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Telegram Channels
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Avatar
            src={channel.profile_image_url}
            alt={channel.display_name || channel.channel_username}
            size="lg"
          />
          <div>
            <h1 className="text-2xl font-bold">{channel.display_name || channel.channel_username}</h1>
            <a
              href={`https://t.me/${channel.channel_username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary"
            >
              @{channel.channel_username}
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {channel.full_history_scanned ? (
            <Badge variant="success">Full Scan Complete</Badge>
          ) : (
            <Badge variant="warning">Pending Full Scan</Badge>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-500/10 text-green-500 rounded-lg mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="font-semibold mb-4">Channel Details</h3>

          <div className="space-y-4">
            <Input
              id="channel_username"
              name="channel_username"
              label="Channel Username"
              value={channel.channel_username}
              disabled
            />

            <Input
              id="display_name"
              name="display_name"
              label="Display Name"
              placeholder="Channel display name"
              value={formData.display_name}
              onChange={handleChange}
            />

            <Textarea
              id="description"
              name="description"
              label="Description"
              placeholder="Channel description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
            />

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-border"
                />
                <span>Active</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_auto_monitored"
                  checked={formData.is_auto_monitored}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-border"
                />
                <span>Auto-Monitored</span>
              </label>
            </div>
          </div>

          <div className="flex gap-4 mt-6 pt-6 border-t border-border">
            <Button onClick={handleSave} isLoading={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Channel
            </Button>
          </div>
        </Card>

        {/* Stats & Actions */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Calls</span>
                <span className="font-medium">{channel.total_calls}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Winning Calls</span>
                <span className="font-medium text-green-500">{channel.winning_calls}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Winrate</span>
                <span className="font-medium">{channel.winrate?.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Multiplier</span>
                <span className="font-medium">{channel.avg_multiplier?.toFixed(2)}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Best Multiplier</span>
                <span className="font-medium text-yellow-500">{channel.best_multiplier?.toFixed(2)}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Members</span>
                <span className="font-medium">{channel.member_count?.toLocaleString()}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Scan Actions</h3>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                <p>Last Scan: {channel.last_scan_at ? new Date(channel.last_scan_at).toLocaleString() : 'Never'}</p>
                <p>Last Message ID: {channel.last_scanned_message_id || 'N/A'}</p>
                <p>Full History: {channel.full_history_scanned ? 'Yes' : 'No'}</p>
              </div>

              <Button
                variant="secondary"
                className="w-full"
                onClick={handleForceFullScan}
                disabled={isScanning}
              >
                {isScanning ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <History className="w-4 h-4 mr-2" />
                )}
                {isScanning ? 'Scanning...' : 'Force Full Scan'}
              </Button>
              <p className="text-xs text-muted-foreground">
                This will reset the scan history and scan ALL messages from this channel.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
