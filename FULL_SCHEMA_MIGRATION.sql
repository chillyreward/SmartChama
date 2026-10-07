-- ============================================================
-- SMARTCHAMA FULL SCHEMA MIGRATION  (single source of truth)
-- Supabase project: ewigxollsudiyqucajqv
-- Go to: Supabase Dashboard → SQL Editor → paste & run.
-- Idempotent: safe to re-run after edits.
--
-- Supersedes everything in migrations/ (v2–v7 and the one-off fixes). Do NOT
-- also run migrations/migration_v7_*.sql: they re-create tables under other
-- names (e.g. `ledger`) and add USING (true) read policies that expose every
-- chama's data to any signed-in user.
-- ============================================================


-- ============================================================
-- PART 1: CORE TABLES
-- ============================================================

-- PROFILES (one row per user, linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT 'User',
  phone_number TEXT UNIQUE,          -- nullable so Google OAuth users can sign up without a phone
  email TEXT,
  national_id TEXT,
  county TEXT,
  occupation TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- The live project already has a smaller `profiles` table (id, full_name, avatar_url,
-- role, ...), so CREATE TABLE IF NOT EXISTS above is a no-op there. Add the columns
-- the app writes to.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS national_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS county TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_number_key
  ON profiles(phone_number) WHERE phone_number IS NOT NULL;

-- CHAMAS_V2
CREATE TABLE IF NOT EXISTS chamas_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  county TEXT,
  group_code TEXT UNIQUE,
  contribution_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  contribution_frequency TEXT NOT NULL DEFAULT 'monthly'
    CHECK (contribution_frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly')),
  contribution_due_day INTEGER DEFAULT 1,
  grace_period_days INTEGER DEFAULT 3,
  late_penalty_amount NUMERIC(12,2) DEFAULT 0,
  max_loan_multiplier NUMERIC(4,2) DEFAULT 3.0,
  loan_interest_rate NUMERIC(5,2) DEFAULT 10.0,
  max_repayment_months INTEGER DEFAULT 3,
  min_trust_score_for_loan INTEGER DEFAULT 40,
  required_loan_approvals INTEGER DEFAULT 2,
  smartgrow_voting_enabled BOOLEAN DEFAULT true,
  smartgrow_vote_threshold NUMERIC(5,2) DEFAULT 50.0,
  smartgrow_voting_period_hours INTEGER DEFAULT 72,
  paybill_number TEXT,
  account_reference TEXT,
  rules TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived', 'dissolved')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- CHAMA_MEMBERSHIPS
CREATE TABLE IF NOT EXISTS chama_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chama_id UUID NOT NULL REFERENCES chamas_v2(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('member', 'admin', 'chairlady', 'treasurer', 'secretary')),
  trust_score INTEGER NOT NULL DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
  contribution_streak INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'flagged', 'inactive', 'removed')),
  flag_reason TEXT,
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, chama_id)
);

-- 'pending' = asked to join with the group code, awaiting an official;
-- 'rejected' = request declined. Re-created so re-runs pick up the new values.
ALTER TABLE chama_memberships DROP CONSTRAINT IF EXISTS chama_memberships_status_check;
ALTER TABLE chama_memberships ADD CONSTRAINT chama_memberships_status_check
  CHECK (status IN ('active', 'pending', 'flagged', 'inactive', 'removed', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_memberships_profile ON chama_memberships(profile_id);
CREATE INDEX IF NOT EXISTS idx_memberships_chama ON chama_memberships(chama_id);
CREATE INDEX IF NOT EXISTS idx_memberships_chama_status ON chama_memberships(chama_id, status);

-- WALLETS
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID UNIQUE NOT NULL REFERENCES chamas_v2(id) ON DELETE CASCADE,
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  savings_pool NUMERIC(14,2) NOT NULL DEFAULT 0,
  loans_disbursed NUMERIC(14,2) NOT NULL DEFAULT 0,
  invested NUMERIC(14,2) NOT NULL DEFAULT 0,
  emergency_reserve NUMERIC(14,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- CONTRIBUTIONS_V2
CREATE TABLE IF NOT EXISTS contributions_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id UUID NOT NULL REFERENCES chama_memberships(id) ON DELETE CASCADE,
  chama_id UUID NOT NULL REFERENCES chamas_v2(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT DEFAULT 'mpesa'
    CHECK (payment_method IN ('mpesa', 'cash', 'bank')),
  mpesa_receipt TEXT,
  mpesa_checkout_request_id TEXT,
  reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'failed', 'late', 'partial')),
  blockchain_tx_hash TEXT,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_contributions_membership ON contributions_v2(membership_id);
CREATE INDEX IF NOT EXISTS idx_contributions_chama_date ON contributions_v2(chama_id, created_at);
-- stk-push saves both ids in one update; without this column that update
-- fails and the M-Pesa callback can never find its contribution
ALTER TABLE contributions_v2 ADD COLUMN IF NOT EXISTS mpesa_merchant_request_id TEXT;
ALTER TABLE contributions_v2 ADD COLUMN IF NOT EXISTS failed_reason TEXT;
CREATE INDEX IF NOT EXISTS idx_contributions_checkout ON contributions_v2(mpesa_checkout_request_id);

-- LOANS_V2
CREATE TABLE IF NOT EXISTS loans_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id UUID NOT NULL REFERENCES chama_memberships(id) ON DELETE CASCADE,
  chama_id UUID NOT NULL REFERENCES chamas_v2(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  interest_rate NUMERIC(5,2) NOT NULL,
  repayment_months INTEGER NOT NULL,
  purpose TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'declined', 'active', 'overdue', 'repaid', 'defaulted')),
  decline_reason TEXT,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  due_date DATE,
  total_repaid NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loans_membership ON loans_v2(membership_id);
CREATE INDEX IF NOT EXISTS idx_loans_chama_status ON loans_v2(chama_id, status);

CREATE TABLE IF NOT EXISTS loan_repayments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loans_v2(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  mpesa_receipt TEXT,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TRANSACTIONS_V2
CREATE TABLE IF NOT EXISTS transactions_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas_v2(id) ON DELETE CASCADE,
  membership_id UUID REFERENCES chama_memberships(id),
  type TEXT NOT NULL CHECK (type IN (
    'contribution', 'loan_disbursement', 'loan_repayment',
    'withdrawal', 'deposit', 'penalty', 'interest',
    'smartgrow_investment', 'smartgrow_return'
  )),
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  reference TEXT,
  status TEXT DEFAULT 'confirmed',
  blockchain_tx_hash TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_chama_date ON transactions_v2(chama_id, created_at);

-- INVITE_TOKENS
CREATE TABLE IF NOT EXISTS invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas_v2(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  max_uses INTEGER DEFAULT 100,
  current_uses INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Columns the invite/join code paths write to
ALTER TABLE invite_tokens ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE invite_tokens ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE invite_tokens ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;
ALTER TABLE invite_tokens ADD COLUMN IF NOT EXISTS used_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE invite_tokens ADD COLUMN IF NOT EXISTS invited_phone TEXT;
ALTER TABLE invite_tokens ADD COLUMN IF NOT EXISTS invited_name TEXT;
ALTER TABLE invite_tokens ADD COLUMN IF NOT EXISTS invited_email TEXT;

CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON invite_tokens(token);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_chama ON invite_tokens(chama_id);

-- OTP CODES (for SMS auth)
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'login'
    CHECK (purpose IN ('login', 'signup', 'password_reset')),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_phone_purpose ON otp_codes(phone_number, purpose, used);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chama_id UUID REFERENCES chamas_v2(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- The live project already has a `notifications` table keyed on user_id/is_read.
-- Add the columns the app uses; without them the index below fails and aborts the run.
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS chama_id UUID REFERENCES chamas_v2(id);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'user_id') THEN
    ALTER TABLE notifications ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_profile ON notifications(profile_id, read);

-- GROUP_ACTIVITY
CREATE TABLE IF NOT EXISTS group_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas_v2(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AUDIT_LOG
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas_v2(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- CHAMA_PAYMENT_CONFIG (used by /api/chamas/create)
CREATE TABLE IF NOT EXISTS chama_payment_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID UNIQUE NOT NULL REFERENCES chamas_v2(id) ON DELETE CASCADE,
  payment_type TEXT DEFAULT 'till',
  till_number TEXT,
  paybill_number TEXT,
  account_number TEXT,
  phone_number TEXT,
  account_name TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SMARTGROW TABLES
CREATE TABLE IF NOT EXISTS smartgrow_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  type TEXT NOT NULL,
  min_amount NUMERIC(12,2) NOT NULL,
  expected_return_min NUMERIC(5,2),
  expected_return_max NUMERIC(5,2),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  liquidity_days INTEGER,
  description TEXT,
  regulatory_body TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS smartgrow_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas_v2(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES smartgrow_products(id),
  amount NUMERIC(12,2) NOT NULL,
  proposed_by UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'voting'
    CHECK (status IN ('voting', 'approved', 'rejected', 'expired', 'executed')),
  voting_closes_at TIMESTAMPTZ NOT NULL,
  votes_for INTEGER DEFAULT 0,
  votes_against INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS smartgrow_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES smartgrow_proposals(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES chama_memberships(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('for', 'against')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(proposal_id, membership_id)
);

CREATE TABLE IF NOT EXISTS smartgrow_investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas_v2(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES smartgrow_proposals(id),
  product_id UUID NOT NULL REFERENCES smartgrow_products(id),
  amount NUMERIC(12,2) NOT NULL,
  expected_return NUMERIC(5,2),
  actual_return NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'matured', 'withdrawn')),
  start_date DATE NOT NULL,
  maturity_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ============================================================
-- PART 2: GROUP CODE AUTO-GENERATION
-- ============================================================

CREATE OR REPLACE FUNCTION generate_group_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT), 1, 6));
    SELECT EXISTS (SELECT 1 FROM chamas_v2 WHERE group_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION set_group_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.group_code IS NULL THEN
    NEW.group_code := generate_group_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_group_code ON chamas_v2;
CREATE TRIGGER auto_group_code
  BEFORE INSERT ON chamas_v2
  FOR EACH ROW
  EXECUTE FUNCTION set_group_code();


-- ============================================================
-- PART 3: DASHBOARD RPC FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_dashboard_data(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_membership RECORD;
  v_chama RECORD;
  v_metrics RECORD;
BEGIN
  -- SECURITY DEFINER bypasses RLS, so only ever answer for the caller
  IF auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN
    RETURN jsonb_build_object('found', false, 'error', 'forbidden');
  END IF;

  SELECT
    cm.id as membership_id, cm.role, cm.trust_score,
    cm.chama_id, cm.contribution_streak,
    p.full_name, p.email, p.phone_number
  INTO v_membership
  FROM chama_memberships cm
  JOIN profiles p ON p.id = cm.profile_id
  WHERE cm.profile_id = p_user_id
    AND cm.status = 'active'
    AND cm.chama_id IS NOT NULL
  ORDER BY cm.joined_at DESC NULLS LAST, cm.created_at DESC
  LIMIT 1;

  IF v_membership IS NULL THEN
    RETURN jsonb_build_object('found', false, 'error', 'no_membership');
  END IF;

  SELECT c.id, c.name, c.group_code, c.contribution_amount,
         c.contribution_frequency, c.status
  INTO v_chama
  FROM chamas_v2 c WHERE c.id = v_membership.chama_id;

  IF v_chama IS NULL THEN
    RETURN jsonb_build_object('found', false, 'error', 'no_chama');
  END IF;

  SELECT
    COALESCE(SUM(cv.amount), 0) as total_saved,
    COALESCE((SELECT balance FROM wallets WHERE chama_id = v_membership.chama_id), 0) as wallet_balance,
    COALESCE((SELECT COUNT(*) FROM loans_v2 WHERE membership_id = v_membership.membership_id AND status IN ('active','overdue')), 0) as active_loans
  INTO v_metrics
  FROM contributions_v2 cv
  WHERE cv.membership_id = v_membership.membership_id AND cv.status = 'confirmed';

  RETURN jsonb_build_object(
    'found', true,
    'membership', jsonb_build_object(
      'membership_id', v_membership.membership_id,
      'role', v_membership.role,
      'trust_score', v_membership.trust_score,
      'chama_id', v_membership.chama_id,
      'full_name', v_membership.full_name,
      'email', v_membership.email,
      'phone', v_membership.phone_number
    ),
    'chama', jsonb_build_object(
      'id', v_chama.id,
      'name', v_chama.name,
      'group_code', v_chama.group_code,
      'contribution_amount', v_chama.contribution_amount,
      'contribution_frequency', v_chama.contribution_frequency,
      'status', v_chama.status
    ),
    'metrics', jsonb_build_object(
      'total_saved', v_metrics.total_saved,
      'wallet_balance', v_metrics.wallet_balance,
      'active_loans', v_metrics.active_loans,
      'trust_score', v_membership.trust_score
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_dashboard_data(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION get_user_dashboard_data(UUID) FROM PUBLIC, anon;


-- ============================================================
-- PART 4: ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chamas_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE chama_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_activity ENABLE ROW LEVEL SECURITY;
-- No policies on otp_codes: only the service role (server routes) may touch it
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Membership checks run as SECURITY DEFINER so policies on chama_memberships can
-- use them without "infinite recursion detected in policy" (42P17).
CREATE OR REPLACE FUNCTION check_is_chama_member(p_chama_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM chama_memberships
    WHERE chama_id = p_chama_id AND profile_id = p_user_id AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION check_is_chama_admin(p_chama_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM chama_memberships
    WHERE chama_id = p_chama_id AND profile_id = p_user_id AND status = 'active'
      AND role IN ('admin','chairlady','treasurer','secretary')
  );
$$;

CREATE OR REPLACE FUNCTION owns_membership(p_membership_id UUID, p_chama_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM chama_memberships
    WHERE id = p_membership_id AND chama_id = p_chama_id
      AND profile_id = auth.uid() AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION shares_chama_with(p_other UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM chama_memberships mine
    JOIN chama_memberships theirs ON theirs.chama_id = mine.chama_id
    WHERE mine.profile_id = auth.uid() AND mine.status = 'active'
      AND theirs.profile_id = p_other
  );
$$;

-- PROFILES
DROP POLICY IF EXISTS "own_profile" ON profiles;
CREATE POLICY "own_profile" ON profiles FOR SELECT USING (auth.uid() = id);

-- Members list pages join profiles(full_name, email) for everyone in the chama
DROP POLICY IF EXISTS "chama_mates_see_profiles" ON profiles;
CREATE POLICY "chama_mates_see_profiles" ON profiles FOR SELECT TO authenticated USING (shares_chama_with(id));

DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
CREATE POLICY "users_insert_own_profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- CHAMAS_V2
DROP POLICY IF EXISTS "member_can_see_chama" ON chamas_v2;
-- created_by lets the creator read the row back from INSERT ... RETURNING
-- before their membership row exists (signup does .insert().select()).
CREATE POLICY "member_can_see_chama" ON chamas_v2 FOR SELECT TO authenticated USING (
  created_by = auth.uid() OR check_is_chama_member(id, auth.uid())
);

DROP POLICY IF EXISTS "authenticated_insert_chama" ON chamas_v2;
CREATE POLICY "authenticated_insert_chama" ON chamas_v2 FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "admins_update_chama" ON chamas_v2;
CREATE POLICY "admins_update_chama" ON chamas_v2 FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM chama_memberships WHERE chama_memberships.chama_id = chamas_v2.id AND chama_memberships.profile_id = auth.uid() AND chama_memberships.role IN ('admin','chairlady','treasurer','secretary'))
);

-- CHAMA_MEMBERSHIPS
DROP POLICY IF EXISTS "own_memberships" ON chama_memberships;
CREATE POLICY "own_memberships" ON chama_memberships FOR SELECT USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "chama_members_see_all_memberships" ON chama_memberships;
CREATE POLICY "chama_members_see_all_memberships" ON chama_memberships FOR SELECT TO authenticated USING (
  check_is_chama_member(chama_id, auth.uid())
);

-- Self-insert is only allowed as the creator of a chama with no members yet
-- (admin signup). Joining an existing chama goes through join_chama_by_code(),
-- otherwise anyone could add themselves to any chama as 'chairlady'.
DROP POLICY IF EXISTS "insert_own_membership" ON chama_memberships;
CREATE POLICY "insert_own_membership" ON chama_memberships FOR INSERT TO authenticated WITH CHECK (
  profile_id = auth.uid()
  AND EXISTS (SELECT 1 FROM chamas_v2 c WHERE c.id = chama_id AND c.created_by = auth.uid())
);

DROP POLICY IF EXISTS "admins_update_membership" ON chama_memberships;
CREATE POLICY "admins_update_membership" ON chama_memberships FOR UPDATE TO authenticated USING (
  check_is_chama_admin(chama_id, auth.uid())
);

-- WALLETS
DROP POLICY IF EXISTS "members_view_wallet" ON wallets;
CREATE POLICY "members_view_wallet" ON wallets FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM chama_memberships WHERE chama_memberships.chama_id = wallets.chama_id AND chama_memberships.profile_id = auth.uid())
);

DROP POLICY IF EXISTS "insert_wallet_on_chama_creation" ON wallets;
CREATE POLICY "insert_wallet_on_chama_creation" ON wallets FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM chamas_v2 c WHERE c.id = wallets.chama_id AND c.created_by = auth.uid())
);

DROP POLICY IF EXISTS "admins_update_wallet" ON wallets;
CREATE POLICY "admins_update_wallet" ON wallets FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM chama_memberships WHERE chama_memberships.chama_id = wallets.chama_id AND chama_memberships.profile_id = auth.uid() AND chama_memberships.role IN ('admin','chairlady','treasurer','secretary'))
);

-- CONTRIBUTIONS_V2
DROP POLICY IF EXISTS "chama_members_see_contributions" ON contributions_v2;
CREATE POLICY "chama_members_see_contributions" ON contributions_v2 FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM chama_memberships WHERE chama_memberships.chama_id = contributions_v2.chama_id AND chama_memberships.profile_id = auth.uid())
);

DROP POLICY IF EXISTS "members_insert_contributions" ON contributions_v2;
-- Officials record cash/bank contributions; members may only open a pending one
-- for their own membership. Confirmation happens server-side (M-Pesa callback).
CREATE POLICY "members_insert_contributions" ON contributions_v2 FOR INSERT TO authenticated WITH CHECK (
  check_is_chama_admin(chama_id, auth.uid())
  OR (status = 'pending' AND owns_membership(membership_id, chama_id))
);

-- LOANS_V2
DROP POLICY IF EXISTS "members_see_loans" ON loans_v2;
CREATE POLICY "members_see_loans" ON loans_v2 FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM chama_memberships WHERE chama_memberships.chama_id = loans_v2.chama_id AND chama_memberships.profile_id = auth.uid())
);

DROP POLICY IF EXISTS "members_insert_loans" ON loans_v2;
CREATE POLICY "members_insert_loans" ON loans_v2 FOR INSERT TO authenticated WITH CHECK (
  status = 'pending' AND approved_by IS NULL AND owns_membership(membership_id, chama_id)
);

DROP POLICY IF EXISTS "admins_update_loans" ON loans_v2;
-- Officials can't act on their own loan
CREATE POLICY "admins_update_loans" ON loans_v2 FOR UPDATE TO authenticated USING (
  check_is_chama_admin(chama_id, auth.uid()) AND NOT owns_membership(membership_id, chama_id)
);

-- TRANSACTIONS_V2
DROP POLICY IF EXISTS "members_see_transactions" ON transactions_v2;
CREATE POLICY "members_see_transactions" ON transactions_v2 FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM chama_memberships WHERE chama_memberships.chama_id = transactions_v2.chama_id AND chama_memberships.profile_id = auth.uid())
);

DROP POLICY IF EXISTS "members_insert_transactions" ON transactions_v2;
CREATE POLICY "members_insert_transactions" ON transactions_v2 FOR INSERT TO authenticated WITH CHECK (
  check_is_chama_admin(chama_id, auth.uid())
);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "own_notifications" ON notifications;
CREATE POLICY "own_notifications" ON notifications FOR SELECT USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "insert_notifications" ON notifications;
-- Officials notify members of their own chama; anyone may notify themselves
CREATE POLICY "insert_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (
  profile_id = auth.uid()
  OR (chama_id IS NOT NULL AND check_is_chama_admin(chama_id, auth.uid()) AND shares_chama_with(profile_id))
);

DROP POLICY IF EXISTS "own_notifications_update" ON notifications;
CREATE POLICY "own_notifications_update" ON notifications FOR UPDATE TO authenticated USING (profile_id = auth.uid());

-- INVITE_TOKENS
-- Was readable by every signed-in user, which leaked every chama's join codes.
-- Joining goes through join_chama_by_code(), so only officials need to list them.
DROP POLICY IF EXISTS "anyone_can_read_active_tokens" ON invite_tokens;
DROP POLICY IF EXISTS "admins_read_invite_tokens" ON invite_tokens;
CREATE POLICY "admins_read_invite_tokens" ON invite_tokens FOR SELECT TO authenticated USING (
  check_is_chama_admin(chama_id, auth.uid())
);

DROP POLICY IF EXISTS "admins_delete_invite_tokens" ON invite_tokens;
CREATE POLICY "admins_delete_invite_tokens" ON invite_tokens FOR DELETE TO authenticated USING (
  check_is_chama_admin(chama_id, auth.uid())
);

DROP POLICY IF EXISTS "admins_insert_invite_tokens" ON invite_tokens;
CREATE POLICY "admins_insert_invite_tokens" ON invite_tokens FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM chama_memberships WHERE chama_memberships.chama_id = invite_tokens.chama_id AND chama_memberships.profile_id = auth.uid() AND chama_memberships.role IN ('admin','chairlady','treasurer','secretary'))
);

DROP POLICY IF EXISTS "admins_update_invite_tokens" ON invite_tokens;
CREATE POLICY "admins_update_invite_tokens" ON invite_tokens FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM chama_memberships WHERE chama_memberships.chama_id = invite_tokens.chama_id AND chama_memberships.profile_id = auth.uid() AND chama_memberships.role IN ('admin','chairlady','treasurer','secretary'))
);

-- CHAMA_PAYMENT_CONFIG (till/paybill details: admins only)
ALTER TABLE chama_payment_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_see_payment_config" ON chama_payment_config;
CREATE POLICY "members_see_payment_config" ON chama_payment_config FOR SELECT TO authenticated USING (
  check_is_chama_member(chama_id, auth.uid())
);

DROP POLICY IF EXISTS "admins_write_payment_config" ON chama_payment_config;
CREATE POLICY "admins_write_payment_config" ON chama_payment_config FOR ALL TO authenticated
  USING (check_is_chama_admin(chama_id, auth.uid()))
  WITH CHECK (check_is_chama_admin(chama_id, auth.uid()));

-- GROUP_ACTIVITY
DROP POLICY IF EXISTS "members_see_activity" ON group_activity;
CREATE POLICY "members_see_activity" ON group_activity FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM chama_memberships WHERE chama_memberships.chama_id = group_activity.chama_id AND chama_memberships.profile_id = auth.uid())
);

DROP POLICY IF EXISTS "members_insert_activity" ON group_activity;
CREATE POLICY "members_insert_activity" ON group_activity FOR INSERT TO authenticated WITH CHECK (
  check_is_chama_member(chama_id, auth.uid())
);


-- ============================================================
-- PART 4B: NEW USER → PROFILE (runs for email, phone and Google sign-ups)
-- ============================================================
-- Client-side profile inserts fail when email confirmation is on (signUp returns
-- no session, so auth.uid() is null under RLS). Creating the row here means every
-- auth user always has a profile, whatever the sign-up path.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone_number, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      split_part(COALESCE(NEW.email, ''), '@', 1),
      'User'
    ),
    NEW.email,
    -- phone is unique; only take it when no other profile already has it
    CASE WHEN NULLIF(NEW.raw_user_meta_data->>'phone_number', '') IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE phone_number = NEW.raw_user_meta_data->>'phone_number')
         THEN NEW.raw_user_meta_data->>'phone_number' END,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block sign-up because of a profile problem; the app upserts it later
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Backfill profiles for users who signed up before this trigger existed
INSERT INTO public.profiles (id, full_name, email)
SELECT u.id,
       COALESCE(NULLIF(u.raw_user_meta_data->>'full_name', ''), NULLIF(u.raw_user_meta_data->>'name', ''),
                split_part(COALESCE(u.email, ''), '@', 1), 'User'),
       u.email
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Keep profiles.updated_at current
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_touch_updated_at ON profiles;
CREATE TRIGGER profiles_touch_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();


-- ============================================================
-- PART 4C: JOIN A CHAMA BY CODE
-- ============================================================
-- Accepts either a chama's permanent group_code (shown to the admin after
-- creating the group) or a one-off invite token. Runs as SECURITY DEFINER because
-- a non-member can't read chamas_v2 or insert their own membership under RLS.
--  - group code   -> 'pending' membership; officials are notified and approve it
--                    on the admin Members page (anyone holding the code can ask)
--  - invite token -> 'active' immediately (an official already chose this person)

CREATE OR REPLACE FUNCTION join_chama_by_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_code TEXT := UPPER(TRIM(p_code));
  v_chama chamas_v2%ROWTYPE;
  v_invite invite_tokens%ROWTYPE;
  v_membership_id UUID;
  v_status TEXT;
  v_existing TEXT;
  v_name TEXT;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_user) THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_profile');
  END IF;

  SELECT * INTO v_chama FROM chamas_v2 WHERE group_code = v_code AND status = 'active';

  IF NOT FOUND THEN
    SELECT * INTO v_invite FROM invite_tokens
    WHERE UPPER(token) = v_code AND is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'invalid_code');
    END IF;
    IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN
      RETURN jsonb_build_object('success', false, 'error', 'expired');
    END IF;
    IF v_invite.max_uses IS NOT NULL AND v_invite.current_uses >= v_invite.max_uses THEN
      RETURN jsonb_build_object('success', false, 'error', 'used_up');
    END IF;

    SELECT * INTO v_chama FROM chamas_v2 WHERE id = v_invite.chama_id AND status = 'active';
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'invalid_code');
    END IF;
  END IF;

  v_status := CASE WHEN v_invite.id IS NOT NULL THEN 'active' ELSE 'pending' END;

  SELECT status INTO v_existing FROM chama_memberships WHERE profile_id = v_user AND chama_id = v_chama.id;
  IF v_existing IN ('removed', 'rejected', 'flagged') THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_allowed');
  END IF;

  INSERT INTO chama_memberships (profile_id, chama_id, role, trust_score, status, joined_at)
  VALUES (v_user, v_chama.id, 'member', 0, v_status, now())
  ON CONFLICT (profile_id, chama_id) DO NOTHING
  RETURNING id INTO v_membership_id;

  IF v_membership_id IS NULL THEN
    -- Already in (or already asked to join) this chama: don't burn an invite use
    RETURN jsonb_build_object('success', true, 'chama_id', v_chama.id, 'chama_name', v_chama.name,
                              'already_member', true, 'pending', v_existing = 'pending');
  END IF;

  v_name := COALESCE((SELECT full_name FROM profiles WHERE id = v_user), 'A new member');

  IF v_status = 'pending' THEN
    INSERT INTO notifications (profile_id, chama_id, type, title, message)
    SELECT m.profile_id, v_chama.id, 'member_request', 'New Member Request',
           v_name || ' requested to join ' || v_chama.name || '.'
    FROM chama_memberships m
    WHERE m.chama_id = v_chama.id AND m.status = 'active'
      AND m.role IN ('admin', 'chairlady', 'treasurer', 'secretary');

    INSERT INTO group_activity (chama_id, event_type, description)
    VALUES (v_chama.id, 'member_requested', v_name || ' requested to join');

    RETURN jsonb_build_object('success', true, 'chama_id', v_chama.id, 'chama_name', v_chama.name,
                              'already_member', false, 'pending', true);
  END IF;

  IF v_invite.id IS NOT NULL THEN
    UPDATE invite_tokens
    SET current_uses = current_uses + 1,
        used_at = now(),
        used_by = v_user,
        status = CASE WHEN max_uses IS NOT NULL AND current_uses + 1 >= max_uses THEN 'used' ELSE status END,
        is_active = NOT (max_uses IS NOT NULL AND current_uses + 1 >= max_uses)
    WHERE id = v_invite.id;
  END IF;

  INSERT INTO group_activity (chama_id, event_type, description)
  VALUES (v_chama.id, 'member_joined', v_name || ' joined the group');

  RETURN jsonb_build_object('success', true, 'chama_id', v_chama.id, 'chama_name', v_chama.name,
                            'already_member', false, 'pending', false);
END;
$$;

REVOKE ALL ON FUNCTION join_chama_by_code(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION join_chama_by_code(TEXT) TO authenticated;

-- Lets the sign-up form check a code (and show the group name) before the
-- account exists. Returns only the name, never ids or member data.
CREATE OR REPLACE FUNCTION preview_join_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT := UPPER(TRIM(p_code));
  v_name TEXT;
  v_invite invite_tokens%ROWTYPE;
BEGIN
  SELECT name INTO v_name FROM chamas_v2 WHERE group_code = v_code AND status = 'active';
  IF FOUND THEN
    RETURN jsonb_build_object('valid', true, 'chama_name', v_name);
  END IF;

  SELECT * INTO v_invite FROM invite_tokens WHERE UPPER(token) = v_code AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'invalid_code');
  END IF;
  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'expired');
  END IF;
  IF v_invite.max_uses IS NOT NULL AND v_invite.current_uses >= v_invite.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'used_up');
  END IF;

  SELECT name INTO v_name FROM chamas_v2 WHERE id = v_invite.chama_id AND status = 'active';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'invalid_code');
  END IF;
  RETURN jsonb_build_object('valid', true, 'chama_name', v_name);
END;
$$;

GRANT EXECUTE ON FUNCTION preview_join_code(TEXT) TO anon, authenticated;


-- ============================================================
-- PART 5: SEED SMARTGROW PRODUCTS
-- ============================================================
-- Unique key so re-running this file doesn't duplicate the catalogue
CREATE UNIQUE INDEX IF NOT EXISTS smartgrow_products_name_provider_key ON smartgrow_products(name, provider);
INSERT INTO smartgrow_products (name, provider, type, min_amount, expected_return_min, expected_return_max, risk_level, liquidity_days, description, regulatory_body)
VALUES
  ('Money Market Fund', 'CIC Asset Management', 'money_market', 5000, 9.0, 11.0, 'low', 3, 'Low-risk fund investing in short-term government securities and bank deposits.', 'CMA Kenya'),
  ('Money Market Fund', 'Sanlam Investments Kenya', 'money_market', 1000, 8.5, 10.5, 'low', 2, 'Accessible money market fund with low minimum investment.', 'CMA Kenya'),
  ('91-Day Treasury Bill', 'Central Bank of Kenya', 'government_security', 50000, 13.0, 16.0, 'low', 91, 'Short-term government debt. Interest rate set by weekly CBK auction.', 'CBK'),
  ('Fixed Deposit Account', 'Equity Bank Kenya', 'fixed_deposit', 20000, 7.0, 9.0, 'low', 180, 'Fixed deposit account at Equity Bank. Interest paid at maturity.', 'CBK / KDIC'),
  ('Chama Sacco Share Capital', 'Various Licensed SACCOs', 'sacco', 10000, 8.0, 12.0, 'medium', 365, 'Invest in share capital of a licensed SACCO.', 'SASRA')
ON CONFLICT (name, provider) DO NOTHING;

-- ============================================================
-- PART 6: PAYMENTS, LOANS & WALLET ENGINE
-- ============================================================
-- Tables and functions the API routes call but that never existed, plus the
-- rule that wallet balances only change inside these functions (never from
-- the browser). Every money function locks the wallet row (FOR UPDATE) so two
-- concurrent requests can't both spend the same balance.

-- ---------- Supporting tables (server-only unless noted) ----------

CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT PRIMARY KEY,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_outbox_pending ON outbox(processed, created_at);

CREATE TABLE IF NOT EXISTS compliance_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market TEXT NOT NULL DEFAULT 'KE',
  config_key TEXT NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (market, config_key)
);

INSERT INTO compliance_config (market, config_key, config_value, description) VALUES
  ('KE', 'max_single_transaction', '{"amount": 150000}', 'Largest single M-Pesa STK push (KSh)'),
  ('KE', 'max_chamas_per_person', '{"count": 5}', 'Fraud flag above this many active memberships'),
  ('KE', 'min_group_members_legitimate', '{"count": 5}', 'Fraud flag for groups this small after 30 days')
ON CONFLICT (market, config_key) DO NOTHING;

-- Double-entry style ledger written by record_ledger_transaction().
-- Convention (matches the M-Pesa callback): money INTO the group credits
-- 'chama_pool'; money OUT of the group debits it. So for any chama,
-- sum(credits to chama_pool) - sum(debits from chama_pool) = wallets.balance.
CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas_v2(id) ON DELETE CASCADE,
  debit_account_type TEXT NOT NULL,
  credit_account_type TEXT NOT NULL,
  membership_id UUID REFERENCES chama_memberships(id) ON DELETE SET NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ledger_chama_date ON ledger_entries(chama_id, created_at);

CREATE TABLE IF NOT EXISTS fraud_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas_v2(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  flag_type TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_chama ON fraud_flags(chama_id, resolved);

CREATE TABLE IF NOT EXISTS withdrawal_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas_v2(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES profiles(id),
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'executed', 'cancelled')),
  votes_for INTEGER NOT NULL DEFAULT 0,
  votes_against INTEGER NOT NULL DEFAULT 0,
  total_eligible_voters INTEGER,
  executed_by UUID REFERENCES profiles(id),
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_withdrawal_consents_chama ON withdrawal_consents(chama_id, status);

CREATE TABLE IF NOT EXISTS withdrawal_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_id UUID NOT NULL REFERENCES withdrawal_consents(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES chama_memberships(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('approve', 'reject')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (consent_id, membership_id)
);

ALTER TABLE loan_repayments ADD COLUMN IF NOT EXISTS reference TEXT;
ALTER TABLE loan_repayments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ DEFAULT now();

-- USSD lookup: one row per phone (their most recent active membership).
-- A plain view so it is never stale; refresh_ussd_summary() is kept as a
-- no-op for the existing cron route. Owned by postgres, so it bypasses RLS:
-- access is revoked from API roles below, only the service role reads it.
CREATE OR REPLACE VIEW ussd_member_summary AS
SELECT DISTINCT ON (p.phone_number)
  p.phone_number,
  p.id AS profile_id,
  p.full_name,
  m.id AS membership_id,
  m.chama_id,
  m.role,
  c.name AS chama_name
FROM profiles p
JOIN chama_memberships m ON m.profile_id = p.id AND m.status = 'active'
JOIN chamas_v2 c ON c.id = m.chama_id AND c.status = 'active'
WHERE p.phone_number IS NOT NULL
ORDER BY p.phone_number, m.joined_at DESC NULLS LAST;

REVOKE ALL ON ussd_member_summary FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION refresh_ussd_summary()
RETURNS void LANGUAGE sql AS $$ SELECT NULL::void $$;

-- ---------- RLS for tables that had none ----------
-- With RLS off, Supabase's REST API gives anon full read/write on a table.

ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE smartgrow_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE smartgrow_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE smartgrow_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE smartgrow_investments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_see_ledger" ON ledger_entries;
CREATE POLICY "members_see_ledger" ON ledger_entries FOR SELECT TO authenticated USING (check_is_chama_member(chama_id, auth.uid()));

DROP POLICY IF EXISTS "officials_see_fraud_flags" ON fraud_flags;
CREATE POLICY "officials_see_fraud_flags" ON fraud_flags FOR SELECT TO authenticated USING (check_is_chama_admin(chama_id, auth.uid()));
DROP POLICY IF EXISTS "officials_resolve_fraud_flags" ON fraud_flags;
CREATE POLICY "officials_resolve_fraud_flags" ON fraud_flags FOR UPDATE TO authenticated USING (check_is_chama_admin(chama_id, auth.uid()));

DROP POLICY IF EXISTS "members_see_withdrawals" ON withdrawal_consents;
CREATE POLICY "members_see_withdrawals" ON withdrawal_consents FOR SELECT TO authenticated USING (check_is_chama_member(chama_id, auth.uid()));
-- Any member may open a request for themselves; tallying and execution are RPC-only
DROP POLICY IF EXISTS "members_request_withdrawal" ON withdrawal_consents;
CREATE POLICY "members_request_withdrawal" ON withdrawal_consents FOR INSERT TO authenticated WITH CHECK (
  requested_by = auth.uid() AND status = 'pending' AND votes_for = 0 AND votes_against = 0
  AND executed_at IS NULL AND check_is_chama_member(chama_id, auth.uid())
);

DROP POLICY IF EXISTS "members_see_withdrawal_votes" ON withdrawal_votes;
CREATE POLICY "members_see_withdrawal_votes" ON withdrawal_votes FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM withdrawal_consents wc WHERE wc.id = consent_id AND check_is_chama_member(wc.chama_id, auth.uid()))
);

DROP POLICY IF EXISTS "members_see_repayments" ON loan_repayments;
CREATE POLICY "members_see_repayments" ON loan_repayments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM loans_v2 l WHERE l.id = loan_id AND check_is_chama_member(l.chama_id, auth.uid()))
);

DROP POLICY IF EXISTS "officials_see_audit_log" ON audit_log;
CREATE POLICY "officials_see_audit_log" ON audit_log FOR SELECT TO authenticated USING (check_is_chama_admin(chama_id, auth.uid()));

DROP POLICY IF EXISTS "anyone_signed_in_sees_products" ON smartgrow_products;
CREATE POLICY "anyone_signed_in_sees_products" ON smartgrow_products FOR SELECT TO authenticated USING (is_active);

DROP POLICY IF EXISTS "members_see_proposals" ON smartgrow_proposals;
CREATE POLICY "members_see_proposals" ON smartgrow_proposals FOR SELECT TO authenticated USING (check_is_chama_member(chama_id, auth.uid()));
DROP POLICY IF EXISTS "members_see_sg_votes" ON smartgrow_votes;
CREATE POLICY "members_see_sg_votes" ON smartgrow_votes FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM smartgrow_proposals sp WHERE sp.id = proposal_id AND check_is_chama_member(sp.chama_id, auth.uid()))
);
DROP POLICY IF EXISTS "members_see_investments" ON smartgrow_investments;
CREATE POLICY "members_see_investments" ON smartgrow_investments FOR SELECT TO authenticated USING (check_is_chama_member(chama_id, auth.uid()));

-- Wallet balances: read-only from the browser from now on
DROP POLICY IF EXISTS "admins_update_wallet" ON wallets;

-- ---------- Server-only money functions (service role) ----------

CREATE OR REPLACE FUNCTION record_ledger_transaction(
  p_chama_id UUID,
  p_debit_account_type TEXT,
  p_credit_account_type TEXT,
  p_membership_id UUID,
  p_amount NUMERIC,
  p_description TEXT
) RETURNS UUID
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  INSERT INTO ledger_entries (chama_id, debit_account_type, credit_account_type, membership_id, amount, description)
  VALUES (p_chama_id, p_debit_account_type, p_credit_account_type, p_membership_id, abs(p_amount), p_description)
  RETURNING id;
$$;

CREATE OR REPLACE FUNCTION increment_wallet_balance_safe(p_chama_id UUID, p_amount NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'amount must be positive';
  END IF;
  INSERT INTO wallets (chama_id) VALUES (p_chama_id) ON CONFLICT (chama_id) DO NOTHING;
  UPDATE wallets
  SET balance = balance + p_amount,
      savings_pool = savings_pool + p_amount,
      updated_at = now()
  WHERE chama_id = p_chama_id
  RETURNING balance INTO v_balance;
  RETURN v_balance;
END;
$$;

-- Called by /api/loans/approve after it has checked the caller is an official.
-- Re-checks everything itself so it is safe even if a caller forgets.
CREATE OR REPLACE FUNCTION approve_loan_safe(
  p_loan_id UUID,
  p_chama_id UUID,
  p_amount NUMERIC,
  p_admin_id UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_loan loans_v2%ROWTYPE;
  v_wallet wallets%ROWTYPE;
  v_borrower UUID;
BEGIN
  SELECT * INTO v_loan FROM loans_v2 WHERE id = p_loan_id AND chama_id = p_chama_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Loan not found');
  END IF;
  IF v_loan.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Loan is not pending');
  END IF;
  IF v_loan.amount <> p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount mismatch');
  END IF;
  IF NOT check_is_chama_admin(p_chama_id, p_admin_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only chama officials can approve loans');
  END IF;
  SELECT profile_id INTO v_borrower FROM chama_memberships WHERE id = v_loan.membership_id;
  IF v_borrower = p_admin_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You cannot approve your own loan');
  END IF;

  SELECT * INTO v_wallet FROM wallets WHERE chama_id = p_chama_id FOR UPDATE;
  IF NOT FOUND OR v_wallet.balance < v_loan.amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient group balance');
  END IF;

  UPDATE loans_v2
  SET status = 'active',
      approved_by = p_admin_id,
      approved_at = now(),
      due_date = (now() + make_interval(months => v_loan.repayment_months))::date
  WHERE id = p_loan_id;

  UPDATE wallets
  SET balance = balance - v_loan.amount,
      loans_disbursed = loans_disbursed + v_loan.amount,
      updated_at = now()
  WHERE chama_id = p_chama_id;

  INSERT INTO transactions_v2 (chama_id, membership_id, type, amount, description, status, created_by)
  VALUES (p_chama_id, v_loan.membership_id, 'loan_disbursement', -v_loan.amount, 'Loan disbursement', 'confirmed', p_admin_id);

  PERFORM record_ledger_transaction(p_chama_id, 'chama_pool', 'member_loans', v_loan.membership_id, v_loan.amount, 'Loan disbursement');

  INSERT INTO notifications (profile_id, chama_id, type, title, message)
  VALUES (v_borrower, p_chama_id, 'loan_approved', 'Loan approved',
          'Your loan of KSh ' || to_char(v_loan.amount, 'FM999,999,990') || ' has been approved.');

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION record_ledger_transaction(UUID, TEXT, TEXT, UUID, NUMERIC, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION increment_wallet_balance_safe(UUID, NUMERIC) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION approve_loan_safe(UUID, UUID, NUMERIC, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION refresh_ussd_summary() FROM PUBLIC, anon, authenticated;

-- ---------- Functions the browser calls (act as auth.uid()) ----------

CREATE OR REPLACE FUNCTION decline_loan(p_loan_id UUID, p_reason TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_loan loans_v2%ROWTYPE;
  v_borrower UUID;
BEGIN
  SELECT * INTO v_loan FROM loans_v2 WHERE id = p_loan_id FOR UPDATE;
  IF NOT FOUND OR NOT check_is_chama_admin(v_loan.chama_id, auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Loan not found');
  END IF;
  SELECT profile_id INTO v_borrower FROM chama_memberships WHERE id = v_loan.membership_id;
  IF v_borrower = auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'You cannot decide your own loan');
  END IF;
  IF v_loan.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Loan is not pending');
  END IF;

  UPDATE loans_v2 SET status = 'declined', decline_reason = left(p_reason, 500) WHERE id = p_loan_id;

  INSERT INTO notifications (profile_id, chama_id, type, title, message)
  VALUES (v_borrower, v_loan.chama_id, 'loan_declined', 'Loan declined',
          'Your loan request was declined. Reason: ' || coalesce(left(p_reason, 500), 'not given'));

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION record_loan_repayment(
  p_loan_id UUID,
  p_amount NUMERIC,
  p_reference TEXT DEFAULT NULL,
  p_paid_at TIMESTAMPTZ DEFAULT now()
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_loan loans_v2%ROWTYPE;
  v_total_due NUMERIC;
  v_new_total NUMERIC;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Enter a positive amount');
  END IF;

  SELECT * INTO v_loan FROM loans_v2 WHERE id = p_loan_id FOR UPDATE;
  IF NOT FOUND OR NOT check_is_chama_admin(v_loan.chama_id, auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Loan not found');
  END IF;
  IF v_loan.status NOT IN ('active', 'overdue', 'approved') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Loan is not being repaid');
  END IF;

  v_total_due := round(v_loan.amount * (1 + v_loan.interest_rate / 100), 2);
  v_new_total := coalesce(v_loan.total_repaid, 0) + p_amount;
  IF v_new_total > v_total_due THEN
    RETURN jsonb_build_object('success', false, 'error',
      'That is more than the KSh ' || to_char(v_total_due - coalesce(v_loan.total_repaid, 0), 'FM999,999,990') || ' still owed');
  END IF;

  PERFORM 1 FROM wallets WHERE chama_id = v_loan.chama_id FOR UPDATE;

  INSERT INTO loan_repayments (loan_id, amount, mpesa_receipt, reference, recorded_by, paid_at)
  VALUES (p_loan_id, p_amount, NULL, left(p_reference, 100), auth.uid(), coalesce(p_paid_at, now()));

  UPDATE loans_v2
  SET total_repaid = v_new_total,
      status = CASE WHEN v_new_total >= v_total_due THEN 'repaid' ELSE status END
  WHERE id = p_loan_id;

  UPDATE wallets
  SET balance = balance + p_amount,
      loans_disbursed = greatest(loans_disbursed - least(p_amount, v_loan.amount), 0),
      updated_at = now()
  WHERE chama_id = v_loan.chama_id;

  INSERT INTO transactions_v2 (chama_id, membership_id, type, amount, reference, description, status, created_by)
  VALUES (v_loan.chama_id, v_loan.membership_id, 'loan_repayment', p_amount, left(p_reference, 100), 'Loan repayment', 'confirmed', auth.uid());

  PERFORM record_ledger_transaction(v_loan.chama_id, 'member_loans', 'chama_pool', v_loan.membership_id, p_amount, 'Loan repayment');

  RETURN jsonb_build_object('success', true, 'total_repaid', v_new_total, 'fully_repaid', v_new_total >= v_total_due);
END;
$$;

-- Cash or bank money an official received outside M-Pesa
CREATE OR REPLACE FUNCTION record_manual_deposit(
  p_chama_id UUID,
  p_amount NUMERIC,
  p_reference TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_membership UUID;
BEGIN
  IF NOT check_is_chama_admin(p_chama_id, auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only chama officials can record deposits');
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 10000000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Enter a valid amount');
  END IF;

  SELECT id INTO v_membership FROM chama_memberships WHERE chama_id = p_chama_id AND profile_id = auth.uid();

  PERFORM increment_wallet_balance_safe(p_chama_id, p_amount);

  INSERT INTO transactions_v2 (chama_id, membership_id, type, amount, reference, description, status, created_by)
  VALUES (p_chama_id, v_membership, 'deposit', p_amount, left(p_reference, 100), coalesce(left(p_notes, 300), 'Deposit'), 'confirmed', auth.uid());

  PERFORM record_ledger_transaction(p_chama_id, 'external_cash', 'chama_pool', v_membership, p_amount, coalesce(left(p_notes, 300), 'Manual deposit'));

  INSERT INTO audit_log (chama_id, actor_id, action, target_type, details)
  VALUES (p_chama_id, auth.uid(), 'manual_deposit', 'wallet', jsonb_build_object('amount', p_amount, 'reference', p_reference));

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION cast_withdrawal_vote(p_consent_id UUID, p_vote TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_consent withdrawal_consents%ROWTYPE;
  v_membership UUID;
  v_for INTEGER;
  v_against INTEGER;
  v_voters INTEGER;
  v_majority INTEGER;
  v_status TEXT;
BEGIN
  IF p_vote NOT IN ('approve', 'reject') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid vote');
  END IF;

  SELECT * INTO v_consent FROM withdrawal_consents WHERE id = p_consent_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  SELECT id INTO v_membership FROM chama_memberships
  WHERE chama_id = v_consent.chama_id AND profile_id = auth.uid() AND status = 'active';
  IF v_membership IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;
  IF v_consent.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Voting on this request has closed');
  END IF;

  INSERT INTO withdrawal_votes (consent_id, membership_id, vote)
  VALUES (p_consent_id, v_membership, p_vote)
  ON CONFLICT (consent_id, membership_id) DO NOTHING;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_voted');
  END IF;

  SELECT count(*) FILTER (WHERE vote = 'approve'), count(*) FILTER (WHERE vote = 'reject')
  INTO v_for, v_against
  FROM withdrawal_votes WHERE consent_id = p_consent_id;

  SELECT count(*) INTO v_voters FROM chama_memberships WHERE chama_id = v_consent.chama_id AND status = 'active';
  v_majority := floor(greatest(v_voters, 1) / 2.0)::int + 1;

  v_status := CASE WHEN v_for >= v_majority THEN 'approved'
                   WHEN v_against >= v_majority THEN 'rejected'
                   ELSE 'pending' END;

  UPDATE withdrawal_consents
  SET votes_for = v_for, votes_against = v_against, total_eligible_voters = v_voters, status = v_status
  WHERE id = p_consent_id;

  RETURN jsonb_build_object('success', true, 'status', v_status, 'votes_for', v_for, 'votes_against', v_against);
END;
$$;

CREATE OR REPLACE FUNCTION execute_withdrawal(p_consent_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_consent withdrawal_consents%ROWTYPE;
  v_wallet wallets%ROWTYPE;
  v_membership UUID;
BEGIN
  SELECT * INTO v_consent FROM withdrawal_consents WHERE id = p_consent_id FOR UPDATE;
  IF NOT FOUND OR NOT check_is_chama_admin(v_consent.chama_id, auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;
  IF v_consent.status <> 'approved' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only member-approved requests can be paid out');
  END IF;

  SELECT * INTO v_wallet FROM wallets WHERE chama_id = v_consent.chama_id FOR UPDATE;
  IF NOT FOUND OR v_wallet.balance < v_consent.amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient group balance');
  END IF;

  SELECT id INTO v_membership FROM chama_memberships WHERE chama_id = v_consent.chama_id AND profile_id = auth.uid();

  UPDATE wallets
  SET balance = balance - v_consent.amount,
      savings_pool = greatest(savings_pool - v_consent.amount, 0),
      updated_at = now()
  WHERE chama_id = v_consent.chama_id;

  UPDATE withdrawal_consents
  SET status = 'executed', executed_at = now(), executed_by = auth.uid()
  WHERE id = p_consent_id;

  INSERT INTO transactions_v2 (chama_id, membership_id, type, amount, reference, description, status, created_by)
  VALUES (v_consent.chama_id, v_membership, 'withdrawal', -v_consent.amount, 'WD-' || left(p_consent_id::text, 8),
          coalesce(v_consent.reason, 'Approved withdrawal'), 'confirmed', auth.uid());

  PERFORM record_ledger_transaction(v_consent.chama_id, 'chama_pool', 'external_cash', v_membership, v_consent.amount, 'Withdrawal');

  INSERT INTO audit_log (chama_id, actor_id, action, target_type, target_id, details)
  VALUES (v_consent.chama_id, auth.uid(), 'withdrawal_executed', 'withdrawal_consent', p_consent_id,
          jsonb_build_object('amount', v_consent.amount));

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION record_smartgrow_investment(p_chama_id UUID, p_product_id UUID, p_amount NUMERIC)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_product smartgrow_products%ROWTYPE;
  v_wallet wallets%ROWTYPE;
  v_membership UUID;
  v_investment UUID;
BEGIN
  IF NOT check_is_chama_admin(p_chama_id, auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only chama officials can invest group funds');
  END IF;

  SELECT * INTO v_product FROM smartgrow_products WHERE id = p_product_id AND is_active;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product not available');
  END IF;
  IF p_amount IS NULL OR p_amount < v_product.min_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Below the product minimum');
  END IF;

  SELECT * INTO v_wallet FROM wallets WHERE chama_id = p_chama_id FOR UPDATE;
  IF NOT FOUND OR v_wallet.balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient group balance');
  END IF;

  SELECT id INTO v_membership FROM chama_memberships WHERE chama_id = p_chama_id AND profile_id = auth.uid();

  INSERT INTO smartgrow_investments (chama_id, product_id, amount, expected_return, status, start_date)
  VALUES (p_chama_id, p_product_id, p_amount, v_product.expected_return_min, 'active', current_date)
  RETURNING id INTO v_investment;

  UPDATE wallets
  SET balance = balance - p_amount, invested = invested + p_amount, updated_at = now()
  WHERE chama_id = p_chama_id;

  INSERT INTO transactions_v2 (chama_id, membership_id, type, amount, description, status, created_by)
  VALUES (p_chama_id, v_membership, 'smartgrow_investment', -p_amount,
          'SmartGrow: ' || v_product.name || ' with ' || v_product.provider, 'confirmed', auth.uid());

  PERFORM record_ledger_transaction(p_chama_id, 'chama_pool', 'investments', v_membership, p_amount, 'SmartGrow: ' || v_product.name);

  RETURN jsonb_build_object('success', true, 'investment_id', v_investment);
END;
$$;

REVOKE ALL ON FUNCTION decline_loan(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION record_loan_repayment(UUID, NUMERIC, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION record_manual_deposit(UUID, NUMERIC, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION cast_withdrawal_vote(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION execute_withdrawal(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION record_smartgrow_investment(UUID, UUID, NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION decline_loan(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION record_loan_repayment(UUID, NUMERIC, TEXT, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION record_manual_deposit(UUID, NUMERIC, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cast_withdrawal_vote(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_withdrawal(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION record_smartgrow_investment(UUID, UUID, NUMERIC) TO authenticated;

-- Policy helpers: not callable by signed-out visitors
REVOKE ALL ON FUNCTION check_is_chama_member(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION check_is_chama_admin(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION owns_membership(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION shares_chama_with(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION check_is_chama_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_is_chama_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION owns_membership(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION shares_chama_with(UUID) TO authenticated;

-- ============================================================
-- PART 7: MERRY-GO-ROUND, WELFARE, PENALTIES, PUSH, AVATARS
-- ============================================================
-- Folded in from migrations/migration_v5_merrygoround.sql and
-- migration_v6_welfare_and_penalties.sql, plus RLS they lacked. The API
-- routes use the service role and do their own membership checks; RLS here
-- stops the browser/mobile app reading or writing these tables directly.

CREATE TABLE IF NOT EXISTS merry_go_round_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas_v2(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Merry-Go-Round',
  amount_per_member NUMERIC NOT NULL CHECK (amount_per_member > 0),
  frequency TEXT NOT NULL DEFAULT 'monthly',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  current_round INTEGER NOT NULL DEFAULT 1,
  total_rounds INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS merry_go_round_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES merry_go_round_cycles(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  recipient_membership_id UUID NOT NULL REFERENCES chama_memberships(id),
  scheduled_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (cycle_id, round_number)
);

CREATE TABLE IF NOT EXISTS merry_go_round_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES merry_go_round_cycles(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  membership_id UUID NOT NULL REFERENCES chama_memberships(id),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  mpesa_receipt TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (cycle_id, round_number, membership_id)
);

CREATE TABLE IF NOT EXISTS member_penalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas_v2(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES chama_memberships(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'custom', -- 'late_contribution', 'missed_meeting', 'loan_default', 'custom'
  amount NUMERIC NOT NULL CHECK (amount > 0),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'waived')),
  imposed_by UUID REFERENCES chama_memberships(id),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_member_penalties_chama ON member_penalties(chama_id, status);

CREATE TABLE IF NOT EXISTS welfare_fund (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL UNIQUE REFERENCES chamas_v2(id) ON DELETE CASCADE,
  balance NUMERIC NOT NULL DEFAULT 0 CHECK (balance >= 0),
  monthly_contribution NUMERIC NOT NULL DEFAULT 500,
  max_claim_amount NUMERIC NOT NULL DEFAULT 50000,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS welfare_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas_v2(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES chama_memberships(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL, -- 'bereavement', 'medical', 'wedding', 'education', 'other'
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  approved_by UUID REFERENCES chama_memberships(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_welfare_claims_chama ON welfare_claims(chama_id, status);

ALTER TABLE merry_go_round_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE merry_go_round_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE merry_go_round_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE welfare_fund ENABLE ROW LEVEL SECURITY;
ALTER TABLE welfare_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_see_mgr_cycles" ON merry_go_round_cycles;
CREATE POLICY "members_see_mgr_cycles" ON merry_go_round_cycles FOR SELECT TO authenticated USING (check_is_chama_member(chama_id, auth.uid()));
DROP POLICY IF EXISTS "members_see_mgr_schedule" ON merry_go_round_schedule;
CREATE POLICY "members_see_mgr_schedule" ON merry_go_round_schedule FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM merry_go_round_cycles c WHERE c.id = cycle_id AND check_is_chama_member(c.chama_id, auth.uid()))
);
DROP POLICY IF EXISTS "members_see_mgr_contributions" ON merry_go_round_contributions;
CREATE POLICY "members_see_mgr_contributions" ON merry_go_round_contributions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM merry_go_round_cycles c WHERE c.id = cycle_id AND check_is_chama_member(c.chama_id, auth.uid()))
);
DROP POLICY IF EXISTS "members_see_penalties" ON member_penalties;
CREATE POLICY "members_see_penalties" ON member_penalties FOR SELECT TO authenticated USING (check_is_chama_member(chama_id, auth.uid()));
DROP POLICY IF EXISTS "members_see_welfare_fund" ON welfare_fund;
CREATE POLICY "members_see_welfare_fund" ON welfare_fund FOR SELECT TO authenticated USING (check_is_chama_member(chama_id, auth.uid()));
DROP POLICY IF EXISTS "members_see_welfare_claims" ON welfare_claims;
CREATE POLICY "members_see_welfare_claims" ON welfare_claims FOR SELECT TO authenticated USING (check_is_chama_member(chama_id, auth.uid()));

-- Expo push token, written by the mobile app for its own profile
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Avatars: public read; each user may only write inside their own <uid>/ folder
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Avatars" ON storage.objects;
CREATE POLICY "Public Read Avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "own_avatar_insert" ON storage.objects;
CREATE POLICY "own_avatar_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
);
DROP POLICY IF EXISTS "own_avatar_update" ON storage.objects;
CREATE POLICY "own_avatar_update" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
);
DROP POLICY IF EXISTS "own_avatar_delete" ON storage.objects;
CREATE POLICY "own_avatar_delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Housekeeping, called from the outbox cron or by hand (service role only)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS INT LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  WITH d AS (DELETE FROM otp_codes WHERE expires_at < now() - interval '1 day' RETURNING 1)
  SELECT count(*)::int FROM d;
$$;

CREATE OR REPLACE FUNCTION cleanup_idempotency_keys()
RETURNS INT LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  WITH d AS (DELETE FROM idempotency_keys WHERE created_at < now() - interval '1 day' RETURNING 1)
  SELECT count(*)::int FROM d;
$$;

REVOKE ALL ON FUNCTION cleanup_expired_otps() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION cleanup_idempotency_keys() FROM PUBLIC, anon, authenticated;

-- ============================================================
-- DONE.
-- ============================================================
