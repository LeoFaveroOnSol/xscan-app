import { createAdminClient } from '@/lib/supabase/server';
import { UserCheck, Users, Radio } from 'lucide-react';
import SubscribersTable from './SubscribersTable';

async function fetchAllSubscriptions(supabase: any) {
  const allSubs: any[] = [];
  let from = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('alert_subscriptions')
      .select('user_id, channel_id, is_active')
      .eq('is_active', true)
      .range(from, from + pageSize - 1);
    
    if (error) {
      console.error('Error fetching alert_subscriptions:', error);
      break;
    }
    
    allSubs.push(...(data || []));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  
  return allSubs;
}

async function getSubscribersData() {
  const supabase = await createAdminClient();

  const [usersResult, channelsResult] = await Promise.all([
    supabase
      .from('alert_users')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('telegram_channels')
      .select('id, channel_username, display_name'),
  ]);

  const subscriptions = await fetchAllSubscriptions(supabase);

  if (usersResult.error) {
    console.error('Error fetching alert_users:', usersResult.error);
  }
  if (channelsResult.error) {
    console.error('Error fetching telegram_channels:', channelsResult.error);
  }

  const users = usersResult.data || [];
  const channels = channelsResult.data || [];

  // Build channel map
  const channelMap = new Map(channels.map((c) => [c.id, c.display_name || c.channel_username]));

  // Build subscriptions per user (keyed by user UUID, not telegram_id)
  const userSubsMap = new Map<string, string[]>();
  for (const sub of subscriptions) {
    const list = userSubsMap.get(sub.user_id) || [];
    const name = channelMap.get(sub.channel_id) || `#${sub.channel_id}`;
    list.push(name);
    userSubsMap.set(sub.user_id, list);
  }

  // Build user channel IDs map for filtering
  const userChannelIds = new Map<string, string[]>();
  for (const sub of subscriptions) {
    const list = userChannelIds.get(sub.user_id) || [];
    list.push(sub.channel_id);
    userChannelIds.set(sub.user_id, list);
  }

  const subscribers = users.map((u) => ({
    telegram_id: u.telegram_id,
    first_name: u.first_name || '',
    username: u.username || '',
    is_active: u.is_active,
    created_at: u.created_at,
    subscriptions: userSubsMap.get(u.id) || [],
    channel_ids: userChannelIds.get(u.id) || [],
  }));

  return {
    subscribers,
    channels: channels.map((c) => ({ id: c.id, name: c.display_name || c.channel_username })),
    totalCount: users.length,
    activeCount: users.filter((u) => u.is_active).length,
  };
}

export default async function AdminSubscribersPage() {
  const { subscribers, channels, totalCount, activeCount } = await getSubscribersData();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-blue-500" />
            Subscribers
          </h1>
          <p className="text-muted-foreground">Manage alert bot subscribers</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold">{totalCount}</p>
            <p className="text-xs text-muted-foreground">Total Subscribers</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold">{activeCount}</p>
            <p className="text-xs text-muted-foreground">Active Subscribers</p>
          </div>
        </div>
      </div>

      <SubscribersTable subscribers={subscribers} channels={channels} />
    </div>
  );
}
