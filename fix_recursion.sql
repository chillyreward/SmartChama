-- Step 1: Drop all policies dynamically on V2 tables to clean up any rogue policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename IN ('profiles', 'chamas_v2', 'chama_memberships', 'wallets', 'contributions_v2', 'loans_v2', 'transactions_v2')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- Step 2: Create a SECURITY DEFINER helper function to check memberships without RLS recursion
CREATE OR REPLACE FUNCTION check_is_chama_member(p_chama_id UUID, p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM chama_memberships
    WHERE chama_id = p_chama_id
      AND profile_id = p_user_id
      AND status = 'active'
  );
$$ LANGUAGE sql;

-- Step 3: Create clean RLS policies

-- 1. PROFILES POLICIES
CREATE POLICY "own_profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own_profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. CHAMAS_V2 POLICIES
CREATE POLICY "member_can_see_chama" ON chamas_v2 FOR SELECT TO authenticated USING (
  check_is_chama_member(id, auth.uid())
);
CREATE POLICY "authenticated_insert_chama" ON chamas_v2 FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "admins_update_chama" ON chamas_v2 FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM chama_memberships
    WHERE chama_memberships.chama_id = chamas_v2.id
      AND chama_memberships.profile_id = auth.uid()
      AND chama_memberships.role IN ('admin', 'chairlady', 'treasurer', 'secretary')
  )
);

-- 3. CHAMA_MEMBERSHIPS POLICIES
-- Allow members to view memberships of chamas they belong to (no recursion because of the helper function!)
CREATE POLICY "members_see_memberships" ON chama_memberships FOR SELECT TO authenticated USING (
  profile_id = auth.uid() OR check_is_chama_member(chama_id, auth.uid())
);
CREATE POLICY "insert_own_membership" ON chama_memberships FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
CREATE POLICY "admins_update_membership" ON chama_memberships FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM chama_memberships admin_member
    WHERE admin_member.chama_id = chama_memberships.chama_id
      AND admin_member.profile_id = auth.uid()
      AND admin_member.role IN ('admin', 'chairlady', 'treasurer', 'secretary')
  )
);

-- 4. WALLETS POLICIES
CREATE POLICY "members_view_wallet" ON wallets FOR SELECT TO authenticated USING (
  check_is_chama_member(chama_id, auth.uid())
);
CREATE POLICY "insert_wallet_on_chama_creation" ON wallets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "admins_update_wallet" ON wallets FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM chama_memberships
    WHERE chama_memberships.chama_id = wallets.chama_id
      AND chama_memberships.profile_id = auth.uid()
      AND chama_memberships.role IN ('admin', 'chairlady', 'treasurer', 'secretary')
  )
);

-- 5. CONTRIBUTIONS_V2 POLICIES
CREATE POLICY "members_see_contributions" ON contributions_v2 FOR SELECT TO authenticated USING (
  check_is_chama_member(chama_id, auth.uid())
);
CREATE POLICY "members_insert_contributions" ON contributions_v2 FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM chama_memberships
    WHERE chama_memberships.id = contributions_v2.membership_id
      AND chama_memberships.profile_id = auth.uid()
  )
);

-- 6. LOANS_V2 POLICIES
CREATE POLICY "members_see_loans" ON loans_v2 FOR SELECT TO authenticated USING (
  check_is_chama_member(chama_id, auth.uid())
);
CREATE POLICY "members_insert_loans" ON loans_v2 FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM chama_memberships
    WHERE chama_memberships.id = loans_v2.membership_id
      AND chama_memberships.profile_id = auth.uid()
  )
);
CREATE POLICY "admins_update_loans" ON loans_v2 FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM chama_memberships
    WHERE chama_memberships.chama_id = loans_v2.chama_id
      AND chama_memberships.profile_id = auth.uid()
      AND chama_memberships.role IN ('admin', 'chairlady', 'treasurer', 'secretary')
  )
);

-- 7. TRANSACTIONS_V2 POLICIES
CREATE POLICY "members_see_transactions" ON transactions_v2 FOR SELECT TO authenticated USING (
  check_is_chama_member(chama_id, auth.uid())
);
CREATE POLICY "members_insert_transactions" ON transactions_v2 FOR INSERT TO authenticated WITH CHECK (true);
