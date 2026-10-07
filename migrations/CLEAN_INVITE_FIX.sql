-- Clean SQL to fix invite_tokens table
-- Copy ONLY the lines below (not the error message)

-- Step 1: Drop RLS policies
DROP POLICY IF EXISTS "Users can view tokens for their chamas" ON invite_tokens;
DROP POLICY IF EXISTS "Users can create tokens for their chamas" ON invite_tokens;
DROP POLICY IF EXISTS "Users can update tokens for their chamas" ON invite_tokens;
DROP POLICY IF EXISTS "Users can delete tokens for their chamas" ON invite_tokens;

-- Step 2: Drop constraint
ALTER TABLE invite_tokens DROP CONSTRAINT IF EXISTS invite_tokens_created_by_fkey;

-- Step 3: Drop column
ALTER TABLE invite_tokens DROP COLUMN IF EXISTS created_by;

-- Step 4: Create new policies
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
