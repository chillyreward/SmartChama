-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own admin data" ON public.chama_admins;
DROP POLICY IF EXISTS "Users can insert their own admin data" ON public.chama_admins;
DROP POLICY IF EXISTS "Users can update their own admin data" ON public.chama_admins;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own admin data" ON public.chama_admins;

-- Recreate policies with correct configuration
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
