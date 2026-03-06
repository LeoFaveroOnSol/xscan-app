import { NextRequest, NextResponse } from 'next/server';
import { getChannelInfo, scanChannel, isTelegramConfigured } from '@/lib/telegram/scanner';

/**
 * Scan a Telegram channel to get info and preview messages
 * POST /api/admin/telegram/scan
 */
export async function POST(request: NextRequest) {
  try {
    if (!isTelegramConfigured()) {
      return NextResponse.json(
        { error: 'Telegram is not configured. Please set TELEGRAM_API_ID, TELEGRAM_API_HASH, and TELEGRAM_SESSION.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { channel_username } = body;

    if (!channel_username) {
      return NextResponse.json(
        { error: 'Channel username is required' },
        { status: 400 }
      );
    }

    const cleanUsername = channel_username.replace('@', '').replace('t.me/', '');

    // Scan channel - limit to 50 messages for preview
    const result = await scanChannel(cleanUsername, 50);

    return NextResponse.json({
      success: true,
      channelInfo: result.channelInfo,
      messagesScanned: result.messagesScanned,
      contractsFound: result.contracts.length,
    });
  } catch (error) {
    console.error('[Telegram] Scan error:', error);
    return NextResponse.json(
      { error: 'Failed to scan channel', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
