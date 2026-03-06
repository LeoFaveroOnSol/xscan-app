'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { ArrowLeft, Save, Trash2, AlertCircle, Loader2, Upload, Image as ImageIcon, Radar, RefreshCw, Database } from 'lucide-react';

interface FormData {
  twitter_handle: string;
  display_name: string;
  bio: string;
  profile_image_url: string;
  follower_count: string;
  wallet_address: string;
  is_active: boolean;
}

export default function EditKOLPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    twitter_handle: '',
    display_name: '',
    bio: '',
    profile_image_url: '',
    follower_count: '',
    wallet_address: '',
    is_active: true,
  });

  useEffect(() => {
    async function fetchKOL() {
      try {
        const response = await fetch(`/api/admin/kols/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch KOL');
        }

        setFormData({
          twitter_handle: data.kol.twitter_handle || '',
          display_name: data.kol.display_name || '',
          bio: data.kol.bio || '',
          profile_image_url: data.kol.profile_image_url || '',
          follower_count: data.kol.follower_count?.toString() || '',
          wallet_address: data.kol.wallet_address || '',
          is_active: data.kol.is_active ?? true,
        });
        if (data.kol.profile_image_url) {
          setImagePreview(data.kol.profile_image_url);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load KOL');
      } finally {
        setIsLoading(false);
      }
    }
    fetchKOL();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setIsUploading(true);
    setError(null);

    try {
      const uploadData = new window.FormData();
      uploadData.append('file', file);
      uploadData.append('handle', formData.twitter_handle);

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: uploadData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      setFormData((prev) => ({ ...prev, profile_image_url: data.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      setImagePreview(formData.profile_image_url || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/kols/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          twitter_handle: formData.twitter_handle,
          display_name: formData.display_name || null,
          bio: formData.bio || null,
          profile_image_url: formData.profile_image_url || null,
          follower_count: formData.follower_count ? parseInt(formData.follower_count) : 0,
          wallet_address: formData.wallet_address || null,
          is_active: formData.is_active,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update KOL');
      }

      router.push('/admin/kols');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update KOL');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/kols/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete KOL');
      }

      router.push('/admin/kols');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete KOL');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };



  const handleBackfillTokens = async () => {
    if (!formData.twitter_handle) return;
    setIsBackfilling(true);
    setBackfillResult(null);
    setError(null);

    try {
      const response = await fetch('/api/admin/backfill-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: formData.twitter_handle }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Backfill failed');
      }

      setBackfillResult(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backfill failed');
    } finally {
      setIsBackfilling(false);
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
        href="/admin/kols"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to KOLs
      </Link>

      <h1 className="text-2xl font-bold mb-6">Edit KOL</h1>

      <Card className="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-danger-muted text-danger rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Input
            id="twitter_handle"
            name="twitter_handle"
            label="Twitter Handle *"
            placeholder="@username"
            value={formData.twitter_handle}
            onChange={handleChange}
            required
          />

          <Input
            id="display_name"
            name="display_name"
            label="Display Name"
            placeholder="Display name"
            value={formData.display_name}
            onChange={handleChange}
          />

          <Textarea
            id="bio"
            name="bio"
            label="Bio"
            placeholder="KOL bio/description"
            rows={3}
            value={formData.bio}
            onChange={handleChange}
          />

          {/* Image Upload Section */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Profile Image
            </label>
            <div className="flex items-start gap-4">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-20 h-20 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-card border-2 border-dashed border-border flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={isUploading}
                  disabled={!formData.twitter_handle}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Upload Image'}
                </Button>
                {!formData.twitter_handle && (
                  <p className="text-xs text-muted-foreground">
                    Enter Twitter handle first to upload image
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Max 5MB. Formats: JPEG, PNG, GIF, WebP
                </p>
              </div>
            </div>
          </div>

          <Input
            id="profile_image_url"
            name="profile_image_url"
            label="Profile Image URL (or paste URL manually)"
            placeholder="https://..."
            value={formData.profile_image_url}
            onChange={handleChange}
          />

          <Input
            id="follower_count"
            name="follower_count"
            label="Follower Count"
            placeholder="10000"
            type="number"
            value={formData.follower_count}
            onChange={handleChange}
          />

          <Input
            id="wallet_address"
            name="wallet_address"
            label="Wallet Address"
            placeholder="Solana wallet address"
            value={formData.wallet_address}
            onChange={handleChange}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-4 h-4 rounded border-border bg-card text-primary focus:ring-primary/50"
            />
            <label htmlFor="is_active" className="text-sm font-medium">
              Active
            </label>
          </div>

          <div className="flex gap-4">
            <Button type="submit" isLoading={isSubmitting}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
            <Link href="/admin/kols">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
          )}
        </div>


        {/* Backfill Tokens Section */}
        <div className="mt-8 pt-6 border-t border-border">
          <h3 className="text-lg font-semibold mb-2">Backfill Token Data</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Fetch names, symbols, images and market caps from DexScreener for UNKNOWN tokens.
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={handleBackfillTokens}
            isLoading={isBackfilling}
            disabled={!formData.twitter_handle}
          >
            <Database className="w-4 h-4 mr-2" />
            {isBackfilling ? 'Backfilling...' : 'Backfill Tokens'}
          </Button>
          {backfillResult && (
            <div className="mt-3 p-3 bg-primary/10 text-primary rounded-lg text-sm">
              {backfillResult}
            </div>
          )}
        </div>

        {/* Delete Section */}
        <div className="mt-8 pt-6 border-t border-border">
          <h3 className="text-lg font-semibold text-danger mb-2">Danger Zone</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Deleting this KOL will also remove all associated calls. This action cannot be undone.
          </p>

          {!showDeleteConfirm ? (
            <Button
              type="button"
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete KOL
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
