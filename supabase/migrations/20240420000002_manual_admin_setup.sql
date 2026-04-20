-- Manual Admin Setup Script
-- Replace 'your-email@example.com' with your actual email address

-- Step 1: Confirm the user (if email confirmation is enabled)
-- Note: confirmed_at is a generated column and will be set automatically
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'temimi.iyed@gmail.com';

-- Step 2: Create user profile with admin privileges
-- This will work even if the trigger didn't fire
INSERT INTO public.user_profiles (id, first_name, last_name, phone, is_admin, is_restricted)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'first_name', 'Admin'), 
  COALESCE(raw_user_meta_data->>'last_name', 'User'),
  COALESCE(raw_user_meta_data->>'phone', '+21622010508'),
  true,  -- Set as admin
  false
FROM auth.users 
WHERE email = 'temimi.iyed@gmail.com'
ON CONFLICT (id) DO UPDATE
SET is_admin = true,
    updated_at = NOW();

-- Step 3: Verify the setup
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  up.first_name,
  up.last_name,
  up.is_admin,
  up.is_restricted
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
WHERE u.email = 'temimi.iyed@gmail.com';
