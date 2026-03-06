import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Bot, Clock, Zap, CheckCircle, XCircle, AlertTriangle, MessageSquare, Radio } from 'lucide-react';
import AutomationControls from '@/components/admin/AutomationControls';
import MonitoredKOLsList from '@/components/admin/MonitoredKOLsList';

async function getAutomationStats() {
  const supabase = await createClient();

  const now = new Date().toISOString();

  const [
    monitoredResult,
    autoCallsResult,
    activeMonitoringResult,
    telegramChannelsResult,
    telegramCallsResult,
  ] = await Promise.all([
    supabase.from('kols').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('is_auto_monitored', true),
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('is_auto_detected', true),
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('is_auto_detected', true).gte('monitoring_until', now),
    supabase.from('telegram_channels').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('telegram_calls').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ]);

  return {
    monitoredKols: monitoredResult.count || 0,
    autoDetectedCalls: autoCallsResult.count || 0,
    activelyMonitored: activeMonitoringResult.count || 0,
    telegramChannels: telegramChannelsResult.count || 0,
    telegramCalls: telegramCallsResult.count || 0,
  };
}

async function getRecentScans() {
  const supabase = await createClient();

  const { data } = await supabase
    .from('scan_logs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(20);

  return data || [];
}

async function getTelegramScanLogs() {
  const supabase = await createClient();

  const { data } = await supabase
    .from('telegram_scan_logs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(20);

  return data || [];
}

async function getMonitoredKols() {
  const supabase = await createClient();

  const { data } = await supabase
    .from('kols')
    .select('id, twitter_handle, display_name, is_auto_monitored, last_scan_at')
    .eq('is_active', true)
    .order('is_auto_monitored', { ascending: false })
    .order('twitter_handle', { ascending: true });

  return data || [];
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleString();
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-success" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-destructive" />;
    case 'running':
      return <Clock className="w-4 h-4 text-warning animate-spin" />;
    default:
      return <AlertTriangle className="w-4 h-4 text-muted-foreground" />;
  }
}

export default async function AutomationPage() {
  const [stats, recentScans, telegramScans, kols] = await Promise.all([
    getAutomationStats(),
    getRecentScans(),
    getTelegramScanLogs(),
    getMonitoredKols(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="w-6 h-6 text-cyan-500" />
          Automation
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.monitoredKols}</p>
              <p className="text-xs text-muted-foreground">Monitored KOLs</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.autoDetectedCalls}</p>
              <p className="text-xs text-muted-foreground">Auto-Detected Calls</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.activelyMonitored}</p>
              <p className="text-xs text-muted-foreground">Actively Tracked</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.telegramChannels}</p>
              <p className="text-xs text-muted-foreground">Telegram Channels</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.telegramCalls}</p>
              <p className="text-xs text-muted-foreground">Telegram Calls</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual Trigger Controls */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Manual Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <AutomationControls />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Scans (KOL) */}
        <Card>
          <CardHeader>
            <CardTitle>KOL Scan Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {recentScans.length === 0 ? (
              <p className="text-muted-foreground text-sm">No scans yet</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {recentScans.map((scan: any) => (
                  <div
                    key={scan.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    {getStatusIcon(scan.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{scan.scan_type}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          scan.status === 'completed' ? 'bg-success/20 text-success' :
                          scan.status === 'failed' ? 'bg-destructive/20 text-destructive' :
                          'bg-warning/20 text-warning'
                        }`}>
                          {scan.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(scan.started_at)}
                      </p>
                      {scan.scan_type === 'tweets' && scan.status === 'completed' && (
                        <p className="text-xs text-muted-foreground">
                          {scan.kols_scanned} KOLs, {scan.tweets_found} tweets, {scan.calls_created} calls
                        </p>
                      )}
                      {scan.scan_type === 'prices' && scan.status === 'completed' && (
                        <p className="text-xs text-muted-foreground">
                          {scan.calls_created} updated, {scan.calls_skipped} ATHs
                        </p>
                      )}
                      {scan.error_message && (
                        <p className="text-xs text-destructive mt-1 truncate">
                          {scan.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Telegram Scan Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              Telegram Scan Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {telegramScans.length === 0 ? (
              <p className="text-muted-foreground text-sm">No Telegram scans yet</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {telegramScans.map((scan: any) => (
                  <div
                    key={scan.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10"
                  >
                    {getStatusIcon(scan.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{scan.scan_type}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          scan.status === 'completed' ? 'bg-success/20 text-success' :
                          scan.status === 'failed' ? 'bg-destructive/20 text-destructive' :
                          'bg-warning/20 text-warning'
                        }`}>
                          {scan.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(scan.started_at)}
                      </p>
                      {scan.status === 'completed' && (
                        <p className="text-xs text-muted-foreground">
                          {scan.channels_scanned} channels, {scan.messages_found} messages, {scan.calls_created} calls created
                          {scan.calls_skipped > 0 && `, ${scan.calls_skipped} skipped`}
                        </p>
                      )}
                      {scan.error_message && (
                        <p className="text-xs text-destructive mt-1 truncate">
                          {scan.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monitored KOLs */}
      <Card>
        <CardHeader>
          <CardTitle>KOL Monitoring</CardTitle>
        </CardHeader>
        <CardContent>
          <MonitoredKOLsList initialKols={kols} />
        </CardContent>
      </Card>
    </div>
  );
}
