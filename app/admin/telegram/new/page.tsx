'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { ArrowLeft, Save, AlertCircle, Search, Loader2 } from 'lucide-react';

interface FormData {
  channel_username: string;
  channel_name: string;
  description: string;
  channel_image_url: string;
}

export default function NewTelegramChannelPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);

  const [formData, setFormData] = useState<FormData>({
    channel_username: '',
    channel_name: '',
    description: '',
    channel_image_url: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleScanChannel = async () => {
    if (!formData.channel_username) {
      setError('Please enter a channel username');
      return;
    }

    setError(null);
    setIsScanning(true);
    setScanResult(null);

    try {
      const response = await fetch('/api/admin/telegram/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_username: formData.channel_username.replace('@', ''),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scan channel');
      }

      setScanResult(data);

      // Auto-fill form with channel info
      if (data.channelInfo) {
        setFormData((prev) => ({
          ...prev,
          channel_name: data.channelInfo.title || prev.channel_name,
          description: data.channelInfo.about || prev.description,
          channel_image_url: data.channelInfo.photo || prev.channel_image_url,
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan channel');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/telegram/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_username: formData.channel_username.replace('@', ''),
          channel_name: formData.channel_name || null,
          description: formData.description || null,
          channel_image_url: formData.channel_image_url || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add channel');
      }

      router.push('/admin/telegram');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add channel');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Link
        href="/admin/telegram"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Telegram Channels
      </Link>

      <h1 className="text-2xl font-bold mb-6">Add Telegram Channel</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="channel_username"
                    name="channel_username"
                    label="Channel Username *"
                    placeholder="@channel or channel"
                    value={formData.channel_username}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="pt-6">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleScanChannel}
                    disabled={isScanning || !formData.channel_username}
                  >
                    {isScanning ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Input
                id="channel_name"
                name="channel_name"
                label="Channel Name"
                placeholder="Channel display name"
                value={formData.channel_name}
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

              <Input
                id="channel_image_url"
                name="channel_image_url"
                label="Image URL"
                placeholder="https://..."
                value={formData.channel_image_url}
                onChange={handleChange}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" isLoading={isSubmitting}>
                <Save className="w-4 h-4 mr-2" />
                Add Channel
              </Button>
              <Link href="/admin/telegram">
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </Card>

        {/* Scan Results */}
        {scanResult && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Scan Results</h3>

            {scanResult.channelInfo && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {scanResult.channelInfo.photo && (
                    <img
                      src={scanResult.channelInfo.photo}
                      alt={scanResult.channelInfo.title}
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div>
                    <div className="font-medium">{scanResult.channelInfo.title}</div>
                    <div className="text-sm text-muted-foreground">
                      @{scanResult.channelInfo.username}
                    </div>
                  </div>
                </div>

                {scanResult.channelInfo.about && (
                  <p className="text-sm text-muted-foreground">
                    {scanResult.channelInfo.about}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Members:</span>{' '}
                    <span className="font-medium">
                      {scanResult.channelInfo.participantsCount?.toLocaleString() || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Messages Scanned:</span>{' '}
                    <span className="font-medium">{scanResult.messagesScanned || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Contracts Found:</span>{' '}
                    <span className="font-medium">{scanResult.contractsFound || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {!scanResult.channelInfo && (
              <p className="text-muted-foreground text-sm">
                Could not fetch channel info. The channel may be private or not exist.
              </p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
