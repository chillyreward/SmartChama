-- SmartChama Merry-Go-Round Migration
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS merry_go_round_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas_v2(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Merry-Go-Round',
  amount_per_member NUMERIC NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'monthly',
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  current_round INTEGER NOT NULL DEFAULT 1,
  total_rounds INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS merry_go_round_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES merry_go_round_cycles(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  recipient_membership_id UUID NOT NULL REFERENCES chama_memberships(id),
  scheduled_date DATE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid'
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cycle_id, round_number)
);

CREATE TABLE IF NOT EXISTS merry_go_round_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES merry_go_round_cycles(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  membership_id UUID NOT NULL REFERENCES chama_memberships(id),
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
  mpesa_receipt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cycle_id, round_number, membership_id)
);
