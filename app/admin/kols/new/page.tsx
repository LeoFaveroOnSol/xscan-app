'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

interface FormData {
  twitter_handle: string;
  display_name: string;
  bio: string;
  profile_image_url: string;
  follower_count: string;
  wallet_address: string;
}

export default function NewKOLPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    twitter_handle: '',
    display_name: '',
    bio: '',
    profile_image_url: '',
    follower_count: '',
    wallet_address: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/kols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          twitter_handle: formData.twitter_handle,
          display_name: formData.display_name || null,
          bio: formData.bio || null,
          profile_image_url: formData.profile_image_url || null,
          follower_count: formData.follower_count ? parseInt(formData.follower_count) : 0,
          wallet_address: formData.wallet_address || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create KOL');
      }

      router.push('/admin/kols');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create KOL');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Link
        href="/admin/kols"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to KOLs
      </Link>

      <h1 className="text-2xl font-bold mb-6">Add New KOL</h1>

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

          <Input
            id="profile_image_url"
            name="profile_image_url"
            label="Profile Image URL"
            placeholder="https://pbs.twimg.com/..."
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

          <div className="flex gap-4">
            <Button type="submit" isLoading={isSubmitting}>
              <Save className="w-4 h-4 mr-2" />
              Create KOL
            </Button>
            <Link href="/admin/kols">
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
