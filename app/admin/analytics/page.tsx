'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Users, Eye, Globe, Monitor, Smartphone } from 'lucide-react';

type AnalyticsData = {
  totalViews: number;
  uniqueSessions: number;
  topPages: { name: string; count: number }[];
  viewsByDay: { date: string; count: number }[];
  topReferrers: { name: string; count: number }[];
  topCountries: { name: string; count: number }[];
  deviceBreakdown: { name: string; count: number }[];
  topKols: { name: string; count: number }[];
};

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-5 h-5 text-primary" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-3xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </div>
  );
}

function BarChart({ data, maxItems = 30 }: { data: { date: string; count: number }[]; maxItems?: number }) {
  const items = data.slice(-maxItems);
  const max = Math.max(...items.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-1 h-40">
      {items.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div
            className="w-full bg-primary/80 rounded-t min-h-[2px] transition-all hover:bg-primary"
            style={{ height: `${(d.count / max) * 100}%` }}
          />
          <div className="absolute -top-8 bg-card border border-border rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
            {d.date}: {d.count}
          </div>
        </div>
      ))}
    </div>
  );
}

function RankTable({ title, data, icon: Icon }: { title: string; data: { name: string; count: number }[]; icon: React.ElementType }) {
  if (!data.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="space-y-2">
        {data.map((item, i) => {
          const max = data[0].count;
          return (
            <div key={item.name} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="truncate max-w-[200px]">{item.name}</span>
                  <span className="text-muted-foreground ml-2">{item.count}</span>
                </div>
                <div className="h-1.5 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-primary/60 rounded-full" style={{ width: `${(item.count / max) * 100}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?period=${period}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const periods = ['7d', '30d', '90d', 'all'] as const;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Self-hosted pageview analytics</p>
        </div>
        <div className="flex gap-1 bg-card border border-border rounded-lg p-1">
          {periods.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                period === p ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Loading...</div>
      ) : data ? (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Views" value={data.totalViews} icon={Eye} />
            <StatCard label="Unique Visitors" value={data.uniqueSessions} icon={Users} />
            <StatCard label="Top Country" value={data.topCountries[0]?.name || '—'} icon={Globe} />
            <StatCard label="Mobile %" value={
              data.totalViews ? `${Math.round((data.deviceBreakdown.find(d => d.name === 'mobile')?.count || 0) / data.totalViews * 100)}%` : '0%'
            } icon={Smartphone} />
          </div>

          {/* Chart */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Views by Day
            </h3>
            {data.viewsByDay.length ? (
              <BarChart data={data.viewsByDay} />
            ) : (
              <p className="text-muted-foreground text-sm">No data yet</p>
            )}
          </div>

          {/* Tables */}
          <div className="grid md:grid-cols-2 gap-6">
            <RankTable title="Top Pages" data={data.topPages} icon={Eye} />
            <RankTable title="Top KOLs Viewed" data={data.topKols} icon={Users} />
            <RankTable title="Top Referrers" data={data.topReferrers} icon={Globe} />
            <RankTable title="Top Countries" data={data.topCountries} icon={Globe} />
          </div>

          {/* Device breakdown */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-primary" />
              Device Breakdown
            </h3>
            <div className="flex gap-6">
              {data.deviceBreakdown.map(d => (
                <div key={d.name} className="text-center">
                  <p className="text-2xl font-bold">{data.totalViews ? Math.round(d.count / data.totalViews * 100) : 0}%</p>
                  <p className="text-sm text-muted-foreground capitalize">{d.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">Failed to load analytics</div>
      )}
    </div>
  );
}
