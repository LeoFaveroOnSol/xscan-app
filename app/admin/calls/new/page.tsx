'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { ArrowLeft, Save, AlertCircle, Search, Loader2 } from 'lucide-react';
import type { KOL, TokenData } from '@/types/database';

interface FormData {
  kol_id: string;
  token_address: string;
  entry_market_cap: string;
  entry_timestamp: string;
  tweet_url: string;
  notes: string;
}

export default function NewCallPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingToken, setIsFetchingToken] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kols, setKols] = useState<KOL[]>([]);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);

  const [formData, setFormData] = useState<FormData>({
    kol_id: '',
    token_address: '',
    entry_market_cap: '',
    entry_timestamp: new Date().toISOString().slice(0, 16),
    tweet_url: '',
    notes: '',
  });

  // Fetch KOLs on mount
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const fetchTokenData = async () => {
    if (!formData.token_address || formData.token_address.length < 32) {
      return;
    }

    setIsFetchingToken(true);
    try {
      const response = await fetch(`/api/tokens/${formData.token_address}`);
      const data = await response.json();

      if (response.ok && data.token) {
        setTokenData(data.token);
        // Auto-fill market cap if empty
        if (!formData.entry_market_cap && data.token.marketCap) {
          setFormData((prev) => ({
            ...prev,
            entry_market_cap: data.token.marketCap.toString(),
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching token data:', err);
    } finally {
      setIsFetchingToken(false);
    }
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
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kol_id: formData.kol_id,
          token_address: formData.token_address,
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
        throw new Error(data.error || 'Failed to create call');
      }

      router.push('/admin/calls');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create call');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Link
        href="/admin/calls"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Calls
      </Link>

      <h1 className="text-2xl font-bold mb-6">Add New Call</h1>

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

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Token Address (CA) *
            </label>
            <div className="flex gap-2">
              <Input
                id="token_address"
                name="token_address"
                placeholder="Solana token address"
                value={formData.token_address}
                onChange={handleChange}
                className="flex-1"
                required
              />
              <Button
                type="button"
                variant="secondary"
                onClick={fetchTokenData}
                disabled={isFetchingToken || !formData.token_address}
              >
                {isFetchingToken ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
            {tokenData && (
              <div className="mt-2 p-3 bg-success-muted rounded-lg text-sm">
                <p className="font-medium">{tokenData.name} ({tokenData.symbol})</p>
                <p className="text-muted-foreground">
                  Current MCap: ${tokenData.marketCap.toLocaleString()}
                </p>
              </div>
            )}
          </div>

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
              Create Call
            </Button>
            <Link href="/admin/calls">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
