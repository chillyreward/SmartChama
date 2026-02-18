# Invite Token Foreign Key Fix

## Issue
Error when generating invite links on Vercel:
```
Failed to generate invite: 500 
"insert or update on table 'invite_tokens' violates foreign key constraint 'invite_tokens_created_by_fkey'"
```

## Root Cause
The `invite_tokens` table has a `created_by` column with a foreign key constraint that references the wrong table or doesn't match the data being inserted.

## Fix Applied

### 1. Updated API Route
**File:** `src/app/api/invite/generate/route.ts`
- Removed `userId` parameter requirement
- Removed `created_by` from insert statement
- Simplified to only require `chamaId`

### 2. Updated Admin Dashboard
**File:** `src/app/admin/dashboard/page.tsx`
- Removed `userId: admin.id` from API call
- Simplified invite generation

### 3. Updated Chamas Page
**File:** `src/app/admin/dashboard/chamas/page.tsx`
- Removed `userId: admin.id` from API call
- Simplified invite generation

## Database Migration Required

Run this in Supabase SQL Editor:

```sql
-- Drop the created_by column to avoid foreign key issues
ALTER TABLE invite_tokens DROP COLUMN IF EXISTS created_by;
```

The `chama_id` already tracks which chama the invite is for, so `created_by` is redundant.

## Testing
1. Push changes to GitHub
2. Vercel will auto-deploy
3. Run SQL migration in Supabase
4. Test invite generation in admin dashboard

## Status
✅ Code fixed
⏳ Needs database migration
⏳ Needs deployment
