import { createClient } from '@/lib/supabase/server';
import LeaderboardClient from './LeaderboardClient';

async function getKOLs() {
  const supabase = await createClient();

  const { data: kols, error } = await supabase
    .from('kols')
    .select('*')
    .eq('is_active', true)
    .order('winrate', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching KOLs:', error);
    return [];
  }

  return kols || [];
}

async function getStats() {
  const supabase = await createClient();

  const [totalResult, verifiedResult] = await Promise.all([
    supabase.from('kols').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('kols').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('is_verified', true),
  ]);

  return {
    total: totalResult.count || 0,
    verified: verifiedResult.count || 0,
    unverified: (totalResult.count || 0) - (verifiedResult.count || 0),
  };
}

export default async function LeaderboardPage() {
  const [kols, stats] = await Promise.all([getKOLs(), getStats()]);

  return <LeaderboardClient kols={kols} stats={stats} />;
}
