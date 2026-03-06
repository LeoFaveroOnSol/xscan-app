-- XSCAN Telegram Channels Schema
-- Migration to add Telegram channel tracking

-- =============================================================================
-- Telegram Channels Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS telegram_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Channel info
    channel_id VARCHAR(100) UNIQUE,  -- Telegram channel ID (numeric)
    channel_username VARCHAR(100) NOT NULL UNIQUE,  -- @channel_username
    display_name VARCHAR(200),
    description TEXT,
    profile_image_url TEXT,
    member_count INTEGER DEFAULT 0,

    -- Cached stats (updated via triggers)
    total_calls INTEGER DEFAULT 0,
    winning_calls INTEGER DEFAULT 0,
    winrate DECIMAL(5,2) DEFAULT 0,
    avg_multiplier DECIMAL(10,2) DEFAULT 0,
    best_multiplier DECIMAL(10,2) DEFAULT 0,

    -- Status
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    featured_rank INTEGER,

    -- Automation
    is_auto_monitored BOOLEAN DEFAULT false,
    last_scan_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_channels_username ON telegram_channels(channel_username);
CREATE INDEX IF NOT EXISTS idx_telegram_channels_winrate ON telegram_channels(winrate DESC);
CREATE INDEX IF NOT EXISTS idx_telegram_channels_avg_multiplier ON telegram_channels(avg_multiplier DESC);
CREATE INDEX IF NOT EXISTS idx_telegram_channels_is_active ON telegram_channels(is_active);
CREATE INDEX IF NOT EXISTS idx_telegram_channels_is_auto_monitored ON telegram_channels(is_auto_monitored);

-- =============================================================================
-- Telegram Calls Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS telegram_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES telegram_channels(id) ON DELETE CASCADE,

    -- Token info
    token_address VARCHAR(44) NOT NULL,
    token_symbol VARCHAR(20),
    token_name VARCHAR(100),
    token_image_url TEXT,

    -- Entry data (when called)
    entry_market_cap DECIMAL(20,2) NOT NULL,
    entry_price DECIMAL(30,18),
    entry_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Current/ATH data (updated periodically)
    current_market_cap DECIMAL(20,2),
    current_price DECIMAL(30,18),
    ath_market_cap DECIMAL(20,2),
    ath_price DECIMAL(30,18),
    ath_timestamp TIMESTAMP WITH TIME ZONE,

    -- Calculated metrics
    current_multiplier DECIMAL(10,2) DEFAULT 1,
    ath_multiplier DECIMAL(10,2) DEFAULT 1,
    is_win BOOLEAN DEFAULT false,  -- true if ath_multiplier >= 2

    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, rugged, delisted

    -- Source
    message_id VARCHAR(100),  -- Telegram message ID
    message_url TEXT,  -- Link to the message
    message_text TEXT,  -- Original message content
    notes TEXT,

    -- Automation
    detected_at TIMESTAMP WITH TIME ZONE,
    is_auto_detected BOOLEAN DEFAULT false,
    monitoring_until TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_price_update TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_telegram_calls_channel_id ON telegram_calls(channel_id);
CREATE INDEX IF NOT EXISTS idx_telegram_calls_token_address ON telegram_calls(token_address);
CREATE INDEX IF NOT EXISTS idx_telegram_calls_entry_timestamp ON telegram_calls(entry_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telegram_calls_ath_multiplier ON telegram_calls(ath_multiplier DESC);
CREATE INDEX IF NOT EXISTS idx_telegram_calls_status ON telegram_calls(status);
CREATE INDEX IF NOT EXISTS idx_telegram_calls_message_id ON telegram_calls(message_id);
CREATE INDEX IF NOT EXISTS idx_telegram_calls_is_auto_detected ON telegram_calls(is_auto_detected);

-- =============================================================================
-- Telegram Scan Logs Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS telegram_scan_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_type VARCHAR(20) NOT NULL, -- 'messages', 'prices', 'manual'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    channels_scanned INTEGER DEFAULT 0,
    messages_found INTEGER DEFAULT 0,
    calls_created INTEGER DEFAULT 0,
    calls_skipped INTEGER DEFAULT 0,
    errors INTEGER DEFAULT 0,
    details JSONB,
    error_message TEXT,
    status VARCHAR(20) DEFAULT 'running' -- running, completed, failed
);

CREATE INDEX IF NOT EXISTS idx_telegram_scan_logs_status ON telegram_scan_logs(status);
CREATE INDEX IF NOT EXISTS idx_telegram_scan_logs_started_at ON telegram_scan_logs(started_at DESC);

-- =============================================================================
-- Row Level Security (RLS) Policies
-- =============================================================================

-- Enable RLS
ALTER TABLE telegram_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_scan_logs ENABLE ROW LEVEL SECURITY;

-- Telegram Channels: Public read for active channels
CREATE POLICY "Telegram channels are viewable by everyone" ON telegram_channels
    FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage telegram channels" ON telegram_channels
    FOR ALL USING (auth.role() = 'service_role');

-- Telegram Calls: Public read
CREATE POLICY "Telegram calls are viewable by everyone" ON telegram_calls
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage telegram calls" ON telegram_calls
    FOR ALL USING (auth.role() = 'service_role');

-- Telegram Scan Logs: Service role only
CREATE POLICY "Service role can manage telegram scan logs" ON telegram_scan_logs
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- Database Functions
-- =============================================================================

-- Function to recalculate Telegram channel stats
CREATE OR REPLACE FUNCTION recalculate_telegram_channel_stats(channel_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE telegram_channels SET
        total_calls = (SELECT COUNT(*) FROM telegram_calls WHERE channel_id = channel_uuid),
        winning_calls = (SELECT COUNT(*) FROM telegram_calls WHERE channel_id = channel_uuid AND is_win = true),
        winrate = COALESCE(
            (SELECT COUNT(*) FILTER (WHERE is_win = true)::DECIMAL / NULLIF(COUNT(*), 0) * 100
             FROM telegram_calls WHERE channel_id = channel_uuid), 0
        ),
        avg_multiplier = COALESCE(
            (SELECT AVG(ath_multiplier) FROM telegram_calls WHERE channel_id = channel_uuid), 0
        ),
        best_multiplier = COALESCE(
            (SELECT MAX(ath_multiplier) FROM telegram_calls WHERE channel_id = channel_uuid), 0
        ),
        updated_at = NOW()
    WHERE id = channel_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update channel stats when calls change
CREATE OR REPLACE FUNCTION update_telegram_channel_stats_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM recalculate_telegram_channel_stats(OLD.channel_id);
        RETURN OLD;
    ELSE
        PERFORM recalculate_telegram_channel_stats(NEW.channel_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS telegram_calls_stats_trigger ON telegram_calls;
CREATE TRIGGER telegram_calls_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON telegram_calls
FOR EACH ROW EXECUTE FUNCTION update_telegram_channel_stats_trigger();

-- Function to set monitoring period for telegram calls (48 hours)
CREATE OR REPLACE FUNCTION set_telegram_call_monitoring()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.monitoring_until IS NULL THEN
        NEW.monitoring_until := NEW.entry_timestamp + INTERVAL '48 hours';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS telegram_call_monitoring_trigger ON telegram_calls;
CREATE TRIGGER telegram_call_monitoring_trigger
BEFORE INSERT ON telegram_calls
FOR EACH ROW EXECUTE FUNCTION set_telegram_call_monitoring();
