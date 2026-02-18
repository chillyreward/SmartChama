# Invite Token Fix - Complete Solution

## Problem
Error when generating invite links:
```
Failed to generate invite: 500 
"insert or update on table 'invite_tokens' violates foreign key constraint 'invite_tokens_created_by_fkey'"
```

When trying to drop the column:
```
ERROR: cannot drop column created_by because other objects depend on it
DETAIL: RLS policies depend on this column
```

## Solution

### Step 1: Run Updated SQL Migration

Go to Supabase Dashboard → SQL Editor and run this:

```sql
-- Step 1: Drop all RLS policies that depend on created_by column
DROP POLICY IF EXISTS "Users can view tokens for their chamas" ON invite_tokens;
DROP POLICY IF EXISTS "Users can create tokens for their chamas" ON invite_tokens;
DROP POLICY IF EXISTS "Users can update tokens for their chamas" ON invite_tokens;
DROP POLICY IF EXISTS "Users can delete tokens for their chamas" ON invite_tokens;

-- Step 2: Drop the foreign key constraint
ALTER TABLE invite_tokens 
DROP CONSTRAINT IF EXISTS invite_tokens_created_by_fkey;

-- Step 3: Drop the created_by column
ALTER TABLE invite_tokens 
DROP COLUMN IF EXISTS created_by;

-- Step 4: Create new RLS policies that don't depend on created_by
CREATE POLICY "Admins can view tokens for their chamas"
ON invite_tokens FOR SELECT
USING (
  chama_id IN (
    SELECT id FROM chamas 
    WHERE admin_id IN (
      SELECT id FROM chama_admins 
      WHERE email = auth.jwt()->>'email'
    )
  )
);

CREATE POLICY "Admins can create tokens for their chamas"
ON invite_tokens FOR INSERT
WITH CHECK (
  chama_id IN (
    SELECT id FROM chamas 
    WHERE admin_id IN (
      SELECT id FROM chama_admins 
      WHERE email = auth.jwt()->>'email'
    )
  )
);

CREATE POLICY "Admins can update tokens for their chamas"
ON invite_tokens FOR UPDATE
USING (
  chama_id IN (
    SELECT id FROM chamas 
    WHERE admin_id IN (
      SELECT id FROM chama_admins 
      WHERE email = auth.jwt()->>'email'
    )
  )
);

CREATE POLICY "Admins can delete tokens for their chamas"
ON invite_tokens FOR DELETE
USING (
  chama_id IN (
    SELECT id FROM chamas 
    WHERE admin_id IN (
      SELECT id FROM chama_admins 
      WHERE email = auth.jwt()->>'email'
    )
  )
);
```

Or simply run the file: `fix-invite-tokens-created-by.sql`

### Step 2: Verify Changes

After running the SQL:

1. Check that `created_by` column is gone:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'invite_tokens';
```

2. Check that new policies exist:
```sql
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'invite_tokens';
```

### Step 3: Test Invite Generation

1. Go to your admin dashboard (production or local)
2. Click "Invite Members" on a chama
3. Should generate invite link successfully
4. Copy and test the invite link

## What Changed

### Before:
- `created_by` column existed with foreign key to wrong table
- RLS policies depended on `created_by`
- API tried to insert `created_by` value
- Foreign key constraint failed

### After:
- ✅ `created_by` column removed
- ✅ Old RLS policies removed
- ✅ New RLS policies use `chama_id` instead
- ✅ API doesn't send `created_by`
- ✅ Invite generation works

## New RLS Policies

The new policies are more secure and use the proper relationship:

1. **View tokens**: Admins can only see tokens for chamas they own
2. **Create tokens**: Admins can only create tokens for their chamas
3. **Update tokens**: Admins can only update tokens for their chamas
4. **Delete tokens**: Admins can only delete tokens for their chamas

All policies check:
- User is authenticated
- User is a chama admin
- The chama belongs to that admin

## Files Modified

1. `src/app/api/invite/generate/route.ts` - Removed `userId` parameter and `created_by` insert
2. `src/app/admin/dashboard/page.tsx` - Removed `userId` from API call
3. `src/app/admin/dashboard/chamas/page.tsx` - Removed `userId` from API call
4. `fix-invite-tokens-created-by.sql` - Complete migration script

## Testing Checklist

- [ ] Run SQL migration in Supabase
- [ ] Verify `created_by` column is dropped
- [ ] Verify new RLS policies exist
- [ ] Test invite generation in admin dashboard
- [ ] Copy invite link
- [ ] Open invite link in incognito window
- [ ] Complete member signup
- [ ] Verify member is added to chama

## Status

✅ Code fixed and pushed to GitHub
✅ Vercel deployed
⏳ SQL migration needs to be run
⏳ Testing needed

## Quick Commands

**Check if column exists:**
```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'invite_tokens' 
  AND column_name = 'created_by'
);
```

**Check policies:**
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'invite_tokens';
```

**Test invite generation:**
```sql
-- This should work after migration
INSERT INTO invite_tokens (token, chama_id, max_uses, expires_at, is_active)
VALUES ('test123', 'your-chama-id', 10, NOW() + INTERVAL '30 days', true);
```

---

**Run the SQL migration and invite generation will work!** 🚀
