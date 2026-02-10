-- ============================================
-- FIX CHAMAS TABLE - Change created_by reference
-- ============================================

-- Drop the existing table and recreate with correct foreign key
DROP TABLE IF EXISTS public.chamas CASCADE;

-- Recreate chamas table with correct schema
CREATE TABLE public.chamas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    total_balance NUMERIC(12,2) DEFAULT 0.00,
    monthly_growth_pct NUMERIC(5,2) DEFAULT 0.00,
    investment_goal NUMERIC(12,2),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on created_by for faster lookups
CREATE INDEX idx_chamas_created_by ON public.chamas(created_by);

-- Enable Row Level Security on chamas
ALTER TABLE public.chamas ENABLE ROW LEVEL SECURITY;

-- Chamas policies
CREATE POLICY "Users can view chamas they created"
    ON public.chamas
    FOR SELECT
    TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "Users can insert their own chamas"
    ON public.chamas
    FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update chamas they created"
    ON public.chamas
    FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete chamas they created"
    ON public.chamas
    FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());

-- Create trigger for chamas updated_at
CREATE TRIGGER set_chamas_updated_at
    BEFORE UPDATE ON public.chamas
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions
GRANT ALL ON public.chamas TO authenticated;
GRANT ALL ON public.chamas TO service_role;

-- Add comments
COMMENT ON TABLE public.chamas IS 'Stores chama group information and financial data';
COMMENT ON COLUMN public.chamas.total_balance IS 'Total balance in the chama account';
COMMENT ON COLUMN public.chamas.monthly_growth_pct IS 'Monthly growth percentage';
COMMENT ON COLUMN public.chamas.investment_goal IS 'Target investment goal amount';
COMMENT ON COLUMN public.chamas.created_by IS 'User who created the chama (references auth.users)';
