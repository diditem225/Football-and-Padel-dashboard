-- FiveStars Simple Database Reset
-- Run these commands one by one in Supabase SQL Editor
-- This is a safer approach that lets you verify each step

-- Step 1: Clear all booking-related data
DELETE FROM public.reviews;
DELETE FROM public.no_show_records; 
DELETE FROM public.waitlist_entries;
DELETE FROM public.email_logs;
DELETE FROM public.bookings;

-- Step 2: Delete non-admin user profiles (keep admin)
DELETE FROM public.user_profiles 
WHERE id NOT IN (
    SELECT id FROM auth.users WHERE email = 'temimi.iyed@gmail.com'
);

-- Step 3: Reset all facilities to active state
UPDATE public.facilities 
SET 
    is_active = TRUE,
    updated_at = NOW();

-- Step 4: Ensure correct facility setup (6 football fields, 2 padel courts)
-- This will show current facilities
SELECT 
    name,
    type,
    capacity,
    hourly_rate,
    is_active
FROM public.facilities 
ORDER BY type, name;

-- Step 5: Verify admin user exists and has correct permissions
SELECT 
    up.first_name,
    up.last_name,
    au.email,
    up.is_admin,
    up.is_restricted
FROM public.user_profiles up
JOIN auth.users au ON up.id = au.id
WHERE au.email = 'temimi.iyed@gmail.com';

-- Step 6: Show final summary
SELECT 
    'Reset Summary' as info,
    (SELECT COUNT(*) FROM public.facilities) as total_facilities,
    (SELECT COUNT(*) FROM public.user_profiles) as total_users,
    (SELECT COUNT(*) FROM public.bookings) as total_bookings,
    (SELECT COALESCE(SUM(hourly_rate), 0) FROM public.facilities) as total_hourly_rates;