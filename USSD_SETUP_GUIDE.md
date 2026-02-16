# USSD Setup Guide for SmartChama (*222#)

## What is USSD?

USSD (Unstructured Supplementary Service Data) is a protocol that allows users to interact with applications by dialing short codes like *222# on any phone, including feature phones ("Mulika Mwizi").

## How USSD Works

1. User dials *222# on their phone
2. Telecom network captures the request
3. Network sends request to your USSD gateway/server
4. Your server responds with menu text
5. User selects option by typing number
6. Process repeats until session ends

## Step 1: Choose a USSD Provider in Kenya

### Option A: Africa's Talking (Recommended)
- **Website**: https://africastalking.com/
- **Cost**: ~KES 50,000 - 100,000 setup + per-session fees
- **Coverage**: Safaricom, Airtel, Telkom Kenya
- **Setup Time**: 2-4 weeks

### Option B: Direct Telecom Integration
- **Safaricom**: Contact Safaricom Business
- **Airtel**: Contact Airtel Business
- **Cost**: Higher (KES 200,000+)
- **Setup Time**: 1-3 months

### Option C: Hover (Alternative)
- **Website**: https://www.usehover.com/
- **Focus**: USSD automation
- **Good for**: Testing and prototyping

## Step 2: Register Your USSD Code

### With Africa's Talking:

1. **Sign Up**: Create account at https://africastalking.com/
2. **Apply for USSD Code**: 
   - Go to USSD section
   - Request a shared code (e.g., *384*1234#) - Cheaper
   - Or request dedicated code (e.g., *222#) - More expensive
3. **Submit Documents**:
   - Business registration certificate
   - KRA PIN certificate
   - ID copies of directors
   - Application letter
4. **Wait for Approval**: 2-4 weeks
5. **Get Credentials**: API key and USSD code

## Step 3: Set Up USSD Gateway

### Install Africa's Talking SDK:

```bash
npm install africastalking
```

### Create USSD Service File:

```typescript
// src/lib/africastalking.ts
import AfricasTalking from 'africastalking';

const credentials = {
  apiKey: process.env.AFRICASTALKING_API_KEY || '',
  username: process.env.AFRICASTALKING_USERNAME || 'sandbox', // Use 'sandbox' for testing
};

const africastalking = AfricasTalking(credentials);

export default africastalking;
```

### Update Environment Variables:

```env
# .env.local
AFRICASTALKING_API_KEY=your_api_key_here
AFRICASTALKING_USERNAME=your_username_here
```

## Step 4: Create USSD Menu Logic

I've already created a basic USSD route at `src/app/api/ussd/route.ts`. Let me enhance it:

### Enhanced USSD Menu Structure:

```
*222#
├── 1. Check Balance
│   └── Shows: Personal savings, Group total
├── 2. Deposit Money
│   ├── Enter amount
│   └── Triggers M-Pesa STK Push
├── 3. Request Loan
│   ├── Shows loan limit
│   ├── Enter amount
│   └── Submits loan request
├── 4. My Group Status
│   └── Shows: Group name, Role, Next meeting
├── 5. Transaction History
│   └── Shows last 5 transactions
└── 0. Main Menu
```

## Step 5: Update USSD Route

Your current USSD route needs to be enhanced to work with Africa's Talking format:

```typescript
// src/app/api/ussd/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    // Africa's Talking sends these parameters
    const sessionId = formData.get("sessionId")?.toString() || "";
    const serviceCode = formData.get("serviceCode")?.toString() || "";
    const phoneNumber = formData.get("phoneNumber")?.toString() || "";
    const text = formData.get("text")?.toString().trim() || "";

    console.log("USSD Request:", { sessionId, serviceCode, phoneNumber, text });

    let response = "";

    // Main Menu
    if (text === "") {
      response = `CON Welcome to SmartChama
1. Check Balance
2. Deposit Money
3. Request Loan
4. My Group Status
5. Transaction History`;
    }
    // Check Balance
    else if (text === "1") {
      // TODO: Fetch from database using phoneNumber
      response = `END Your Balance:
Personal Savings: KES 45,000
Group Total: KES 1,250,000

Thank you for using SmartChama!`;
    }
    // Deposit Money
    else if (text === "2") {
      response = `CON Enter amount to deposit:
(e.g., 500)`;
    }
    else if (text.startsWith("2*")) {
      const amount = text.split("*")[1];
      // TODO: Trigger M-Pesa STK Push
      response = `END Deposit Request Sent!
Amount: KES ${amount}

Check your phone for M-Pesa prompt.`;
    }
    // Request Loan
    else if (text === "3") {
      response = `CON Loan Limit: KES 15,000
Enter amount to borrow:`;
    }
    else if (text.startsWith("3*")) {
      const amount = text.split("*")[1];
      // TODO: Save loan request to database
      response = `END Loan Request Submitted!
Amount: KES ${amount}

Your request is being processed.`;
    }
    // Group Status
    else if (text === "4") {
      // TODO: Fetch from database
      response = `END Your Group Info:
Group: Family Savings
Role: Admin
Next Meeting: Friday 2PM

Total Members: 12`;
    }
    // Transaction History
    else if (text === "5") {
      // TODO: Fetch from database
      response = `END Recent Transactions:
1. +KES 5,000 (Deposit)
2. -KES 2,000 (Loan)
3. +KES 3,000 (Deposit)

View more on app.`;
    }
    // Back to Main Menu
    else if (text.endsWith("*0")) {
      response = `CON Welcome to SmartChama
1. Check Balance
2. Deposit Money
3. Request Loan
4. My Group Status
5. Transaction History`;
    }
    // Invalid Input
    else {
      response = `END Invalid option.
Please dial *222# again.`;
    }

    // Return response in plain text
    return new NextResponse(response, {
      headers: { "Content-Type": "text/plain" },
    });

  } catch (error) {
    console.error("USSD Error:", error);
    return new NextResponse("END System Error. Please try again.", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
```

## Step 6: USSD Response Format

### Important Rules:

1. **CON** = Continue (show menu, wait for input)
   ```
   CON Welcome to SmartChama
   1. Check Balance
   2. Deposit Money
   ```

2. **END** = End session (final message)
   ```
   END Your balance is KES 45,000
   Thank you!
   ```

3. **Navigation**:
   - User input is cumulative: "1" → "1*2" → "1*2*500"
   - Use `text.split("*")` to parse user journey

## Step 7: Testing USSD

### Sandbox Testing (Africa's Talking):

1. **Use Simulator**: https://simulator.africastalking.com/
2. **Enter your USSD code**: *384*1234# (sandbox code)
3. **Test all menu flows**
4. **Check logs** in Africa's Talking dashboard

### Local Testing with Ngrok:

```bash
# Start your dev server
npm run dev

# In another terminal, start ngrok
ngrok http 3000

# Copy ngrok URL (e.g., https://abc123.ngrok.io)
# Set as callback URL in Africa's Talking dashboard:
# https://abc123.ngrok.io/api/ussd
```

## Step 8: Database Integration

### Link USSD to User Accounts:

```typescript
// Identify user by phone number
const { data: member } = await supabase
  .from('members')
  .select('*, chamas(*)')
  .eq('phone_number', phoneNumber)
  .single();

if (!member) {
  response = `END Phone not registered.
Please sign up on our app first.`;
  return;
}

// Now you can access user data
const balance = member.total_contributions;
const chamaName = member.chamas.name;
```

## Step 9: M-Pesa Integration via USSD

When user selects "Deposit Money":

```typescript
// Trigger STK Push
import { initiateSTKPush } from '@/lib/mpesa';

const result = await initiateSTKPush(
  phoneNumber,
  amount,
  'SmartChama',
  'USSD Deposit'
);

if (result.success) {
  response = `END Check your phone for M-Pesa prompt.`;
} else {
  response = `END Payment failed. Please try again.`;
}
```

## Step 10: Production Deployment

### Requirements:
1. **SSL Certificate**: USSD callbacks require HTTPS
2. **Static IP**: Some providers require whitelisting
3. **High Availability**: USSD sessions timeout quickly (30-60 seconds)
4. **Fast Response**: Must respond within 20 seconds

### Deployment Checklist:
- [ ] Deploy to production server (Vercel, Railway, etc.)
- [ ] Configure HTTPS
- [ ] Update callback URL in Africa's Talking
- [ ] Test with real phone numbers
- [ ] Monitor logs and errors
- [ ] Set up alerts for downtime

## Costs Breakdown (Kenya)

### Africa's Talking:
- **Shared USSD Code** (e.g., *384*1234#): KES 50,000 setup
- **Dedicated Code** (e.g., *222#): KES 200,000 - 500,000 setup
- **Per Session**: KES 0.50 - 2.00
- **Monthly Maintenance**: KES 5,000 - 20,000

### Direct Telecom:
- **Safaricom Dedicated Code**: KES 500,000+ setup
- **Per Session**: Negotiable
- **Monthly**: KES 50,000+

## Alternative: SMS Fallback

If USSD is too expensive initially, consider SMS:

```typescript
// User sends: BAL to 22222
// Response: Your balance is KES 45,000

// User sends: DEP 500 to 22222
// Response: Check phone for M-Pesa prompt
```

SMS is cheaper and works on all phones!

## Next Steps

1. **Sign up** for Africa's Talking sandbox
2. **Test** USSD flow in simulator
3. **Apply** for USSD code (2-4 weeks)
4. **Integrate** with your database
5. **Deploy** to production
6. **Launch** to users!

## Support Resources

- **Africa's Talking Docs**: https://developers.africastalking.com/docs/ussd
- **USSD Best Practices**: https://developers.africastalking.com/docs/ussd/best_practices
- **Community Forum**: https://help.africastalking.com/

## Important Notes

⚠️ **USSD sessions are short** (30-60 seconds) - keep menus simple
⚠️ **Test thoroughly** - USSD bugs are hard to debug on real phones
⚠️ **Have fallback** - SMS or app for complex operations
⚠️ **Monitor costs** - USSD can get expensive with high usage
⚠️ **Compliance** - Ensure you have proper licenses for financial services

---

**Ready to go live?** Start with Africa's Talking sandbox today!
