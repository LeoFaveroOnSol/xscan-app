import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { scanChannel, isTelegramConfigured, ChainType } from '@/lib/telegram/scanner';
import { getTokenData, DexScreenerChain } from '@/lib/api/dexscreener';
import { calculateMultiplier } from '@/lib/utils/calculations';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Force a full rescan of a Telegram channel
 * POST /api/admin/telegram/channels/[id]/rescan
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!isTelegramConfigured()) {
      return NextResponse.json(
        { error: 'Telegram is not configured' },
        { status: 503 }
      );
    }

    const supabase = await createAdminClient();

    // Get the channel
    const { data: channel, error: channelError } = await supabase
      .from('telegram_channels')
      .select('*')
      .eq('id', id)
      .single();

    if (channelError || !channel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      );
    }

    console.log(`[Telegram] Force rescan for @${channel.channel_username}`);

    // Reset the scan tracking fields to force a full scan
    await supabase
      .from('telegram_channels')
      .update({
        full_history_scanned: false,
        last_scanned_message_id: null,
      })
      .eq('id', id);

    // Perform full scan (no sinceMessageId = scan all)
    const scanResult = await scanChannel(channel.channel_username, 0);

    let callsCreated = 0;
    let callsSkipped = 0;

    // Process each detected contract
    for (const contract of scanResult.contracts) {
      // Check if call already exists
      const { data: existing } = await supabase
        .from('telegram_calls')
        .select('id')
        .eq('channel_id', id)
        .eq('token_address', contract.contractAddress)
        .single();

      if (existing) {
        callsSkipped++;
        continue;
      }

      // Fetch token data
      const dexChain: DexScreenerChain = contract.chain as DexScreenerChain;
      const tokenData = await getTokenData(contract.contractAddress, dexChain);

      if (!tokenData || !tokenData.marketCap) {
        console.log(`[Telegram] Skipping ${contract.contractAddress} (${contract.chain}) - No market data`);
        callsSkipped++;
        continue;
      }

      const entryMcap = tokenData.marketCap;
      const multiplier = calculateMultiplier(entryMcap, tokenData.marketCap);

      const { error: insertError } = await supabase
        .from('telegram_calls')
        .insert({
          channel_id: id,
          token_address: contract.contractAddress,
          token_symbol: tokenData.symbol || null,
          token_name: tokenData.name || null,
          token_image_url: tokenData.imageUrl || null,
          chain: contract.chain,
          entry_market_cap: entryMcap,
          entry_price: tokenData.price || null,
          entry_timestamp: contract.timestamp.toISOString(),
          current_market_cap: tokenData.marketCap,
          current_price: tokenData.price || null,
          ath_market_cap: tokenData.marketCap,
          ath_price: tokenData.price || null,
          ath_timestamp: new Date().toISOString(),
          current_multiplier: multiplier,
          ath_multiplier: multiplier,
          is_win: multiplier >= 2,
          status: 'active',
          message_id: contract.messageId.toString(),
          message_url: contract.messageUrl,
          message_text: contract.messageText.substring(0, 1000),
          detected_at: new Date().toISOString(),
          is_auto_detected: false,
          last_price_update: new Date().toISOString(),
        });

      if (insertError) {
        console.error('[Telegram] Error creating call:', insertError);
        callsSkipped++;
      } else {
        callsCreated++;
        console.log(`[Telegram] Created call for ${tokenData.symbol || contract.contractAddress} (${contract.chain})`);
      }
    }

    // Update channel with scan results
    const updateData: Record<string, any> = {
      last_scan_at: new Date().toISOString(),
      full_history_scanned: true,
      updated_at: new Date().toISOString(),
    };

    if (scanResult.newestMessageId) {
      updateData.last_scanned_message_id = scanResult.newestMessageId;
    }

    if (scanResult.channelInfo) {
      updateData.channel_id = scanResult.channelInfo.id;
      updateData.display_name = scanResult.channelInfo.title;
      updateData.description = scanResult.channelInfo.about;
      updateData.member_count = scanResult.channelInfo.participantsCount;
      if (scanResult.channelInfo.photo) {
        updateData.profile_image_url = scanResult.channelInfo.photo;
      }
    }

    await supabase
      .from('telegram_channels')
      .update(updateData)
      .eq('id', id);

    return NextResponse.json({
      success: true,
      messagesScanned: scanResult.messagesScanned,
      contractsFound: scanResult.contracts.length,
      callsCreated,
      callsSkipped,
    });
  } catch (error) {
    console.error('[Telegram] Rescan error:', error);
    return NextResponse.json(
      { error: 'Failed to rescan channel', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
