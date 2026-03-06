'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { ArrowLeft, Save, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import type { KOL } from '@/types/database';

interface FormData {
  kol_id: string;
  token_address: string;
  token_symbol: string;
  entry_market_cap: string;
  entry_timestamp: string;
  tweet_url: string;
  notes: string;
}

export default function EditCallPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [kols, setKols] = useState<KOL[]>([]);

  const [formData, setFormData] = useState<FormData>({
    kol_id: '',
    token_address: '',
    token_symbol: '',
    entry_market_cap: '',
    entry_timestamp: '',
    tweet_url: '',
    notes: '',
  });

  // Fetch KOLs for dropdown
  useEffect(() => {
    async function fetchKOLs() {
      try {
        const response = await fetch('/api/kols');
        const data = await response.json();
        setKols(data.kols || []);
      } catch (err) {
        console.error('Error fetching KOLs:', err);
      }
    }
    fetchKOLs();
  }, []);

  // Fetch Call data
  useEffect(() => {
    async function fetchCall() {
      try {
        const response = await fetch(`/api/admin/calls/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch call');
        }

        const call = data.call;
        setFormData({
          kol_id: call.kol_id || '',
          token_address: call.token_address || '',
          token_symbol: call.token_symbol || '',
          entry_market_cap: call.entry_market_cap?.toString() || '',
          entry_timestamp: call.entry_timestamp
            ? new Date(call.entry_timestamp).toISOString().slice(0, 16)
            : '',
          tweet_url: call.tweet_url || '',
          notes: call.notes || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load call');
      } finally {
        setIsLoading(false);
      }
    }
    fetchCall();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.kol_id) {
      setError('Please select a KOL');
      return;
    }

    if (!formData.token_address) {
      setError('Token address is required');
      return;
    }

    if (!formData.entry_market_cap) {
      setError('Entry market cap is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/calls/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kol_id: formData.kol_id,
          token_address: formData.token_address,
          token_symbol: formData.token_symbol || null,
          entry_market_cap: parseFloat(formData.entry_market_cap),
          entry_timestamp: formData.entry_timestamp
            ? new Date(formData.entry_timestamp).toISOString()
            : new Date().toISOString(),
          tweet_url: formData.tweet_url || null,
          notes: formData.notes || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update call');
      }

      router.push('/admin/calls');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update call');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/calls/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete call');
      }

      router.push('/admin/calls');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete call');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin/calls"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Calls
      </Link>

      <h1 className="text-2xl font-bold mb-6">Edit Call</h1>

      <Card className="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-danger-muted text-danger rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Select KOL *
            </label>
            <select
              name="kol_id"
              value={formData.kol_id}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            >
              <option value="">Select a KOL</option>
              {kols.map((kol) => (
                <option key={kol.id} value={kol.id}>
                  {kol.display_name || kol.twitter_handle} (@{kol.twitter_handle})
                </option>
              ))}
            </select>
          </div>

          <Input
            id="token_address"
            name="token_address"
            label="Token Address (CA) *"
            placeholder="Solana token address"
            value={formData.token_address}
            onChange={handleChange}
            required
          />

          <Input
            id="token_symbol"
            name="token_symbol"
            label="Token Symbol"
            placeholder="e.g., BONK"
            value={formData.token_symbol}
            onChange={handleChange}
          />

          <Input
            id="entry_market_cap"
            name="entry_market_cap"
            label="Entry Market Cap (USD) *"
            placeholder="e.g., 50000"
            type="number"
            step="0.01"
            value={formData.entry_market_cap}
            onChange={handleChange}
            required
          />

          <Input
            id="entry_timestamp"
            name="entry_timestamp"
            label="Entry Date/Time"
            type="datetime-local"
            value={formData.entry_timestamp}
            onChange={handleChange}
          />

          <Input
            id="tweet_url"
            name="tweet_url"
            label="Tweet URL"
            placeholder="https://x.com/..."
            value={formData.tweet_url}
            onChange={handleChange}
          />

          <Textarea
            id="notes"
            name="notes"
            label="Notes"
            placeholder="Any additional notes..."
            rows={3}
            value={formData.notes}
            onChange={handleChange}
          />

          <div className="flex gap-4">
            <Button type="submit" isLoading={isSubmitting}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
            <Link href="/admin/calls">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
          </div>
        </form>

        {/* Delete Section */}
        <div className="mt-8 pt-6 border-t border-border">
          <h3 className="text-lg font-semibold text-danger mb-2">Danger Zone</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Deleting this call is permanent and cannot be undone.
          </p>

          {!showDeleteConfirm ? (
            <Button
              type="button"
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Call
            </Button>
          ) : (
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                isLoading={isDeleting}
              >
                Confirm Delete
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
