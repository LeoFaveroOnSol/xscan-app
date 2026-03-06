import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import TelegramChannelSidebar from '@/components/telegram/TelegramChannelSidebar';
import TelegramBestCoins from '@/components/telegram/TelegramBestCoins';
import TelegramTokensGrid from '@/components/telegram/TelegramTokensGrid';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ===========================================
// FEATURE FLAG: Set to true to enable V2
// ===========================================
const TELEGRAM_V2_ENABLED = true;
// ===========================================

interface Props {
  params: Promise<{ username: string }>;
}

async function getChannelData(username: string) {
  const supabase = await createClient();
  const cleanUsername = username.replace('@', '');

  const { data: channel, error: channelError } = await supabase
    .from('telegram_channels')
    .select('*')
    .eq('channel_username', cleanUsername)
    .eq('is_active', true)
    .single();

  if (channelError || !channel) {
    return null;
  }

  const { data: calls } = await supabase
    .from('telegram_calls')
    .select('*')
    .eq('channel_id', channel.id)
    .order('entry_timestamp', { ascending: false });

  return { channel, calls: calls || [] };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // If V2 is not enabled, show generic metadata
  if (!TELEGRAM_V2_ENABLED) {
    return {
      title: 'Telegram Channels - Coming in V2 - XSCAN',
      description: 'Track and analyze the performance of Telegram call channels. Coming soon in V2.',
    };
  }

  const { username } = await params;
  const data = await getChannelData(username);

  if (!data) {
    return {
      title: 'Channel Not Found - XSCAN',
    };
  }

  return {
    title: `${data.channel.display_name || data.channel.channel_username} - XSCAN Telegram`,
    description: `View ${data.channel.channel_username}'s crypto call performance. Winrate: ${data.channel.winrate.toFixed(1)}%, Total Calls: ${data.channel.total_calls}`,
  };
}

export default async function TelegramChannelPage({ params }: Props) {
  // Redirect to coming soon page if V2 is not enabled
  if (!TELEGRAM_V2_ENABLED) {
    redirect('/telegram');
  }

  const { username } = await params;
  const data = await getChannelData(username);

  if (!data) {
    notFound();
  }

  const { channel, calls } = data;

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        {/* Main Layout - Sidebar + Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Profile */}
          <TelegramChannelSidebar channel={channel} totalCalls={calls.length} calls={calls} />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Best Coins Pedestal */}
            <TelegramBestCoins calls={calls} />

            {/* All Tokens Grid */}
            <TelegramTokensGrid calls={calls} />
          </div>
        </div>
      </div>
    </div>
  );
}
