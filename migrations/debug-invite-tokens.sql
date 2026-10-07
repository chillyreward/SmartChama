-- Debug script to check invite_tokens table structure and data

-- Check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'invite_tokens'
ORDER BY ordinal_position;

-- Check if there are any invite tokens with their chama relationships
SELECT 
    it.id,
    it.token,
    it.chama_id,
    c.name as chama_name,
    c.id as actual_chama_id,
    it.is_active,
    it.current_uses,
    it.max_uses,
    it.expires_at
FROM invite_tokens it
LEFT JOIN chamas c ON it.chama_id = c.id
ORDER BY it.created_at DESC
LIMIT 10;

-- Check for any tokens with NULL or invalid chama_id
SELECT 
    id,
    token,
    chama_id,
    is_active
FROM invite_tokens
WHERE chama_id IS NULL OR chama_id = '';
