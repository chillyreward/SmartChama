-- ============================================
-- FIX CHAMA_ADMINS TABLE SCHEMA
-- ============================================
-- This script removes old columns and updates the table structure

-- Drop the existing table and recreate it with the correct schema
DROP TABLE IF EXISTS public.chama_admins CASCADE;

-- Recreate chama_admins table with correct schema
CREATE TABLE public.chama_admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    chama_id UUID REFERENCES public.chamas(id) ON DELETE SET NULL,
    phone_number TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX idx_chama_admins_user_id ON public.chama_admins(admin_user_id);
CREATE INDEX idx_chama_admins_chama_id ON public.chama_admins(chama_id);

-- Enable Row Level Security
ALTER TABLE public.chama_admins ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to insert their own admin data"
    ON public.chama_admins
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = admin_user_id);

CREATE POLICY "Users can view their own admin data"
    ON public.chama_admins
    FOR SELECT
    TO authenticated
    USING (auth.uid() = admin_user_id);

CREATE POLICY "Users can update their own admin data"
    ON public.chama_admins
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = admin_user_id)
    WITH CHECK (auth.uid() = admin_user_id);

CREATE POLICY "Users can delete their own admin data"
    ON public.chama_admins
    FOR DELETE
    TO authenticated
    USING (auth.uid() = admin_user_id);

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.chama_admins
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions
GRANT ALL ON public.chama_admins TO authenticated;
GRANT ALL ON public.chama_admins TO service_role;

-- Add comments
COMMENT ON TABLE public.chama_admins IS 'Stores admin user details and chama information';
COMMENT ON COLUMN public.chama_admins.id IS 'Primary key UUID';
COMMENT ON COLUMN public.chama_admins.admin_user_id IS 'Foreign key to auth.users';
COMMENT ON COLUMN public.chama_admins.chama_id IS 'Foreign key to chamas table (nullable)';
