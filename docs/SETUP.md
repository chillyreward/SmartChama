# Akibora: getting the database and backend working

Do these in order. Each step says how you know it worked. Steps 1 to 3 change nothing; step 4 is the first change.

You never need to paste a secret key into a chat. When a step says "send the result", send only what the SQL query prints.

---

## 1. Find which Supabase project is live

1. Open Vercel → the Akibora project → **Settings → Environment Variables**.
2. Look at `NEXT_PUBLIC_SUPABASE_URL`. It looks like `https://abcdefgh.supabase.co`. The `abcdefgh` part is the project ref.
3. In Supabase, open the project with that ref. That is the live database. Ignore the other one for now.

The schema file mentions `ewigxollsudiyqucajqv`, and the mobile app's builds mention `jwfgvbmo…`. Note which one Vercel uses. The app's `eas.json` must use the same one, or app users and web users end up in different databases.

## 2. Back up before changing anything

Supabase → **Database → Backups**. On the free plan, daily backups are kept for a short time. To keep your own copy, install the Supabase CLI and run:

```
supabase db dump --db-url "<connection string from Settings → Database>" -f akibora-backup.sql
```

Keep that file somewhere safe and out of GitHub.

## 3. Run the health check (read-only)

1. Supabase → **SQL Editor → New query**.
2. Paste all of `scripts/db-health-check.sql` and click **Run**.
3. Send back the one row it prints.

It lists any table, function or storage bucket the code uses that the database doesn't have. It also lists tables without row-level security and counts users, groups, payments and unsent messages.

## 4. Bring the schema up to date

`FULL_SCHEMA_MIGRATION.sql` is the single source of truth. It only adds what is missing, so it is safe to run on the live database and safe to run twice.

1. SQL Editor → New query → paste all of `FULL_SCHEMA_MIGRATION.sql` → Run.
2. Run the health check again. `missing_tables`, `missing_functions` and `missing_storage_buckets` should all say `none`.

Do **not** run the files in `migrations/`. They are older and some of them open every group's data to every signed-in user.

## 5. Sign-in settings (Supabase → Authentication)

**URL Configuration**
- **Site URL:** your live web address, e.g. `https://akibora.co.ke`
- **Redirect URLs:** add all three:
  - `https://<your web address>/auth/callback`
  - `http://localhost:3000/auth/callback`
  - `akibora://auth/callback` (the mobile app)

**Providers**
- Turn on Email.
- Turn on Google if you want "Continue with Google". This needs a Google Cloud OAuth client.
- Turn on Apple only if you ship on iPhone.

## 6. Email: why tokens and codes aren't arriving

Supabase's built-in email is only for testing. It sends very few emails an hour, and on newer projects it only delivers to the project's own team members. That is why sign-up confirmations and password resets fail for real members.

The fix is free at Akibora's size: send through **Resend**. The free plan covers 100 emails a day (3,000 a month). Paid plans start at $20 a month for 50,000.

1. Sign up at resend.com.
2. **Domains → Add domain.** Use a subdomain such as `mail.akibora.co.ke`. Add the DNS records Resend shows at your domain registrar and wait until it says Verified.

   Without a domain you own, Resend only lets you email yourself. This is the one thing that needs a domain.
3. **API Keys → Create.** Copy the key.
4. **Supabase auth emails** (confirmations, password resets): Supabase → Authentication → **Emails → SMTP Settings** → turn on **Custom SMTP**:
   - Host `smtp.resend.com`, port `465`
   - Username `resend`, password = the API key
   - Sender email `hello@mail.akibora.co.ke`, sender name `Akibora`
5. Then go to Authentication → **Rate Limits** and raise "emails per hour" (start with 100).
6. **Akibora's own emails** (payment confirmed, invites, new group code): in Vercel, add:
   - `RESEND_API_KEY` = the same key
   - `EMAIL_FROM` = `Akibora <hello@mail.akibora.co.ke>`

   Then redeploy.

How you know it works: create a test group with an email address. The group code arrives by email. "Forgot it?" on the sign-in page sends a reset link that signs you in.

## 7. SMS (codes, reminders, payment confirmations)

SMS always costs money: you top up credit and pay per message. The code supports two providers.
- **Wakali:** set `WAKALI_API_KEY`. It is used first if set.
- **Africa's Talking:** set `AFRICASTALKING_API_KEY` and `AFRICASTALKING_USERNAME`, plus `AFRICASTALKING_SENDER_ID` once your sender name is approved.

With neither set, no SMS goes out. Phone sign-in codes then cannot arrive, so members should use email until SMS credit is in place.

## 8. M-Pesa (Daraja)

- Start on the Daraja **sandbox** keys. Payments are fake but the whole flow runs.
- `MPESA_CALLBACK_URL` must be `https://<your web address>/api/mpesa/callback?secret=<MPESA_CALLBACK_SECRET>`. Safaricom calls this to confirm each payment.
- Going live needs a paybill or till and Safaricom's approval. Then swap in the production keys.

When a payment is confirmed, the member now gets these straight away rather than at the next daily job:
- an in-app notice
- an SMS
- an email, if they have one

The trust score updates at the same time.

## 9. Vercel environment variables

`.env.example` lists every variable with a note. The required ones:

| Variable | What it is |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page. Server only, never in the app. |
| `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL` | Your live address, both the same |
| `INTERNAL_API_SECRET`, `CRON_SECRET`, `MPESA_CALLBACK_SECRET`, `USSD_WEBHOOK_SECRET`, `OTP_PEPPER` | Generate each with `openssl rand -hex 32` |
| `MPESA_*` | From Daraja |
| `RESEND_API_KEY`, `EMAIL_FROM` | Step 6 |
| SMS keys | Step 7 |

After changing variables: Vercel → Deployments → **Redeploy**.

## 10. Final check

1. Sign up as a new official and create a group. The code is shown and emailed.
2. Sign up as a member on another browser using that code. The official sees them under **Waiting for you** and approves them.
3. The member pays with M-Pesa (sandbox). The payment shows as confirmed, the SMS and email arrive, and the trust score moves.
4. Run the health check once more. `unsent_messages` should be 0.
