# M-Pesa Callback URL Setup for Local Development

M-Pesa requires a **publicly accessible HTTPS URL** for callbacks. Since `localhost` is not accessible from the internet, you need to use one of these solutions:

## Option 1: webhook.site (Easiest - For Testing Only)

1. Go to https://webhook.site
2. Copy your unique URL (e.g., `https://webhook.site/abc123-def456-...`)
3. Update `.env.local`:
   ```
   MPESA_CALLBACK_URL=https://webhook.site/YOUR-UNIQUE-ID
   ```
4. Restart your Next.js server
5. When you test STK Push, you'll see the callback data on webhook.site

**Pros:** Instant setup, no installation
**Cons:** You can't process the callback in your app, only view it

---

## Option 2: ngrok (Recommended for Development)

### Step 1: Install ngrok
- Download from https://ngrok.com/download
- Or use: `npm install -g ngrok` (if you have npm)

### Step 2: Start ngrok tunnel
```bash
ngrok http 3000
```

### Step 3: Copy the HTTPS URL
You'll see output like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

### Step 4: Update `.env.local`
```
MPESA_CALLBACK_URL=https://abc123.ngrok.io/api/mpesa/callback
```

### Step 5: Restart Next.js
```bash
npm run dev
```

**Pros:** Full callback processing in your app
**Cons:** URL changes each time you restart ngrok (unless you have a paid account)

---

## Option 3: localtunnel (Free Alternative to ngrok)

### Step 1: Install
```bash
npm install -g localtunnel
```

### Step 2: Start tunnel
```bash
lt --port 3000
```

### Step 3: Update `.env.local`
```
MPESA_CALLBACK_URL=https://your-subdomain.loca.lt/api/mpesa/callback
```

---

## Quick Test Setup (Use webhook.site)

For immediate testing, just update your `.env.local`:

```env
MPESA_CALLBACK_URL=https://webhook.site/unique-id-here
```

Replace `unique-id-here` with your actual webhook.site ID.

Then restart your dev server:
```bash
npm run dev
```

---

## Production Setup

For production, use your actual domain:
```
MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback
```

Make sure your domain has a valid SSL certificate (HTTPS is required).
