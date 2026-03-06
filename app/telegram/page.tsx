import { createClient } from '@/lib/supabase/server';
import TelegramLeaderboardClient from './TelegramLeaderboardClient';
import TelegramComingSoon from './TelegramComingSoon';

// ===========================================
// FEATURE FLAG: Set to true to enable V2
// ===========================================
const TELEGRAM_V2_ENABLED = true;
// ===========================================

async function getChannels() {
  const supabase = await createClient();

  const { data: channels, error } = await supabase
    .from('telegram_channels')
    .select('*')
    .eq('is_active', true)
    .order('winrate', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching Telegram channels:', error);
    return [];
  }

  return channels || [];
}

async function getStats() {
  const supabase = await createClient();

  const [totalResult, verifiedResult] = await Promise.all([
    supabase.from('telegram_channels').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('telegram_channels').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('is_verified', true),
  ]);

  return {
    total: totalResult.count || 0,
    verified: verifiedResult.count || 0,
    unverified: (totalResult.count || 0) - (verifiedResult.count || 0),
  };
}

export default async function TelegramPage() {
  // Show coming soon page if V2 is not enabled
  if (!TELEGRAM_V2_ENABLED) {
    return <TelegramComingSoon />;
  }

  const [channels, stats] = await Promise.all([getChannels(), getStats()]);

  return <TelegramLeaderboardClient channels={channels} stats={stats} />;
}
