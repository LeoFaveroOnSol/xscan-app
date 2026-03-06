-- Add fields for incremental scanning of Telegram channels
-- Tracks the last scanned message ID and whether a full history scan has been completed

-- Add last_scanned_message_id to track incremental scans
ALTER TABLE telegram_channels
ADD COLUMN IF NOT EXISTS last_scanned_message_id BIGINT;

-- Add full_history_scanned flag to know if we've done a complete scan
ALTER TABLE telegram_channels
ADD COLUMN IF NOT EXISTS full_history_scanned BOOLEAN DEFAULT false;

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_telegram_channels_full_history_scanned
ON telegram_channels(full_history_scanned);

COMMENT ON COLUMN telegram_channels.last_scanned_message_id IS 'The ID of the most recent message that was scanned. Used for incremental scans.';
COMMENT ON COLUMN telegram_channels.full_history_scanned IS 'Whether a complete history scan has been done for this channel.';
