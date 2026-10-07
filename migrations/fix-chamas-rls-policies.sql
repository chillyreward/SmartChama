-- Fix Row Level Security policies for chamas table

-- First, check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'chamas';

-- Enable RLS if not already enabled
ALTER TABLE chamas ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow admins to insert chamas" ON chamas;
DROP POLICY IF EXISTS "Allow admins to view their chamas" ON chamas;
DROP POLICY IF EXISTS "Allow admins to update their chamas" ON chamas;
DROP POLICY IF EXISTS "Allow admins to delete their chamas" ON chamas;
DROP POLICY IF EXISTS "Allow service role full access" ON chamas;

-- Policy 1: Allow authenticated users to insert chamas
-- (They must be in chama_admins table)
CREATE POLICY "Allow admins to insert chamas"
ON chamas
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chama_admins
    WHERE chama_admins.id = admin_id
    AND chama_admins.admin_user_id = auth.uid()
  )
);

-- Policy 2: Allow admins to view their own chamas
CREATE POLICY "Allow admins to view their chamas"
ON chamas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM chama_admins
    WHERE chama_admins.id = admin_id
    AND chama_admins.admin_user_id = auth.uid()
  )
);

-- Policy 3: Allow admins to update their own chamas
CREATE POLICY "Allow admins to update their chamas"
ON chamas
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM chama_admins
    WHERE chama_admins.id = admin_id
    AND chama_admins.admin_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chama_admins
    WHERE chama_admins.id = admin_id
    AND chama_admins.admin_user_id = auth.uid()
  )
);

-- Policy 4: Allow admins to delete their own chamas
CREATE POLICY "Allow admins to delete their chamas"
ON chamas
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM chama_admins
    WHERE chama_admins.id = admin_id
    AND chama_admins.admin_user_id = auth.uid()
  )
);

-- Policy 5: Allow service role full access (for server-side operations)
CREATE POLICY "Allow service role full access"
ON chamas
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'chamas';
 