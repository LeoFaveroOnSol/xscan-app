-- Add token_image_url column to calls table
ALTER TABLE calls ADD COLUMN IF NOT EXISTS token_image_url TEXT;

-- Add comment
COMMENT ON COLUMN calls.token_image_url IS 'Token logo image URL from DexScreener';
