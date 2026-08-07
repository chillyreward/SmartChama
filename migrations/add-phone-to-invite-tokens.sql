-- ============================================================
-- MIGRATION: ADD PHONE, NAME, EMAIL & STATUS TO INVITE_TOKENS
-- ============================================================

ALTER TABLE public.invite_tokens 
ADD COLUMN IF NOT EXISTS invited_phone TEXT,
ADD COLUMN IF NOT EXISTS invited_name TEXT,
ADD COLUMN IF NOT EXISTS invited_email TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Index for faster query performance on pending invites per chama
CREATE INDEX IF NOT EXISTS idx_invite_tokens_chama_status 
ON public.invite_tokens(chama_id, status);
