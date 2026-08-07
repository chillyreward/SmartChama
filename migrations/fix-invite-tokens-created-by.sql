-- Fix invite_tokens created_by foreign key constraint
-- This fixes the error: "violates foreign key constraint invite_tokens_created_by_fkey"

-- Step 1: Drop all RLS policies that depend on created_by column
DROP POLICY IF EXISTS "Users can view tokens for their chamas" ON invite_tokens;
DROP POLICY IF EXISTS "Users can create tokens for their chamas" ON invite_tokens;
DROP POLICY IF EXISTS "Users can update tokens for their chamas" ON invite_tokens;
DROP POLICY IF EXISTS "Users can delete tokens for their chamas" ON invite_tokens;

-- Step 2: Drop the foreign key constraint
ALTER TABLE invite_tokens 
DROP CONSTRAINT IF EXISTS invite_tokens_created_by_fkey;

-- Step 3: Drop the created_by column
ALTER TABLE invite_tokens 
DROP COLUMN IF EXISTS created_by;

-- Step 4: Create new RLS policies that don't depend on created_by
-- These policies use chama_id instead

-- Policy: Admins can view tokens for their chamas
CREATE POLICY "Admins can view tokens for their chamas"
ON invite_tokens FOR SELECT
USING (
  chama_id IN (
    SELECT id FROM chamas 
    WHERE admin_id IN (
      SELECT id FROM chama_admins 
      WHERE email = auth.jwt()->>'email'
    )
  )
);

-- Policy: Admins can create tokens for their chamas
CREATE POLICY "Admins can create tokens for their chamas"
ON invite_tokens FOR INSERT
WITH CHECK (
  chama_id IN (
    SELECT id FROM chamas 
    WHERE admin_id IN (
      SELECT id FROM chama_admins 
      WHERE email = auth.jwt()->>'email'
    )
  )
);

-- Policy: Admins can update tokens for their chamas
CREATE POLICY "Admins can update tokens for their chamas"
ON invite_tokens FOR UPDATE
USING (
  chama_id IN (
    SELECT id FROM chamas 
    WHERE admin_id IN (
      SELECT id FROM chama_admins 
      WHERE email = auth.jwt()->>'email'
    )
  )
);

-- Policy: Admins can delete tokens for their chamas
CREATE POLICY "Admins can delete tokens for their chamas"
ON invite_tokens FOR DELETE
USING (
  chama_id IN (
    SELECT id FROM chamas 
    WHERE admin_id IN (
      SELECT id FROM chama_admins 
      WHERE email = auth.jwt()->>'email'
    )
  )
);

-- Note: The chama_id already tells you which chama the invite is for
-- No need for created_by column
