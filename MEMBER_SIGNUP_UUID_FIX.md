# Member Signup UUID Error Fix

## Problem
Members getting error when signing up via invite link:
```
Failed to create member profile: invalid input syntax for type uuid: ""
```

## Root Cause
The `chama_id` field was being set as an empty string (`""`) instead of a valid UUID when the invite token's chama relationship wasn't properly loaded.

## Solution Applied

### 1. Enhanced Token Validation (Line 67-73)
Added strict validation to ensure chama data exists before proceeding:

```typescript
// Validate that we have chama data
if (!tokenData.chamas || !tokenData.chamas.id) {
  setError("Invalid invite code - chama not found.");
  setTokenValid(false);
  return;
}

setChamaName(tokenData.chamas.name);
setChamaId(tokenData.chamas.id);
setTokenValid(true);
```

### 2. Pre-Signup Validation (Line 90-94)
Added check before signup process starts:

```typescript
if (!chamaId) {
  setError("Invalid invite code - missing chama information. Please request a new invite link.");
  return;
}
```

### 3. Fallback to Token Data (Line 177-184)
Use `chama_id` directly from token data as fallback:

```typescript
// Use chama_id from token data to ensure we have the correct UUID
const memberChamaId = tokenData.chama_id || chamaId;

if (!memberChamaId) {
  throw new Error("Invalid invite code - missing chama information.");
}
```

## Files Modified
- `src/app/member/signup/page.tsx` - Added UUID validation and fallback logic

## Files Created
- `debug-invite-tokens.sql` - SQL script to debug invite token issues
- `MEMBER_SIGNUP_UUID_FIX.md` - This documentation

## Testing Steps

### 1. Verify Existing Invite Tokens
Run in Supabase SQL Editor:
```sql
SELECT 
    it.token,
    it.chama_id,
    c.name as chama_name,
    it.is_active
FROM invite_tokens it
LEFT JOIN chamas c ON it.chama_id = c.id
WHERE it.is_active = true;
```

### 2. Generate New Invite Token
From admin dashboard:
1. Go to Chamas page
2. Click on a chama
3. Click "Generate Invite Link"
4. Copy the invite link

### 3. Test Member Signup
1. Open invite link on phone (or incognito browser)
2. Fill in all fields:
   - Full Name
   - ID Number
   - Email
   - Phone Number (+254...)
   - Password (8+ characters)
3. Check "I agree to Privacy Policy & Terms"
4. Click "Join Chama"
5. Should see success message and redirect to login

### 4. Verify Member Created
Run in Supabase SQL Editor:
```sql
SELECT 
    m.full_name,
    m.phone_number,
    m.chama_id,
    c.name as chama_name,
    m.created_at
FROM members m
LEFT JOIN chamas c ON m.chama_id = c.id
ORDER BY m.created_at DESC
LIMIT 5;
```

## Common Issues & Solutions

### Issue 1: "Invalid invite code - chama not found"
**Cause:** Invite token query not including chama relationship
**Solution:** Token validation query includes `.select("*, chamas(id, name)")`

### Issue 2: Empty chama_id still being inserted
**Cause:** State not properly set before signup
**Solution:** Added validation check before signup process starts

### Issue 3: Token has chama_id but chama doesn't exist
**Cause:** Chama was deleted but tokens still reference it
**Solution:** Run this SQL to clean up:
```sql
-- Deactivate tokens for deleted chamas
UPDATE invite_tokens
SET is_active = false
WHERE chama_id NOT IN (SELECT id FROM chamas);
```

## Prevention

### For Admins
1. Always generate invite links from the dashboard (not manually)
2. Don't delete chamas that have active invite tokens
3. Check token status before sharing with members

### For Developers
1. Always validate UUID fields before database inserts
2. Use TypeScript strict mode to catch empty string assignments
3. Add logging to track chama_id values through the signup flow
4. Consider adding database constraint to prevent NULL chama_id

## Database Schema Check

Run `debug-invite-tokens.sql` to verify:
1. `chama_id` column is type UUID
2. `chama_id` has foreign key to chamas table
3. No tokens exist with NULL or empty chama_id

## Next Steps

If issue persists:
1. Check browser console for detailed error logs
2. Verify invite token in database has valid chama_id
3. Test with newly generated invite link
4. Check Supabase logs for RLS policy issues

## Success Criteria
✅ Member can sign up via invite link without UUID error
✅ Member record created with valid chama_id
✅ Member appears in chama's member list
✅ Member can login and see their chama in "My Groups"

---

**Fix Applied:** February 18, 2026
**Status:** Ready for Testing
