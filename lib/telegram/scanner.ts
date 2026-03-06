import { getTelegramClient, isTelegramConfigured } from './client';
import { Api } from 'telegram';

// Re-export for convenience
export { isTelegramConfigured };

// Contract address patterns
// Solana: base58, 32-44 chars (no 0, O, I, l)
const SOLANA_CONTRACT_REGEX = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;

// EVM (BSC, Base, ETH): 0x + 40 hex chars
const EVM_CONTRACT_REGEX = /0x[a-fA-F0-9]{40}/g;

// Chain types
export type ChainType = 'solana' | 'bsc' | 'base' | 'ethereum';

// Common false positives to filter out
const FALSE_POSITIVES_SOLANA = [
  'So11111111111111111111111111111111111111112', // Wrapped SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
];

const FALSE_POSITIVES_EVM = [
  '0x0000000000000000000000000000000000000000', // Zero address
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // Native token placeholder
  '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', // WBNB
  '0x55d398326f99059ff775485246999027b3197955', // BSC USDT
  '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', // BSC USDC
  '0x4200000000000000000000000000000000000006', // Base WETH
];

export interface TelegramMessage {
  id: number;
  text: string;
  date: Date;
  views: number;
  forwards: number;
  messageUrl: string;
}

export interface ExtractedContract {
  contractAddress: string;
  chain: ChainType;
  messageId: number;
  messageText: string;
  timestamp: Date;
  messageUrl: string;
  views: number;
}

export interface ChannelInfo {
  id: string;
  username: string;
  title: string;
  about: string | null;
  participantsCount: number;
  photo: string | null;
}

/**
 * Get channel info from username
 */
export async function getChannelInfo(username: string): Promise<ChannelInfo | null> {
  if (!isTelegramConfigured()) {
    console.log('[Telegram] Not configured, skipping channel info fetch');
    return null;
  }

  try {
    const client = await getTelegramClient();
    const cleanUsername = username.replace('@', '').replace('t.me/', '');

    const result = await client.invoke(
      new Api.channels.GetFullChannel({
        channel: cleanUsername,
      })
    );

    const channel = result.chats[0] as Api.Channel;
    const fullChannel = result.fullChat as Api.ChannelFull;

    // Try to get channel photo
    let photoUrl: string | null = null;
    try {
      if (channel.photo && 'photoId' in channel.photo) {
        // Download the profile photo
        const photo = await client.downloadProfilePhoto(channel, {
          isBig: false,
        });
        if (photo) {
          // Convert to base64 data URL
          const base64 = Buffer.from(photo).toString('base64');
          photoUrl = `data:image/jpeg;base64,${base64}`;
        }
      }
    } catch (photoError) {
      console.log('[Telegram] Could not download channel photo:', photoError);
    }

    return {
      id: channel.id.toString(),
      username: channel.username || cleanUsername,
      title: channel.title,
      about: fullChannel.about || null,
      participantsCount: fullChannel.participantsCount || 0,
      photo: photoUrl,
    };
  } catch (error) {
    console.error('[Telegram] Error getting channel info:', error);
    return null;
  }
}

/**
 * Get messages from a channel with pagination support
 * Uses offsetId to fetch all messages up to the limit
 * Telegram API returns max ~100 messages per request, so we paginate
 *
 * @param username - Channel username
 * @param limit - Maximum number of messages to fetch (0 = all messages)
 * @param sinceMessageId - Only fetch messages newer than this ID (for incremental scans)
 */
export async function getChannelMessages(
  username: string,
  limit: number = 100,
  sinceMessageId?: number
): Promise<TelegramMessage[]> {
  if (!isTelegramConfigured()) {
    console.log('[Telegram] Not configured, skipping message fetch');
    return [];
  }

  try {
    const client = await getTelegramClient();
    const cleanUsername = username.replace('@', '').replace('t.me/', '');

    const allMessages: TelegramMessage[] = [];
    let offsetId = 0;
    const batchSize = 100; // Telegram API max per request
    const maxLimit = limit === 0 ? Infinity : limit;

    console.log(`[Telegram] Fetching up to ${limit === 0 ? 'ALL' : limit} messages from ${cleanUsername}${sinceMessageId ? ` (since message ${sinceMessageId})` : ''}`);

    while (allMessages.length < maxLimit) {
      const remaining = maxLimit - allMessages.length;
      const fetchCount = Math.min(batchSize, remaining === Infinity ? batchSize : remaining);

      const messages = await client.getMessages(cleanUsername, {
        limit: fetchCount,
        offsetId,
      });

      if (!messages || messages.length === 0) {
        console.log(`[Telegram] No more messages to fetch (total: ${allMessages.length})`);
        break;
      }

      // Filter for incremental scan - stop when we reach already-scanned messages
      let reachedLastScanned = false;
      const textMessages = messages
        .filter((msg) => {
          // Skip if no text
          if (!msg.message) return false;
          // For incremental scans, stop at already-scanned messages
          if (sinceMessageId && msg.id <= sinceMessageId) {
            reachedLastScanned = true;
            return false;
          }
          return true;
        })
        .map((msg) => ({
          id: msg.id,
          text: msg.message || '',
          date: new Date(msg.date * 1000),
          views: (msg as any).views || 0,
          forwards: (msg as any).forwards || 0,
          messageUrl: `https://t.me/${cleanUsername}/${msg.id}`,
        }));

      allMessages.push(...textMessages);

      // If we reached already-scanned messages, stop
      if (reachedLastScanned) {
        console.log(`[Telegram] Reached last scanned message (${sinceMessageId}), stopping`);
        break;
      }

      // Set offset to the oldest message ID for next batch
      const lastMessage = messages[messages.length - 1];
      if (lastMessage) {
        offsetId = lastMessage.id;
      }

      console.log(`[Telegram] Fetched ${messages.length} messages (total: ${allMessages.length}, offset: ${offsetId})`);

      // If we got less than requested, we've reached the end
      if (messages.length < fetchCount) {
        console.log(`[Telegram] Reached end of channel history`);
        break;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`[Telegram] Total messages fetched: ${allMessages.length}`);
    return allMessages;
  } catch (error) {
    console.error('[Telegram] Error getting messages:', error);
    return [];
  }
}

/**
 * Detect chain from message context
 * Looks for chain indicators in the message text
 */
function detectChainFromContext(text: string): ChainType | null {
  const lowerText = text.toLowerCase();

  // BSC indicators
  if (
    lowerText.includes('bsc') ||
    lowerText.includes('binance') ||
    lowerText.includes('bnb') ||
    lowerText.includes('pancakeswap') ||
    lowerText.includes('bscscan')
  ) {
    return 'bsc';
  }

  // Base indicators
  if (
    lowerText.includes('base chain') ||
    lowerText.includes('on base') ||
    lowerText.includes('$base') ||
    lowerText.includes('basescan') ||
    lowerText.includes('aerodrome') ||
    lowerText.includes('/base') ||
    lowerText.includes('base/') ||
    lowerText.includes('(base)') ||
    lowerText.includes('[base]') ||
    /\bbase\b/.test(lowerText)
  ) {
    return 'base';
  }

  // Ethereum indicators
  if (
    lowerText.includes('ethereum') ||
    lowerText.includes('eth chain') ||
    lowerText.includes('uniswap') ||
    lowerText.includes('etherscan')
  ) {
    return 'ethereum';
  }

  // Solana indicators
  if (
    lowerText.includes('solana') ||
    lowerText.includes('$sol') ||
    lowerText.includes('raydium') ||
    lowerText.includes('jupiter') ||
    lowerText.includes('pump.fun') ||
    lowerText.includes('solscan')
  ) {
    return 'solana';
  }

  return null;
}

/**
 * Extract contract addresses from messages (Solana and EVM)
 */
export function extractContracts(messages: TelegramMessage[]): ExtractedContract[] {
  const contracts: ExtractedContract[] = [];
  const seenAddresses = new Set<string>();

  for (const msg of messages) {
    // Try to detect chain from message context
    const contextChain = detectChainFromContext(msg.text);

    // Extract Solana addresses
    const solanaMatches = msg.text.match(SOLANA_CONTRACT_REGEX) || [];
    for (const match of solanaMatches) {
      // Skip if already seen or is a false positive
      if (seenAddresses.has(match) || FALSE_POSITIVES_SOLANA.includes(match)) {
        continue;
      }

      // Basic validation: Solana addresses are typically 43-44 chars
      if (match.length < 32 || match.length > 44) {
        continue;
      }

      // Skip if it looks like it could be part of a URL or other non-address text
      // EVM addresses start with 0x so they won't match here

      seenAddresses.add(match);
      contracts.push({
        contractAddress: match,
        chain: contextChain === 'solana' || !contextChain ? 'solana' : contextChain,
        messageId: msg.id,
        messageText: msg.text.substring(0, 500),
        timestamp: msg.date,
        messageUrl: msg.messageUrl,
        views: msg.views,
      });
    }

    // Extract EVM addresses (BSC, Base, Ethereum)
    const evmMatches = msg.text.match(EVM_CONTRACT_REGEX) || [];
    for (const match of evmMatches) {
      const normalizedMatch = match.toLowerCase();

      // Skip if already seen or is a false positive
      if (seenAddresses.has(normalizedMatch) || FALSE_POSITIVES_EVM.includes(normalizedMatch)) {
        continue;
      }

      seenAddresses.add(normalizedMatch);

      // Determine chain - default to BSC if no context (most common for memecoins)
      let chain: ChainType = 'bsc';
      if (contextChain && contextChain !== 'solana') {
        chain = contextChain;
      }

      contracts.push({
        contractAddress: normalizedMatch,
        chain,
        messageId: msg.id,
        messageText: msg.text.substring(0, 500),
        timestamp: msg.date,
        messageUrl: msg.messageUrl,
        views: msg.views,
      });
    }
  }

  return contracts;
}

/**
 * Scan a channel for token calls
 *
 * @param username - Channel username
 * @param messageLimit - Maximum messages to scan (0 = ALL messages in channel history)
 * @param sinceMessageId - Only fetch messages newer than this ID (for incremental scans)
 */
export async function scanChannel(
  username: string,
  messageLimit: number = 0,
  sinceMessageId?: number
): Promise<{
  channelInfo: ChannelInfo | null;
  contracts: ExtractedContract[];
  messagesScanned: number;
  newestMessageId: number | null;
}> {
  console.log(`[Telegram] Scanning channel: ${username} (limit: ${messageLimit === 0 ? 'ALL' : messageLimit}${sinceMessageId ? `, since: ${sinceMessageId}` : ''})`);

  const channelInfo = await getChannelInfo(username);
  const messages = await getChannelMessages(username, messageLimit, sinceMessageId);
  const contracts = extractContracts(messages);

  // Get the newest message ID for tracking incremental scans
  const newestMessageId = messages.length > 0
    ? Math.max(...messages.map(m => m.id))
    : null;

  console.log(`[Telegram] Found ${contracts.length} contracts in ${messages.length} messages`);

  return {
    channelInfo,
    contracts,
    messagesScanned: messages.length,
    newestMessageId,
  };
}
