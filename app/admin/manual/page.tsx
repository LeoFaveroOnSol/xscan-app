'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { ArrowLeft, Upload, Save, AlertCircle, CheckCircle2, Loader2, Image as ImageIcon, FileText } from 'lucide-react';

interface ParsedCall {
  token_address: string;
  token_symbol?: string;
  entry_timestamp: string;
  entry_market_cap: number;
  ath_market_cap?: number;
  current_market_cap?: number;
  tweet_url?: string;
  notes?: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  kolId?: string;
  callsCreated?: number;
}

export default function ManualImportPage() {
  const [activeTab, setActiveTab] = useState<'kol' | 'calls'>('kol');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [parsedCalls, setParsedCalls] = useState<ParsedCall[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // KOL Form Data
  const [kolData, setKolData] = useState({
    twitter_handle: '',
    display_name: '',
    bio: '',
    follower_count: '',
    wallet_address: '',
  });

  // Calls Text Area
  const [callsText, setCallsText] = useState('');

  const handleKolChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setKolData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const parseCallsText = () => {
    setError(null);
    const lines = callsText.trim().split('\n').filter(line => line.trim());
    const parsed: ParsedCall[] = [];

    for (const line of lines) {
      try {
        // Expected format: CA | Symbol | Date | Entry MC | ATH MC | Current MC | Tweet URL (optional)
        // Or simplified: CA | Date | Entry MC | ATH MC
        const parts = line.split('|').map(p => p.trim());

        if (parts.length < 3) {
          // Try comma separation
          const commaParts = line.split(',').map(p => p.trim());
          if (commaParts.length >= 3) {
            parts.length = 0;
            parts.push(...commaParts);
          }
        }

        if (parts.length >= 3) {
          // Try to detect which part is the CA (44 char base58)
          let ca = '';
          let dateStr = '';
          let entryMc = 0;
          let athMc = 0;
          let currentMc = 0;
          let symbol = '';
          let tweetUrl = '';

          for (const part of parts) {
            // Check if it's a Solana address (base58, ~44 chars)
            if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(part)) {
              ca = part;
            }
            // Check if it's a date
            else if (/\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}/.test(part) || /\d{1,2}:\d{2}/.test(part)) {
              dateStr = part;
            }
            // Check if it's a number (market cap)
            else if (/^[\d,.]+[kKmMbB]?$/.test(part.replace(/[$\s]/g, ''))) {
              const numStr = part.replace(/[$,\s]/g, '');
              let num = parseFloat(numStr);

              // Handle k, m, b suffixes
              if (/[kK]$/.test(numStr)) num *= 1000;
              if (/[mM]$/.test(numStr)) num *= 1000000;
              if (/[bB]$/.test(numStr)) num *= 1000000000;

              if (entryMc === 0) entryMc = num;
              else if (athMc === 0) athMc = num;
              else if (currentMc === 0) currentMc = num;
            }
            // Check if it's a tweet URL
            else if (part.includes('twitter.com') || part.includes('x.com')) {
              tweetUrl = part;
            }
            // Otherwise it might be a symbol
            else if (part.length <= 10 && /^[A-Z$]+$/i.test(part)) {
              symbol = part.toUpperCase();
            }
          }

          if (ca && entryMc > 0) {
            parsed.push({
              token_address: ca,
              token_symbol: symbol || undefined,
              entry_timestamp: dateStr ? new Date(dateStr).toISOString() : new Date().toISOString(),
              entry_market_cap: entryMc,
              ath_market_cap: athMc || entryMc,
              current_market_cap: currentMc || athMc || entryMc,
              tweet_url: tweetUrl || undefined,
            });
          }
        }
      } catch (e) {
        console.warn('Failed to parse line:', line, e);
      }
    }

    setParsedCalls(parsed);
    if (parsed.length === 0 && callsText.trim()) {
      setError('Could not parse any calls. Use format: CA | Symbol | Date | Entry MC | ATH MC | Tweet URL');
    }
  };

  const handleSubmitKol = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      // First, upload image if selected
      let profileImageUrl = '';

      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('handle', kolData.twitter_handle.replace('@', ''));

        const uploadRes = await fetch('/api/admin/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json();
          throw new Error(uploadErr.error || 'Failed to upload image');
        }

        const uploadData = await uploadRes.json();
        profileImageUrl = uploadData.url;
      }

      // Create KOL
      const response = await fetch('/api/kols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          twitter_handle: kolData.twitter_handle,
          display_name: kolData.display_name || kolData.twitter_handle,
          bio: kolData.bio || null,
          profile_image_url: profileImageUrl || null,
          follower_count: kolData.follower_count ? parseInt(kolData.follower_count) : 0,
          wallet_address: kolData.wallet_address || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create KOL');
      }

      // If we have parsed calls, create them
      if (parsedCalls.length > 0 && data.kol?.id) {
        let callsCreated = 0;
        for (const call of parsedCalls) {
          try {
            const callRes = await fetch('/api/admin/bulk-calls', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                kol_id: data.kol.id,
                ...call,
              }),
            });
            if (callRes.ok) callsCreated++;
          } catch (e) {
            console.warn('Failed to create call:', e);
          }
        }
        setSuccess(`KOL created successfully with ${callsCreated} calls!`);
      } else {
        setSuccess('KOL created successfully!');
      }

      // Reset form
      setKolData({
        twitter_handle: '',
        display_name: '',
        bio: '',
        follower_count: '',
        wallet_address: '',
      });
      setImageFile(null);
      setImagePreview(null);
      setCallsText('');
      setParsedCalls([]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create KOL');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Admin
      </Link>

      <h1 className="text-2xl font-bold mb-2">Manual Import</h1>
      <p className="text-muted-foreground mb-6">
        Add KOLs manually with profile image and bulk import calls
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('kol')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'kol'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border hover:bg-accent'
          }`}
        >
          <ImageIcon className="w-4 h-4 inline mr-2" />
          New KOL + Calls
        </button>
        <button
          onClick={() => setActiveTab('calls')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'calls'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border hover:bg-accent'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Add Calls to Existing KOL
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-danger-muted text-danger rounded-lg mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-success-muted text-success rounded-lg mb-6">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {activeTab === 'kol' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* KOL Info Card */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">KOL Information</h2>
            <form onSubmit={handleSubmitKol} className="space-y-4">
              <Input
                id="twitter_handle"
                name="twitter_handle"
                label="Twitter Handle *"
                placeholder="@username"
                value={kolData.twitter_handle}
                onChange={handleKolChange}
                required
              />

              <Input
                id="display_name"
                name="display_name"
                label="Display Name"
                placeholder="Display name"
                value={kolData.display_name}
                onChange={handleKolChange}
              />

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Profile Image
                </label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-16 h-16 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </Button>
                    {imageFile && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {imageFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Textarea
                id="bio"
                name="bio"
                label="Bio"
                placeholder="KOL bio/description"
                rows={2}
                value={kolData.bio}
                onChange={handleKolChange}
              />

              <Input
                id="follower_count"
                name="follower_count"
                label="Follower Count"
                placeholder="10000"
                type="number"
                value={kolData.follower_count}
                onChange={handleKolChange}
              />

              <Input
                id="wallet_address"
                name="wallet_address"
                label="Wallet Address"
                placeholder="Solana wallet address"
                value={kolData.wallet_address}
                onChange={handleKolChange}
              />

              <Button type="submit" isLoading={isSubmitting} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Create KOL {parsedCalls.length > 0 && `with ${parsedCalls.length} calls`}
              </Button>
            </form>
          </Card>

          {/* Calls Import Card */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">Bulk Import Calls</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Paste call data below. Supports multiple formats:
            </p>
            <div className="text-xs text-muted-foreground bg-card/50 p-3 rounded-lg mb-4 font-mono">
              <p>CA | Symbol | Date | Entry MC | ATH MC</p>
              <p>CA, 2024-01-15, 50000, 500000</p>
              <p>ABC123...xyz | $TOKEN | Jan 15 | 50k | 500k</p>
            </div>

            <Textarea
              id="callsText"
              label="Calls Data (one per line)"
              placeholder="Paste your calls data here...

Example:
ABC123xyz... | TOKEN | 2024-01-15 | 50000 | 500000
DEF456abc... | MEME | 2024-02-20 | 100k | 1M"
              rows={10}
              value={callsText}
              onChange={(e) => setCallsText(e.target.value)}
            />

            <Button
              type="button"
              variant="secondary"
              onClick={parseCallsText}
              className="w-full mt-4"
            >
              Parse Calls ({parsedCalls.length} parsed)
            </Button>

            {parsedCalls.length > 0 && (
              <div className="mt-4 max-h-64 overflow-y-auto">
                <p className="text-sm font-medium mb-2">Parsed Calls:</p>
                <div className="space-y-2">
                  {parsedCalls.map((call, idx) => (
                    <div key={idx} className="text-xs p-2 bg-success-muted rounded-lg">
                      <p className="font-mono truncate">{call.token_address}</p>
                      <p className="text-muted-foreground">
                        {call.token_symbol && `${call.token_symbol} | `}
                        Entry: ${call.entry_market_cap.toLocaleString()}
                        {call.ath_market_cap && ` | ATH: $${call.ath_market_cap.toLocaleString()}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'calls' && (
        <AddCallsToExistingKOL />
      )}
    </div>
  );
}

// Component for adding calls to existing KOL
function AddCallsToExistingKOL() {
  const [kols, setKols] = useState<Array<{ id: string; twitter_handle: string; display_name: string | null }>>([]);
  const [selectedKolId, setSelectedKolId] = useState('');
  const [callsText, setCallsText] = useState('');
  const [parsedCalls, setParsedCalls] = useState<ParsedCall[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch KOLs on mount
  useState(() => {
    fetch('/api/kols?limit=100')
      .then(res => res.json())
      .then(data => setKols(data.kols || []))
      .catch(console.error);
  });

  const parseCallsText = () => {
    setError(null);
    const lines = callsText.trim().split('\n').filter(line => line.trim());
    const parsed: ParsedCall[] = [];

    for (const line of lines) {
      try {
        const parts = line.split(/[|,]/).map(p => p.trim());

        if (parts.length >= 3) {
          let ca = '';
          let dateStr = '';
          let entryMc = 0;
          let athMc = 0;
          let currentMc = 0;
          let symbol = '';
          let tweetUrl = '';

          for (const part of parts) {
            if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(part)) {
              ca = part;
            } else if (/\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}/.test(part)) {
              dateStr = part;
            } else if (/^[\d,.]+[kKmMbB]?$/.test(part.replace(/[$\s]/g, ''))) {
              const numStr = part.replace(/[$,\s]/g, '');
              let num = parseFloat(numStr);
              if (/[kK]$/.test(numStr)) num *= 1000;
              if (/[mM]$/.test(numStr)) num *= 1000000;
              if (/[bB]$/.test(numStr)) num *= 1000000000;

              if (entryMc === 0) entryMc = num;
              else if (athMc === 0) athMc = num;
              else if (currentMc === 0) currentMc = num;
            } else if (part.includes('twitter.com') || part.includes('x.com')) {
              tweetUrl = part;
            } else if (part.length <= 10 && /^[A-Z$]+$/i.test(part)) {
              symbol = part.toUpperCase();
            }
          }

          if (ca && entryMc > 0) {
            parsed.push({
              token_address: ca,
              token_symbol: symbol || undefined,
              entry_timestamp: dateStr ? new Date(dateStr).toISOString() : new Date().toISOString(),
              entry_market_cap: entryMc,
              ath_market_cap: athMc || entryMc,
              current_market_cap: currentMc || athMc || entryMc,
              tweet_url: tweetUrl || undefined,
            });
          }
        }
      } catch (e) {
        console.warn('Failed to parse line:', line, e);
      }
    }

    setParsedCalls(parsed);
  };

  const handleSubmit = async () => {
    if (!selectedKolId) {
      setError('Please select a KOL');
      return;
    }
    if (parsedCalls.length === 0) {
      setError('No calls to import. Parse calls first.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/bulk-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kol_id: selectedKolId,
          calls: parsedCalls,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import calls');
      }

      setSuccess(`Successfully imported ${data.created} calls!`);
      setCallsText('');
      setParsedCalls([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import calls');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <h2 className="text-lg font-semibold mb-4">Add Calls to Existing KOL</h2>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-danger-muted text-danger rounded-lg mb-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-success-muted text-success rounded-lg mb-4">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Select KOL *
          </label>
          <select
            value={selectedKolId}
            onChange={(e) => setSelectedKolId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Select a KOL</option>
            {kols.map((kol) => (
              <option key={kol.id} value={kol.id}>
                {kol.display_name || kol.twitter_handle} (@{kol.twitter_handle})
              </option>
            ))}
          </select>
        </div>

        <Textarea
          id="callsText"
          label="Calls Data (one per line)"
          placeholder="CA | Symbol | Date | Entry MC | ATH MC | Current MC

Example:
ABC123xyz... | TOKEN | 2024-01-15 | 50000 | 500000 | 200000
DEF456abc... | MEME | 2024-02-20 | 100k | 1M | 500k"
          rows={10}
          value={callsText}
          onChange={(e) => setCallsText(e.target.value)}
        />

        <div className="flex gap-4">
          <Button type="button" variant="secondary" onClick={parseCallsText}>
            Parse Calls
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={parsedCalls.length === 0}
          >
            Import {parsedCalls.length} Calls
          </Button>
        </div>

        {parsedCalls.length > 0 && (
          <div className="mt-4 max-h-64 overflow-y-auto">
            <p className="text-sm font-medium mb-2">Parsed Calls:</p>
            <div className="space-y-2">
              {parsedCalls.map((call, idx) => (
                <div key={idx} className="text-xs p-2 bg-success-muted rounded-lg">
                  <p className="font-mono truncate">{call.token_address}</p>
                  <p className="text-muted-foreground">
                    {call.token_symbol && `${call.token_symbol} | `}
                    Entry: ${call.entry_market_cap.toLocaleString()}
                    {call.ath_market_cap && ` | ATH: $${call.ath_market_cap.toLocaleString()}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
