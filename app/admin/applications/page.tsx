import { createServiceClient } from '@/lib/supabase/server';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import CopyAddress from '@/components/ui/CopyAddress';
import { formatTimeAgo, truncateAddress } from '@/lib/utils/formatters';
import { CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';

async function getApplications() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching applications:', error);
    return [];
  }

  return data || [];
}

export default async function AdminApplicationsPage() {
  const applications = await getApplications();

  const pendingCount = applications.filter((a: any) => a.status === 'pending').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">KOL Applications</h1>
          <p className="text-muted-foreground">
            Review and manage KOL applications ({pendingCount} pending)
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Type</TableHead>
              <TableHead>Applicant</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Followers</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No applications yet.
                </TableCell>
              </TableRow>
            ) : (
              applications.map((app: any) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <Badge variant={app.application_type === 'telegram_channel' ? 'primary' : 'default'} size="sm">
                      {app.application_type === 'telegram_channel' ? 'Channel' : 'KOL'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {app.display_name || app.twitter_handle}
                        </span>
                        <a
                          href={`https://x.com/${app.twitter_handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        @{app.twitter_handle}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {app.wallet_address ? (
                      <CopyAddress address={app.wallet_address} />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {app.follower_count ? app.follower_count.toLocaleString() : '-'}
                  </TableCell>
                  <TableCell>
                    {app.status === 'pending' && (
                      <Badge variant="warning" size="sm">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                    {app.status === 'approved' && (
                      <Badge variant="success" size="sm">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approved
                      </Badge>
                    )}
                    {app.status === 'rejected' && (
                      <Badge variant="danger" size="sm">
                        <XCircle className="w-3 h-3 mr-1" />
                        Rejected
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatTimeAgo(app.created_at)}
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/applications/${app.id}`}>
                      <Button variant="secondary" size="sm">
                        Review
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
