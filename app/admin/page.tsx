import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Users, TrendingUp, FileText, Bot, Clock, Zap } from 'lucide-react';
import Link from 'next/link';

async function getAdminStats() {
  const supabase = await createClient();

  const [kolsResult, callsResult, applicationsResult, monitoredResult, autoCallsResult] = await Promise.all([
    supabase.from('kols').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('calls').select('*', { count: 'exact', head: true }),
    supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('kols').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('is_auto_monitored', true),
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('is_auto_detected', true),
  ]);

  return {
    totalKols: kolsResult.count || 0,
    totalCalls: callsResult.count || 0,
    pendingApplications: applicationsResult.count || 0,
    monitoredKols: monitoredResult.count || 0,
    autoDetectedCalls: autoCallsResult.count || 0,
  };
}

async function getRecentActivity() {
  const supabase = await createClient();

  const { data: recentKols } = await supabase
    .from('kols')
    .select('id, twitter_handle, display_name, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: recentCalls } = await supabase
    .from('calls')
    .select('id, token_symbol, token_address, entry_timestamp, is_auto_detected, kols(twitter_handle)')
    .order('created_at', { ascending: false })
    .limit(5);

  return {
    recentKols: recentKols || [],
    recentCalls: recentCalls || [],
  };
}

async function getAutomationStatus() {
  const supabase = await createClient();

  const { data: lastTweetScan } = await supabase
    .from('scan_logs')
    .select('*')
    .eq('scan_type', 'tweets')
    .eq('status', 'completed')
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  const { data: lastPriceUpdate } = await supabase
    .from('scan_logs')
    .select('*')
    .eq('scan_type', 'prices')
    .eq('status', 'completed')
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  return {
    lastTweetScan,
    lastPriceUpdate,
  };
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default async function AdminDashboardPage() {
  const [stats, activity, automation] = await Promise.all([
    getAdminStats(),
    getRecentActivity(),
    getAutomationStatus(),
  ]);

  const statCards = [
    {
      label: 'Total KOLs',
      value: stats.totalKols,
      icon: Users,
      color: 'text-primary',
      href: '/admin/kols',
    },
    {
      label: 'Total Calls',
      value: stats.totalCalls,
      icon: TrendingUp,
      color: 'text-success',
      href: '/admin/calls',
    },
    {
      label: 'Pending Applications',
      value: stats.pendingApplications,
      icon: FileText,
      color: 'text-warning',
      href: '/admin/applications',
    },
  ];

  const automationCards = [
    {
      label: 'Monitored KOLs',
      value: stats.monitoredKols,
      icon: Bot,
      color: 'text-cyan-500',
    },
    {
      label: 'Auto-Detected Calls',
      value: stats.autoDetectedCalls,
      icon: Zap,
      color: 'text-yellow-500',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card hover>
                <CardContent className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-current/10 ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Automation Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-500" />
            Automation Status
          </h2>
          <Link
            href="/admin/automation"
            className="text-sm text-primary hover:underline"
          >
            View Details
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {automationCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-3 py-4">
                  <div className={`p-2 rounded-lg bg-current/10 ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Last Tweet Scan */}
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {formatTimeAgo(automation.lastTweetScan?.completed_at)}
                </p>
                <p className="text-xs text-muted-foreground">Last Tweet Scan</p>
              </div>
            </CardContent>
          </Card>

          {/* Last Price Update */}
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {formatTimeAgo(automation.lastPriceUpdate?.completed_at)}
                </p>
                <p className="text-xs text-muted-foreground">Last Price Update</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent KOLs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent KOLs</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.recentKols.length === 0 ? (
              <p className="text-muted-foreground text-sm">No KOLs yet</p>
            ) : (
              <ul className="space-y-3">
                {activity.recentKols.map((kol: any) => (
                  <li key={kol.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{kol.display_name || kol.twitter_handle}</p>
                      <p className="text-xs text-muted-foreground">@{kol.twitter_handle}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent Calls */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Calls</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.recentCalls.length === 0 ? (
              <p className="text-muted-foreground text-sm">No calls yet</p>
            ) : (
              <ul className="space-y-3">
                {activity.recentCalls.map((call: any) => (
                  <li key={call.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                      {call.is_auto_detected ? (
                        <Zap className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-success" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{call.token_symbol || 'Unknown'}</p>
                        {call.is_auto_detected && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500">
                            AUTO
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        by @{call.kols?.twitter_handle}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
