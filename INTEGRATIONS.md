# SmartChama Integrations Guide

## Overview
This document explains how to set up and use Twilio SMS and OpenAI integrations in SmartChama.

---

## 🔧 Setup Instructions

### 1. Twilio Setup (SMS & OTP)

#### Get Twilio Credentials:
1. Go to [Twilio Console](https://console.twilio.com/)
2. Sign up or log in
3. Get your credentials:
   - **Account SID**: Found on dashboard
   - **Auth Token**: Found on dashboard (click to reveal)
   - **Phone Number**: Get a Twilio phone number (Trial or Paid)

#### Add to Environment Variables:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

#### Phone Number Format:
- Must include country code
- Kenya format: `+254712345678`
- US format: `+11234567890`

---

### 2. OpenAI Setup (AI Assistant)

#### Get OpenAI API Key:
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create new secret key
5. Copy the key (you won't see it again!)

#### Add to Environment Variables:
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 📱 Twilio Features

### Available Functions:

#### 1. Send OTP
```typescript
import { sendOTP } from '@/lib/twilio';

await sendOTP('+254712345678', '123456');
```

#### 2. Send Contribution Reminder
```typescript
import { sendContributionReminder } from '@/lib/twilio';

await sendContributionReminder('+254712345678', 5000, '2026-02-15');
```

#### 3. Send Loan Approval
```typescript
import { sendLoanApproval } from '@/lib/twilio';

await sendLoanApproval('+254712345678', 50000, 'Tuungane Chama');
```

#### 4. Send Transaction Notification
```typescript
import { sendTransactionNotification } from '@/lib/twilio';

await sendTransactionNotification(
  '+254712345678',
  'contribution',
  5000,
  150000
);
```

#### 5. Send Meeting Reminder
```typescript
import { sendMeetingReminder } from '@/lib/twilio';

await sendMeetingReminder(
  '+254712345678',
  '2026-02-20',
  '2:00 PM',
  'Community Hall'
);
```

#### 6. Send Welcome Message
```typescript
import { sendWelcomeMessage } from '@/lib/twilio';

await sendWelcomeMessage('+254712345678', 'John Doe', 'Tuungane Chama');
```

---

## 🤖 OpenAI Features

### Available Functions:

#### 1. Get Financial Advice
```typescript
import { getFinancialAdvice } from '@/lib/openai';

const advice = await getFinancialAdvice({
  totalBalance: 1450230,
  monthlyContributions: 120000,
  activeLoans: 8,
  memberCount: 24
});
```

#### 2. Analyze Spending Patterns
```typescript
import { analyzeSpendingPatterns } from '@/lib/openai';

const analysis = await analyzeSpendingPatterns([
  { type: 'contribution', amount: 5000, date: '2026-02-01' },
  { type: 'loan', amount: 25000, date: '2026-02-05' }
]);
```

#### 3. Generate Reminder Message
```typescript
import { generateReminderMessage } from '@/lib/openai';

const message = await generateReminderMessage('John Doe', 5000, 3);
```

#### 4. Chat with AI
```typescript
import { chatWithAI } from '@/lib/openai';

const response = await chatWithAI(
  'How can I improve my chama savings?',
  'Current balance: KES 100,000'
);
```

#### 5. Predict Loan Risk
```typescript
import { predictLoanRisk } from '@/lib/openai';

const risk = await predictLoanRisk({
  contributionHistory: [5000, 5000, 0, 5000, 5000, 5000],
  loanHistory: 2,
  missedPayments: 1,
  membershipDuration: 12
});
```

---

## 🌐 API Routes

### SMS Endpoints:

#### Send SMS
```bash
POST /api/sms/send
Content-Type: application/json

{
  "to": "+254712345678",
  "message": "Your message here"
}
```

#### Send/Verify OTP
```bash
# Send OTP
POST /api/sms/otp
Content-Type: application/json

{
  "phoneNumber": "+254712345678"
}

# Verify OTP
POST /api/sms/otp
Content-Type: application/json

{
  "phoneNumber": "+254712345678",
  "action": "verify",
  "code": "123456"
}
```

### AI Endpoints:

#### Get Financial Advice
```bash
POST /api/ai/advice
Content-Type: application/json

{
  "totalBalance": 1450230,
  "monthlyContributions": 120000,
  "activeLoans": 8,
  "memberCount": 24
}
```

#### Chat with AI
```bash
POST /api/ai/chat
Content-Type: application/json

{
  "message": "How can I save more?",
  "context": "Monthly income: KES 50,000"
}
```

---

## 💡 Usage Examples

### Example 1: OTP Verification on Signup
```typescript
// In your signup component
const handleSendOTP = async () => {
  const response = await fetch('/api/sms/otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber: '+254712345678' })
  });
  
  const data = await response.json();
  console.log(data.message); // "OTP sent successfully"
};

const handleVerifyOTP = async (code: string) => {
  const response = await fetch('/api/sms/otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      phoneNumber: '+254712345678',
      action: 'verify',
      code 
    })
  });
  
  const data = await response.json();
  if (data.verified) {
    console.log('OTP verified!');
  }
};
```

### Example 2: AI Financial Advice on Dashboard
```typescript
// In your dashboard component
const [advice, setAdvice] = useState('');

const fetchAdvice = async () => {
  const response = await fetch('/api/ai/advice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      totalBalance: 1450230,
      monthlyContributions: 120000,
      activeLoans: 8,
      memberCount: 24
    })
  });
  
  const data = await response.json();
  setAdvice(data.advice);
};
```

---

## 💰 Pricing Information

### Twilio Pricing:
- **SMS**: ~$0.0075 per message (Kenya)
- **Trial Account**: $15.50 credit (can send ~2000 messages)
- **Phone Number**: ~$1/month

### OpenAI Pricing:
- **GPT-4o-mini**: $0.150 per 1M input tokens, $0.600 per 1M output tokens
- **Typical Request**: ~$0.001 per advice/chat
- **Monthly Estimate**: $5-20 for moderate usage

---

## 🔒 Security Best Practices

1. **Never commit `.env.local` file**
2. **Use environment variables for all secrets**
3. **Validate phone numbers before sending SMS**
4. **Rate limit API endpoints**
5. **Implement OTP expiration (10 minutes)**
6. **Store OTPs securely (use Redis in production)**
7. **Sanitize user inputs before AI processing**

---

## 🚀 Next Steps

1. Add environment variables to `.env.local`
2. Test SMS sending with your Twilio number
3. Test AI features with OpenAI API
4. Implement OTP verification in signup flow
5. Add AI assistant to dashboard
6. Set up automated reminders with cron jobs

---

## 📞 Support

- **Twilio Docs**: https://www.twilio.com/docs
- **OpenAI Docs**: https://platform.openai.com/docs
- **SmartChama Issues**: Create an issue in your repository
