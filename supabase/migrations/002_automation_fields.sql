-- XSCAN Automation Fields Migration
-- Run this in Supabase SQL Editor to add automation support

-- =============================================================================
-- Add automation fields to KOLs table
-- =============================================================================

-- Add is_auto_monitored flag (whether to automatically scan tweets)
ALTER TABLE kols
ADD COLUMN IF NOT EXISTS is_auto_monitored BOOLEAN DEFAULT false;

-- Add last_scan_at timestamp (when tweets were last scanned)
ALTER TABLE kols
ADD COLUMN IF NOT EXISTS last_scan_at TIMESTAMP WITH TIME ZONE;

-- Create index for monitored KOLs
CREATE INDEX IF NOT EXISTS idx_kols_auto_monitored ON kols(is_auto_monitored) WHERE is_auto_monitored = true;

-- =============================================================================
-- Add automation fields to Calls table
-- =============================================================================

-- Add tweet_id (to prevent duplicate calls from same tweet)
ALTER TABLE calls
ADD COLUMN IF NOT EXISTS tweet_id VARCHAR(50);

-- Add detected_at timestamp (when the call was auto-detected)
ALTER TABLE calls
ADD COLUMN IF NOT EXISTS detected_at TIMESTAMP WITH TIME ZONE;

-- Add is_auto_detected flag
ALTER TABLE calls
ADD COLUMN IF NOT EXISTS is_auto_detected BOOLEAN DEFAULT false;

-- Add monitoring_until timestamp (when to stop monitoring ATH)
ALTER TABLE calls
ADD COLUMN IF NOT EXISTS monitoring_until TIMESTAMP WITH TIME ZONE;

-- Create unique index on tweet_id to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_calls_tweet_id ON calls(tweet_id) WHERE tweet_id IS NOT NULL;

-- Create index for auto-detected calls
CREATE INDEX IF NOT EXISTS idx_calls_auto_detected ON calls(is_auto_detected) WHERE is_auto_detected = true;

-- Create index for active monitoring
CREATE INDEX IF NOT EXISTS idx_calls_monitoring ON calls(monitoring_until) WHERE monitoring_until IS NOT NULL;

-- =============================================================================
-- Create scan_logs table for tracking automation runs
-- =============================================================================

CREATE TABLE IF NOT EXISTS scan_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Scan info
    scan_type VARCHAR(50) NOT NULL, -- 'tweets', 'prices', 'manual'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Results
    kols_scanned INTEGER DEFAULT 0,
    tweets_found INTEGER DEFAULT 0,
    calls_created INTEGER DEFAULT 0,
    calls_skipped INTEGER DEFAULT 0,
    errors INTEGER DEFAULT 0,

    -- Details
    details JSONB,
    error_message TEXT,

    -- Status
    status VARCHAR(20) DEFAULT 'running' -- running, completed, failed
);

CREATE INDEX IF NOT EXISTS idx_scan_logs_type ON scan_logs(scan_type);
CREATE INDEX IF NOT EXISTS idx_scan_logs_started ON scan_logs(started_at DESC);

-- =============================================================================
-- Enable RLS on scan_logs
-- =============================================================================

ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scan logs are viewable by everyone" ON scan_logs
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage scan logs" ON scan_logs
    FOR ALL USING (true);

-- =============================================================================
-- Update existing calls to have monitoring_until set (48 hours from now for active calls)
-- =============================================================================

UPDATE calls
SET monitoring_until = entry_timestamp + INTERVAL '48 hours'
WHERE status = 'active' AND monitoring_until IS NULL;

-- =============================================================================
-- Create function to set monitoring_until on new calls
-- =============================================================================

CREATE OR REPLACE FUNCTION set_call_monitoring()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.monitoring_until IS NULL THEN
        NEW.monitoring_until := NEW.entry_timestamp + INTERVAL '48 hours';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS set_monitoring_trigger ON calls;
CREATE TRIGGER set_monitoring_trigger
BEFORE INSERT ON calls
FOR EACH ROW EXECUTE FUNCTION set_call_monitoring();

-- =============================================================================
-- Success message
-- =============================================================================

SELECT 'Automation fields migration complete!' as status;
