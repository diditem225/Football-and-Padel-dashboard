-- FiveStars Database Reset Script
-- This script resets the database to a clean state while preserving:
-- 1. Database schema and functions
-- 2. Admin user (temimi.iyed@gmail.com)
-- 3. Facility definitions (but resets their availability)

-- WARNING: This will delete ALL user data except the admin user!
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

BEGIN;

-- 1. Delete all bookings and related data
DELETE FROM public.reviews;
DELETE FROM public.no_show_records;
DELETE FROM public.waitlist_entries;
DELETE FROM public.email_logs;
DELETE FROM public.bookings;

-- 2. Delete all non-admin users
-- First, get the admin user ID
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Find admin user by email
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'temimi.iyed@gmail.com';
    
    IF admin_user_id IS NOT NULL THEN
        -- Delete all user profiles except admin
        DELETE FROM public.user_profiles 
        WHERE id != admin_user_id;
        
        -- Delete all auth users except admin
        -- Note: This might require superuser privileges in production
        DELETE FROM auth.users 
        WHERE id != admin_user_id;
        
        RAISE NOTICE 'Preserved admin user: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Admin user not found! Please ensure temimi.iyed@gmail.com is registered.';
    END IF;
END $$;

-- 3. Reset facilities to default state (all active)
UPDATE public.facilities 
SET 
    is_active = TRUE,
    updated_at = NOW();

-- 4. Reset facility data to original values
UPDATE public.facilities SET
    name = CASE 
        WHEN type = 'football_field' THEN 'Football Field ' || ROW_NUMBER() OVER (PARTITION BY type ORDER BY created_at)
        WHEN type = 'padel_court' THEN 'Padel Court ' || ROW_NUMBER() OVER (PARTITION BY type ORDER BY created_at)
    END,
    hourly_rate = CASE 
        WHEN type = 'football_field' THEN 120.00
        WHEN type = 'padel_court' THEN 90.00
    END,
    capacity = CASE 
        WHEN type = 'football_field' THEN 14
        WHEN type = 'padel_court' THEN 4
    END;

-- 5. Ensure we have the correct number of facilities
-- Delete extra facilities if any
WITH facility_counts AS (
    SELECT 
        type,
        id,
        ROW_NUMBER() OVER (PARTITION BY type ORDER BY created_at) as rn
    FROM public.facilities
)
DELETE FROM public.facilities 
WHERE id IN (
    SELECT id FROM facility_counts 
    WHERE (type = 'football_field' AND rn > 6) 
       OR (type = 'padel_court' AND rn > 2)
);

-- Insert missing facilities if needed
INSERT INTO public.facilities (name, type, capacity, hourly_rate, is_active)
SELECT 
    'Football Field ' || generate_series,
    'football_field'::facility_type,
    14,
    120.00,
    TRUE
FROM generate_series(
    (SELECT COALESCE(MAX(CAST(SUBSTRING(name FROM '\d+') AS INTEGER)), 0) + 1 
     FROM public.facilities 
     WHERE type = 'football_field'),
    6
)
WHERE generate_series <= 6
  AND (SELECT COUNT(*) FROM public.facilities WHERE type = 'football_field') < 6;

INSERT INTO public.facilities (name, type, capacity, hourly_rate, is_active)
SELECT 
    'Padel Court ' || generate_series,
    'padel_court'::facility_type,
    4,
    90.00,
    TRUE
FROM generate_series(
    (SELECT COALESCE(MAX(CAST(SUBSTRING(name FROM '\d+') AS INTEGER)), 0) + 1 
     FROM public.facilities 
     WHERE type = 'padel_court'),
    2
)
WHERE generate_series <= 2
  AND (SELECT COUNT(*) FROM public.facilities WHERE type = 'padel_court') < 2;

-- 6. Ensure admin user has correct permissions
UPDATE public.user_profiles 
SET 
    is_admin = TRUE,
    is_restricted = FALSE,
    restriction_end_date = NULL,
    updated_at = NOW()
WHERE id = (
    SELECT id FROM auth.users WHERE email = 'temimi.iyed@gmail.com'
);

-- 7. Reset any sequences or counters if needed
-- (Add any sequence resets here if you have custom sequences)

COMMIT;

-- Display summary
SELECT 
    'Database Reset Complete!' as status,
    (SELECT COUNT(*) FROM public.facilities) as total_facilities,
    (SELECT COUNT(*) FROM public.facilities WHERE type = 'football_field') as football_fields,
    (SELECT COUNT(*) FROM public.facilities WHERE type = 'padel_court') as padel_courts,
    (SELECT COUNT(*) FROM public.user_profiles) as total_users,
    (SELECT COUNT(*) FROM public.user_profiles WHERE is_admin = TRUE) as admin_users,
    (SELECT COUNT(*) FROM public.bookings) as total_bookings,
    (SELECT SUM(hourly_rate) FROM public.facilities) as total_potential_revenue;

-- Show facilities
SELECT 
    name,
    type,
    capacity,
    hourly_rate,
    is_active,
    created_at
FROM public.facilities 
ORDER BY type, name;

-- Show remaining users
SELECT 
    up.first_name,
    up.last_name,
    au.email,
    up.is_admin,
    up.is_restricted,
    up.created_at
FROM public.user_profiles up
JOIN auth.users au ON up.id = au.id
ORDER BY up.created_at;