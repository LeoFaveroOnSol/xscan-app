/**
 * Script to clean Motion Calls channel - keep only popstick call
 * Run with: npx tsx scripts/clean-motion-calls.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 1. Find "Motion Calls" channel (try different name variations)
  console.log('Looking for Motion Calls channel...');

  const { data: channels, error: channelError } = await supabase
    .from('telegram_channels')
    .select('id, channel_username, display_name')
    .or('display_name.ilike.%motion%,channel_username.ilike.%motion%');

  if (channelError) {
    console.error('Error finding channel:', channelError);
    process.exit(1);
  }

  if (!channels || channels.length === 0) {
    console.log('No Motion Calls channel found. Listing all channels:');
    const { data: allChannels } = await supabase
      .from('telegram_channels')
      .select('id, channel_username, display_name');
    console.log(allChannels);
    process.exit(1);
  }

  console.log('Found channels:', channels);
  const channel = channels[0];
  const channelId = channel.id;

  // 2. Get all calls for this channel
  const { data: calls, error: callsError } = await supabase
    .from('telegram_calls')
    .select('id, token_symbol, token_name')
    .eq('channel_id', channelId);

  if (callsError) {
    console.error('Error fetching calls:', callsError);
    process.exit(1);
  }

  console.log(`\nFound ${calls?.length || 0} calls for ${channel.display_name || channel.channel_username}:`);
  calls?.forEach(c => console.log(`  - ${c.token_symbol} (${c.token_name})`));

  // 3. Find popstick call
  const popstickCall = calls?.find(c =>
    c.token_symbol?.toLowerCase().includes('popstick') ||
    c.token_name?.toLowerCase().includes('popstick')
  );

  if (!popstickCall) {
    console.error('\nNo popstick call found! Aborting.');
    process.exit(1);
  }

  console.log(`\nKeeping: ${popstickCall.token_symbol} (${popstickCall.token_name})`);

  // 4. Delete all calls except popstick
  const callsToDelete = calls?.filter(c => c.id !== popstickCall.id) || [];
  console.log(`\nDeleting ${callsToDelete.length} calls...`);

  const { error: deleteError, count } = await supabase
    .from('telegram_calls')
    .delete()
    .eq('channel_id', channelId)
    .neq('id', popstickCall.id);

  if (deleteError) {
    console.error('Error deleting calls:', deleteError);
    process.exit(1);
  }

  console.log(`✓ Deleted ${callsToDelete.length} calls`);

  // 5. Recalculate channel stats
  console.log('\nRecalculating channel stats...');

  const { data: remainingCalls } = await supabase
    .from('telegram_calls')
    .select('ath_multiplier, is_win')
    .eq('channel_id', channelId);

  if (remainingCalls && remainingCalls.length > 0) {
    const totalCalls = remainingCalls.length;
    const winningCalls = remainingCalls.filter(c => c.is_win).length;
    const avgMultiplier = remainingCalls.reduce((acc, c) => acc + (c.ath_multiplier || 1), 0) / totalCalls;
    const bestMultiplier = Math.max(...remainingCalls.map(c => c.ath_multiplier || 1));
    const winrate = Math.round((winningCalls / totalCalls) * 100 * 100) / 100;

    await supabase
      .from('telegram_channels')
      .update({
        total_calls: totalCalls,
        winning_calls: winningCalls,
        winrate,
        avg_multiplier: Math.round(avgMultiplier * 100) / 100,
        best_multiplier: Math.round(bestMultiplier * 100) / 100,
        updated_at: new Date().toISOString(),
      })
      .eq('id', channelId);

    console.log(`✓ Updated channel stats: ${totalCalls} calls, ${winrate}% winrate`);
  }

  console.log('\n✅ Done! Motion Calls now only has the popstick call.');
}

main().catch(console.error);
