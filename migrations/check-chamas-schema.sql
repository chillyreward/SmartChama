-- Check the current schema of the chamas table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'chamas'
ORDER BY ordinal_position;

-- Also check if there's a created_by column
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'chamas' 
AND column_name LIKE '%created%' OR column_name LIKE '%admin%';
