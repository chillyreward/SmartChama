-- Add blockchain fields to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS blockchain_hash TEXT,
ADD COLUMN IF NOT EXISTS blockchain_explorer_url TEXT,
ADD COLUMN IF NOT EXISTS blockchain_qr_code TEXT,
ADD COLUMN IF NOT EXISTS blockchain_verified BOOLEAN DEFAULT false;

-- Add index for blockchain hash lookups
CREATE INDEX IF NOT EXISTS idx_transactions_blockchain_hash 
ON transactions(blockchain_hash);

-- Add comment
COMMENT ON COLUMN transactions.blockchain_hash IS 'Polygon blockchain transaction hash for verification';
COMMENT ON COLUMN transactions.blockchain_explorer_url IS 'URL to view transaction on Polygon explorer';
COMMENT ON COLUMN transactions.blockchain_qr_code IS 'QR code data URL for easy verification';
COMMENT ON COLUMN transactions.blockchain_verified IS 'Whether transaction has been verified on blockchain';
