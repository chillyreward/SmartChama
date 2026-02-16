# USSD & Africa's Talking Integration Spec

## Overview
This spec documents the USSD integration with Africa's Talking platform, enabling SmartChama members to access core banking features via mobile phone without internet connectivity.

## Status
✅ **IMPLEMENTED** - Documented for reference and future enhancements

## Business Context
- **Target Users**: Chama members in Kenya with basic mobile phones
- **Problem Solved**: Access to chama services without smartphones or internet
- **Value Proposition**: Financial inclusion through USSD technology
- **USSD Code**: `*384*23713#`

---

## User Stories

### US-1: Check Balance via USSD
**As a** chama member  
**I want to** check my wallet balance and group balance via USSD  
**So that** I can monitor my finances without internet access

**Acceptance Criteria:**
- [x] Member dials `*384*23713#` and selects option 1
- [x] System retrieves member by phone number from database
- [x] System calculates personal wallet balance from transactions
- [x] System displays personal balance and group total balance
- [x] Response shows chama name and formatted currency
- [x] Error handling for unregistered phone numbers

### US-2: Deposit Money via USSD
**As a** chama member  
**I want to** initiate M-Pesa deposits through USSD  
**So that** I can contribute to my chama without using the app

**Acceptance Criteria:**
- [x] Member selects option 2 from main menu
- [x] System prompts for deposit amount (minimum KES 100)
- [x] System validates amount is numeric and >= 100
- [x] System triggers M-Pesa STK Push to member's phone
- [x] Member receives M-Pesa prompt to enter PIN
- [x] Success message confirms deposit request sent
- [x] Transaction recorded in database via M-Pesa callback

### US-3: Request Loan via USSD
**As a** chama member  
**I want to** request a loan through USSD  
**So that** I can access emergency funds quickly

**Acceptance Criteria:**
- [x] Member selects option 3 from main menu
- [x] System displays member's loan limit (currently KES 15,000)
- [x] System prompts for loan amount
- [x] System validates amount (min KES 500, max KES 15,000)
- [x] Loan request saved to transactions table with 'pending' status
- [x] SMS notification sent to member confirming request
- [x] Processing time communicated (24-48 hours)

### US-4: View Group Status via USSD
**As a** chama member  
**I want to** view my group information via USSD  
**So that** I can stay informed about my chama's status

**Acceptance Criteria:**
- [x] Member selects option 4 from main menu
- [x] System retrieves member's chama details
- [x] System counts total members in the chama
- [x] Display shows: group name, member count, total balance, status
- [x] Error handling for members not in any chama

### US-5: View Transaction History via USSD
**As a** chama member  
**I want to** view my recent transactions via USSD  
**So that** I can track my financial activity

**Acceptance Criteria:**
- [x] Member selects option 5 from main menu
- [x] System retrieves last 5 completed transactions
- [x] Transactions displayed with amount and type indicator (+/-)
- [x] Empty state message if no transactions exist
- [x] Prompt to view more on app

---

## Technical Architecture

### Components
1. **USSD Route Handler**: `/api/ussd/route.ts`
2. **Africa's Talking Library**: `src/lib/africastalking.ts`
3. **M-Pesa Integration**: `/api/mpesa/stk-push/route.ts`
4. **SMS Service**: `/api/sms/send/route.ts`
5. **Database**: Supabase (members, transactions, chamas tables)

### Data Flow
```
User Phone → Africa's Talking → USSD Route → Supabase Database
                                    ↓
                              M-Pesa API (for deposits)
                                    ↓
                              SMS API (for notifications)
```

### Environment Variables
```env
AFRICASTALKING_API_KEY=your_api_key
AFRICASTALKING_USERNAME=sandbox (or production username)
AFRICASTALKING_SENDER_ID=SmartChama
NEXT_PUBLIC_APP_URL=https://your-ngrok-url.ngrok-free.dev
```

### Database Schema Dependencies
- **members**: phone_number, chama_id, name, email
- **chamas**: name, total_balance
- **transactions**: transaction_type, amount, phone_number, status, mpesa_receipt_number

---

## USSD Menu Structure

```
Main Menu (text="")
├── 1. Check Balance → Display personal + group balance
├── 2. Deposit Money
│   └── Enter amount → Trigger M-Pesa STK Push
├── 3. Request Loan
│   └── Enter amount → Save to DB + Send SMS
├── 4. My Group Status → Display chama info
├── 5. Transaction History → Show last 5 transactions
└── 0. Exit → Thank you message
```

### Response Types
- **CON**: Continue session (show menu/prompt)
- **END**: End session (final message)

---

## Testing & Deployment

### Testing Checklist
- [x] Simulator testing on Africa's Talking dashboard
- [x] Phone number registration in sandbox
- [x] USSD channel creation with callback URL
- [x] ngrok tunnel for local development
- [x] M-Pesa integration testing
- [x] SMS notification testing
- [x] Database transaction recording

### Production Deployment
1. Move from sandbox to production Africa's Talking account
2. Register production USSD code with Safaricom
3. Update environment variables with production credentials
4. Configure production callback URL (not ngrok)
5. Set up monitoring and logging
6. Test with real phone numbers

---

## Future Enhancements

### Phase 2 Features
- [ ] **Dynamic Loan Limits**: Calculate based on member contributions
- [ ] **Loan Approval Workflow**: Admin approval via SMS/USSD
- [ ] **Multi-language Support**: Kiswahili, Kikuyu menus
- [ ] **Withdrawal Requests**: Request withdrawals via USSD
- [ ] **Meeting Reminders**: Automated SMS for upcoming meetings
- [ ] **Voting via USSD**: Simple yes/no votes for proposals

### Phase 3 Features
- [ ] **Voice Integration**: IVR for illiterate users
- [ ] **USSD Analytics**: Track usage patterns
- [ ] **Airtime Rewards**: Send airtime to active members
- [ ] **Bill Payments**: Pay utilities via USSD
- [ ] **Savings Goals**: Track personal savings targets

---

## Known Limitations

1. **Sandbox Restrictions**:
   - Only registered phone numbers can test
   - Limited to Africa's Talking test numbers
   - SMS may not deliver in sandbox mode

2. **USSD Constraints**:
   - 182 character limit per screen
   - Session timeout after 30 seconds of inactivity
   - No rich media (text only)

3. **Current Simplifications**:
   - Fixed loan limit (not dynamic)
   - No loan approval workflow
   - Basic transaction history (last 5 only)
   - No pagination for long lists

---

## Support & Documentation

### Related Files
- `AFRICASTALKING_SETUP.md` - Setup guide
- `USSD_SETUP_GUIDE.md` - Testing guide
- `src/app/api/ussd/route.ts` - Implementation
- `src/lib/africastalking.ts` - Library wrapper

### External Resources
- [Africa's Talking USSD Docs](https://developers.africastalking.com/docs/ussd/overview)
- [Africa's Talking Sandbox](https://account.africastalking.com/apps/sandbox)
- [USSD Simulator](https://simulator.africastalking.com:1517/)

---

## Success Metrics

### KPIs to Track
- USSD session count per day
- Successful deposit rate via USSD
- Loan request volume
- Average session duration
- Error rate by menu option
- User retention (repeat USSD users)

### Target Goals (6 months)
- 500+ active USSD users
- 70%+ successful transaction rate
- <5% error rate
- 30% of deposits via USSD

---

**Last Updated**: February 14, 2026  
**Spec Owner**: SmartChama Development Team  
**Status**: Production Ready
