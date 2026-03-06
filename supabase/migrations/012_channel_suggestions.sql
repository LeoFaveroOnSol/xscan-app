-- Channel Suggestions Table
-- For users to suggest Telegram channels via the Telegram bot

CREATE TABLE IF NOT EXISTS channel_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Channel info
    channel_username VARCHAR(100) NOT NULL,
    display_name VARCHAR(200),
    description TEXT,

    -- Suggester info
    suggested_by_telegram_id VARCHAR(100),
    suggested_by_username VARCHAR(100),

    -- Review status
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by VARCHAR(100),
    rejection_reason TEXT,

    -- If approved, link to created channel
    approved_channel_id UUID REFERENCES telegram_channels(id),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_channel_suggestions_status ON channel_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_channel_suggestions_created_at ON channel_suggestions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_channel_suggestions_username ON channel_suggestions(channel_username);

-- Prevent duplicate pending suggestions for same channel
CREATE UNIQUE INDEX IF NOT EXISTS idx_channel_suggestions_unique_pending
ON channel_suggestions(channel_username)
WHERE status = 'pending';

-- Enable RLS
ALTER TABLE channel_suggestions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Channel suggestions are viewable by everyone" ON channel_suggestions
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage channel suggestions" ON channel_suggestions
    FOR ALL USING (true);

-- Comments
COMMENT ON TABLE channel_suggestions IS 'User-submitted channel suggestions from Telegram bot';
COMMENT ON COLUMN channel_suggestions.status IS 'pending = awaiting review, approved = channel created, rejected = declined';
