# M-Pesa Daraja API Integration Guide

## Step 1: Create Daraja Account

1. Go to https://developer.safaricom.co.ke/
2. Sign up and verify your email
3. Login to the developer portal

## Step 2: Create Sandbox App

1. Click "My Apps" → "Create App"
2. App Name: **SmartChama**
3. Select APIs: **M-Pesa Sandbox**
4. Click "Create App"
5. Copy your credentials:
   - Consumer Key
   - Consumer Secret

## Step 3: Get Sandbox Credentials

### Test Credentials (Sandbox):
- **Business Short Code**: 174379 (Paybill) or 600000 (Till)
- **Passkey**: Get from Daraja portal under "Test Credentials"
- **Initiator Name**: testapi
- **Test Phone Numbers**: 
  - 254708374149
  - 254708374150
  - 254708374151

## Step 4: Update Environment Variables

Add these to your `.env.local` file:

```env
# M-Pesa Daraja API Credentials
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here
MPESA_BUSINESS_SHORT_CODE=174379
MPESA_PASSKEY=your_passkey_here
MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback

# For local testing with ngrok
# MPESA_CALLBACK_URL=https://your-ngrok-url.ngrok.io/api/mpesa/callback
```

## Step 5: Install Dependencies

```bash
npm install axios
```

## Step 6: Test with Ngrok (Local Development)

Since M-Pesa needs a public URL for callbacks:

1. Install ngrok: https://ngrok.com/download
2. Run your dev server: `npm run dev`
3. In another terminal: `ngrok http 3000`
4. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
5. Update `.env.local`:
   ```env
   MPESA_CALLBACK_URL=https://abc123.ngrok.io/api/mpesa/callback
   ```

## Step 7: Test STK Push

### Using the API:

```javascript
// Example: Initiate payment
const response = await fetch('/api/mpesa/stk-push', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: '254708374149', // Test number
    amount: 100,
    accountReference: 'SmartChama',
    transactionDesc: 'Chama Contribution'
  })
});

const data = await response.json();
console.log(data);
```

### Expected Response:

```json
{
  "success": true,
  "message": "STK Push sent successfully",
  "checkoutRequestID": "ws_CO_123456789",
  "merchantRequestID": "12345-67890-1"
}
```

## Step 8: Test the Flow

1. **Initiate Payment**: Call `/api/mpesa/stk-push`
2. **Check Phone**: You'll receive an STK Push prompt on the test phone
3. **Enter PIN**: Use `1234` (sandbox PIN)
4. **Callback**: M-Pesa will call `/api/mpesa/callback`
5. **Verify**: Check your console logs for callback data

## API Endpoints Created

### 1. STK Push (Initiate Payment)
```
POST /api/mpesa/stk-push
```

**Request Body:**
```json
{
  "phoneNumber": "254712345678",
  "amount": 1000,
  "accountReference": "SmartChama",
  "transactionDesc": "Monthly Contribution"
}
```

### 2. Callback (Receive Payment Status)
```
POST /api/mpesa/callback
```

This endpoint receives automatic callbacks from M-Pesa.

## Integration with SmartChama

### Example: Add to Deposit Button

```typescript
const handleDeposit = async () => {
  try {
    const response = await fetch('/api/mpesa/stk-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: userPhone,
        amount: depositAmount,
        accountReference: chamaName,
        transactionDesc: 'Chama Deposit'
      })
    });

    const data = await response.json();
    
    if (data.success) {
      alert('Check your phone for M-Pesa prompt!');
      // Save checkoutRequestID to track this transaction
    } else {
      alert('Payment failed: ' + data.error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## Troubleshooting

### Error: "Invalid Access Token"
- Check your Consumer Key and Secret
- Regenerate access token

### Error: "Invalid Phone Number"
- Use format: 254712345678 (no + or spaces)
- Use test numbers in sandbox

### Callback Not Received
- Check ngrok is running
- Verify callback URL in .env.local
- Check ngrok dashboard: http://localhost:4040

### STK Push Not Showing
- Use test phone numbers only in sandbox
- Check phone has network
- Verify shortcode and passkey

## Production Deployment

When going live:

1. Create a **Production App** in Daraja portal
2. Get production credentials
3. Update environment variables
4. Use your live shortcode
5. Update callback URL to production domain
6. Test with real phone numbers

## Security Notes

- Never commit `.env.local` to git
- Keep Consumer Key/Secret secure
- Validate all inputs before processing
- Log all transactions
- Implement rate limiting
- Use HTTPS for callbacks

## Next Steps

1. Create transactions table in Supabase
2. Save successful payments to database
3. Update user balances
4. Send confirmation SMS/email
5. Add transaction history page
6. Implement refunds (if needed)

## Useful Links

- Daraja Portal: https://developer.safaricom.co.ke/
- API Documentation: https://developer.safaricom.co.ke/Documentation
- Test Credentials: https://developer.safaricom.co.ke/test_credentials
- Ngrok: https://ngrok.com/
