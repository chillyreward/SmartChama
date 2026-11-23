-- ============================================================
-- AKIBORA DATABASE HEALTH CHECK  (read-only: changes nothing)
-- Supabase Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Copy the single result row and send it back. Every list should be empty
-- and every count should look sensible.
-- ============================================================
with
expected_tables(name) as (values ('announcements'), ('audit_log'), ('avatars'), ('chama_contribution_dates'), ('chama_memberships'), ('chama_messages'), ('chama_payment_config'), ('chamas_v2'), ('compliance_config'), ('contribution_reminders'), ('contributions_v2'), ('fraud_flags'), ('group_activity'), ('idempotency_keys'), ('invite_tokens'), ('kyc_verifications'), ('login_attempts'), ('member_penalties'), ('merry_go_round_contributions'), ('merry_go_round_cycles'), ('merry_go_round_schedule'), ('notifications'), ('otp_codes'), ('outbox'), ('platform_admins'), ('profile_private'), ('profiles'), ('smartgrow_investments'), ('smartgrow_products'), ('transactions_v2'), ('ussd_member_summary'), ('wallets'), ('welfare_claims'), ('welfare_fund'), ('withdrawal_consents'), ('withdrawal_votes')),
expected_functions(name) as (values ('anonymize_account'), ('cast_withdrawal_vote'), ('execute_withdrawal'), ('increment_wallet_balance_safe'), ('join_chama_by_code'), ('preview_join_code'), ('record_cash_contribution'), ('record_ledger_transaction'), ('record_manual_deposit'), ('record_smartgrow_investment'), ('refresh_ussd_summary')),
expected_buckets(name) as (values ('kyc'), ('avatars')),
tbl as (select table_name from information_schema.tables where table_schema = 'public'),
fn as (select routine_name from information_schema.routines where routine_schema = 'public')
select
  (select coalesce(string_agg(name, ', '), 'none') from expected_tables where name not in (select table_name from tbl)) as missing_tables,
  (select coalesce(string_agg(name, ', '), 'none') from expected_functions where name not in (select routine_name from fn)) as missing_functions,
  (select coalesce(string_agg(name, ', '), 'none') from expected_buckets where name not in (select id from storage.buckets)) as missing_storage_buckets,
  (select coalesce(string_agg(c.relname, ', '), 'none') from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity) as tables_without_rls,
  (select count(*) from auth.users) as users,
  (select count(*) from public.profiles) as profiles,
  (select count(*) from public.chamas_v2) as groups,
  (select count(*) from public.chama_memberships where status = 'active') as active_members,
  (select count(*) from public.chama_memberships where status = 'pending') as waiting_members,
  (select count(*) from public.contributions_v2 where status = 'confirmed') as confirmed_payments,
  (select count(*) from public.contributions_v2 where status = 'pending') as pending_payments,
  (select count(*) from public.outbox where processed = false) as unsent_messages,
  (select count(*) from public.smartgrow_products where is_active) as smartgrow_options,
  (select max(created_at)::text from public.contributions_v2) as last_payment_at;
