# M-Pesa STK Push Troubleshooting Guide

## Quick Diagnostics

### Step 1: Test M-Pesa Credentials
Visit: `http://localhost:3000/api/mpesa/test`

This will check:
- ✅ Environment variables are set
- ✅ Credentials can generate access token
- ✅ Callback URL is configured

### Step 2: Check Server Logs
When you click "Deposit", check your terminal/console for detailed logs:
- STK Push Request details
- Payload being sent to M-Pesa
- Response from M-Pesa API
- Any error messages

## Common Issues & Solutions

### 1. "Bad Request - Invalid CallBackURL"
**Problem:** M-Pesa requires HTTPS callback URL

**Solution:**
```bash
# Option A: Use ngrok (recommended for local testing)
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Update .env.local:
MPESA_CALLBACK_URL=https://abc123.ngrok.io/api/mpesa/callback

# Option B: Use webhook.site
# Visit https://webhook.site
# Copy your unique URL
MPESA_CALLBACK_URL=https://webhook.site/YOUR-UNIQUE-ID
```

### 2. "Invalid Access Token"
**Problem:** Credentials are incorrect or expired

**Solution:**
- Verify credentials in Safaricom Daraja Portal
- Check if using Sandbox credentials for sandbox environment
- Regenerate credentials if needed

### 3. "Invalid Phone Number"
**Problem:** Phone number format is incorrect

**Solution:**
- Use format: `254712345678` (no spaces, no +)
- Must start with 254 (Kenya country code)
- Must be 12 digits total

### 4. "Request failed with status code 401"
**Problem:** Authentication failed

**Solution:**
- Check MPESA_CONSUMER_KEY in .env.local
- Check MPESA_CONSUMER_SECRET in .env.local
- Ensure no extra spaces in credentials
- Restart dev server after changing .env.local

### 5. "Request failed with status code 400"
**Problem:** Invalid request parameters

**Solution:**
- Check Business Short Code (should be 174379 for sandbox)
- Verify Passkey is correct
- Ensure amount is a positive integer

## Testing Workflow

### For Local Development:

1. **Start ngrok:**
   ```bash
   ngrok http 3000
   ```

2. **Update .env.local with ngrok URL:**
   ```
   MPESA_CALLBACK_URL=https://YOUR-NGROK-URL.ngrok.io/api/mpesa/callback
   ```

3. **Restart Next.js dev server:**
   ```bash
   npm run dev
   ```

4. **Test credentials:**
   - Visit: http://localhost:3000/api/mpesa/test
   - Should return: `{ success: true, message: "M-Pesa credentials are valid" }`

5. **Test STK Push:**
   - Go to dashboard
   - Click "Deposit"
   - Enter phone: `254712345678` (use your actual Safaricom number)
   - Enter amount: `1` (minimum for testing)
   - Click "Confirm deposit"
   - Check your phone for M-Pesa prompt

6. **Monitor callback:**
   - Watch ngrok dashboard: http://127.0.0.1:4040
   - Or watch webhook.site if using that
   - Should receive callback after completing/canceling payment

### For Production:

1. **Use your actual domain:**
   ```
   MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback
   ```

2. **Switch to production credentials:**
   - Get production credentials from Daraja Portal
   - Update all MPESA_* variables in .env.local
   - Change BASE_URL in src/lib/mpesa.ts to production URL

## Debugging Tips

### Enable Detailed Logging:
The code now includes console.log statements. Check your terminal for:
```
STK Push Request: { phoneNumber: '254...', amount: 100, ... }
STK Push Payload: { BusinessShortCode: '174379', ... }
STK Push Response: { CheckoutRequestID: 'ws_CO_...', ... }
```

### Check M-Pesa Response Codes:
- `0` = Success
- `1` = Insufficient funds
- `1032` = Request cancelled by user
- `1037` = Timeout (user didn't respond)
- `2001` = Invalid initiator information

### Test Without M-Pesa:
Use the "Create Test Transaction" button to bypass M-Pesa and test database integration.

## Environment Variables Checklist

```env
# Required for M-Pesa
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here
MPESA_BUSINESS_SHORT_CODE=174379
MPESA_PASSKEY=your_passkey_here
MPESA_CALLBACK_URL=https://your-callback-url.com/api/mpesa/callback

# Required for Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Still Not Working?

1. Check server console for exact error message
2. Visit `/api/mpesa/test` to verify credentials
3. Ensure dev server was restarted after .env.local changes
4. Try with amount = 1 KES for testing
5. Use your actual Safaricom phone number
6. Check if phone has M-Pesa enabled
7. Verify you're using sandbox credentials with sandbox short code

## Contact Support

If issues persist:
- Check Safaricom Daraja documentation: https://developer.safaricom.co.ke
- Review API logs in Daraja portal
- Contact Safaricom support with your merchant request ID
