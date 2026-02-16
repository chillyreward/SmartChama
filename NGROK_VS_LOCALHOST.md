# ngrok vs localhost: When to Use Each

## The Problem

When generating invite links, you were seeing the ngrok warning page (ERR_NGROK_6024). This is because ngrok's free tier shows a security warning to protect users from potentially malicious sites.

## The Solution

We now use **two different URLs** depending on the use case:

### 1. `NEXT_PUBLIC_APP_URL` - For Browser Access (localhost)
**Use for**: Invite links, user-facing URLs, anything users click in their browser

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Why localhost?**
- No ngrok warning page
- Faster (no tunnel overhead)
- Works perfectly for local development
- Users access your app directly

**Used in**:
- Invite link generation (`/api/invite/generate`)
- Email links
- Any URL users will click

### 2. `NEXT_PUBLIC_WEBHOOK_URL` - For External Services (ngrok)
**Use for**: M-Pesa callbacks, Africa's Talking webhooks, any external service that needs to reach your local server

```env
NEXT_PUBLIC_WEBHOOK_URL=https://uninaugurated-biscuitlike-madaline.ngrok-free.dev
```

**Why ngrok?**
- External services (M-Pesa, Africa's Talking) can't reach localhost
- Provides public URL for webhooks
- Required for testing payment integrations

**Used in**:
- M-Pesa callback URL
- Africa's Talking USSD callback
- Africa's Talking SMS webhooks
- Any external API that needs to POST to your server

---

## Configuration Summary

### .env.local
```env
# For browser access (invite links, etc.)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# For external webhooks (M-Pesa, Africa's Talking)
NEXT_PUBLIC_WEBHOOK_URL=https://your-ngrok-url.ngrok-free.dev

# M-Pesa uses webhook URL
MPESA_CALLBACK_URL=https://your-ngrok-url.ngrok-free.dev/api/mpesa/callback
```

---

## How It Works Now

### Invite Link Flow
```
1. Admin generates invite link
   ↓
2. API uses NEXT_PUBLIC_APP_URL (localhost:3000)
   ↓
3. Link: http://localhost:3000/member/signup?invite=abc123
   ↓
4. User clicks link → Opens directly in browser
   ↓
5. No ngrok warning! ✅
```

### M-Pesa Callback Flow
```
1. User initiates M-Pesa payment
   ↓
2. M-Pesa sends callback to MPESA_CALLBACK_URL (ngrok)
   ↓
3. ngrok tunnels to localhost:3000
   ↓
4. Your API receives callback
   ↓
5. Payment processed ✅
```

---

## When to Update ngrok URL

### You need to update the ngrok URL when:
1. You restart ngrok (free tier gives new URL each time)
2. Your computer restarts
3. ngrok session expires

### How to update:
1. Start ngrok: `ngrok http 3000`
2. Copy the new URL (e.g., `https://new-url.ngrok-free.dev`)
3. Update `.env.local`:
   ```env
   NEXT_PUBLIC_WEBHOOK_URL=https://new-url.ngrok-free.dev
   MPESA_CALLBACK_URL=https://new-url.ngrok-free.dev/api/mpesa/callback
   ```
4. Restart your dev server: `npm run dev`
5. Update Africa's Talking USSD callback URL in their dashboard

---

## Production Deployment

When you deploy to production (Vercel, etc.):

```env
# Both use your production domain
NEXT_PUBLIC_APP_URL=https://smartchama.co.ke
NEXT_PUBLIC_WEBHOOK_URL=https://smartchama.co.ke

# M-Pesa callback uses production domain
MPESA_CALLBACK_URL=https://smartchama.co.ke/api/mpesa/callback
```

No ngrok needed in production! 🎉

---

## Troubleshooting

### Issue: Invite links still show ngrok warning
**Solution**: 
1. Check `.env.local` has `NEXT_PUBLIC_APP_URL=http://localhost:3000`
2. Restart dev server: `Ctrl+C` then `npm run dev`
3. Clear browser cache
4. Generate new invite link

### Issue: M-Pesa callbacks not working
**Solution**:
1. Check ngrok is running: `ngrok http 3000`
2. Verify `NEXT_PUBLIC_WEBHOOK_URL` matches ngrok URL
3. Verify `MPESA_CALLBACK_URL` matches ngrok URL
4. Restart dev server after changing env vars

### Issue: USSD not working
**Solution**:
1. Update Africa's Talking USSD callback URL to ngrok URL
2. Verify ngrok tunnel is active
3. Check ngrok dashboard for incoming requests

---

## Quick Reference

| Feature | URL to Use | Variable |
|---------|-----------|----------|
| Invite Links | localhost | `NEXT_PUBLIC_APP_URL` |
| Email Links | localhost | `NEXT_PUBLIC_APP_URL` |
| M-Pesa Callbacks | ngrok | `NEXT_PUBLIC_WEBHOOK_URL` |
| USSD Callbacks | ngrok | `NEXT_PUBLIC_WEBHOOK_URL` |
| SMS Webhooks | ngrok | `NEXT_PUBLIC_WEBHOOK_URL` |
| User Dashboard | localhost | Direct browser access |

---

**Last Updated**: February 14, 2026  
**Status**: Active Configuration
