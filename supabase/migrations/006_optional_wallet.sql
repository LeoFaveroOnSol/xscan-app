-- Make wallet_address optional in applications
-- Add hide_wallet field

-- Make wallet_address nullable (it might already be, but ensure it)
ALTER TABLE applications ALTER COLUMN wallet_address DROP NOT NULL;

-- Add hide_wallet column if it doesn't exist
ALTER TABLE applications ADD COLUMN IF NOT EXISTS hide_wallet BOOLEAN DEFAULT false;
