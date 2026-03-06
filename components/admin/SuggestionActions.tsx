'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { CheckCircle, XCircle, RefreshCw, Loader2 } from 'lucide-react';

interface SuggestionActionsProps {
  suggestionId: string;
  channelUsername: string;
}

export default function SuggestionActions({ suggestionId, channelUsername }: SuggestionActionsProps) {
  const [loading, setLoading] = useState<'approve' | 'reject' | 'scan' | null>(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string; channelId?: string } | null>(null);

  const handleApprove = async () => {
    setLoading('approve');
    setResult(null);

    try {
      const response = await fetch(`/api/admin/channel-suggestions/${suggestionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          message: data.already_existed
            ? 'Channel already exists - suggestion approved'
            : 'Channel created successfully!',
          channelId: data.channel?.id || data.channel_id,
        });

        // Refresh page after short delay
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setResult({ success: false, message: data.error || 'Failed to approve' });
      }
    } catch (error) {
      setResult({ success: false, message: 'Network error' });
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setShowRejectInput(true);
      return;
    }

    setLoading('reject');
    setResult(null);

    try {
      const response = await fetch(`/api/admin/channel-suggestions/${suggestionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', rejection_reason: rejectionReason }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({ success: true, message: 'Suggestion rejected' });
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setResult({ success: false, message: data.error || 'Failed to reject' });
      }
    } catch (error) {
      setResult({ success: false, message: 'Network error' });
    } finally {
      setLoading(null);
    }
  };

  const handleScanChannel = async (channelId: string) => {
    setLoading('scan');

    try {
      const response = await fetch(`/api/admin/telegram/channels/${channelId}/rescan`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          message: `Scan started! Found ${data.contracts_found || 0} calls`,
        });
      } else {
        setResult({ success: false, message: data.error || 'Scan failed' });
      }
    } catch (error) {
      setResult({ success: false, message: 'Scan failed' });
    } finally {
      setLoading(null);
    }
  };

  if (result?.success && result.channelId) {
    return (
      <div className="flex flex-col items-end gap-2">
        <div className="text-sm text-green-400 flex items-center gap-1">
          <CheckCircle className="w-4 h-4" />
          {result.message}
        </div>
        <Button
          size="sm"
          onClick={() => handleScanChannel(result.channelId!)}
          disabled={loading === 'scan'}
          className="gap-1"
        >
          {loading === 'scan' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Scan History
        </Button>
      </div>
    );
  }

  if (result) {
    return (
      <div className={`text-sm ${result.success ? 'text-green-400' : 'text-red-400'}`}>
        {result.message}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleApprove}
          disabled={loading !== null}
          className="gap-1 bg-green-600 hover:bg-green-700"
        >
          {loading === 'approve' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          Approve
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={handleReject}
          disabled={loading !== null}
          className="gap-1"
        >
          {loading === 'reject' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          Reject
        </Button>
      </div>

      {showRejectInput && (
        <div className="flex items-center gap-2 mt-2">
          <input
            type="text"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Reason for rejection..."
            className="px-3 py-1.5 text-sm rounded-lg bg-background border border-border focus:border-primary outline-none"
          />
          <Button
            size="sm"
            variant="danger"
            onClick={handleReject}
            disabled={!rejectionReason.trim() || loading !== null}
          >
            Confirm
          </Button>
        </div>
      )}

      <a
        href={`https://t.me/${channelUsername}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-400 hover:underline"
      >
        Preview channel
      </a>
    </div>
  );
}
