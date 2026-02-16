# SmartGrow Investment Tracking Enhancement Spec

## Overview
Enhance the SmartGrow investment platform to enable chamas to track, manage, and analyze their investments in real Kenyan financial products with portfolio management features.

## Status
🚧 **PLANNED** - Current implementation shows opportunities, needs tracking functionality

## Business Context
- **Target Users**: Chama admins and members seeking investment growth
- **Problem**: Chamas struggle to track investments across multiple products
- **Solution**: Unified investment portfolio with real-time tracking and analytics
- **Revenue Model**: Pro feature (subscription-based)

---

## User Stories

### US-1: Investment Portfolio Dashboard
**As a** chama admin  
**I want to** view all my chama's active investments in one dashboard  
**So that** I can monitor overall portfolio performance

**Acceptance Criteria:**
- [ ] Dashboard shows total invested amount across all products
- [ ] Display current portfolio value with gains/losses
- [ ] Show portfolio allocation by asset type (pie chart)
- [ ] List all active investments with individual performance
- [ ] Filter by investment type (Money Market, Bonds, Unit Trusts, REITs)
- [ ] Export portfolio report as PDF
- [ ] Real-time or daily updated valuations

**Priority**: HIGH  
**Effort**: 5 days

### US-2: Make Investment from Chama Balance
**As a** chama admin  
**I want to** invest chama funds into verified opportunities  
**So that** our savings can grow through professional investments

**Acceptance Criteria:**
- [ ] "Invest Now" button on opportunity cards
- [ ] Investment form with amount input and confirmation
- [ ] Validate sufficient chama balance before investment
- [ ] Require admin PIN verification for investments
- [ ] Optional: Require member voting approval (configurable)
- [ ] Deduct amount from chama balance
- [ ] Create investment record in database
- [ ] Send confirmation SMS to admin and members
- [ ] Generate investment certificate/receipt

**Priority**: HIGH  
**Effort**: 8 days

### US-3: Track Investment Performance
**As a** chama member  
**I want to** see how each investment is performing  
**So that** I can understand our returns and make informed decisions

**Acceptance Criteria:**
- [ ] Investment detail page for each active investment
- [ ] Show: principal amount, current value, gain/loss, APY
- [ ] Display investment timeline (start date, maturity date)
- [ ] Show interest earned to date
- [ ] Historical performance chart (line graph)
- [ ] Projected returns at maturity
- [ ] Option to view investment certificate/documentation

**Priority**: MEDIUM  
**Effort**: 5 days

### US-4: Dividend & Interest Distribution
**As a** chama admin  
**I want to** automatically distribute investment returns to members  
**So that** everyone benefits proportionally from our investments

**Acceptance Criteria:**
- [ ] Automated dividend distribution based on member contributions
- [ ] Manual distribution option for admins
- [ ] Distribution preview showing each member's share
- [ ] Option to reinvest dividends or add to wallet
- [ ] Transaction records for all distributions
- [ ] SMS notifications to members on dividend receipt
- [ ] Tax calculation and reporting (if applicable)

**Priority**: MEDIUM  
**Effort**: 6 days

### US-5: Investment Maturity & Withdrawal
**As a** chama admin  
**I want to** withdraw matured investments back to chama balance  
**So that** we can access our returns and principal

**Acceptance Criteria:**
- [ ] Notification 7 days before investment maturity
- [ ] "Withdraw" button enabled only after maturity date
- [ ] Withdrawal request form with bank details
- [ ] Admin PIN verification required
- [ ] Processing status tracking (pending, approved, completed)
- [ ] Funds added back to chama balance on completion
- [ ] Final investment statement generated
- [ ] Option to rollover/reinvest at maturity

**Priority**: MEDIUM  
**Effort**: 5 days

### US-6: Investment Recommendations
**As a** chama admin  
**I want to** receive personalized investment recommendations  
**So that** I can make better investment decisions for my chama

**Acceptance Criteria:**
- [ ] AI-powered recommendations based on chama profile
- [ ] Consider: risk tolerance, investment goals, time horizon
- [ ] Suggest portfolio diversification strategies
- [ ] Compare similar investment products
- [ ] Show "Chamas like yours invested in..." insights
- [ ] Educational content on each investment type
- [ ] Risk assessment questionnaire for new chamas

**Priority**: LOW  
**Effort**: 8 days

---

## Technical Architecture

### New Database Tables

#### investments
```sql
CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chama_id UUID REFERENCES chamas(id) NOT NULL,
  opportunity_id VARCHAR(50) NOT NULL, -- Links to opportunity catalog
  principal_amount DECIMAL(15,2) NOT NULL,
  current_value DECIMAL(15,2) NOT NULL,
  interest_earned DECIMAL(15,2) DEFAULT 0,
  investment_date TIMESTAMP DEFAULT NOW(),
  maturity_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active', -- active, matured, withdrawn
  certificate_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### investment_opportunities
```sql
CREATE TABLE investment_opportunities (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  partner VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- money_market, bonds, unit_trusts, reit
  risk_level VARCHAR(20) NOT NULL, -- low, medium, high
  apy DECIMAL(5,2) NOT NULL,
  min_investment DECIMAL(15,2) NOT NULL,
  lock_period_months INT,
  description TEXT,
  url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### investment_transactions
```sql
CREATE TABLE investment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investment_id UUID REFERENCES investments(id),
  transaction_type VARCHAR(50) NOT NULL, -- purchase, dividend, interest, withdrawal
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### dividend_distributions
```sql
CREATE TABLE dividend_distributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investment_id UUID REFERENCES investments(id),
  member_id UUID REFERENCES members(id),
  amount DECIMAL(15,2) NOT NULL,
  distribution_date TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

```typescript
// Investment Management
POST   /api/investments/create          // Create new investment
GET    /api/investments/portfolio       // Get chama portfolio
GET    /api/investments/:id             // Get investment details
PUT    /api/investments/:id/update      // Update investment value
POST   /api/investments/:id/withdraw    // Withdraw matured investment

// Opportunities
GET    /api/opportunities               // List all opportunities
GET    /api/opportunities/:id           // Get opportunity details
POST   /api/opportunities/recommend     // Get AI recommendations

// Dividends
POST   /api/dividends/distribute        // Distribute dividends
GET    /api/dividends/preview           // Preview distribution
GET    /api/dividends/history           // Get distribution history
```

### Component Structure

```
src/app/dashboard/smartgrow/
├── page.tsx                    // Main SmartGrow page (existing)
├── portfolio/
│   └── page.tsx               // Portfolio dashboard (NEW)
├── investments/
│   └── [id]/
│       └── page.tsx           // Investment detail page (NEW)
└── components/
    ├── InvestmentCard.tsx     // Investment display card (NEW)
    ├── PortfolioChart.tsx     // Portfolio allocation chart (NEW)
    ├── InvestmentForm.tsx     // Investment creation form (NEW)
    └── DividendCalculator.tsx // Dividend distribution UI (NEW)
```

---

## UI/UX Design

### Portfolio Dashboard Layout
```
┌─────────────────────────────────────────────────────┐
│ SmartGrow Portfolio                    [Export PDF] │
├─────────────────────────────────────────────────────┤
│ Total Invested: KES 850,000    Current Value: KES 912,450 │
│ Total Returns: +KES 62,450 (+7.3%)    [View Details] │
├─────────────────────────────────────────────────────┤
│ ┌─────────────┐  ┌─────────────────────────────┐   │
│ │ Allocation  │  │ Active Investments (4)      │   │
│ │ Pie Chart   │  │ ┌─────────────────────────┐ │   │
│ │             │  │ │ CIC Money Market        │ │   │
│ │             │  │ │ KES 200,000 → 225,000   │ │   │
│ │             │  │ │ +12.5% | Matures: 6mo   │ │   │
│ └─────────────┘  │ └─────────────────────────┘ │   │
│                  │ [More investments...]       │   │
│                  └─────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Investment Flow
1. Browse opportunities → Click "Invest Now"
2. Enter amount → Validate balance
3. Review investment details → Confirm
4. Enter admin PIN → Verify
5. Process investment → Show success
6. Send notifications → Update portfolio

---

## Business Rules

### Investment Constraints
- Minimum investment: As per opportunity (KES 5,000 - 50,000)
- Maximum: Cannot exceed chama balance
- Lock period: Varies by product (0-12 months)
- Early withdrawal: Not allowed (or with penalty)
- Voting threshold: Configurable (e.g., 60% approval required)

### Dividend Distribution
- Distribution frequency: Quarterly or as per product terms
- Allocation method: Proportional to member contributions
- Minimum distribution: KES 10 per member
- Reinvestment option: Available for all dividends

### Performance Tracking
- Update frequency: Daily (automated job)
- Data source: Partner APIs or manual admin updates
- Historical data: Retained for 5 years
- Reporting: Monthly statements generated

---

## Integration Requirements

### External APIs
1. **CIC Asset Management API** (if available)
   - Fetch real-time fund values
   - Get NAV (Net Asset Value) updates

2. **Central Bank of Kenya API**
   - Treasury bond rates
   - Government securities data

3. **NSE API** (Nairobi Securities Exchange)
   - REIT prices and performance
   - Market data

### Fallback Strategy
- Manual admin updates if APIs unavailable
- Scheduled email reports from partners
- CSV import functionality for bulk updates

---

## Testing Strategy

### Unit Tests
- Investment creation logic
- Dividend calculation algorithms
- Balance validation
- Date calculations (maturity, lock periods)

### Integration Tests
- End-to-end investment flow
- M-Pesa payment integration
- SMS notification delivery
- Database transaction integrity

### User Acceptance Testing
- Admin creates investment
- Member views portfolio
- Dividend distribution
- Investment withdrawal
- Report generation

---

## Rollout Plan

### Phase 1: Core Investment Tracking (Sprint 1-2)
- [ ] Database schema implementation
- [ ] Investment creation API
- [ ] Portfolio dashboard UI
- [ ] Basic investment tracking

### Phase 2: Performance & Analytics (Sprint 3)
- [ ] Investment detail pages
- [ ] Performance charts
- [ ] Historical data tracking
- [ ] Export functionality

### Phase 3: Dividends & Withdrawals (Sprint 4)
- [ ] Dividend distribution logic
- [ ] Withdrawal workflow
- [ ] Maturity notifications
- [ ] Final statements

### Phase 4: AI & Recommendations (Sprint 5)
- [ ] Recommendation engine
- [ ] Risk assessment
- [ ] Educational content
- [ ] Comparative analysis

---

## Success Metrics

### Adoption Metrics
- % of chamas using SmartGrow
- Average investment amount per chama
- Number of active investments
- Investment diversity (products per chama)

### Financial Metrics
- Total assets under management (AUM)
- Average portfolio return
- Dividend distribution volume
- Revenue from Pro subscriptions

### Engagement Metrics
- Portfolio views per week
- Investment creation rate
- Withdrawal completion rate
- User satisfaction score

### Target Goals (12 months)
- 200+ chamas with active investments
- KES 50M+ total AUM
- 15%+ average portfolio return
- 80%+ user satisfaction

---

## Risk Mitigation

### Financial Risks
- **Risk**: Investment losses
- **Mitigation**: Clear disclaimers, risk assessment, diversification guidance

### Technical Risks
- **Risk**: API failures from partners
- **Mitigation**: Manual update fallback, cached data, error handling

### Regulatory Risks
- **Risk**: Compliance with financial regulations
- **Mitigation**: Legal review, partner due diligence, proper licensing

### User Risks
- **Risk**: Unauthorized investments
- **Mitigation**: PIN verification, voting requirements, audit logs

---

## Dependencies

### Internal
- M-Pesa integration (for payments)
- SMS service (for notifications)
- Admin authentication system
- Member voting system (future)

### External
- Investment partner APIs
- Payment gateway
- PDF generation service
- Email service provider

### Team
- Backend developer (API & database)
- Frontend developer (UI components)
- Financial analyst (opportunity vetting)
- Legal advisor (compliance review)

---

## Future Considerations

### Advanced Features
- Automated rebalancing
- Tax-loss harvesting
- Robo-advisor integration
- Social investing (follow top chamas)
- Investment challenges/competitions

### Scaling
- Multi-currency support
- International investments
- Institutional partnerships
- White-label solution for banks

---

**Last Updated**: February 14, 2026  
**Spec Owner**: SmartChama Product Team  
**Status**: Ready for Development  
**Estimated Timeline**: 5 sprints (10 weeks)
