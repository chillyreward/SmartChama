# Invite System Analytics & Enhancement Spec

## Overview
Enhance the existing invite system with comprehensive analytics, tracking, and management features to help admins understand member acquisition, optimize invite strategies, and improve onboarding success rates.

## Status
🚧 **ENHANCEMENT** - Basic invite system exists, needs analytics and advanced features

## Business Context
- **Current State**: Admins can generate invite links, members can sign up
- **Gap**: No visibility into invite performance, conversion rates, or member sources
- **Solution**: Analytics dashboard with invite tracking and optimization tools
- **Impact**: Data-driven member acquisition and improved onboarding

---

## User Stories

### Analytics & Tracking

#### US-1: Invite Analytics Dashboard
**As a** chama admin  
**I want to** view analytics on my invite links  
**So that** I can understand which invites are most effective

**Acceptance Criteria:**
- [ ] Dashboard showing:
  - Total invites sent
  - Total signups from invites
  - Conversion rate (signups/invites)
  - Active vs expired invites
  - Most successful invite links
  - Signup trends over time (chart)
- [ ] Filter by: date range, chama, invite status
- [ ] Compare multiple invite campaigns
- [ ] Export analytics to PDF/CSV
- [ ] Real-time updates

**Priority**: HIGH  
**Effort**: 5 days

#### US-2: Individual Invite Link Tracking
**As a** chama admin  
**I want to** track performance of each invite link  
**So that** I can identify which channels work best

**Acceptance Criteria:**
- [ ] Invite detail page showing:
  - Link creation date and creator
  - Total clicks on link
  - Unique visitors
  - Signups completed
  - Conversion rate
  - Geographic data (if available)
  - Device types (mobile/desktop)
  - Time-to-signup (avg time from click to signup)
- [ ] Click timeline visualization
- [ ] List of members who joined via this link
- [ ] Option to regenerate or extend expiry
- [ ] Share link via SMS/WhatsApp/Email

**Priority**: HIGH  
**Effort**: 4 days

#### US-3: Member Source Attribution
**As a** chama admin  
**I want to** know how each member joined my chama  
**So that** I can understand my best acquisition channels

**Acceptance Criteria:**
- [ ] Member profile shows:
  - Source: invite link, direct signup, USSD, etc.
  - Invite link used (if applicable)
  - Referrer (admin who sent invite)
  - Signup date and time
  - Onboarding completion status
- [ ] Member list filterable by source
- [ ] Source breakdown chart (pie chart)
- [ ] Top referrers leaderboard
- [ ] Referral rewards tracking (future)

**Priority**: MEDIUM  
**Effort**: 3 days

---

### Invite Management Enhancements

#### US-4: Bulk Invite Generation
**As a** chama admin  
**I want to** generate multiple invite links at once  
**So that** I can run large-scale recruitment campaigns

**Acceptance Criteria:**
- [ ] Bulk invite form with:
  - Number of links to generate (1-100)
  - Chama selection
  - Custom expiry date
  - Custom usage limit per link
  - Campaign name/tag
- [ ] Generate unique links in batch
- [ ] Download all links as CSV
- [ ] Copy all links to clipboard
- [ ] Assign links to specific recruiters
- [ ] Track which recruiter used which link

**Priority**: MEDIUM  
**Effort**: 3 days

#### US-5: Custom Invite Messages
**As a** chama admin  
**I want to** customize the invite message  
**So that** I can personalize recruitment for different audiences

**Acceptance Criteria:**
- [ ] Invite message template editor
- [ ] Variables: {chama_name}, {admin_name}, {invite_link}
- [ ] Preview before sending
- [ ] Save templates for reuse
- [ ] Multiple templates per chama
- [ ] SMS character count indicator
- [ ] WhatsApp formatting support
- [ ] Default template provided

**Priority**: MEDIUM  
**Effort**: 3 days

#### US-6: Invite Link Expiry Management
**As a** chama admin  
**I want to** manage invite link expiry dates  
**So that** I can control when invites are valid

**Acceptance Criteria:**
- [ ] Set custom expiry date (not just 30 days)
- [ ] Extend expiry for active links
- [ ] Manually expire/deactivate links
- [ ] Bulk expiry management
- [ ] Notification 3 days before expiry
- [ ] Auto-renewal option for evergreen links
- [ ] Expired link redirect to contact page

**Priority**: LOW  
**Effort**: 2 days

#### US-7: Invite Usage Limits
**As a** chama admin  
**I want to** set custom usage limits per invite  
**So that** I can control how many members join via each link

**Acceptance Criteria:**
- [ ] Set custom usage limit (not just 30)
- [ ] Unlimited usage option
- [ ] Single-use links for exclusive invites
- [ ] Usage counter visible to admin
- [ ] Notification when limit reached
- [ ] Option to increase limit
- [ ] Link auto-deactivates at limit

**Priority**: LOW  
**Effort**: 2 days

---

### Advanced Features

#### US-8: Invite Campaigns
**As a** chama admin  
**I want to** organize invites into campaigns  
**So that** I can track different recruitment initiatives

**Acceptance Criteria:**
- [ ] Create named campaigns (e.g., "Church Recruitment", "Facebook Ads")
- [ ] Assign multiple invite links to a campaign
- [ ] Campaign dashboard showing:
  - Total invites in campaign
  - Total signups
  - Campaign ROI (if cost tracked)
  - Performance vs other campaigns
- [ ] Campaign start/end dates
- [ ] Campaign notes and goals
- [ ] Archive completed campaigns

**Priority**: LOW  
**Effort**: 4 days

#### US-9: A/B Testing for Invites
**As a** chama admin  
**I want to** test different invite messages  
**So that** I can optimize my recruitment strategy

**Acceptance Criteria:**
- [ ] Create A/B test with 2 variants
- [ ] Different messages for each variant
- [ ] Automatic traffic split (50/50)
- [ ] Track conversion rate per variant
- [ ] Statistical significance indicator
- [ ] Declare winner and use best variant
- [ ] Test history and results

**Priority**: LOW  
**Effort**: 5 days

#### US-10: Referral Rewards Program
**As a** chama admin  
**I want to** reward members who refer new members  
**So that** I can incentivize organic growth

**Acceptance Criteria:**
- [ ] Enable referral rewards in chama settings
- [ ] Set reward amount (e.g., KES 100 per referral)
- [ ] Track referrals per member
- [ ] Automatic reward distribution
- [ ] Reward conditions: new member must make first deposit
- [ ] Leaderboard of top referrers
- [ ] Referral bonus history
- [ ] Monthly referral contests

**Priority**: LOW  
**Effort**: 6 days

#### US-11: Invite Link QR Codes
**As a** chama admin  
**I want to** generate QR codes for invite links  
**So that** I can share invites at physical events

**Acceptance Criteria:**
- [ ] Generate QR code for each invite link
- [ ] Download QR code as PNG/SVG
- [ ] Customizable QR code (colors, logo)
- [ ] Print-friendly format
- [ ] QR code on invite posters (template)
- [ ] Track scans vs manual link clicks
- [ ] Bulk QR code generation

**Priority**: LOW  
**Effort**: 2 days

#### US-12: Invite Reminders & Follow-ups
**As a** chama admin  
**I want to** send reminders to people who clicked but didn't sign up  
**So that** I can improve conversion rates

**Acceptance Criteria:**
- [ ] Track invite link clicks without signup
- [ ] Automatic reminder SMS after 24 hours
- [ ] Customizable reminder message
- [ ] Reminder frequency settings (1-3 reminders)
- [ ] Stop reminders after signup
- [ ] Unsubscribe option in reminders
- [ ] Reminder effectiveness analytics

**Priority**: MEDIUM  
**Effort**: 4 days

---

## Technical Architecture

### Enhanced Database Schema

#### invite_tokens (existing - enhance)
```sql
ALTER TABLE invite_tokens ADD COLUMN IF NOT EXISTS
  campaign_id UUID REFERENCES invite_campaigns(id),
  click_count INT DEFAULT 0,
  unique_visitors INT DEFAULT 0,
  custom_message TEXT,
  created_by_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  deactivated_at TIMESTAMP,
  deactivated_reason TEXT,
  qr_code_url TEXT;

CREATE INDEX idx_invite_tokens_campaign ON invite_tokens(campaign_id);
CREATE INDEX idx_invite_tokens_chama ON invite_tokens(chama_id);
```

#### invite_campaigns (new)
```sql
CREATE TABLE invite_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chama_id UUID REFERENCES chamas(id) NOT NULL,
  admin_id UUID REFERENCES chama_admins(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  target_signups INT,
  budget DECIMAL(15,2),
  status VARCHAR(20) DEFAULT 'active', -- active, paused, completed, archived
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### invite_clicks (new)
```sql
CREATE TABLE invite_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invite_token_id UUID REFERENCES invite_tokens(id) NOT NULL,
  clicked_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_type VARCHAR(50), -- mobile, desktop, tablet
  referrer_url TEXT,
  country VARCHAR(100),
  city VARCHAR(100),
  converted BOOLEAN DEFAULT false, -- did they sign up?
  member_id UUID REFERENCES members(id), -- if they signed up
  time_to_conversion INT -- seconds from click to signup
);

CREATE INDEX idx_invite_clicks_token ON invite_clicks(invite_token_id);
CREATE INDEX idx_invite_clicks_date ON invite_clicks(clicked_at);
```

#### invite_signups (new)
```sql
CREATE TABLE invite_signups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invite_token_id UUID REFERENCES invite_tokens(id) NOT NULL,
  member_id UUID REFERENCES members(id) NOT NULL,
  signup_date TIMESTAMP DEFAULT NOW(),
  first_deposit_date TIMESTAMP,
  onboarding_completed BOOLEAN DEFAULT false,
  referral_reward_paid BOOLEAN DEFAULT false,
  referral_reward_amount DECIMAL(15,2)
);
```

#### referral_rewards (new)
```sql
CREATE TABLE referral_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chama_id UUID REFERENCES chamas(id) NOT NULL,
  referrer_member_id UUID REFERENCES members(id) NOT NULL,
  referred_member_id UUID REFERENCES members(id) NOT NULL,
  reward_amount DECIMAL(15,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, paid, cancelled
  paid_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### ab_tests (new)
```sql
CREATE TABLE ab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chama_id UUID REFERENCES chamas(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  variant_a_message TEXT NOT NULL,
  variant_b_message TEXT NOT NULL,
  variant_a_clicks INT DEFAULT 0,
  variant_b_clicks INT DEFAULT 0,
  variant_a_signups INT DEFAULT 0,
  variant_b_signups INT DEFAULT 0,
  winner VARCHAR(10), -- a, b, or null
  status VARCHAR(20) DEFAULT 'active', -- active, completed
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

### API Endpoints

```typescript
// Analytics APIs
GET    /api/invites/analytics                // Get invite analytics dashboard
GET    /api/invites/:id/analytics            // Get individual invite analytics
GET    /api/invites/analytics/export         // Export analytics data
GET    /api/members/sources                  // Get member source breakdown

// Invite Management APIs
POST   /api/invites/bulk-generate            // Generate multiple invites
PUT    /api/invites/:id/extend               // Extend invite expiry
PUT    /api/invites/:id/deactivate           // Deactivate invite
POST   /api/invites/:id/qr-code              // Generate QR code
GET    /api/invites/templates                // Get message templates
POST   /api/invites/templates                // Save message template

// Campaign APIs
POST   /api/campaigns/create                 // Create campaign
GET    /api/campaigns                        // List campaigns
GET    /api/campaigns/:id                    // Get campaign details
PUT    /api/campaigns/:id                    // Update campaign
GET    /api/campaigns/:id/analytics          // Campaign analytics

// Tracking APIs
POST   /api/invites/:token/track-click       // Track invite click (public)
GET    /api/invites/:token/validate          // Validate invite token (public)

// Referral APIs
GET    /api/referrals/leaderboard            // Get top referrers
GET    /api/referrals/my-referrals           // Get member's referrals
POST   /api/referrals/pay-reward             // Pay referral reward

// A/B Testing APIs
POST   /api/ab-tests/create                  // Create A/B test
GET    /api/ab-tests/:id                     // Get test results
POST   /api/ab-tests/:id/declare-winner      // Declare winner
```

### Component Structure

```
src/app/admin/dashboard/
├── invites/
│   ├── page.tsx                    // Invite management (enhance existing)
│   ├── analytics/
│   │   └── page.tsx               // Analytics dashboard (NEW)
│   ├── [id]/
│   │   ├── page.tsx               // Invite details (NEW)
│   │   └── analytics/
│   │       └── page.tsx           // Individual invite analytics (NEW)
│   ├── campaigns/
│   │   ├── page.tsx               // Campaign list (NEW)
│   │   ├── create/
│   │   │   └── page.tsx           // Create campaign (NEW)
│   │   └── [id]/
│   │       └── page.tsx           // Campaign details (NEW)
│   ├── referrals/
│   │   └── page.tsx               // Referral program (NEW)
│   └── components/
│       ├── InviteAnalyticsCard.tsx    // Analytics card (NEW)
│       ├── InviteChart.tsx            // Charts (NEW)
│       ├── BulkInviteModal.tsx        // Bulk generation (NEW)
│       ├── QRCodeGenerator.tsx        // QR code UI (NEW)
│       └── CampaignCard.tsx           // Campaign display (NEW)
│
└── members/
    └── page.tsx                    // Add source column (enhance)
```

---

## Analytics Visualizations

### Dashboard Charts

1. **Signup Trend Line Chart**
   - X-axis: Date
   - Y-axis: Number of signups
   - Compare multiple campaigns

2. **Conversion Funnel**
   - Invites sent → Clicks → Signups → First deposit
   - Show drop-off at each stage

3. **Source Breakdown Pie Chart**
   - Invite links, Direct signup, USSD, etc.
   - Percentage and count

4. **Top Performing Invites Table**
   - Rank by conversion rate
   - Show clicks, signups, conversion %

5. **Geographic Heatmap** (future)
   - Show where signups are coming from
   - Requires IP geolocation

---

## Business Rules

### Invite Tracking
- Track click only if unique IP within 24 hours
- Conversion attributed to first click (not last)
- Anonymous tracking (GDPR compliant)
- Data retention: 2 years

### Campaign Management
- Maximum 10 active campaigns per chama
- Campaign must have at least 1 invite link
- Cannot delete campaign with active invites
- Archived campaigns read-only

### Referral Rewards
- Reward paid only after referred member makes first deposit
- Minimum deposit: KES 500 to qualify
- Maximum reward: KES 500 per referral
- Rewards paid monthly (batch processing)
- Referrer must be active member

### A/B Testing
- Minimum 50 clicks per variant for significance
- Test runs for minimum 7 days
- Cannot edit variants after test starts
- Winner declared manually by admin

---

## UI/UX Design

### Analytics Dashboard
```
┌─────────────────────────────────────────────────────┐
│ Invite Analytics                    [Export] [Date▼]│
├─────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│ │ Invites  │ │ Clicks   │ │ Signups  │ │ Conv Rate││
│ │   24     │ │   156    │ │   18     │ │  11.5%   ││
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘│
│                                                     │
│ ┌─────────────────────────────────────────────────┐│
│ │ Signup Trend (Last 30 Days)                     ││
│ │      ╱╲                                          ││
│ │     ╱  ╲    ╱╲                                   ││
│ │    ╱    ╲  ╱  ╲                                  ││
│ │ ──╱──────╲╱────╲─────────────────────────────── ││
│ └─────────────────────────────────────────────────┘│
│                                                     │
│ Top Performing Invites:                             │
│ 1. Church Campaign - 45% conversion (9/20)          │
│ 2. Facebook Ads - 22% conversion (11/50)            │
│ 3. WhatsApp Group - 15% conversion (6/40)           │
│                                                     │
│ Member Sources:                                     │
│ ┌─────────────┐  Invite Links: 75%                 │
│ │   ███       │  Direct Signup: 15%                 │
│ │   ███  ██   │  USSD: 10%                          │
│ └─────────────┘                                     │
└─────────────────────────────────────────────────────┘
```

### Invite Detail Page
```
┌─────────────────────────────────────────────────────┐
│ Invite Link: smartchama.co.ke/join/ABC123          │
│ Created: Feb 1, 2026 | Expires: Mar 3, 2026        │
├─────────────────────────────────────────────────────┤
│ Performance:                                        │
│ Clicks: 45 (32 unique) | Signups: 8 | Conv: 17.8%  │
│                                                     │
│ ┌─────────────────────────────────────────────────┐│
│ │ Click Timeline                                  ││
│ │ Feb 1 ████                                       ││
│ │ Feb 5 ████████                                   ││
│ │ Feb 10 ██████                                    ││
│ │ Feb 14 ███                                       ││
│ └─────────────────────────────────────────────────┘│
│                                                     │
│ Members Joined via this Link:                       │
│ • John Doe (Feb 2, 2026)                            │
│ • Jane Smith (Feb 5, 2026)                          │
│ • ... 6 more                                        │
│                                                     │
│ [Copy Link] [Generate QR] [Extend Expiry] [Share]  │
└─────────────────────────────────────────────────────┘
```

---

## Testing Strategy

### Unit Tests
- Click tracking logic
- Conversion attribution
- Referral reward calculation
- Campaign analytics aggregation

### Integration Tests
- End-to-end invite flow with tracking
- Click → Signup → Reward flow
- Campaign creation and management
- Analytics data accuracy

### Performance Tests
- High-volume click tracking
- Analytics query performance
- Bulk invite generation
- Export large datasets

---

## Rollout Plan

### Phase 1: Core Analytics (Sprint 1)
- [ ] Click tracking implementation
- [ ] Basic analytics dashboard
- [ ] Individual invite analytics
- [ ] Member source attribution

### Phase 2: Management Enhancements (Sprint 2)
- [ ] Bulk invite generation
- [ ] Custom messages and templates
- [ ] Expiry and usage management
- [ ] QR code generation

### Phase 3: Campaigns (Sprint 3)
- [ ] Campaign creation and management
- [ ] Campaign analytics
- [ ] Campaign comparison
- [ ] Archive functionality

### Phase 4: Advanced Features (Sprint 4)
- [ ] Referral rewards program
- [ ] A/B testing
- [ ] Invite reminders
- [ ] Advanced reporting

---

## Success Metrics

### Adoption Metrics
- % of admins using analytics
- Average invites per admin
- Campaign creation rate
- QR code generation rate

### Performance Metrics
- Average invite conversion rate (target: >15%)
- Click-to-signup time (target: <24 hours)
- Referral program participation (target: 30% of members)
- A/B test usage rate

### Business Impact
- Member acquisition cost (with campaigns)
- Organic growth rate (referrals)
- Invite link effectiveness improvement
- Admin satisfaction with invite tools

---

## Privacy & Compliance

### Data Collection
- Minimal PII collection (IP, user agent)
- Anonymous tracking where possible
- Clear privacy policy disclosure
- GDPR compliance (data deletion requests)

### Data Retention
- Click data: 2 years
- Analytics aggregates: Indefinite
- Personal data: Deleted on member deletion
- Export data: 30 days

---

**Last Updated**: February 14, 2026  
**Spec Owner**: SmartChama Product Team  
**Status**: Ready for Development  
**Estimated Timeline**: 4 sprints (8 weeks)
