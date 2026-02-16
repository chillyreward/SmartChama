# Transaction History & Loan Management Spec

## Overview
Comprehensive transaction tracking and loan management system enabling chamas to monitor all financial activities, manage loan applications, approvals, repayments, and generate financial reports.

## Status
🚧 **PLANNED** - Basic transaction table exists, needs full UI and loan workflow

## Business Context
- **Target Users**: Chama admins and members
- **Problem**: Lack of transparency in financial transactions and manual loan processing
- **Solution**: Automated transaction tracking with detailed loan lifecycle management
- **Impact**: Improved financial accountability and faster loan processing

---

## User Stories

### Transaction History Features

#### US-1: View All Transactions
**As a** chama member  
**I want to** view all my personal transactions  
**So that** I can track my financial activity in the chama

**Acceptance Criteria:**
- [ ] Transaction list page showing all member transactions
- [ ] Display: date, type, amount, status, description, receipt number
- [ ] Filter by: transaction type, date range, status
- [ ] Search by: receipt number, description
- [ ] Pagination (20 transactions per page)
- [ ] Sort by: date (newest first), amount (high to low)
- [ ] Color coding: deposits (green), withdrawals (red), loans (orange)
- [ ] Click transaction to view full details

**Priority**: HIGH  
**Effort**: 3 days

#### US-2: Transaction Details Modal
**As a** chama member  
**I want to** view detailed information about a transaction  
**So that** I can verify transaction accuracy

**Acceptance Criteria:**
- [ ] Modal shows: full transaction details, timestamp, status history
- [ ] Display M-Pesa receipt number (if applicable)
- [ ] Show related chama information
- [ ] Download receipt as PDF
- [ ] Report transaction issue button
- [ ] Share transaction via SMS/email

**Priority**: MEDIUM  
**Effort**: 2 days

#### US-3: Admin Transaction Dashboard
**As a** chama admin  
**I want to** view all chama transactions across all members  
**So that** I can monitor overall financial activity

**Acceptance Criteria:**
- [ ] Dashboard showing all chama transactions
- [ ] Summary cards: total deposits, withdrawals, loans, pending
- [ ] Filter by: member, transaction type, date range
- [ ] Export to CSV/Excel
- [ ] Monthly transaction summary report
- [ ] Transaction analytics: trends, patterns, anomalies
- [ ] Bulk actions: approve, reject, flag for review

**Priority**: HIGH  
**Effort**: 5 days

#### US-4: Transaction Notifications
**As a** chama member  
**I want to** receive notifications for all my transactions  
**So that** I'm immediately aware of financial activity

**Acceptance Criteria:**
- [ ] SMS notification for every transaction
- [ ] In-app notification with transaction details
- [ ] Email summary (daily/weekly configurable)
- [ ] Push notifications (if mobile app exists)
- [ ] Notification preferences in settings
- [ ] Unsubscribe option for non-critical notifications

**Priority**: MEDIUM  
**Effort**: 3 days

---

### Loan Management Features

#### US-5: Apply for Loan
**As a** chama member  
**I want to** apply for a loan through the app  
**So that** I can access funds when needed

**Acceptance Criteria:**
- [ ] Loan application form with fields:
  - Loan amount (with min/max limits)
  - Loan purpose (dropdown: emergency, business, education, etc.)
  - Repayment period (1-12 months)
  - Guarantor selection (2 members required)
  - Supporting documents upload (optional)
- [ ] Display member's loan eligibility and limit
- [ ] Calculate and show: interest rate, monthly payment, total repayment
- [ ] Loan calculator tool
- [ ] Submit application with confirmation
- [ ] SMS notification to member and admin
- [ ] Application reference number generated

**Priority**: HIGH  
**Effort**: 5 days

#### US-6: Loan Eligibility Calculation
**As a** chama member  
**I want to** see my loan eligibility before applying  
**So that** I know how much I can borrow

**Acceptance Criteria:**
- [ ] Eligibility based on:
  - Total contributions (3x multiplier)
  - Membership duration (min 3 months)
  - Previous loan repayment history
  - Current outstanding loans
  - Chama rules/policies
- [ ] Display: max loan amount, interest rate, terms
- [ ] Show calculation breakdown
- [ ] Warning if not eligible with reasons
- [ ] Tips to improve eligibility

**Priority**: MEDIUM  
**Effort**: 3 days

#### US-7: Admin Loan Approval Workflow
**As a** chama admin  
**I want to** review and approve/reject loan applications  
**So that** I can manage lending responsibly

**Acceptance Criteria:**
- [ ] Loan applications dashboard showing:
  - Pending applications (priority view)
  - Approved loans
  - Rejected loans
  - Completed loans
- [ ] Application detail view with:
  - Member profile and history
  - Loan details and calculations
  - Guarantor information
  - Risk assessment score
- [ ] Actions: Approve, Reject, Request More Info
- [ ] Rejection reason required (dropdown + text)
- [ ] Approval triggers:
  - Loan amount deducted from chama balance
  - Amount added to member wallet
  - Transaction records created
  - SMS notifications sent
- [ ] Approval requires admin PIN verification
- [ ] Optional: Multi-admin approval for large loans

**Priority**: HIGH  
**Effort**: 6 days

#### US-8: Guarantor System
**As a** chama member  
**I want to** be notified when I'm selected as a guarantor  
**So that** I can accept or decline the responsibility

**Acceptance Criteria:**
- [ ] SMS notification when selected as guarantor
- [ ] In-app notification with loan details
- [ ] Guarantor can: Accept, Decline, Request Info
- [ ] Loan application shows guarantor status
- [ ] Loan cannot be approved until guarantors accept
- [ ] Guarantor liability clearly stated
- [ ] Guarantor history tracked (loans guaranteed, defaults)

**Priority**: MEDIUM  
**Effort**: 4 days

#### US-9: Loan Repayment Tracking
**As a** chama member  
**I want to** track my loan repayment progress  
**So that** I can stay on top of my obligations

**Acceptance Criteria:**
- [ ] Loan detail page showing:
  - Original amount, interest, total due
  - Amount paid, amount remaining
  - Payment schedule (monthly breakdown)
  - Next payment due date and amount
  - Payment history
  - Early repayment option
- [ ] Progress bar visualization
- [ ] Overdue indicator (red flag)
- [ ] Make payment button (triggers M-Pesa)
- [ ] Automatic payment reminders (SMS 3 days before due)
- [ ] Late payment penalties calculated automatically

**Priority**: HIGH  
**Effort**: 5 days

#### US-10: Automated Loan Repayment
**As a** chama member  
**I want to** set up automatic loan repayments  
**So that** I never miss a payment

**Acceptance Criteria:**
- [ ] Enable auto-repayment option in loan settings
- [ ] Automatic M-Pesa STK Push on due date
- [ ] Retry logic if payment fails (3 attempts)
- [ ] SMS notification before auto-deduction
- [ ] Option to disable auto-repayment anytime
- [ ] Fallback to manual payment if auto fails
- [ ] Transaction records for all auto-payments

**Priority**: MEDIUM  
**Effort**: 4 days

#### US-11: Loan Default Management
**As a** chama admin  
**I want to** manage defaulted loans  
**So that** I can recover funds and maintain chama health

**Acceptance Criteria:**
- [ ] Automatic default flag after 30 days overdue
- [ ] Default dashboard showing:
  - All defaulted loans
  - Total amount in default
  - Member contact information
  - Guarantor details
- [ ] Actions available:
  - Send reminder SMS
  - Contact guarantors
  - Restructure loan (extend period, reduce payment)
  - Write off loan (with approval)
  - Suspend member privileges
- [ ] Default history and resolution tracking
- [ ] Reporting to credit bureaus (future)

**Priority**: MEDIUM  
**Effort**: 5 days

#### US-12: Loan Reports & Analytics
**As a** chama admin  
**I want to** generate loan reports and analytics  
**So that** I can make informed lending decisions

**Acceptance Criteria:**
- [ ] Reports available:
  - Loan portfolio summary
  - Repayment rate analysis
  - Default rate by loan type
  - Member borrowing patterns
  - Interest income generated
  - Loan aging report
- [ ] Visual charts and graphs
- [ ] Export to PDF/Excel
- [ ] Date range selection
- [ ] Scheduled reports (monthly email)
- [ ] Benchmarking against other chamas (anonymized)

**Priority**: LOW  
**Effort**: 4 days

---

## Technical Architecture

### Enhanced Database Schema

#### transactions (existing - enhance)
```sql
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS
  related_loan_id UUID REFERENCES loans(id),
  category VARCHAR(50), -- deposit, withdrawal, loan_disbursement, loan_repayment, etc.
  notes TEXT,
  receipt_url TEXT,
  is_flagged BOOLEAN DEFAULT false,
  flagged_reason TEXT;

CREATE INDEX idx_transactions_member ON transactions(phone_number);
CREATE INDEX idx_transactions_chama ON transactions(chama_id);
CREATE INDEX idx_transactions_date ON transactions(created_at);
```

#### loans (new)
```sql
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) NOT NULL,
  chama_id UUID REFERENCES chamas(id) NOT NULL,
  application_date TIMESTAMP DEFAULT NOW(),
  amount DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL, -- e.g., 5.00 for 5%
  repayment_period_months INT NOT NULL,
  purpose VARCHAR(100),
  purpose_description TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, active, completed, defaulted
  approved_by UUID REFERENCES chama_admins(id),
  approved_date TIMESTAMP,
  rejection_reason TEXT,
  disbursement_date TIMESTAMP,
  total_amount_due DECIMAL(15,2), -- principal + interest
  amount_paid DECIMAL(15,2) DEFAULT 0,
  amount_remaining DECIMAL(15,2),
  next_payment_date DATE,
  next_payment_amount DECIMAL(15,2),
  is_auto_repay BOOLEAN DEFAULT false,
  default_date TIMESTAMP,
  completed_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_loans_member ON loans(member_id);
CREATE INDEX idx_loans_status ON loans(status);
```

#### loan_guarantors (new)
```sql
CREATE TABLE loan_guarantors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID REFERENCES loans(id) NOT NULL,
  guarantor_member_id UUID REFERENCES members(id) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, declined
  response_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### loan_payments (new)
```sql
CREATE TABLE loan_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID REFERENCES loans(id) NOT NULL,
  transaction_id UUID REFERENCES transactions(id),
  payment_date TIMESTAMP DEFAULT NOW(),
  amount DECIMAL(15,2) NOT NULL,
  payment_method VARCHAR(50), -- mpesa, cash, bank_transfer
  is_auto_payment BOOLEAN DEFAULT false,
  late_fee DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### loan_schedule (new)
```sql
CREATE TABLE loan_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID REFERENCES loans(id) NOT NULL,
  installment_number INT NOT NULL,
  due_date DATE NOT NULL,
  principal_amount DECIMAL(15,2) NOT NULL,
  interest_amount DECIMAL(15,2) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, paid, overdue
  paid_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

```typescript
// Transaction APIs
GET    /api/transactions                    // Get member transactions
GET    /api/transactions/:id                // Get transaction details
GET    /api/transactions/admin/all          // Admin: all chama transactions
POST   /api/transactions/export             // Export transactions
POST   /api/transactions/:id/flag           // Flag transaction for review

// Loan Application APIs
POST   /api/loans/apply                     // Submit loan application
GET    /api/loans/eligibility               // Check loan eligibility
GET    /api/loans/calculator                // Loan calculator

// Loan Management APIs (Member)
GET    /api/loans/my-loans                  // Get member's loans
GET    /api/loans/:id                       // Get loan details
POST   /api/loans/:id/repay                 // Make loan payment
PUT    /api/loans/:id/auto-repay            // Toggle auto-repayment
GET    /api/loans/:id/schedule              // Get payment schedule

// Loan Management APIs (Admin)
GET    /api/loans/admin/pending             // Get pending applications
GET    /api/loans/admin/all                 // Get all chama loans
POST   /api/loans/:id/approve               // Approve loan
POST   /api/loans/:id/reject                // Reject loan
POST   /api/loans/:id/restructure           // Restructure loan
GET    /api/loans/admin/reports             // Generate loan reports

// Guarantor APIs
GET    /api/guarantors/requests             // Get guarantor requests
POST   /api/guarantors/:id/respond          // Accept/decline guarantor request
GET    /api/guarantors/history              // Get guarantor history
```

### Component Structure

```
src/app/dashboard/
├── transactions/
│   ├── page.tsx                    // Transaction list (NEW)
│   ├── [id]/
│   │   └── page.tsx               // Transaction details (NEW)
│   └── components/
│       ├── TransactionCard.tsx    // Transaction display (NEW)
│       ├── TransactionFilter.tsx  // Filter UI (NEW)
│       └── TransactionExport.tsx  // Export functionality (NEW)
│
└── loans/
    ├── page.tsx                    // Loan dashboard (enhance existing)
    ├── apply/
    │   └── page.tsx               // Loan application form (NEW)
    ├── [id]/
    │   └── page.tsx               // Loan details (NEW)
    └── components/
        ├── LoanCard.tsx           // Loan display card (NEW)
        ├── LoanCalculator.tsx     // Loan calculator (NEW)
        ├── PaymentSchedule.tsx    // Payment schedule table (NEW)
        └── GuarantorRequest.tsx   // Guarantor UI (NEW)

src/app/admin/dashboard/
├── transactions/
│   └── page.tsx                    // Admin transaction dashboard (NEW)
└── loans/
    ├── page.tsx                    // Admin loan management (NEW)
    ├── pending/
    │   └── page.tsx               // Pending applications (NEW)
    └── reports/
        └── page.tsx               // Loan reports (NEW)
```

---

## Business Rules

### Transaction Rules
- All transactions must have: type, amount, phone_number, status
- Completed transactions cannot be edited
- Flagged transactions require admin review
- Transaction history retained indefinitely
- Receipts generated for all M-Pesa transactions

### Loan Eligibility Rules
- Minimum membership: 3 months
- Minimum contributions: KES 5,000
- Maximum loan: 3x total contributions (configurable)
- No outstanding defaulted loans
- Maximum 2 active loans per member
- Interest rate: 5-10% per annum (configurable by chama)

### Loan Approval Rules
- Requires 2 guarantors (active members)
- Admin approval required for all loans
- Loans > KES 50,000 require multi-admin approval
- Approval within 48 hours (SLA)
- Automatic rejection after 7 days if no action

### Repayment Rules
- Monthly installments (equal amounts)
- Grace period: 5 days after due date
- Late fee: 2% of installment amount per week
- Default: 30 days overdue
- Early repayment allowed (no penalty)
- Partial payments accepted

---

## UI/UX Design

### Transaction List Page
```
┌─────────────────────────────────────────────────────┐
│ My Transactions                    [Export] [Filter] │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Feb 14, 2026 | Deposit | +KES 5,000 | Completed │ │
│ │ M-Pesa Receipt: ABC123XYZ                       │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Feb 10, 2026 | Loan Repayment | -KES 2,500 | ✓ │ │
│ │ Loan #L-2024-001 | Auto-payment                │ │
│ └─────────────────────────────────────────────────┘ │
│ [Load More...]                                      │
└─────────────────────────────────────────────────────┘
```

### Loan Application Form
```
┌─────────────────────────────────────────────────────┐
│ Apply for Loan                                      │
├─────────────────────────────────────────────────────┤
│ Your Loan Limit: KES 15,000                         │
│                                                     │
│ Loan Amount: [_________] KES                        │
│ Purpose: [Dropdown: Emergency, Business, etc.]      │
│ Repayment Period: [___] months (1-12)               │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Loan Summary                                    │ │
│ │ Principal: KES 10,000                           │ │
│ │ Interest (5%): KES 500                          │ │
│ │ Total Repayment: KES 10,500                     │ │
│ │ Monthly Payment: KES 1,750 (6 months)           │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Select Guarantors:                                  │
│ [x] John Doe (Member since 2024)                    │
│ [x] Jane Smith (Member since 2023)                  │
│                                                     │
│ [Cancel] [Submit Application]                       │
└─────────────────────────────────────────────────────┘
```

### Loan Detail Page
```
┌─────────────────────────────────────────────────────┐
│ Loan #L-2024-001                          [Active]  │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Progress: ████████░░░░░░░░░░ 40% Complete      │ │
│ │ Paid: KES 4,200 | Remaining: KES 6,300          │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Next Payment: Feb 28, 2026 | KES 1,750             │
│ [Make Payment Now]                                  │
│                                                     │
│ Payment Schedule:                                   │
│ ✓ Jan 2026 - KES 1,750 (Paid)                      │
│ ✓ Feb 2026 - KES 1,750 (Paid)                      │
│ ⏰ Mar 2026 - KES 1,750 (Due in 14 days)            │
│ ○ Apr 2026 - KES 1,750                              │
│ [View Full Schedule]                                │
│                                                     │
│ Loan Details:                                       │
│ Original Amount: KES 10,000                         │
│ Interest Rate: 5% per annum                         │
│ Approved: Jan 1, 2026                               │
│ Guarantors: John Doe, Jane Smith                    │
└─────────────────────────────────────────────────────┘
```

---

## Testing Strategy

### Unit Tests
- Transaction filtering and sorting logic
- Loan eligibility calculation
- Interest and payment calculations
- Late fee calculations
- Guarantor validation

### Integration Tests
- End-to-end loan application flow
- Loan approval workflow
- Repayment processing with M-Pesa
- Automatic payment scheduling
- SMS notification delivery

### User Acceptance Testing
- Member applies for loan
- Admin approves/rejects loan
- Guarantor accepts/declines
- Member makes repayment
- Admin generates reports

---

## Rollout Plan

### Phase 1: Transaction History (Sprint 1)
- [ ] Transaction list page (member)
- [ ] Transaction details modal
- [ ] Basic filtering and search
- [ ] Admin transaction dashboard

### Phase 2: Loan Application (Sprint 2)
- [ ] Loan eligibility calculation
- [ ] Loan application form
- [ ] Guarantor system
- [ ] Admin approval workflow

### Phase 3: Loan Repayment (Sprint 3)
- [ ] Loan detail page
- [ ] Payment schedule
- [ ] Manual repayment
- [ ] Automatic repayment

### Phase 4: Advanced Features (Sprint 4)
- [ ] Default management
- [ ] Loan restructuring
- [ ] Reports and analytics
- [ ] Export functionality

---

## Success Metrics

### Transaction Metrics
- Average transactions per member per month
- Transaction completion rate
- Flagged transaction rate (<1% target)
- Export usage rate

### Loan Metrics
- Loan application volume
- Approval rate (target: 70-80%)
- Average loan amount
- Repayment rate (target: >95%)
- Default rate (target: <5%)
- Average time to approval (target: <24 hours)

### User Satisfaction
- Loan application ease (survey score)
- Repayment experience rating
- Admin workflow efficiency
- Feature adoption rate

---

**Last Updated**: February 14, 2026  
**Spec Owner**: SmartChama Product Team  
**Status**: Ready for Development  
**Estimated Timeline**: 4 sprints (8 weeks)
