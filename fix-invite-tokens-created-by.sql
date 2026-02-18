-- Fix invite_tokens created_by foreign key constraint
-- This fixes the error: "violates foreign key constraint invite_tokens_created_by_fkey"

-- Option 1: Drop the created_by column if you don't need it
-- (Recommended if you don't track who created invites)
ALTER TABLE invite_tokens DROP COLUMN IF EXISTS created_by;

-- Option 2: If you want to keep tracking who creates invites,
-- update the foreign key to reference chama_admins instead of auth.users
-- (Uncomment the lines below if you choose this option)

/*
-- First, drop the existing constraint
ALTER TABLE invite_tokens 
DROP CONSTRAINT IF EXISTS invite_tokens_created_by_fkey;

-- Add the column if it doesn't exist
ALTER TABLE invite_tokens 
ADD COLUMN IF NOT EXISTS created_by UUID;

-- Add the correct foreign key constraint
ALTER TABLE invite_tokens
ADD CONSTRAINT invite_tokens_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES chama_admins(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_invite_tokens_created_by 
ON invite_tokens(created_by);
*/

-- Recommended: Use Option 1 (drop the column) for simplicity
-- The chama_id already tells you which chama the invite is for
