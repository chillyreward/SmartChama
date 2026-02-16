# 🚀 ngrok M-Pesa Setup - ACTIVE

## ✅ Current Configuration

**ngrok URL:** `https://uninaugurated-biscuitlike-madaline.ngrok-free.dev`

**M-Pesa Callback:** `https://uninaugurated-biscuitlike-madaline.ngrok-free.dev/api/mpesa/callback`

**Status:** Active and configured

## 📋 What's Running

1. **Dev Server:** http://localhost:3000 (running in background)
2. **ngrok Tunnel:** Forwarding to localhost:3000
3. **M-Pesa Callbacks:** Will now save to your database!

## 🧪 How to Test

1. Go to your app: http://localhost:3000 or use the ngrok URL
2. Login as admin or member
3. Make a deposit (STK Push)
4. Enter your M-Pesa PIN on your phone
5. Complete the payment
6. **M-Pesa will send callback to ngrok → your local server → saves to database**

## 📊 Monitor Callbacks

### Option 1: Check your terminal
Look for console logs like:
```
🔔 M-Pesa Callback Received:
✅ Transaction saved to database
```

### Option 2: ngrok Web Interface
Open in browser: http://127.0.0.1:4040

This shows all HTTP requests coming through ngrok, including M-Pesa callbacks!

### Option 3: Check Supabase
Go to your Supabase dashboard → Table Editor → `transactions` table

## ⚠️ Important Notes

### ngrok URL Changes
- Free ngrok URLs change every time you restart ngrok
- When you restart ngrok, you'll get a NEW URL
- You'll need to:
  1. Copy the new ngrok URL
  2. Update `.env.local` with new callback URL
  3. Restart your dev server

### Keep Both Running
You need TWO terminals:
- **Terminal 1:** Dev server (already running in background via Kiro)
- **Terminal 2:** ngrok (the one you opened manually)

Don't close either terminal!

## 🔄 If You Need to Restart

### Restart ngrok only:
1. Press Ctrl+C in the ngrok terminal
2. Run: `ngrok http 3000`
3. Copy the new URL
4. Update `.env.local` with new callback URL
5. Tell me to restart the dev server

### Restart dev server only:
Just tell me "restart dev server" and I'll handle it!

## 🐛 Troubleshooting

### Not seeing callbacks?
1. Check ngrok is still running (look at the terminal)
2. Check dev server is running: http://localhost:3000
3. Open ngrok inspector: http://127.0.0.1:4040
4. Look for POST requests to `/api/mpesa/callback`

### Database not updating?
1. Verify `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
2. Check you ran `create-transactions-table.sql` in Supabase
3. Check Supabase logs for errors
4. Look at your dev server terminal for error messages

### "Failed to fetch" errors?
- Make sure you're accessing the app via http://localhost:3000 (not the ngrok URL for browsing)
- The ngrok URL is ONLY for M-Pesa callbacks, not for you to browse the app

## 💡 Pro Tip

Get a paid ngrok account ($8/month) for:
- Permanent subdomain (no need to update URL every time)
- More simultaneous tunnels
- Better performance

## 📞 Need Help?

Just ask me:
- "Check if ngrok is working"
- "Show me the callback logs"
- "Restart the dev server"
- "Test M-Pesa integration"

---

**Last Updated:** Now  
**ngrok Status:** Active ✅  
**Dev Server:** Running on port 3000 ✅
