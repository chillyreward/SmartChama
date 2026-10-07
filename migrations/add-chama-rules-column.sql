-- Add rules column to chamas table
-- This column will store an array of chama rules

ALTER TABLE chamas 
ADD COLUMN IF NOT EXISTS rules TEXT[];

-- Add a comment to describe the column
COMMENT ON COLUMN chamas.rules IS 'Array of chama rules defined by the admin (e.g., contribution amounts, meeting schedules, loan policies)';

-- Example of how rules will be stored:
-- rules: ['Monthly contribution: KES 5,000', 'Meetings every first Saturday', 'Maximum loan: 3x contributions']
