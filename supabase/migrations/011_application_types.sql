-- Add support for different application types (KOL vs Telegram Channel)

-- Add application_type column
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS application_type VARCHAR(30) DEFAULT 'kol';

-- Add channel_username for Telegram channel applications
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS channel_username VARCHAR(100);

-- Add website_url field
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Add telegram_handle for KOL applications
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS telegram_handle VARCHAR(100);

-- Create index for application type
CREATE INDEX IF NOT EXISTS idx_applications_type
ON applications(application_type);

-- Create index for channel username
CREATE INDEX IF NOT EXISTS idx_applications_channel_username
ON applications(channel_username);

-- Add comments
COMMENT ON COLUMN applications.application_type IS 'Type of application: kol or telegram_channel';
COMMENT ON COLUMN applications.channel_username IS 'Telegram channel username (for telegram_channel applications)';
COMMENT ON COLUMN applications.website_url IS 'Website URL of the applicant';
COMMENT ON COLUMN applications.telegram_handle IS 'Telegram handle of the KOL applicant';
