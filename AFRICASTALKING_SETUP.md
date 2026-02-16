# 🚀 Africa's Talking Integration - Complete Setup Guide

## ✅ What's Been Done

1. ✅ Installed `africastalking` npm package
2. ✅ Created Africa's Talking library (`src/lib/africastalking.ts`)
3. ✅ Updated USSD route with database integration (`src/app/api/ussd/route.ts`)
4. ✅ Created SMS API route (`src/app/api/sms/send/route.ts`)
5. ✅ Added environment variables to `.env.local`

## 📋 Step-by-Step Setup

### Step 1: Create Africa's Talking Account

1. Go to https://africastalking.com/
2. Click "Sign Up" (top right)
3. Fill in your details:
   - Email
   - Password
   - Country: Kenya
   - Phone number
4. Verify your email
5. Login to your account

### Step 2: Get Sandbox Credentials

1. After login, you'll be in the **Sandbox** environment
2. Go to **Settings** → **API Key**
3. Click "Generate API Key"
4. Copy your API Key
5. Your username is: `sandbox`

### Step 3: Update Environment Variables

Open `.env.local` and update:

```env
AFRICASTALKING_API_KEY=your_actual_api_key_here
AFRICASTALKING_USERNAME=sandbox
AFRICASTALKING_SENDER_ID=SmartChama
```

Replace `your_actual_api_key_here` with the API key you copied.

### Step 4: Restart Your Dev Server

Stop and restart your dev server to load the new environment variables.

## 🧪 Testing USSD (Sandbox)

### Option A: Use Africa's Talking Simulator

1. Go to https://simulator.africastalking.com/
2. Select "USSD"
3. Enter your ngrok URL: `https://uninaugurated-biscuitlike-madaline.ngrok-free.dev/api/ussd`
4. Click "Launch Simulator"
5. Dial the test code (usually `*384*1234#`)
6. Test all menu options!

### Option B: Test with Real Phone (Sandbox)

1. Go to Africa's Talking Dashboard
2. Navigate to **USSD** → **Create Channel**
3. Set callback URL: `https://uninaugurated-biscuitlike-madaline.ngrok-free.dev/api/ussd`
4. Get your sandbox USSD code (e.g., `*384*1234#`)
5. Dial from your registered phone number
6. Test the menu!

**Note:** In sandbox, only phone numbers you've added to your account can test.

## 📱 USSD Menu Structure

```
*384*1234# (Sandbox Code)
│
├── 1. Check Balance
│   └── Shows: Personal savings, Group total
│
├── 2. Deposit Money
│   ├── Enter amount
│   └── Triggers M-Pesa STK Push (TODO)
│
├── 3. Request Loan
│   ├── Shows loan limit
│   ├── Enter amount
│   └── Submits loan request (TODO)
│
├── 4. My Group Status
│   └── Shows: Group name, Members, Balance
│
├── 5. Transaction History
│   └── Shows last 5 transactions
│
└── 0. Exit
    └── Thank you message
```

## 📨 Testing SMS

### Send Test SMS via API:

```bash
curl -X POST http://localhost:3000/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+254712345678",
    "message": "Hello from SmartChama! Your deposit of KES 1,000 was successful."
  }'
```

### Send SMS from Code:

```typescript
// Example: Send SMS notification after deposit
const response = await fetch('/api/sms/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: '+254712345678',
    message: 'Your deposit of KES 1,000 was successful. New balance: KES 5,000'
  })
});
```

## 🔗 Integrate USSD with M-Pesa

To trigger M-Pesa STK Push from USSD, update the deposit section:

```typescript
// In src/app/api/ussd/route.ts
else if (text.startsWith("2*")) {
  const amount = text.split("*")[1];
  const numAmount = parseFloat(amount);

  if (isNaN(numAmount) || numAmount < 100) {
    response = `END Invalid amount.`;
  } else {
    // Trigger M-Pesa STK Push
    try {
      const mpesaResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/stk-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: normalizedPhone,
          amount: numAmount,
          accountReference: 'SmartChama',
          transactionDesc: 'USSD Deposit'
        })
      });

      const result = await mpesaResponse.json();

      if (result.success) {
        response = `END Check your phone for M-Pesa prompt! 📲`;
      } else {
        response = `END Payment failed. Try again.`;
      }
    } catch (error) {
      response = `END System error. Try again.`;
    }
  }
}
```

## 🚀 Going to Production

### Step 1: Apply for Production Access

1. Go to Africa's Talking Dashboard
2. Click "Go Live" button
3. Fill in business details:
   - Business name
   - Registration certificate
   - KRA PIN
   - ID copies
4. Wait for approval (2-5 business days)

### Step 2: Apply for USSD Code

**Option A: Shared Code** (Cheaper)
- Format: `*384*YOUR_CODE#`
- Cost: ~KES 50,000 setup
- Example: `*384*1234#`

**Option B: Dedicated Code** (Premium)
- Format: `*YOUR_CODE#`
- Cost: ~KES 200,000 - 500,000 setup
- Example: `*222#`

**Application Process:**
1. Submit application via Africa's Talking
2. Provide required documents
3. Wait for telecom approval (2-4 weeks)
4. Pay setup fees
5. Get your USSD code!

### Step 3: Update Production Environment

```env
AFRICASTALKING_API_KEY=your_production_api_key
AFRICASTALKING_USERNAME=your_actual_username
AFRICASTALKING_SENDER_ID=SmartChama
```

### Step 4: Set Production Callback URL

1. Deploy your app to production (Vercel, Railway, etc.)
2. Get your production URL (e.g., `https://smartchama.co.ke`)
3. Update callback URL in Africa's Talking:
   - USSD: `https://smartchama.co.ke/api/ussd`
   - SMS: `https://smartchama.co.ke/api/sms/callback` (if needed)

## 💰 Pricing (Kenya)

### USSD:
- **Shared Code Setup:** KES 50,000
- **Dedicated Code Setup:** KES 200,000 - 500,000
- **Per Session:** KES 0.50 - 2.00
- **Monthly Maintenance:** KES 5,000 - 20,000

### SMS:
- **Per SMS:** KES 0.80 - 1.50 (bulk rates available)
- **No setup fees**
- **Pay as you go**

### Airtime:
- **Commission:** 4-6% per transaction
- **No setup fees**

## 🔍 Monitoring & Debugging

### Check Logs in Africa's Talking Dashboard:

1. Go to **Logs** section
2. Filter by:
   - USSD sessions
   - SMS delivery
   - API calls
3. View request/response details
4. Check error messages

### Local Debugging:

```typescript
// Add detailed logging in your USSD route
console.log("📱 USSD Request:", { sessionId, phoneNumber, text });
console.log("📤 USSD Response:", response);
```

### ngrok Inspector:

Open http://127.0.0.1:4040 to see all USSD requests in real-time!

## 🛠️ Common Issues & Solutions

### Issue 1: "Invalid API Key"
**Solution:** 
- Check your API key in `.env.local`
- Make sure you copied the full key
- Restart dev server after updating

### Issue 2: "Phone number not registered"
**Solution:**
- In sandbox, add your phone to Africa's Talking account
- Go to Settings → Test Credentials → Add Phone Number

### Issue 3: USSD session timeout
**Solution:**
- Keep responses under 160 characters
- Respond within 20 seconds
- Simplify menu structure

### Issue 4: SMS not sending
**Solution:**
- Check phone number format: `+254712345678`
- Verify API key is correct
- Check Africa's Talking balance
- View logs in dashboard

## 📚 Additional Features

### 1. Airtime Top-Up

```typescript
import { airtime } from '@/lib/africastalking';

const result = await airtime.send({
  recipients: [{
    phoneNumber: '+254712345678',
    amount: 'KES 100'
  }]
});
```

### 2. Voice Calls

```typescript
import { voice } from '@/lib/africastalking';

const result = await voice.call({
  to: '+254712345678',
  from: '+254711082300' // Your Africa's Talking number
});
```

### 3. Bulk SMS

```typescript
const result = await sms.send({
  to: ['+254712345678', '+254723456789', '+254734567890'],
  message: 'Group meeting tomorrow at 2PM!',
  from: 'SmartChama'
});
```

## 🎯 Next Steps

1. ✅ Get Africa's Talking sandbox credentials
2. ✅ Update `.env.local` with your API key
3. ✅ Restart dev server
4. ✅ Test USSD in simulator
5. ✅ Test SMS sending
6. ⏳ Apply for production access
7. ⏳ Apply for USSD code
8. ⏳ Deploy to production
9. ⏳ Launch to users!

## 📞 Support

- **Africa's Talking Docs:** https://developers.africastalking.com/
- **Support Email:** support@africastalking.com
- **Community Slack:** https://slackin-africastalking.now.sh/
- **Phone:** +254 20 524 2223

## 🔐 Security Best Practices

1. **Never commit API keys** to git
2. **Use environment variables** for all credentials
3. **Validate phone numbers** before processing
4. **Rate limit** USSD sessions to prevent abuse
5. **Log all transactions** for audit trail
6. **Use HTTPS** for all callbacks
7. **Verify callback signatures** (production)

---

**Ready to test?** Get your sandbox API key and start testing USSD now! 🚀
