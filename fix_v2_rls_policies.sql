-- Enable RLS for all V2 tables (already enabled, but let's make sure)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chamas_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE chama_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions_v2 ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
DROP POLICY IF EXISTS "own_profile" ON profiles;
CREATE POLICY "own_profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
CREATE POLICY "users_insert_own_profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE USING (auth.uid() = id);


-- 2. CHAMAS_V2 POLICIES
DROP POLICY IF EXISTS "member_can_see_chama" ON chamas_v2;
CREATE POLICY "member_can_see_chama" ON chamas_v2 FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chama_memberships 
    WHERE chama_memberships.chama_id = chamas_v2.id 
      AND chama_memberships.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "authenticated_insert_chama" ON chamas_v2;
CREATE POLICY "authenticated_insert_chama" ON chamas_v2 FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admins_update_chama" ON chamas_v2;
CREATE POLICY "admins_update_chama" ON chamas_v2 FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM chama_memberships
    WHERE chama_memberships.chama_id = chamas_v2.id
      AND chama_memberships.profile_id = auth.uid()
      AND chama_memberships.role IN ('admin', 'chairlady', 'treasurer', 'secretary')
  )
);


-- 3. CHAMA_MEMBERSHIPS POLICIES
DROP POLICY IF EXISTS "own_memberships" ON chama_memberships;
CREATE POLICY "own_memberships" ON chama_memberships FOR SELECT USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "insert_own_membership" ON chama_memberships;
CREATE POLICY "insert_own_membership" ON chama_memberships FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "admins_update_membership" ON chama_memberships;
CREATE POLICY "admins_update_membership" ON chama_memberships FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM chama_memberships admin_member
    WHERE admin_member.chama_id = chama_memberships.chama_id
      AND admin_member.profile_id = auth.uid()
      AND admin_member.role IN ('admin', 'chairlady', 'treasurer', 'secretary')
  )
);


-- 4. WALLETS POLICIES
DROP POLICY IF EXISTS "members_view_wallet" ON wallets;
CREATE POLICY "members_view_wallet" ON wallets FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM chama_memberships
    WHERE chama_memberships.chama_id = wallets.chama_id
      AND chama_memberships.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "insert_wallet_on_chama_creation" ON wallets;
CREATE POLICY "insert_wallet_on_chama_creation" ON wallets FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admins_update_wallet" ON wallets;
CREATE POLICY "admins_update_wallet" ON wallets FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM chama_memberships
    WHERE chama_memberships.chama_id = wallets.chama_id
      AND chama_memberships.profile_id = auth.uid()
      AND chama_memberships.role IN ('admin', 'chairlady', 'treasurer', 'secretary')
  )
);


-- 5. CONTRIBUTIONS_V2 POLICIES
DROP POLICY IF EXISTS "chama_members_see_contributions" ON contributions_v2;
CREATE POLICY "chama_members_see_contributions" ON contributions_v2 FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM chama_memberships
    WHERE chama_memberships.chama_id = contributions_v2.chama_id
      AND chama_memberships.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "members_insert_contributions" ON contributions_v2;
CREATE POLICY "members_insert_contributions" ON contributions_v2 FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM chama_memberships
    WHERE chama_memberships.id = contributions_v2.membership_id
      AND chama_memberships.profile_id = auth.uid()
  )
);


-- 6. LOANS_V2 POLICIES
DROP POLICY IF EXISTS "members_see_loans" ON loans_v2;
CREATE POLICY "members_see_loans" ON loans_v2 FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM chama_memberships
    WHERE chama_memberships.chama_id = loans_v2.chama_id
      AND chama_memberships.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "members_insert_loans" ON loans_v2;
CREATE POLICY "members_insert_loans" ON loans_v2 FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM chama_memberships
    WHERE chama_memberships.id = loans_v2.membership_id
      AND chama_memberships.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "admins_update_loans" ON loans_v2;
CREATE POLICY "admins_update_loans" ON loans_v2 FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM chama_memberships
    WHERE chama_memberships.chama_id = loans_v2.chama_id
      AND chama_memberships.profile_id = auth.uid()
      AND chama_memberships.role IN ('admin', 'chairlady', 'treasurer', 'secretary')
  )
);


-- 7. TRANSACTIONS_V2 POLICIES
DROP POLICY IF EXISTS "members_see_transactions" ON transactions_v2;
CREATE POLICY "members_see_transactions" ON transactions_v2 FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM chama_memberships
    WHERE chama_memberships.chama_id = transactions_v2.chama_id
      AND chama_memberships.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "members_insert_transactions" ON transactions_v2;
CREATE POLICY "members_insert_transactions" ON transactions_v2 FOR INSERT TO authenticated WITH CHECK (true);
