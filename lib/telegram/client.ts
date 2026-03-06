import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';

// Telegram API credentials - get from https://my.telegram.org
const API_ID = parseInt(process.env.TELEGRAM_API_ID || '0');
const API_HASH = process.env.TELEGRAM_API_HASH || '';
const SESSION_STRING = process.env.TELEGRAM_SESSION_STRING || '';

let client: TelegramClient | null = null;

/**
 * Get or create Telegram client instance
 * Uses StringSession for serverless environments
 */
export async function getTelegramClient(): Promise<TelegramClient> {
  if (!API_ID || !API_HASH) {
    throw new Error('Telegram API credentials not configured. Set TELEGRAM_API_ID and TELEGRAM_API_HASH.');
  }

  if (client && client.connected) {
    return client;
  }

  const session = new StringSession(SESSION_STRING);

  client = new TelegramClient(session, API_ID, API_HASH, {
    connectionRetries: 3,
    useWSS: true,
  });

  await client.connect();

  return client;
}

/**
 * Check if Telegram is configured
 */
export function isTelegramConfigured(): boolean {
  return !!(API_ID && API_HASH && SESSION_STRING);
}

/**
 * Disconnect Telegram client
 */
export async function disconnectTelegram(): Promise<void> {
  if (client) {
    await client.disconnect();
    client = null;
  }
}
