-- ============================================================================
-- SmartChama Migration v7 (FIXED): Consolidated Missing Tables, RPCs, & Storage Buckets
-- ============================================================================
-- Run this corrected script in your Supabase SQL Editor.
-- Fixes:
-- 1. Added DROP FUNCTION IF EXISTS CASCADE for all RPCs to prevent return type mismatch errors (42P13)
-- 2. Corrected wallets table INSERT (removed non-existent created_at column)
-- 3. Renamed get_user_dashboard_data -> get_member_summary_metrics to avoid overwriting v3 RPC
-- 4. Added ALTER TABLE group_activity ADD COLUMN IF NOT EXISTS metadata JSONB
-- 5. Enabled RLS and added RLS security policies on all 9 new tables
-- 6. Added GRANT EXECUTE ON FUNCTION to authenticated and service_role
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. MISSING TABLES & SCHEMA UPDATES
-- ----------------------------------------------------------------------------

-- Idempotency Keys (for duplicate payment prevention)
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    result JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Activity Audit Log
CREATE TABLE IF NOT EXISTS public.group_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chama_id UUID REFERENCES public.chamas_v2(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure metadata column exists if group_activity was created in v2
ALTER TABLE public.group_activity ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Withdrawal Consents
CREATE TABLE IF NOT EXISTS public.withdrawal_consents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chama_id UUID REFERENCES public.chamas_v2(id) ON DELETE CASCADE,
    membership_id UUID REFERENCES public.chama_memberships(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    approved_by UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chama Payment Configurations
CREATE TABLE IF NOT EXISTS public.chama_payment_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chama_id UUID UNIQUE REFERENCES public.chamas_v2(id) ON DELETE CASCADE,
    contribution_amount NUMERIC(12, 2) DEFAULT 0,
    frequency TEXT DEFAULT 'monthly',
    mpesa_paybill TEXT,
    mpesa_account_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated Reports
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chama_id UUID REFERENCES public.chamas_v2(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL,
    generated_by UUID REFERENCES public.profiles(id),
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event Outbox (Asynchronous Event Processing)
CREATE TABLE IF NOT EXISTS public.outbox (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    attempts INT DEFAULT 0,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OTP Verification Codes
CREATE TABLE IF NOT EXISTS public.otp_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL,
    code TEXT NOT NULL,
    purpose TEXT DEFAULT 'login',
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Double-Entry Financial Ledger
CREATE TABLE IF NOT EXISTS public.ledger (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chama_id UUID REFERENCES public.chamas_v2(id) ON DELETE CASCADE,
    account_type TEXT NOT NULL,
    entry_type TEXT CHECK (entry_type IN ('debit', 'credit')),
    membership_id UUID REFERENCES public.chama_memberships(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    chama_id UUID REFERENCES public.chamas_v2(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for high-performance queries
CREATE INDEX IF NOT EXISTS idx_outbox_processed ON public.outbox(processed, attempts);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON public.otp_codes(phone_number, used, expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_profile ON public.notifications(profile_id, read);

-- ----------------------------------------------------------------------------
-- 2. ENABLE ROW LEVEL SECURITY (RLS) & POLICIES
-- ----------------------------------------------------------------------------

ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chama_payment_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper RLS Policies for Authenticated Users & Service Role
DO $$
BEGIN
    -- Service role bypass policies (Service Role can do anything)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access idempotency') THEN
        CREATE POLICY "Service role full access idempotency" ON public.idempotency_keys FOR ALL TO service_role USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access outbox') THEN
        CREATE POLICY "Service role full access outbox" ON public.outbox FOR ALL TO service_role USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access otp') THEN
        CREATE POLICY "Service role full access otp" ON public.otp_codes FOR ALL TO service_role USING (true);
    END IF;

    -- Authenticated User policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated select group_activity') THEN
        CREATE POLICY "Authenticated select group_activity" ON public.group_activity FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated select chama_payment_config') THEN
        CREATE POLICY "Authenticated select chama_payment_config" ON public.chama_payment_config FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated select notifications') THEN
        CREATE POLICY "Authenticated select notifications" ON public.notifications FOR SELECT TO authenticated USING (profile_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated update notifications') THEN
        CREATE POLICY "Authenticated update notifications" ON public.notifications FOR UPDATE TO authenticated USING (profile_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated select reports') THEN
        CREATE POLICY "Authenticated select reports" ON public.reports FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated select ledger') THEN
        CREATE POLICY "Authenticated select ledger" ON public.ledger FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated select withdrawal_consents') THEN
        CREATE POLICY "Authenticated select withdrawal_consents" ON public.withdrawal_consents FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. RPC FUNCTIONS (WITH DROP FUNCTION PREVENTING 42P13 ERRORS)
-- ----------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.increment_wallet_balance_safe(UUID, NUMERIC) CASCADE;
CREATE OR REPLACE FUNCTION public.increment_wallet_balance_safe(
    p_chama_id UUID,
    p_amount NUMERIC
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.wallets (chama_id, balance, updated_at)
    VALUES (p_chama_id, p_amount, NOW())
    ON CONFLICT (chama_id) DO UPDATE
    SET balance = wallets.balance + EXCLUDED.balance,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.approve_loan_safe(UUID, UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.approve_loan_safe(
    p_loan_id UUID,
    p_approved_by UUID
)
RETURNS JSONB AS $$
DECLARE
    v_loan RECORD;
BEGIN
    SELECT * INTO v_loan FROM public.loans_v2 WHERE id = p_loan_id FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Loan not found');
    END IF;

    IF v_loan.status != 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Loan is not in pending status');
    END IF;

    UPDATE public.loans_v2
    SET status = 'active',
        approved_by = p_approved_by,
        approved_at = NOW()
    WHERE id = p_loan_id;

    RETURN jsonb_build_object('success', true, 'loan_id', p_loan_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.record_ledger_transaction(UUID, TEXT, TEXT, UUID, NUMERIC, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.record_ledger_transaction(
    p_chama_id UUID,
    p_debit_account_type TEXT,
    p_credit_account_type TEXT,
    p_membership_id UUID,
    p_amount NUMERIC,
    p_description TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Debit entry
    INSERT INTO public.ledger (chama_id, account_type, entry_type, membership_id, amount, description)
    VALUES (p_chama_id, p_debit_account_type, 'debit', p_membership_id, p_amount, p_description);

    -- Credit entry
    INSERT INTO public.ledger (chama_id, account_type, entry_type, membership_id, amount, description)
    VALUES (p_chama_id, p_credit_account_type, 'credit', p_membership_id, p_amount, p_description);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.get_admin_dashboard_data(UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_data(
    p_chama_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_total_balance NUMERIC := 0;
    v_active_members INT := 0;
    v_active_loans NUMERIC := 0;
    v_pending_claims INT := 0;
BEGIN
    SELECT COALESCE(balance, 0) INTO v_total_balance FROM public.wallets WHERE chama_id = p_chama_id;
    SELECT COUNT(*) INTO v_active_members FROM public.chama_memberships WHERE chama_id = p_chama_id AND status = 'active';
    SELECT COALESCE(SUM(amount), 0) INTO v_active_loans FROM public.loans_v2 WHERE chama_id = p_chama_id AND status = 'active';
    SELECT COUNT(*) INTO v_pending_claims FROM public.welfare_claims WHERE chama_id = p_chama_id AND status = 'pending';

    RETURN jsonb_build_object(
        'total_balance', v_total_balance,
        'active_members', v_active_members,
        'active_loans_total', v_active_loans,
        'pending_welfare_claims', v_pending_claims
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.get_member_summary_metrics(UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.get_member_summary_metrics(
    p_membership_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_total_contributions NUMERIC := 0;
    v_trust_score INT := 100;
    v_active_loan_amount NUMERIC := 0;
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO v_total_contributions
    FROM public.contributions_v2
    WHERE membership_id = p_membership_id AND status = 'confirmed';

    SELECT COALESCE(trust_score, 100) INTO v_trust_score
    FROM public.chama_memberships
    WHERE id = p_membership_id;

    SELECT COALESCE(SUM(amount), 0) INTO v_active_loan_amount
    FROM public.loans_v2
    WHERE membership_id = p_membership_id AND status = 'active';

    RETURN jsonb_build_object(
        'total_contributions', v_total_contributions,
        'trust_score', v_trust_score,
        'active_loan_balance', v_active_loan_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.refresh_ussd_summary() CASCADE;
CREATE OR REPLACE FUNCTION public.refresh_ussd_summary()
RETURNS VOID AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'ussd_summary_view') THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY public.ussd_summary_view;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 4. GRANT EXECUTE PERMISSIONS ON RPC FUNCTIONS
-- ----------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.increment_wallet_balance_safe(UUID, NUMERIC) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.approve_loan_safe(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_ledger_transaction(UUID, TEXT, TEXT, UUID, NUMERIC, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_data(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_member_summary_metrics(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.refresh_ussd_summary() TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 5. STORAGE BUCKETS & POLICIES
-- ----------------------------------------------------------------------------

-- Create avatars bucket if not present
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Public Read Access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Avatars' AND tablename = 'objects' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Public Read Avatars" ON storage.objects
        FOR SELECT USING (bucket_id = 'avatars');
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 6. CLEANUP CRON JOBS / UTILITY FUNCTIONS
-- ----------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.cleanup_expired_otps() CASCADE;
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS INT AS $$
DECLARE
    v_deleted_count INT;
BEGIN
    DELETE FROM public.otp_codes
    WHERE expires_at < NOW() OR used = TRUE;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.cleanup_idempotency_keys() CASCADE;
CREATE OR REPLACE FUNCTION public.cleanup_idempotency_keys()
RETURNS INT AS $$
DECLARE
    v_deleted_count INT;
BEGIN
    DELETE FROM public.idempotency_keys
    WHERE created_at < NOW() - INTERVAL '24 hours';

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.cleanup_expired_otps() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_idempotency_keys() TO service_role;
