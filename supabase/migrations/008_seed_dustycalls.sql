-- Seed dustycalls Telegram channel
-- Run this after applying 005_telegram_channels.sql

INSERT INTO telegram_channels (
    channel_username,
    display_name,
    description,
    member_count,
    total_calls,
    winning_calls,
    winrate,
    avg_multiplier,
    best_multiplier,
    is_verified,
    is_active,
    is_auto_monitored
) VALUES (
    'dustycalls',
    'Dusty Calls',
    'Solana token calls channel',
    0,
    0,
    0,
    0,
    0,
    0,
    false,
    true,
    true
) ON CONFLICT (channel_username) DO NOTHING;
