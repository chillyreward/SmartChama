-- ============================================
-- SMARTCHAMA DATABASE SETUP
-- ============================================

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PROFILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    phone_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Grant permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- ============================================
-- CHAMAS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.chamas (
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
CREATE INDEX IF NOT EXISTS idx_chamas_created_by ON public.chamas(created_by);

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

COMMENT ON TABLE public.chamas IS 'Stores chama group information and financial data';
COMMENT ON COLUMN public.chamas.total_balance IS 'Total balance in the chama account';
COMMENT ON COLUMN public.chamas.monthly_growth_pct IS 'Monthly growth percentage';
COMMENT ON COLUMN public.chamas.investment_goal IS 'Target investment goal amount';
COMMENT ON COLUMN public.chamas.created_by IS 'User who created the chama';

-- ============================================
-- CHAMA_ADMINS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.chama_admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    chama_id UUID REFERENCES public.chamas(id) ON DELETE SET NULL,
    phone_number TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on admin_user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_chama_admins_user_id ON public.chama_admins(admin_user_id);

-- Create index on chama_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_chama_admins_chama_id ON public.chama_admins(chama_id);

-- Enable Row Level Security
ALTER TABLE public.chama_admins ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to insert their own data
CREATE POLICY "Allow authenticated users to insert their own admin data"
    ON public.chama_admins
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = admin_user_id);

-- Create policy to allow users to read their own data
CREATE POLICY "Users can view their own admin data"
    ON public.chama_admins
    FOR SELECT
    TO authenticated
    USING (auth.uid() = admin_user_id);

-- Create policy to allow users to update their own data
CREATE POLICY "Users can update their own admin data"
    ON public.chama_admins
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = admin_user_id)
    WITH CHECK (auth.uid() = admin_user_id);

-- Create policy to allow users to delete their own data
CREATE POLICY "Users can delete their own admin data"
    ON public.chama_admins
    FOR DELETE
    TO authenticated
    USING (auth.uid() = admin_user_id);

-- Create trigger to call the function
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.chama_admins
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions
GRANT ALL ON public.chama_admins TO authenticated;
GRANT ALL ON public.chama_admins TO service_role;

COMMENT ON TABLE public.chama_admins IS 'Stores admin user details and chama information';
COMMENT ON COLUMN public.chama_admins.id IS 'Primary key UUID';
COMMENT ON COLUMN public.chama_admins.admin_user_id IS 'Foreign key to auth.users';
COMMENT ON COLUMN public.chama_admins.chama_id IS 'Foreign key to chamas table (nullable)';

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Create a function to handle new user signup (optional - for automatic insertion)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- This function can be used with a trigger on auth.users if needed
    -- For now, we're handling insertion from the application
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
