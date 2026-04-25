-- Seed Test Admin User Migration
-- This migration creates a test admin user for development and testing
-- IMPORTANT: This should NOT be run in production or should be modified with secure credentials

-- NOTE: This migration assumes you have already created a user account via Supabase Auth
-- You need to:
-- 1. Sign up a user through the application or Supabase dashboard
-- 2. Replace 'admin@example.com' below with the actual email you used
-- 3. Run this migration to grant admin privileges

-- Configuration: Replace this email with your test admin email
DO $
DECLARE
  admin_email TEXT := 'admin@example.com';
  admin_user_id UUID;
BEGIN
  -- Find the user by email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;

  -- Check if user exists
  IF admin_user_id IS NULL THEN
    RAISE NOTICE 'User with email % not found. Please create the user first via Supabase Auth.', admin_email;
  ELSE
    -- Confirm the user's email (if not already confirmed)
    UPDATE auth.users 
    SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE id = admin_user_id;

    -- Create or update user profile with admin privileges
    INSERT INTO public.user_profiles (id, first_name, last_name, phone, is_admin, is_restricted)
    VALUES (
      admin_user_id,
      'Test',
      'Admin',
      '+216XXXXXXXX',
      true,  -- Grant admin privileges
      false
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      is_admin = true,
      is_restricted = false,
      updated_at = NOW();

    RAISE NOTICE 'Admin privileges granted to user: %', admin_email;
  END IF;
END $;

-- Verify the admin user setup
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  up.first_name,
  up.last_name,
  up.phone,
  up.is_admin,
  up.is_restricted,
  up.created_at
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
WHERE up.is_admin = true;
