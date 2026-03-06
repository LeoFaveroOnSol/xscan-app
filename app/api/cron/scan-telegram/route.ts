import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { scanChannel, isTelegramConfigured, ChainType } from '@/lib/telegram/scanner';
import { getTokenData, DexScreenerChain } from '@/lib/api/dexscreener';
import { calculateMultiplier } from '@/lib/utils/calculations';
import { getHistoricalPrice, toGeckoNetwork, GeckoTerminalNetwork } from '@/lib/api/geckoterminal';

// Create Supabase admin client
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Create a scan log entry
 */
async function createScanLog() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('telegram_scan_logs')
    .insert({
      scan_type: 'messages',
      status: 'running',
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Telegram] Failed to create scan log', error);
    return null;
  }

  return data.id;
}

/**
 * Update scan log with results
 */
async function updateScanLog(
  logId: string,
  results: {
    channelsScanned: number;
    messagesFound: number;
    callsCreated: number;
    callsSkipped: number;
    errors: number;
    details?: any;
    errorMessage?: string;
    status: 'completed' | 'failed';
  }
) {
  const supabase = getSupabaseAdmin();

  await supabase
    .from('telegram_scan_logs')
    .update({
      completed_at: new Date().toISOString(),
      channels_scanned: results.channelsScanned,
      messages_found: results.messagesFound,
      calls_created: results.callsCreated,
      calls_skipped: results.callsSkipped,
      errors: results.errors,
      details: results.details,
      error_message: results.errorMessage,
      status: results.status,
    })
    .eq('id', logId);
}

/**
 * Get monitored Telegram channels
 */
async function getMonitoredChannels() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('telegram_channels')
    .select('*')
    .eq('is_active', true)
    .eq('is_auto_monitored', true);

  if (error) {
    console.error('[Telegram] Error fetching monitored channels:', error);
    return [];
  }

  return data || [];
}

/**
 * Update channel's last scan timestamp
 */
async function updateLastScan(channelId: string) {
  const supabase = getSupabaseAdmin();

  await supabase
    .from('telegram_channels')
    .update({
      last_scan_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', channelId);
}

/**
 * Check if a call already exists for this token
 */
async function callExists(channelId: string, tokenAddress: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('telegram_calls')
    .select('id')
    .eq('channel_id', channelId)
    .eq('token_address', tokenAddress)
    .single();

  return !!data && !error;
}

/**
 * Create a new call from detected contract
 */
async function createCall(
  channelId: string,
  contract: {
    contractAddress: string;
    chain: ChainType;
    messageId: number;
    messageText: string;
    timestamp: Date;
    messageUrl: string;
    views: number;
  }
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  try {
    // Map chain type to DexScreener chain
    const dexChain: DexScreenerChain = contract.chain as DexScreenerChain;

    // Fetch token data from DexScreener with correct chain
    const tokenData = await getTokenData(contract.contractAddress, dexChain);

    if (!tokenData || !tokenData.marketCap) {
      console.log(`[Telegram] Skipping ${contract.contractAddress} (${contract.chain}) - No market data`);
      return false;
    }

    let entryMcap = tokenData.marketCap;
    let entryPrice = tokenData.price || 0;

    // If message is older than 5 minutes, try to get historical price at message time
    const messageAgeMs = Date.now() - contract.timestamp.getTime();
    if (messageAgeMs > 5 * 60 * 1000 && tokenData.price > 0) {
      try {
        const chain = contract.chain as string;
        const geckoNetwork = toGeckoNetwork(chain) || (chain === 'solana' ? 'solana' as GeckoTerminalNetwork : null);
        if (geckoNetwork) {
          const targetTime = Math.floor(contract.timestamp.getTime() / 1000);
          const historical = await getHistoricalPrice(contract.contractAddress, geckoNetwork, targetTime);
          if (historical && historical.price > 0) {
            // Calculate historical mcap from price ratio
            const priceRatio = historical.price / tokenData.price;
            const historicalMcap = Math.round(tokenData.marketCap * priceRatio);
            // Sanity check: historical entry should not be more than 10x current MC
            if (historicalMcap > 0 && historicalMcap <= tokenData.marketCap * 10) {
              entryMcap = historicalMcap;
              entryPrice = historical.price;
              console.log(`[Telegram] 📊 Historical entry for ${tokenData.symbol}: $${(historicalMcap/1000).toFixed(1)}K (current $${(tokenData.marketCap/1000).toFixed(1)}K)`);
            }
          }
        }
      } catch (err) {
        // Silent fail - use current price as fallback
        console.log(`[Telegram] Historical price lookup failed for ${contract.contractAddress}, using current`);
      }
    }

    const multiplier = calculateMultiplier(entryMcap, tokenData.marketCap);

    const { error } = await supabase
      .from('telegram_calls')
      .insert({
        channel_id: channelId,
        token_address: contract.contractAddress,
        token_symbol: tokenData.symbol || null,
        token_name: tokenData.name || null,
        token_image_url: tokenData.imageUrl || null,
        chain: contract.chain,
        entry_market_cap: entryMcap,
        entry_price: entryPrice || null,
        entry_timestamp: contract.timestamp.toISOString(),
        current_market_cap: tokenData.marketCap,
        current_price: tokenData.price || null,
        ath_market_cap: Math.max(entryMcap, tokenData.marketCap),
        ath_price: entryMcap > tokenData.marketCap ? (entryPrice || tokenData.price || null) : (tokenData.price || null),
        ath_timestamp: entryMcap > tokenData.marketCap ? contract.timestamp.toISOString() : new Date().toISOString(),
        current_multiplier: multiplier,
        ath_multiplier: Math.max(1, multiplier),
        is_win: multiplier >= 2,
        status: 'active',
        message_id: contract.messageId.toString(),
        message_url: contract.messageUrl,
        message_text: contract.messageText.substring(0, 1000),
        detected_at: new Date().toISOString(),
        is_auto_detected: true,
        last_price_update: new Date().toISOString(),
      });

    if (error) {
      console.error('[Telegram] Error creating call:', error);
      return false;
    }

    console.log(`[Telegram] Created call for ${tokenData.symbol || contract.contractAddress} (${contract.chain})`);
    return true;
  } catch (error) {
    console.error('[Telegram] Error processing contract:', error);
    return false;
  }
}

/**
 * Main Telegram scanning cron job
 * Scans messages from all monitored channels and processes detected contract addresses
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Telegram is configured
    if (!isTelegramConfigured()) {
      console.log('[Telegram] Not configured - skipping scan');
      return NextResponse.json({
        message: 'Telegram not configured',
        error: 'Set TELEGRAM_API_ID, TELEGRAM_API_HASH, and TELEGRAM_SESSION_STRING',
      }, { status: 400 });
    }

    console.log('[Telegram] 🚀 Starting channel scan cron job');

    // Create scan log
    const scanLogId = await createScanLog();

    // Get all monitored channels
    const monitoredChannels = await getMonitoredChannels();

    if (monitoredChannels.length === 0) {
      console.log('[Telegram] No monitored channels found');

      if (scanLogId) {
        await updateScanLog(scanLogId, {
          channelsScanned: 0,
          messagesFound: 0,
          callsCreated: 0,
          callsSkipped: 0,
          errors: 0,
          status: 'completed',
        });
      }

      return NextResponse.json({
        message: 'No monitored channels',
        channelsScanned: 0,
        messagesFound: 0,
        callsCreated: 0,
      });
    }

    console.log(`[Telegram] Found ${monitoredChannels.length} monitored channels`);

    // Aggregate results
    let totalMessagesFound = 0;
    let totalCallsCreated = 0;
    let totalCallsSkipped = 0;
    let totalErrors = 0;
    const detailedResults: any[] = [];

    // Process each channel
    for (const channel of monitoredChannels) {
      console.log(`[Telegram] Scanning @${channel.channel_username}...`);

      try {
        // Determine if we need full scan or incremental
        const isFullScan = !channel.full_history_scanned;
        const sinceMessageId = isFullScan ? undefined : channel.last_scanned_message_id;

        console.log(`[Telegram] @${channel.channel_username}: ${isFullScan ? 'FULL SCAN' : 'Incremental scan'}${sinceMessageId ? ` (since msg ${sinceMessageId})` : ''}`);

        // Scan channel for contracts
        // Full scan: 0 = ALL messages
        // Incremental: 0 = all new messages since last scan
        const scanResult = await scanChannel(channel.channel_username, 0, sinceMessageId);

        totalMessagesFound += scanResult.messagesScanned;

        console.log(`[Telegram] @${channel.channel_username}: ${scanResult.contracts.length} contracts found in ${scanResult.messagesScanned} messages`);

        let channelCallsCreated = 0;
        let channelCallsSkipped = 0;

        // Process each detected contract
        for (const contract of scanResult.contracts) {
          // Check if call already exists
          const exists = await callExists(channel.id, contract.contractAddress);

          if (exists) {
            channelCallsSkipped++;
            continue;
          }

          // Create new call
          const created = await createCall(channel.id, contract);
          if (created) {
            channelCallsCreated++;
          } else {
            channelCallsSkipped++;
          }
        }

        totalCallsCreated += channelCallsCreated;
        totalCallsSkipped += channelCallsSkipped;

        // Update channel info and scan tracking
        const supabase = getSupabaseAdmin();
        const updateData: any = {
          updated_at: new Date().toISOString(),
        };

        // Update channel info if available
        if (scanResult.channelInfo) {
          updateData.channel_id = scanResult.channelInfo.id;
          updateData.display_name = scanResult.channelInfo.title;
          updateData.description = scanResult.channelInfo.about;
          updateData.member_count = scanResult.channelInfo.participantsCount;
          // Only update photo if we got one
          if (scanResult.channelInfo.photo) {
            updateData.profile_image_url = scanResult.channelInfo.photo;
          }
        }

        // Update incremental scan tracking
        if (scanResult.newestMessageId) {
          updateData.last_scanned_message_id = scanResult.newestMessageId;
        }
        // Mark as full history scanned if this was a full scan
        if (isFullScan) {
          updateData.full_history_scanned = true;
        }

        await supabase
          .from('telegram_channels')
          .update(updateData)
          .eq('id', channel.id);

        detailedResults.push({
          channel: channel.channel_username,
          messagesScanned: scanResult.messagesScanned,
          contractsFound: scanResult.contracts.length,
          callsCreated: channelCallsCreated,
          callsSkipped: channelCallsSkipped,
        });

        // Update last scan timestamp
        await updateLastScan(channel.id);

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Telegram] Error processing @${channel.channel_username}: ${errorMsg}`);
        totalErrors++;
      }
    }

    const duration = Date.now() - startTime;

    // Update scan log
    if (scanLogId) {
      await updateScanLog(scanLogId, {
        channelsScanned: monitoredChannels.length,
        messagesFound: totalMessagesFound,
        callsCreated: totalCallsCreated,
        callsSkipped: totalCallsSkipped,
        errors: totalErrors,
        details: detailedResults,
        status: 'completed',
      });
    }

    console.log(`[Telegram] ✅ Channel scan completed in ${duration}ms`);
    console.log(`[Telegram] Results: ${totalCallsCreated} calls created, ${totalCallsSkipped} skipped, ${totalErrors} errors`);

    return NextResponse.json({
      message: 'Telegram scan completed',
      channelsScanned: monitoredChannels.length,
      messagesFound: totalMessagesFound,
      callsCreated: totalCallsCreated,
      callsSkipped: totalCallsSkipped,
      errors: totalErrors,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Telegram] Channel scan cron failed: ${errorMsg}`);

    return NextResponse.json({
      error: 'Telegram scan failed',
      message: errorMsg,
    }, { status: 500 });
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
