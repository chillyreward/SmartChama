# M-Pesa STK Push Fix Summary

## What Was Fixed

### 1. Improved Error Handling
- Fixed TypeScript errors in error handling code
- Added detailed logging throughout the STK push flow
- Better error message extraction from M-Pesa API responses

### 2. Enhanced Validation
- Added phone number format validation (must be 254XXXXXXXXX)
- Added amount validation (minimum 1 KES)
- Better input sanitization

### 3. Diagnostic Tools Created

#### `/api/mpesa/diagnose` - Quick Configuration Check
Returns:
- Environment variable status
- Configuration validation
- Specific recommendations

#### `/api/mpesa/test` - Credential Validation
Tests:
- Access token generation
- API connectivity
- Credential validity

### 4. Detailed Logging
Now logs:
- Request parameters
- Payload sent to M-Pesa (with password hidden)
- Full response from M-Pesa
- Detailed error information

## How to Diagnose "Not Working"

### Step 1: Check Configuration
Visit: `http://localhost:3000/api/mpesa/diagnose`

Expected output:
```json
{
  "environment": {
    "hasConsumerKey": true,
    "hasConsumerSecret": true,
    "hasShortCode": true,
    "hasPasskey": true,
    "hasCallbackUrl": true,
    "shortCode": "174379",
    "callbackUrl": "https://..."
  },
  "checks": {
    "credentialsConfigured": true,
    "callbackIsHttps": true,
    "shortCodeValid": true
  },
  "recommendations": ["✅ Configuration looks good!"]
}
```

### Step 2: Test Credentials
Visit: `http://localhost:3000/api/mpesa/test`

Expected output:
```json
{
  "success": true,
  "message": "M-Pesa credentials are valid",
  "tokenGenerated": true
}
```

### Step 3: Check Server Logs
When you click "Deposit", your terminal should show:
```
STK Push Request: { phoneNumber: '254712345678', amount: 100, ... }
Requesting M-Pesa access token...
Access token generated successfully
Initiating STK Push...
Phone: 254712345678 Amount: 100
STK Push Payload: { BusinessShortCode: '174379', ... }
STK Push Response: { CheckoutRequestID: 'ws_CO_...', ... }
```

## Most Common Issues

### Issue 1: "Bad Request - Invalid CallBackURL"
**Cause:** Callback URL is not HTTPS

**Fix:**
```bash
# Install ngrok
# Run: ngrok http 3000
# Update .env.local:
MPESA_CALLBACK_URL=https://YOUR-NGROK-URL.ngrok.io/api/mpesa/callback
# Restart dev server
```

### Issue 2: "Invalid Access Token" or 401 Error
**Cause:** Wrong credentials

**Fix:**
1. Go to https://developer.safaricom.co.ke
2. Login and go to your app
3. Copy Consumer Key and Consumer Secret
4. Update .env.local
5. Restart dev server

### Issue 3: No Error Message, Just "Not Working"
**Cause:** Need to check server logs

**Fix:**
1. Open terminal where `npm run dev` is running
2. Click "Deposit" button
3. Look for error messages in terminal
4. Share the exact error message for specific help

## Testing Checklist

- [ ] Visit `/api/mpesa/diagnose` - all checks pass
- [ ] Visit `/api/mpesa/test` - returns success
- [ ] .env.local has all MPESA_* variables set
- [ ] Callback URL is HTTPS (ngrok or webhook.site)
- [ ] Dev server restarted after .env.local changes
- [ ] Using actual Safaricom phone number (254...)
- [ ] Phone number has M-Pesa enabled
- [ ] Amount is at least 1 KES

## Next Steps

1. **Run diagnostics** to identify the specific issue
2. **Check server logs** when clicking deposit
3. **Share the exact error message** if still not working

The code now has comprehensive logging, so the exact error will be visible in your terminal/console.
