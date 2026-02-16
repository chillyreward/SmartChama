# Setup ngrok for M-Pesa Local Testing

Since you're using webhook.site, the M-Pesa callbacks are going there instead of your local server. To save transactions to your database, you need to use ngrok.

## Step 1: Install ngrok

### Option A: Download from website
1. Go to https://ngrok.com/download
2. Download for Windows
3. Extract the zip file
4. Move `ngrok.exe` to a folder in your PATH (or just remember the location)

### Option B: Using npm (if you prefer)
```bash
npm install -g ngrok
```

## Step 2: Start ngrok

Open a NEW terminal (keep your Next.js server running in another terminal) and run:

```bash
ngrok http 3000
```

You'll see output like:
```
Session Status                online
Account                       [your account]
Forwarding                    https://abc123def456.ngrok.io -> http://localhost:3000
```

## Step 3: Update .env.local

Copy the HTTPS URL (e.g., `https://abc123def456.ngrok.io`) and update your `.env.local`:

```env
MPESA_CALLBACK_URL=https://abc123def456.ngrok.io/api/mpesa/callback
```

**Important:** Replace `abc123def456` with your actual ngrok subdomain!

## Step 4: Restart Next.js Server

Stop your Next.js server (Ctrl+C) and restart it:

```bash
npm run dev
```

## Step 5: Test Deposit

Now when you make a deposit:
1. STK push will be sent to your phone
2. After you enter your PIN and complete payment
3. M-Pesa will send callback to your ngrok URL
4. ngrok will forward it to your local server
5. Transaction will be saved to your database
6. Balance will update automatically

## Troubleshooting

### ngrok URL changes every time
- Free ngrok URLs change each time you restart
- You'll need to update `.env.local` and restart Next.js each time
- Paid ngrok accounts get a permanent subdomain

### Can't see callbacks
- Check your Next.js terminal for console logs
- Look for "M-Pesa Callback Received:" messages
- Check ngrok web interface at http://127.0.0.1:4040

### Database errors
- Make sure you ran `create-transactions-table.sql` in Supabase
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
- Check Supabase logs for RLS policy issues

## Alternative: Manual Testing

If you don't want to use ngrok right now, you can manually insert a test transaction:

Go to Supabase SQL Editor and run:

```sql
INSERT INTO transactions (
  transaction_type,
  amount,
  phone_number,
  mpesa_receipt_number,
  description,
  status
) VALUES (
  'deposit',
  1000,
  '254712345678',
  'TEST' || floor(random() * 1000000),
  'Test Deposit',
  'completed'
);
```

This will add a test transaction so you can see the balance update.
