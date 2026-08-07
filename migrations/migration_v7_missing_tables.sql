-- ============================================================================
-- SmartChama Migration v7: Consolidated Missing Tables, RPCs, & Storage Buckets
-- ============================================================================
-- Run this script in the Supabase SQL Editor to ensure all tables, functions,
-- RLS policies, and storage buckets used by SmartChama are present.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. MISSING TABLES
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
-- 2. MISSING RPC FUNCTIONS
-- ----------------------------------------------------------------------------

-- Function: Atomic Wallet Balance Increment
CREATE OR REPLACE FUNCTION public.increment_wallet_balance_safe(
    p_chama_id UUID,
    p_amount NUMERIC
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.wallets (chama_id, balance, created_at, updated_at)
    VALUES (p_chama_id, p_amount, NOW(), NOW())
    ON CONFLICT (chama_id) DO UPDATE
    SET balance = wallets.balance + EXCLUDED.balance,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Atomic Loan Approval (Prevents double-approval)
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

-- Function: Double-Entry Ledger Transaction Recording
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

-- Function: Aggregate Admin Dashboard Data
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

-- Function: Aggregate Member Dashboard Data
CREATE OR REPLACE FUNCTION public.get_user_dashboard_data(
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

-- Function: Refresh USSD Summary View
CREATE OR REPLACE FUNCTION public.refresh_ussd_summary()
RETURNS VOID AS $$
BEGIN
    -- Refresh materialized view if it exists
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'ussd_summary_view') THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY public.ussd_summary_view;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 3. STORAGE BUCKETS
-- ----------------------------------------------------------------------------

-- Create avatars bucket if not present
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Public Read Access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Avatars' AND tablename = 'objects'
    ) THEN
        CREATE POLICY "Public Read Avatars" ON storage.objects
        FOR SELECT USING (bucket_id = 'avatars');
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. CLEANUP CRON JOBS / UTILITY FUNCTIONS
-- ----------------------------------------------------------------------------

-- Function: Cleanup Expired OTP Codes
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

-- Function: Cleanup Stale Idempotency Keys (> 24 hours old)
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
