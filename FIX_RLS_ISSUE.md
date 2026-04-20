# Fix "Failed to load facilities" and "Failed to load bookings" Error

## Problem
The RLS (Row Level Security) policies are preventing authenticated users from accessing facilities and bookings data.

## Solution
Run this SQL in your Supabase SQL Editor:

```sql
-- Fix 1: Drop and recreate facilities policies
DROP POLICY IF EXISTS "Anyone can view active facilities" ON public.facilities;
DROP POLICY IF EXISTS "Admins can manage facilities" ON public.facilities;

-- Allow everyone (authenticated and anonymous) to view active facilities
CREATE POLICY "Everyone can view active facilities" ON public.facilities
  FOR SELECT USING (is_active = true);

-- Allow admins to manage facilities
CREATE POLICY "Admins can manage facilities" ON public.facilities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Fix 2: Verify bookings policies allow users to create bookings
-- This should already exist, but let's make sure
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;

CREATE POLICY "Users can create their own bookings" ON public.bookings
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Fix 3: Verify the user_profiles table has your user
-- Run this to check:
SELECT id, email, first_name, last_name, is_admin 
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
WHERE u.email = 'temimi.iyed@gmail.com';

-- If the user_profiles row is missing, create it:
INSERT INTO public.user_profiles (id, first_name, last_name, phone, is_admin, is_restricted)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'first_name', 'Admin'), 
  COALESCE(raw_user_meta_data->>'last_name', 'User'),
  COALESCE(raw_user_meta_data->>'phone', '+216'),
  true,
  false
FROM auth.users 
WHERE email = 'temimi.iyed@gmail.com'
ON CONFLICT (id) DO UPDATE
SET is_admin = true,
    updated_at = NOW();
```

## Quick Test
After running the SQL above, try these queries to verify:

```sql
-- Test 1: Can you see facilities?
SELECT * FROM public.facilities WHERE is_active = true;

-- Test 2: Can you see your profile?
SELECT * FROM public.user_profiles WHERE id = auth.uid();

-- Test 3: Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('facilities', 'bookings', 'user_profiles');
```

## Alternative: Temporarily Disable RLS (NOT RECOMMENDED FOR PRODUCTION)

If you want to test without RLS temporarily:

```sql
-- ONLY FOR TESTING - DO NOT USE IN PRODUCTION
ALTER TABLE public.facilities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
```

To re-enable:
```sql
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
```

## Steps to Fix

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/ogrgfjdrtdihvdxsrlss
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the SQL from "Solution" section above
5. Click "Run" or press Ctrl+Enter
6. Refresh your app at http://localhost:3000

## Expected Result

After running the fix:
- ✅ Facilities should load on the booking page
- ✅ Bookings should load on the dashboard
- ✅ You should be able to create new bookings
- ✅ Real-time updates should work

## If Still Not Working

Check the browser console (F12) for the exact error message and share it. The error will show which table/policy is causing the issue.

Common issues:
1. **User profile doesn't exist** - Run the INSERT query above
2. **Not authenticated** - Make sure you're logged in
3. **Wrong RLS policy** - The policy might be checking the wrong condition

## Verify Your Session

Open browser console and run:
```javascript
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
console.log('User ID:', session?.user?.id)
```

This will show if you're properly authenticated.
