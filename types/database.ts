export interface KOL {
  id: string;
  twitter_handle: string;
  display_name: string | null;
  bio: string | null;
  profile_image_url: string | null;
  follower_count: number;
  wallet_address: string | null;
  total_calls: number;
  winning_calls: number;
  winrate: number;
  avg_multiplier: number;
  best_multiplier: number;
  is_verified: boolean;
  is_active: boolean;
  featured_rank: number | null;
  // Automation fields
  is_auto_monitored: boolean;
  last_scan_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Call {
  id: string;
  kol_id: string;
  token_address: string;
  token_symbol: string | null;
  token_name: string | null;
  token_image_url: string | null;
  entry_market_cap: number;
  entry_price: number | null;
  entry_timestamp: string;
  current_market_cap: number | null;
  current_price: number | null;
  ath_market_cap: number | null;
  ath_price: number | null;
  ath_timestamp: string | null;
  current_multiplier: number;
  ath_multiplier: number;
  is_win: boolean;
  status: 'active' | 'rugged' | 'delisted';
  tweet_url: string | null;
  notes: string | null;
  // Automation fields
  tweet_id: string | null;
  detected_at: string | null;
  is_auto_detected: boolean;
  monitoring_until: string | null;
  created_at: string;
  updated_at: string;
  last_price_update: string | null;
  // Additional fields
  is_deleted: boolean;
  source: string | null;
  deleted_tweet_data: Record<string, unknown> | null;
}

export interface ScanLog {
  id: string;
  scan_type: 'tweets' | 'prices' | 'manual';
  started_at: string;
  completed_at: string | null;
  kols_scanned: number;
  tweets_found: number;
  calls_created: number;
  calls_skipped: number;
  errors: number;
  details: any;
  error_message: string | null;
  status: 'running' | 'completed' | 'failed';
}

export interface Application {
  id: string;
  twitter_handle: string;
  wallet_address: string | null;
  display_name: string | null;
  bio: string | null;
  follower_count: number | null;
  proof_of_calls: string | null;
  additional_info: string | null;
  wallet_signature: string | null;
  hide_wallet: boolean;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Admin {
  id: string;
  email: string;
  display_name: string | null;
  role: 'admin' | 'super_admin';
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface PriceHistory {
  id: string;
  call_id: string;
  market_cap: number | null;
  price: number | null;
  multiplier: number | null;
  recorded_at: string;
}

// =============================================================================
// Telegram Types
// =============================================================================

export interface TelegramChannel {
  id: string;
  channel_id: string | null;
  channel_username: string;
  display_name: string | null;
  description: string | null;
  profile_image_url: string | null;
  member_count: number;
  total_calls: number;
  winning_calls: number;
  winrate: number;
  avg_multiplier: number;
  best_multiplier: number;
  is_verified: boolean;
  is_active: boolean;
  featured_rank: number | null;
  is_auto_monitored: boolean;
  last_scan_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TelegramCall {
  id: string;
  channel_id: string;
  token_address: string;
  token_symbol: string | null;
  token_name: string | null;
  token_image_url: string | null;
  entry_market_cap: number;
  entry_price: number | null;
  entry_timestamp: string;
  current_market_cap: number | null;
  current_price: number | null;
  ath_market_cap: number | null;
  ath_price: number | null;
  ath_timestamp: string | null;
  current_multiplier: number;
  ath_multiplier: number;
  is_win: boolean;
  status: 'active' | 'rugged' | 'delisted';
  message_id: string | null;
  message_url: string | null;
  message_text: string | null;
  notes: string | null;
  detected_at: string | null;
  is_auto_detected: boolean;
  monitoring_until: string | null;
  created_at: string;
  updated_at: string;
  last_price_update: string | null;
}

export interface TelegramScanLog {
  id: string;
  scan_type: 'messages' | 'prices' | 'manual';
  started_at: string;
  completed_at: string | null;
  channels_scanned: number;
  messages_found: number;
  calls_created: number;
  calls_skipped: number;
  errors: number;
  details: any;
  error_message: string | null;
  status: 'running' | 'completed' | 'failed';
}

// Extended Telegram types
export interface TelegramChannelWithCalls extends TelegramChannel {
  calls: TelegramCall[];
}

export interface TelegramCallWithChannel extends TelegramCall {
  channel: TelegramChannel;
}

export interface TelegramChannelsResponse {
  channels: TelegramChannel[];
  total: number;
  page: number;
  limit: number;
}

// Extended types with relations
export interface KOLWithCalls extends KOL {
  calls: Call[];
}

export interface CallWithKOL extends Call {
  kol: KOL;
}

// API response types
export interface KOLsResponse {
  kols: KOL[];
  total: number;
  page: number;
  limit: number;
}

export interface TokenData {
  address: string;
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  liquidity: number;
  priceChange24h: number;
  volume24h: number;
  imageUrl?: string;
}
