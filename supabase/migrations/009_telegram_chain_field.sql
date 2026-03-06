-- Add chain field to telegram_calls for multi-chain support
-- Supports: solana, bsc, base, ethereum

-- Add chain column with default 'solana' for existing records
ALTER TABLE telegram_calls
ADD COLUMN IF NOT EXISTS chain VARCHAR(20) DEFAULT 'solana';

-- Update token_address length to support EVM addresses (42 chars including 0x)
-- Solana addresses are 32-44 chars, EVM are exactly 42
ALTER TABLE telegram_calls
ALTER COLUMN token_address TYPE VARCHAR(50);

-- Create index for chain filtering
CREATE INDEX IF NOT EXISTS idx_telegram_calls_chain ON telegram_calls(chain);

-- Add comment for documentation
COMMENT ON COLUMN telegram_calls.chain IS 'Blockchain network: solana, bsc, base, ethereum';
