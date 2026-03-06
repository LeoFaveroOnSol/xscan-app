-- Telegram Achievements table
-- Stores achievement records when calls hit milestone multipliers
CREATE TABLE IF NOT EXISTS telegram_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES telegram_calls(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES telegram_channels(id) ON DELETE CASCADE,
    
    -- Token info (denormalized for fast queries)
    token_address VARCHAR(44) NOT NULL,
    token_symbol VARCHAR(20),
    token_name VARCHAR(100),
    chain VARCHAR(20) DEFAULT 'sol',
    
    -- Market data at achievement time
    entry_market_cap DECIMAL(20,2),
    ath_market_cap DECIMAL(20,2),
    ath_multiplier DECIMAL(10,2),
    
    -- Achievement details
    display_multiplier INTEGER NOT NULL,  -- e.g. 67 for 67.9x
    milestone_tier INTEGER NOT NULL,      -- e.g. 50 (the tier bracket: 2,3,5,10,20,50,100)
    
    -- Telegram message tracking
    message_id BIGINT,                    -- message ID in the achievements channel
    
    -- Timestamps
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tg_achiev_call_id ON telegram_achievements(call_id);
CREATE INDEX IF NOT EXISTS idx_tg_achiev_channel_id ON telegram_achievements(channel_id);
CREATE INDEX IF NOT EXISTS idx_tg_achiev_sent_at ON telegram_achievements(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_tg_achiev_display_multi ON telegram_achievements(display_multiplier DESC);

-- RLS: Allow service role full access
ALTER TABLE telegram_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON telegram_achievements
    FOR ALL USING (true) WITH CHECK (true);
