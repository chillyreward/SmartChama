-- ============================================
-- PART 0: BACKUPS
-- (These work on the Free Tier! They create a copy of your tables)
-- ============================================
CREATE TABLE IF NOT EXISTS members_backup_pre_migration AS SELECT * FROM members;
CREATE TABLE IF NOT EXISTS chamas_backup_pre_migration AS SELECT * FROM chamas;

-- ============================================
-- PART 1: THE CORRECT SCHEMA
-- ============================================

-- PROFILES (one row per real human, tied to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone_number TEXT UNIQUE NOT NULL,
  email TEXT,
  national_id TEXT,
  county TEXT,
  occupation TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- CHAMAS_V2
CREATE TABLE IF NOT EXISTS chamas_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  county TEXT,
  contribution_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  contribution_frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (contribution_frequency IN ('weekly', 'monthly')),
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
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'dissolved')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- CHAMA MEMBERSHIPS (The Multi-Chama Fix)
CREATE TABLE IF NOT EXISTS chama_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chama_id UUID NOT NULL REFERENCES chamas_v2(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin', 'chairlady', 'treasurer', 'secretary')),
  trust_score INTEGER NOT NULL DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
  contribution_streak INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'flagged', 'inactive', 'removed')),
  flag_reason TEXT,
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, chama_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_profile ON chama_memberships(profile_id);
CREATE INDEX IF NOT EXISTS idx_memberships_chama ON chama_memberships(chama_id);
CREATE INDEX IF NOT EXISTS idx_memberships_chama_status ON chama_memberships(chama_id, status);

-- CONTRIBUTIONS_V2
CREATE TABLE IF NOT EXISTS contributions_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id UUID NOT NULL REFERENCES chama_memberships(id) ON DELETE CASCADE,
  chama_id UUID NOT NULL REFERENCES chamas_v2(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT DEFAULT 'mpesa' CHECK (payment_method IN ('mpesa', 'cash', 'bank')),
  mpesa_receipt TEXT,
  mpesa_checkout_request_id TEXT,
  reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'late', 'partial')),
  blockchain_tx_hash TEXT,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_contributions_membership ON contributions_v2(membership_id);
CREATE INDEX IF NOT EXISTS idx_contributions_chama_date ON contributions_v2(chama_id, created_at);
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
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'active', 'overdue', 'repaid', 'defaulted')),
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

-- TRANSACTIONS_V2
CREATE TABLE IF NOT EXISTS transactions_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas_v2(id) ON DELETE CASCADE,
  membership_id UUID REFERENCES chama_memberships(id),
  type TEXT NOT NULL CHECK (type IN ('contribution', 'loan_disbursement', 'loan_repayment', 'withdrawal', 'deposit', 'penalty', 'interest', 'smartgrow_investment', 'smartgrow_return')),
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  reference TEXT,
  status TEXT DEFAULT 'confirmed',
  blockchain_tx_hash TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_chama_date ON transactions_v2(chama_id, created_at);

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
  status TEXT NOT NULL DEFAULT 'voting' CHECK (status IN ('voting', 'approved', 'rejected', 'expired', 'executed')),
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

-- OTP CODES
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'login' CHECK (purpose IN ('login', 'signup', 'password_reset')),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_phone_purpose ON otp_codes(phone_number, purpose, used);

-- NOTIFICATIONS & ACTIVITY
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

CREATE INDEX IF NOT EXISTS idx_notifications_profile ON notifications(profile_id, read);

CREATE TABLE IF NOT EXISTS group_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas_v2(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

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

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chamas_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE chama_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own_memberships" ON chama_memberships FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "member_can_see_chama" ON chamas_v2 FOR SELECT USING (EXISTS (SELECT 1 FROM chama_memberships WHERE chama_memberships.chama_id = chamas_v2.id AND chama_memberships.profile_id = auth.uid()));
CREATE POLICY "chama_members_see_contributions" ON contributions_v2 FOR SELECT USING (EXISTS (SELECT 1 FROM chama_memberships WHERE chama_memberships.chama_id = contributions_v2.chama_id AND chama_memberships.profile_id = auth.uid()));
CREATE POLICY "own_notifications" ON notifications FOR SELECT USING (profile_id = auth.uid());


-- ============================================
-- PART 2: MIGRATE EXISTING REAL DATA
-- ============================================

-- Step 1: Migrate existing members into profiles
INSERT INTO profiles (id, full_name, phone_number, email, created_at)
SELECT DISTINCT ON (user_id)
  user_id, full_name, COALESCE(NULLIF(phone_number, ''), 'unknown_' || substr(user_id::text, 1, 8)), email, created_at
FROM members
WHERE user_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Step 2: Migrate existing chamas into chamas_v2
INSERT INTO chamas_v2 (id, name, contribution_amount, contribution_frequency, status, created_by, created_at)
SELECT 
  id, name, 0, 'monthly', 'active', 
  (CASE WHEN admin_id IN (SELECT id FROM profiles) THEN admin_id ELSE NULL END), 
  created_at
FROM chamas
ON CONFLICT (id) DO NOTHING;

-- Step 3: Create chama_memberships
INSERT INTO chama_memberships (profile_id, chama_id, role, status, joined_at)
SELECT 
  user_id, chama_id,
  CASE WHEN user_id = (SELECT admin_id FROM chamas WHERE chamas.id = members.chama_id) THEN 'chairlady' ELSE 'member' END,
  'active', created_at
FROM members
WHERE user_id IS NOT NULL AND chama_id IS NOT NULL
ON CONFLICT (profile_id, chama_id) DO NOTHING;

-- Step 4: Create a wallet row for every migrated chama
INSERT INTO wallets (chama_id, balance)
SELECT id, 0 FROM chamas_v2
ON CONFLICT (chama_id) DO NOTHING;


-- ============================================
-- PART 3: SEED SMARTGROW PRODUCTS
-- ============================================
INSERT INTO smartgrow_products (name, provider, type, min_amount, expected_return_min, expected_return_max, risk_level, liquidity_days, description, regulatory_body)
VALUES
('Money Market Fund', 'CIC Asset Management', 'money_market', 5000, 9.0, 11.0, 'low', 3, 'A low-risk fund that invests in short-term government securities and bank deposits.', 'CMA Kenya'),
('Money Market Fund', 'Sanlam Investments Kenya', 'money_market', 1000, 8.5, 10.5, 'low', 2, 'Accessible money market fund with low minimum investment.', 'CMA Kenya'),
('91-Day Treasury Bill', 'Central Bank of Kenya', 'government_security', 50000, 13.0, 16.0, 'low', 91, 'Short-term government debt securities. Interest rate set by weekly CBK auction.', 'CBK'),
('Fixed Deposit Account', 'Equity Bank Kenya', 'fixed_deposit', 20000, 7.0, 9.0, 'low', 180, 'Fixed deposit account held at Equity Bank. Interest paid at maturity.', 'CBK / KDIC'),
('Chama Sacco Share Capital', 'Various Licensed SACCOs', 'sacco', 10000, 8.0, 12.0, 'medium', 365, 'Invest in share capital of a licensed SACCO.', 'SASRA');
