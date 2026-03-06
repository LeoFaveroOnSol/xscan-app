-- Add optional fields to applications table for website and telegram
ALTER TABLE applications ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS telegram_handle VARCHAR(50);
