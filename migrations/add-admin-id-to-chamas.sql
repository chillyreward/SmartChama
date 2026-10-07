-- Add admin_id column to chamas table
-- This links each chama to the admin who created it

-- First, check what column currently exists for tracking the creator
-- It might be 'created_by' or something else

-- Add admin_id column if it doesn't exist
ALTER TABLE chamas 
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES chama_admins(id);

-- If you have an existing 'created_by' column that references auth.users, 
-- you might want to migrate the data:
-- UPDATE chamas 
-- SET admin_id = (
--   SELECT id FROM chama_admins WHERE admin_user_id = chamas.created_by
-- )
-- WHERE created_by IS NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_chamas_admin_id ON chamas(admin_id);

-- Add comment
COMMENT ON COLUMN chamas.admin_id IS 'References the admin who created and manages this chama';
