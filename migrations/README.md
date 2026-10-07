# Legacy migrations (superseded)

Do not run these. The whole schema now lives in `../FULL_SCHEMA_MIGRATION.sql`
(idempotent; run it in the Supabase SQL Editor).

`migration_v5` (merry-go-round) and `migration_v6` (welfare & penalties) are folded
into Part 7 of that file, with row-level security added. `migration_v7_*.sql`
conflict with it: they create a separate `ledger` table and `USING (true)` read
policies that expose every chama's data to any signed-in user.
