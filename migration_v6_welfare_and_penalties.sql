-- SmartChama Welfare & Penalties Migration
-- Run this in your Supabase SQL Editor

-- Member Penalties / Fines
CREATE TABLE IF NOT EXISTS member_penalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas_v2(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES chama_memberships(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'custom', -- 'late_contribution', 'missed_meeting', 'loan_default', 'custom'
  amount NUMERIC NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'unpaid', -- 'unpaid', 'paid', 'waived'
  imposed_by UUID REFERENCES chama_memberships(id),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Welfare Fund Pool
CREATE TABLE IF NOT EXISTS welfare_fund (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas_v2(id) ON DELETE CASCADE UNIQUE,
  balance NUMERIC NOT NULL DEFAULT 0,
  monthly_contribution NUMERIC NOT NULL DEFAULT 500,
  max_claim_amount NUMERIC NOT NULL DEFAULT 50000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Welfare Claims
CREATE TABLE IF NOT EXISTS welfare_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas_v2(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES chama_memberships(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  reason TEXT NOT NULL, -- 'bereavement', 'medical', 'wedding', 'education', 'other'
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'paid'
  approved_by UUID REFERENCES chama_memberships(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
