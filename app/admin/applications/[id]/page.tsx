'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Textarea from '@/components/ui/Textarea';
import CopyAddress from '@/components/ui/CopyAddress';
import { formatDateTime, getTwitterUrl } from '@/lib/utils/formatters';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  ExternalLink,
  AlertCircle,
  Clock,
} from 'lucide-react';
import type { Application } from '@/types/database';

export default function ReviewApplicationPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    async function fetchApplication() {
      try {
        const response = await fetch(`/api/applications/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch application');
        }

        setApplication(data.application);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load application');
      } finally {
        setIsLoading(false);
      }
    }
    fetchApplication();
  }, [id]);

  const handleApprove = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve application');
      }

      router.push('/admin/applications');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          rejection_reason: rejectionReason || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject application');
      }

      router.push('/admin/applications');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Application Not Found</h2>
        <Link href="/admin/applications">
          <Button variant="secondary">Back to Applications</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin/applications"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Applications
      </Link>

      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Review Application</h1>
        {application.status === 'pending' && (
          <Badge variant="warning">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )}
        {application.status === 'approved' && (
          <Badge variant="success">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        )}
        {application.status === 'rejected' && (
          <Badge variant="danger">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-danger-muted text-danger rounded-lg mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Application Details */}
        <Card>
          <h3 className="font-semibold mb-4">Applicant Details</h3>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm text-muted-foreground">Twitter Handle</dt>
              <dd className="flex items-center gap-2">
                <span className="font-medium">@{application.twitter_handle}</span>
                <a
                  href={getTwitterUrl(application.twitter_handle)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </dd>
            </div>

            {application.display_name && (
              <div>
                <dt className="text-sm text-muted-foreground">Display Name</dt>
                <dd className="font-medium">{application.display_name}</dd>
              </div>
            )}

            {application.wallet_address && (
              <div>
                <dt className="text-sm text-muted-foreground">Wallet Address</dt>
                <dd>
                  <CopyAddress address={application.wallet_address} startChars={8} endChars={8} />
                </dd>
              </div>
            )}

            {application.follower_count && (
              <div>
                <dt className="text-sm text-muted-foreground">Follower Count</dt>
                <dd className="font-medium">{application.follower_count.toLocaleString()}</dd>
              </div>
            )}

            <div>
              <dt className="text-sm text-muted-foreground">Applied At</dt>
              <dd className="text-muted-foreground">{formatDateTime(application.created_at)}</dd>
            </div>
          </dl>
        </Card>

        {/* Bio & Proof */}
        <Card>
          <h3 className="font-semibold mb-4">Additional Info</h3>

          {application.bio && (
            <div className="mb-4">
              <h4 className="text-sm text-muted-foreground mb-2">Bio</h4>
              <p className="text-sm">{application.bio}</p>
            </div>
          )}

          {application.proof_of_calls && (
            <div className="mb-4">
              <h4 className="text-sm text-muted-foreground mb-2">Proof of Calls</h4>
              <p className="text-sm whitespace-pre-wrap">{application.proof_of_calls}</p>
            </div>
          )}

          {application.additional_info && (
            <div>
              <h4 className="text-sm text-muted-foreground mb-2">Additional Info</h4>
              <p className="text-sm">{application.additional_info}</p>
            </div>
          )}

          {!application.bio && !application.proof_of_calls && !application.additional_info && (
            <p className="text-muted-foreground text-sm">No additional information provided.</p>
          )}
        </Card>
      </div>

      {/* Actions */}
      {application.status === 'pending' && (
        <Card className="mt-6">
          <h3 className="font-semibold mb-4">Review Actions</h3>

          <div className="space-y-4">
            <Textarea
              label="Rejection Reason (optional)"
              placeholder="Reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={2}
            />

            <div className="flex gap-4">
              <Button onClick={handleApprove} isLoading={isProcessing}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve & Create KOL
              </Button>
              <Button variant="danger" onClick={handleReject} isLoading={isProcessing}>
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        </Card>
      )}

      {application.status === 'rejected' && application.rejection_reason && (
        <Card className="mt-6">
          <h3 className="font-semibold mb-2">Rejection Reason</h3>
          <p className="text-muted-foreground">{application.rejection_reason}</p>
        </Card>
      )}
    </div>
  );
}
