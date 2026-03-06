import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getMultipleTokensData, DexScreenerChain } from '@/lib/api/dexscreener';

// Supported chains
const SUPPORTED_CHAINS: DexScreenerChain[] = ['solana', 'bsc', 'base', 'ethereum'];

/**
 * Update token images for Telegram calls that are missing images
 * GET/POST /api/cron/update-telegram-images
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret (optional)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Telegram] 🖼️ Starting image update');

    const supabase = createServiceClient();

    // Get calls with missing images
    // Note: .eq.'') checks for empty string, .is.null checks for NULL
    const { data: calls, error: callsError } = await supabase
      .from('telegram_calls')
      .select('id, token_address, token_symbol, token_image_url, chain')
      .or('token_image_url.is.null,token_image_url.eq.');

    console.log(`[Telegram] Query returned ${calls?.length || 0} calls with missing images`);

    if (callsError) {
      console.error('[Telegram] Error fetching calls:', callsError);
      return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 });
    }

    if (!calls || calls.length === 0) {
      console.log('[Telegram] No calls need image updates');
      return NextResponse.json({
        message: 'No calls need image updates',
        updated: 0,
      });
    }

    console.log(`[Telegram] Found ${calls.length} calls needing images`);

    // Group calls by chain
    const callsByChain = new Map<DexScreenerChain, typeof calls>();
    for (const call of calls) {
      const chain = (call.chain || 'solana') as DexScreenerChain;
      if (!callsByChain.has(chain)) {
        callsByChain.set(chain, []);
      }
      callsByChain.get(chain)!.push(call);
    }

    // Fetch token data for each chain
    const tokenDataMap = new Map<string, any>();

    for (const chain of SUPPORTED_CHAINS) {
      const chainCalls = callsByChain.get(chain);
      if (!chainCalls || chainCalls.length === 0) continue;

      const uniqueAddresses = Array.from(new Set(chainCalls.map((c) => c.token_address)));
      console.log(`[Telegram] Fetching images for ${uniqueAddresses.length} tokens on ${chain}`);

      const chainTokenData = await getMultipleTokensData(uniqueAddresses, chain);

      for (const [addr, data] of Array.from(chainTokenData.entries())) {
        tokenDataMap.set(`${chain}:${addr.toLowerCase()}`, data);
      }
    }

    let updated = 0;
    let errors = 0;
    let noImageFound = 0;
    const updatedTokens: string[] = [];
    const tokensWithoutImage: string[] = [];

    // Update each call with image
    for (const call of calls) {
      const chain = (call.chain || 'solana') as DexScreenerChain;
      const tokenData = tokenDataMap.get(`${chain}:${call.token_address.toLowerCase()}`);

      if (!tokenData) {
        noImageFound++;
        tokensWithoutImage.push(`${call.token_symbol || call.token_address.slice(0, 8)} (not found)`);
        console.log(`[Telegram] Token data not found for ${call.token_address} (${chain})`);
        continue;
      }

      if (!tokenData.imageUrl) {
        noImageFound++;
        tokensWithoutImage.push(`${tokenData.symbol || call.token_address.slice(0, 8)} (no image)`);
        console.log(`[Telegram] No image URL for ${tokenData.symbol || call.token_address} (${chain})`);
        continue;
      }

      const { error: updateError } = await supabase
        .from('telegram_calls')
        .update({
          token_image_url: tokenData.imageUrl,
          token_symbol: tokenData.symbol || call.token_symbol,
          token_name: tokenData.name || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', call.id);

      if (updateError) {
        errors++;
        console.error(`[Telegram] Failed to update image for ${call.token_address}:`, updateError);
      } else {
        updated++;
        updatedTokens.push(tokenData.symbol || call.token_address.slice(0, 8));
        console.log(`[Telegram] Updated image for ${tokenData.symbol || call.token_address} (${chain}) - ${tokenData.imageUrl}`);
      }
    }

    const duration = Date.now() - startTime;

    console.log(`[Telegram] ✅ Image update completed in ${duration}ms - ${updated} updated, ${noImageFound} no image, ${errors} errors`);

    return NextResponse.json({
      message: 'Telegram images updated',
      totalCalls: calls.length,
      updated,
      noImageFound,
      errors,
      updatedTokens,
      tokensWithoutImage,
      durationMs: duration,
    });
  } catch (error) {
    console.error('[Telegram] Image update failed:', error);
    return NextResponse.json({
      error: 'Image update failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
