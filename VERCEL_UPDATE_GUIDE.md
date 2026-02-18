# Vercel Deployment Update Guide

## 🚀 Updating Your Vercel Deployment

Since you pushed to GitHub, Vercel will automatically redeploy. However, you need to add new environment variables for the wow features to work.

---

## 📋 New Environment Variables to Add

Go to your Vercel project: https://vercel.com/chillyrewards-projects/smart-chama1.0

### Steps:
1. Click on your project
2. Go to **Settings** → **Environment Variables**
3. Add these new variables:

---

## 🔑 Required Environment Variables

### 1. Gemini AI (Voice Assistant & Predictive AI)

**Variable Name:** `GEMINI_API_KEY`  
**Value:** Get from https://makersuite.google.com/app/apikey

**How to get:**
1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key
4. Paste in Vercel

**Environment:** Production, Preview, Development (select all)

---

### 2. Blockchain (Optional - for transaction verification)

**Variable Name:** `BLOCKCHAIN_RPC_URL`  
**Value:** `https://rpc-mumbai.maticvigil.com`

**Environment:** Production, Preview, Development (select all)

---

**Variable Name:** `BLOCKCHAIN_PRIVATE_KEY`  
**Value:** Your MetaMask wallet private key (optional)

**How to get:**
1. Install MetaMask browser extension
2. Create a new wallet
3. Switch to Polygon Mumbai Testnet
4. Export private key (Settings → Security & Privacy → Reveal Private Key)
5. Get test MATIC from https://faucet.polygon.technology/

**Environment:** Production, Preview, Development (select all)

**⚠️ Note:** Blockchain is optional. If you don't add these, transactions will still work but won't have blockchain verification badges.

---

## ✅ Existing Environment Variables (Already Set)

These should already be in your Vercel project:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_WEBHOOK_URL
MPESA_CONSUMER_KEY
MPESA_CONSUMER_SECRET
MPESA_BUSINESS_SHORT_CODE
MPESA_PASSKEY
MPESA_CALLBACK_URL
AFRICASTALKING_API_KEY
AFRICASTALKING_USERNAME
AFRICASTALKING_SENDER_ID
```

---

## 🗄️ Database Migration Required

After deploying, you need to run the database migration in Supabase:

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Run this SQL:

```sql
-- Add blockchain fields to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS blockchain_hash TEXT,
ADD COLUMN IF NOT EXISTS blockchain_explorer_url TEXT,
ADD COLUMN IF NOT EXISTS blockchain_qr_code TEXT,
ADD COLUMN IF NOT EXISTS blockchain_verified BOOLEAN DEFAULT false;

-- Add index for blockchain hash lookups
CREATE INDEX IF NOT EXISTS idx_transactions_blockchain_hash 
ON transactions(blockchain_hash);

-- Add comments
COMMENT ON COLUMN transactions.blockchain_hash IS 'Polygon blockchain transaction hash for verification';
COMMENT ON COLUMN transactions.blockchain_explorer_url IS 'URL to view transaction on Polygon explorer';
COMMENT ON COLUMN transactions.blockchain_qr_code IS 'QR code data URL for easy verification';
COMMENT ON COLUMN transactions.blockchain_verified IS 'Whether transaction has been verified on blockchain';
```

Or upload and run the file: `add-blockchain-fields.sql`

---

## 🎯 Quick Setup (Minimum Required)

If you want to get the wow features working quickly, you only need:

### Essential (Required):
1. **GEMINI_API_KEY** - For Voice AI and Predictive AI
   - Get from: https://makersuite.google.com/app/apikey
   - Takes 2 minutes to get

### Optional (Can skip for now):
2. **BLOCKCHAIN_RPC_URL** - For blockchain verification
3. **BLOCKCHAIN_PRIVATE_KEY** - For blockchain recording

**Without blockchain variables:**
- ✅ Voice AI will work
- ✅ Predictive AI will work
- ❌ Blockchain badges won't appear (but transactions still work)

---

## 📝 Step-by-Step Vercel Update

### 1. Get Gemini API Key
```
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy the key (starts with "AIza...")
```

### 2. Add to Vercel
```
1. Go to https://vercel.com/chillyrewards-projects/smart-chama1.0
2. Click "Settings"
3. Click "Environment Variables"
4. Click "Add New"
5. Name: GEMINI_API_KEY
6. Value: [paste your key]
7. Environment: Select all (Production, Preview, Development)
8. Click "Save"
```

### 3. Redeploy
```
1. Go to "Deployments" tab
2. Click "..." on latest deployment
3. Click "Redeploy"
4. Wait for deployment to complete
```

### 4. Run Database Migration
```
1. Go to Supabase Dashboard
2. SQL Editor
3. Paste the SQL from above
4. Click "Run"
```

---

## 🧪 Testing After Deployment

### Test Voice AI:
1. Go to your Vercel URL
2. Login as admin
3. Look for floating microphone button (bottom-right)
4. Click and speak: "Check my balance"
5. Should get AI response

### Test Predictive AI:
1. Go to Members page
2. Click on a member
3. Should see AI insights with risk scores

### Test Blockchain (if configured):
1. Go to Chamas page
2. Click on a chama
3. View transactions
4. Should see "Blockchain Verified" badges with QR codes

---

## ⚠️ Important Notes

### About NEXT_PUBLIC_APP_URL:
- For production, update this to your Vercel URL
- Example: `https://smart-chama1.vercel.app`
- This is used for invite links and redirects

### About NEXT_PUBLIC_WEBHOOK_URL:
- Keep this as your ngrok URL for M-Pesa callbacks
- Or update to your production domain if you have one

### About Blockchain:
- Blockchain is completely optional
- App works perfectly without it
- Only adds verification badges to transactions
- Costs ~$0.001 per transaction on testnet

---

## 🎉 What Will Work After Update

### With GEMINI_API_KEY only:
✅ Voice AI Assistant (Swahili & English)
✅ Predictive AI (Risk scores, loan suggestions)
✅ All existing features
❌ Blockchain verification badges

### With All Variables:
✅ Voice AI Assistant
✅ Predictive AI
✅ Blockchain verification badges
✅ QR codes for transactions
✅ Complete wow features

---

## 🐛 Troubleshooting

### Voice AI not working:
- Check GEMINI_API_KEY is set in Vercel
- Check browser console for errors
- Verify microphone permissions

### Predictive AI not loading:
- Check GEMINI_API_KEY is set
- Check member has transaction history
- Check browser console for errors

### Blockchain badges not showing:
- This is normal if BLOCKCHAIN_PRIVATE_KEY not set
- Transactions still work without blockchain
- Add blockchain variables if you want badges

### Deployment failed:
- Check all environment variables are set
- Check for syntax errors in code
- Check Vercel build logs

---

## 📞 Quick Reference

**Vercel Project:** https://vercel.com/chillyrewards-projects/smart-chama1.0

**Required for Wow Features:**
- GEMINI_API_KEY (get from https://makersuite.google.com/app/apikey)

**Optional for Blockchain:**
- BLOCKCHAIN_RPC_URL: `https://rpc-mumbai.maticvigil.com`
- BLOCKCHAIN_PRIVATE_KEY: (from MetaMask)

**Database Migration:**
- Run `add-blockchain-fields.sql` in Supabase SQL Editor

---

## ✅ Deployment Checklist

Before competition:
- [ ] Get Gemini API key
- [ ] Add GEMINI_API_KEY to Vercel
- [ ] Redeploy on Vercel
- [ ] Run database migration in Supabase
- [ ] Test voice AI on production
- [ ] Test predictive AI on production
- [ ] (Optional) Add blockchain variables
- [ ] (Optional) Test blockchain badges
- [ ] Update NEXT_PUBLIC_APP_URL to production URL
- [ ] Test invite links work
- [ ] Test member signup flow
- [ ] Test admin dashboard

---

**Good luck with your deployment! 🚀**

The wow features will make your competition demo unforgettable!
