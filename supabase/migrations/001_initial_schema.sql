-- XSCAN Database Schema
-- Run this in your Supabase SQL Editor to create all tables

-- =============================================================================
-- KOLs Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS kols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    twitter_handle VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100),
    bio TEXT,
    profile_image_url TEXT,
    follower_count INTEGER DEFAULT 0,
    wallet_address VARCHAR(44),

    -- Cached stats (updated periodically)
    total_calls INTEGER DEFAULT 0,
    winning_calls INTEGER DEFAULT 0,
    winrate DECIMAL(5,2) DEFAULT 0,
    avg_multiplier DECIMAL(10,2) DEFAULT 0,
    best_multiplier DECIMAL(10,2) DEFAULT 0,

    -- Status
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    featured_rank INTEGER,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kols_twitter_handle ON kols(twitter_handle);
CREATE INDEX IF NOT EXISTS idx_kols_winrate ON kols(winrate DESC);
CREATE INDEX IF NOT EXISTS idx_kols_avg_multiplier ON kols(avg_multiplier DESC);
CREATE INDEX IF NOT EXISTS idx_kols_is_active ON kols(is_active);

-- =============================================================================
-- Calls Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kol_id UUID NOT NULL REFERENCES kols(id) ON DELETE CASCADE,

    -- Token info
    token_address VARCHAR(44) NOT NULL,
    token_symbol VARCHAR(20),
    token_name VARCHAR(100),

    -- Entry data (when KOL called it)
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
    tweet_url TEXT,
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_price_update TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_calls_kol_id ON calls(kol_id);
CREATE INDEX IF NOT EXISTS idx_calls_token_address ON calls(token_address);
CREATE INDEX IF NOT EXISTS idx_calls_entry_timestamp ON calls(entry_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_calls_ath_multiplier ON calls(ath_multiplier DESC);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);

-- =============================================================================
-- Applications Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Applicant info
    twitter_handle VARCHAR(50) NOT NULL,
    wallet_address VARCHAR(44) NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    follower_count INTEGER,

    -- Application details
    proof_of_calls TEXT,  -- Links to past call tweets
    additional_info TEXT,

    -- Verification
    wallet_signature TEXT,  -- Signature proving wallet ownership

    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_twitter ON applications(twitter_handle);
CREATE INDEX IF NOT EXISTS idx_applications_wallet ON applications(wallet_address);

-- =============================================================================
-- Admins Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'admin', -- admin, super_admin

    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- Price History Table (Optional - for historical tracking)
-- =============================================================================
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,

    market_cap DECIMAL(20,2),
    price DECIMAL(30,18),
    multiplier DECIMAL(10,2),

    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_call_id ON price_history(call_id);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at ON price_history(recorded_at);

-- =============================================================================
-- Row Level Security (RLS) Policies
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE kols ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- KOLs: Public read for active KOLs
CREATE POLICY "KOLs are viewable by everyone" ON kols
    FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage KOLs" ON kols
    FOR ALL USING (auth.role() = 'service_role');

-- Calls: Public read
CREATE POLICY "Calls are viewable by everyone" ON calls
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage calls" ON calls
    FOR ALL USING (auth.role() = 'service_role');

-- Applications: Public can insert, only service role can read/update
CREATE POLICY "Anyone can submit applications" ON applications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can manage applications" ON applications
    FOR ALL USING (auth.role() = 'service_role');

-- Admins: Only service role
CREATE POLICY "Service role can manage admins" ON admins
    FOR ALL USING (auth.role() = 'service_role');

-- Price History: Public read
CREATE POLICY "Price history is viewable by everyone" ON price_history
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage price history" ON price_history
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- Database Functions
-- =============================================================================

-- Function to recalculate KOL stats
CREATE OR REPLACE FUNCTION recalculate_kol_stats(kol_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE kols SET
        total_calls = (SELECT COUNT(*) FROM calls WHERE kol_id = kol_uuid),
        winning_calls = (SELECT COUNT(*) FROM calls WHERE kol_id = kol_uuid AND is_win = true),
        winrate = COALESCE(
            (SELECT COUNT(*) FILTER (WHERE is_win = true)::DECIMAL / NULLIF(COUNT(*), 0) * 100
             FROM calls WHERE kol_id = kol_uuid), 0
        ),
        avg_multiplier = COALESCE(
            (SELECT AVG(ath_multiplier) FROM calls WHERE kol_id = kol_uuid), 0
        ),
        best_multiplier = COALESCE(
            (SELECT MAX(ath_multiplier) FROM calls WHERE kol_id = kol_uuid), 0
        ),
        updated_at = NOW()
    WHERE id = kol_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update KOL stats when calls change
CREATE OR REPLACE FUNCTION update_kol_stats_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM recalculate_kol_stats(OLD.kol_id);
        RETURN OLD;
    ELSE
        PERFORM recalculate_kol_stats(NEW.kol_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS calls_stats_trigger ON calls;
CREATE TRIGGER calls_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON calls
FOR EACH ROW EXECUTE FUNCTION update_kol_stats_trigger();

-- =============================================================================
-- Sample Data (Optional - for testing)
-- =============================================================================

-- Uncomment below to insert sample data

/*
INSERT INTO kols (twitter_handle, display_name, bio, follower_count, winrate, avg_multiplier, best_multiplier, total_calls, winning_calls, is_verified)
VALUES
    ('cryptowhale', 'Crypto Whale', 'Top memecoin caller. NFA DYOR.', 150000, 72.5, 8.5, 125.0, 40, 29, true),
    ('solanamaster', 'Solana Master', 'Solana ecosystem expert', 85000, 65.0, 5.2, 45.0, 20, 13, true),
    ('degentrader', 'Degen Trader', 'High risk high reward', 42000, 55.0, 4.1, 32.0, 30, 17, false);
*/
