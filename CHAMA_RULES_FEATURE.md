# Chama Rules Feature

## Overview
Added a chama rules section to the create chama form, allowing admins to define and store rules for their investment groups.

---

## Changes Made

### 1. Updated Create Chama Form
**File**: `src/app/admin/dashboard/chamas/page.tsx`

**New Features**:
- Dynamic list of rule inputs
- Add/remove rules functionality
- Rules stored as array in database
- Rules displayed in chama details modal

### 2. Database Schema Update
**File**: `add-chama-rules-column.sql`

**New Column**:
```sql
ALTER TABLE chamas 
ADD COLUMN IF NOT EXISTS rules TEXT[];
```

**Data Type**: `TEXT[]` (PostgreSQL array of text)

---

## How It Works

### Creating Rules

1. **Admin opens create chama modal**
2. **Fills in basic info** (name, investment goal, monthly growth)
3. **Adds rules** (optional):
   - Click "Add Rule" to add more rules
   - Each rule has a numbered input field
   - Click X to remove a rule
   - At least one empty rule field is always shown
4. **Submits form**
5. **Rules saved to database** as array

### Rule Examples
- "Monthly contribution: KES 5,000"
- "Meetings every first Saturday of the month"
- "Maximum loan: 3x total contributions"
- "Late payment penalty: KES 500"
- "Minimum membership period: 3 months"
- "Voting requires 60% approval"

### Viewing Rules

Rules are displayed in the chama details modal under "About This Chama" section:
- Numbered list format
- Each rule shown with amber badge number
- Only shown if rules exist

---

## UI Components

### Create Form - Rules Section
```
┌─────────────────────────────────────────────┐
│ Chama Rules (Optional)        [+ Add Rule]  │
├─────────────────────────────────────────────┤
│ 1. [Monthly contribution: KES 5,000    ] [X]│
│ 2. [Meetings every first Saturday     ] [X]│
│ 3. [Maximum loan: 3x contributions    ] [X]│
│                                             │
│ Define rules like contribution amounts,     │
│ meeting schedules, loan policies, etc.      │
└─────────────────────────────────────────────┘
```

### Chama Details - Rules Display
```
┌─────────────────────────────────────────────┐
│ 🛡️ Chama Rules                              │
├─────────────────────────────────────────────┤
│ ① Monthly contribution: KES 5,000           │
│ ② Meetings every first Saturday             │
│ ③ Maximum loan: 3x contributions            │
└─────────────────────────────────────────────┘
```

---

## Technical Implementation

### State Management
```typescript
const [chamaRules, setChamaRules] = useState<string[]>([""]);

// Add new rule
const addRule = () => {
  setChamaRules([...chamaRules, ""]);
};

// Remove rule
const removeRule = (index: number) => {
  if (chamaRules.length > 1) {
    const newRules = chamaRules.filter((_, i) => i !== index);
    setChamaRules(newRules);
  }
};

// Update rule
const updateRule = (index: number, value: string) => {
  const newRules = [...chamaRules];
  newRules[index] = value;
  setChamaRules(newRules);
};
```

### Database Insert
```typescript
// Filter out empty rules
const filteredRules = chamaRules.filter(rule => rule.trim() !== "");

const { data: chama, error } = await supabase
  .from('chamas')
  .insert({
    name: chamaName,
    investment_goal: parseFloat(investmentGoal) || 0,
    monthly_growth_pct: parseFloat(monthlyGrowth) || 0,
    rules: filteredRules.length > 0 ? filteredRules : null,
    created_by: user.id,
    total_balance: 0
  });
```

### Display Rules
```typescript
{selectedGroup.rules && selectedGroup.rules.length > 0 && (
  <div className="mt-6 pt-6 border-t border-slate-800">
    <h4 className="text-white font-bold mb-3">Chama Rules</h4>
    <ul className="space-y-2">
      {selectedGroup.rules.map((rule: string, index: number) => (
        <li key={index} className="flex items-start gap-3">
          <span className="badge">{index + 1}</span>
          <span>{rule}</span>
        </li>
      ))}
    </ul>
  </div>
)}
```

---

## Database Setup

### Step 1: Run SQL Migration

Go to Supabase Dashboard → SQL Editor → New Query:

```sql
ALTER TABLE chamas 
ADD COLUMN IF NOT EXISTS rules TEXT[];

COMMENT ON COLUMN chamas.rules IS 'Array of chama rules defined by the admin';
```

### Step 2: Verify Column Added

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chamas' AND column_name = 'rules';
```

Expected result:
```
column_name | data_type
------------|----------
rules       | ARRAY
```

---

## Testing Checklist

### Create Chama with Rules
- [ ] Open create chama modal
- [ ] Fill in chama name
- [ ] Add 3-5 rules
- [ ] Remove one rule
- [ ] Submit form
- [ ] Verify chama created successfully
- [ ] Check Supabase: rules column should contain array

### View Rules
- [ ] Click on created chama
- [ ] Enter PIN (any 4 digits)
- [ ] Verify rules appear in "About This Chama" section
- [ ] Verify rules are numbered correctly
- [ ] Verify formatting looks good

### Edge Cases
- [ ] Create chama with no rules (should work)
- [ ] Create chama with 1 rule
- [ ] Create chama with 10+ rules
- [ ] Try to remove last rule (should keep at least one empty field)
- [ ] Submit with empty rule fields (should filter them out)

---

## User Benefits

### For Admins
✅ **Clear Governance**: Define rules upfront  
✅ **Transparency**: All members see the same rules  
✅ **Flexibility**: Add as many rules as needed  
✅ **Easy Management**: Edit rules anytime (future feature)

### For Members
✅ **Know Expectations**: Clear rules from day one  
✅ **Fair Treatment**: Same rules for everyone  
✅ **Reference**: Can always check rules in chama details  
✅ **Trust**: Transparent governance builds trust

---

## Future Enhancements

### Phase 2
- [ ] Edit rules after chama creation
- [ ] Rule categories (Contributions, Loans, Meetings, etc.)
- [ ] Rule templates (common rules pre-filled)
- [ ] Rule enforcement (automatic penalties, reminders)
- [ ] Rule change history (audit trail)

### Phase 3
- [ ] Member voting on rule changes
- [ ] Rule violation tracking
- [ ] Automated rule reminders (SMS/email)
- [ ] Rule compliance dashboard
- [ ] Export rules as PDF

---

## Example Rule Sets

### Conservative Chama
1. Monthly contribution: KES 5,000 (mandatory)
2. Meetings: First Saturday of every month
3. Loan limit: 2x total contributions
4. Loan interest: 5% per annum
5. Late payment penalty: KES 500
6. Minimum membership: 6 months before loan eligibility

### Flexible Chama
1. Minimum monthly contribution: KES 2,000
2. Meetings: Quarterly (March, June, Sept, Dec)
3. Loan limit: 3x total contributions
4. Loan interest: 3% per annum
5. No penalties for late payment
6. Loan eligibility: After 3 months membership

### Investment-Focused Chama
1. Monthly contribution: KES 10,000
2. 70% of funds invested in approved opportunities
3. Meetings: Monthly via Zoom
4. Loans discouraged (emergency only)
5. Dividend distribution: Quarterly
6. Exit penalty: 10% of total contributions

---

## API Reference

### Create Chama with Rules
```typescript
POST /api/chamas/create

Body:
{
  "name": "Family Savings",
  "investment_goal": 1000000,
  "monthly_growth_pct": 5.5,
  "rules": [
    "Monthly contribution: KES 5,000",
    "Meetings every first Saturday",
    "Maximum loan: 3x contributions"
  ]
}
```

### Get Chama with Rules
```typescript
GET /api/chamas/:id

Response:
{
  "id": "uuid",
  "name": "Family Savings",
  "rules": [
    "Monthly contribution: KES 5,000",
    "Meetings every first Saturday",
    "Maximum loan: 3x contributions"
  ],
  ...
}
```

---

## Troubleshooting

### Issue: Rules not saving
**Check**:
1. Did you run the SQL migration?
2. Is the `rules` column in the chamas table?
3. Check browser console for errors
4. Check Supabase logs

### Issue: Rules not displaying
**Check**:
1. Are rules actually in the database?
2. Is the chama details modal loading the rules?
3. Check if `selectedGroup.rules` exists
4. Check browser console for errors

### Issue: Can't remove rules
**Check**:
1. Is there more than one rule?
2. The last rule can't be removed (by design)
3. Check if `removeRule` function is working

---

**Last Updated**: February 14, 2026  
**Status**: Implemented  
**Database Migration Required**: Yes (run `add-chama-rules-column.sql`)
