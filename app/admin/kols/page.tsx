import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { formatPercent, formatTimeAgo } from '@/lib/utils/formatters';
import { Plus, Edit, CheckCircle2 } from 'lucide-react';

async function getKOLs() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('kols')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching KOLs:', error);
    return [];
  }

  return data || [];
}

export default async function AdminKOLsPage() {
  const kols = await getKOLs();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Manage KOLs</h1>
          <p className="text-muted-foreground">Add, edit, and manage KOL profiles</p>
        </div>
        <Link href="/admin/kols/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add KOL
          </Button>
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>KOL</TableHead>
              <TableHead>Winrate</TableHead>
              <TableHead>Calls</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kols.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No KOLs yet. Add your first KOL to get started.
                </TableCell>
              </TableRow>
            ) : (
              kols.map((kol) => (
                <TableRow key={kol.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={kol.profile_image_url}
                        alt={kol.display_name || kol.twitter_handle}
                        size="sm"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {kol.display_name || kol.twitter_handle}
                          </span>
                          {kol.is_verified && (
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          @{kol.twitter_handle}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatPercent(kol.winrate)}</TableCell>
                  <TableCell>{kol.total_calls}</TableCell>
                  <TableCell>
                    {kol.is_active ? (
                      <Badge variant="success" size="sm">Active</Badge>
                    ) : (
                      <Badge variant="danger" size="sm">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatTimeAgo(kol.created_at)}
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/kols/${kol.id}`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
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
