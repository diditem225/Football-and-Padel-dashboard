-- Update existing facility prices to TND (Tunisian Dinar)
-- Run this in Supabase SQL Editor to update existing facilities

-- Update Football Fields to 120 TND per hour
UPDATE public.facilities 
SET hourly_rate = 120.00 
WHERE type = 'football_field';

-- Update Padel Courts to 90 TND per hour  
UPDATE public.facilities 
SET hourly_rate = 90.00 
WHERE type = 'padel_court';

-- Verify the changes
SELECT 
    name,
    type,
    hourly_rate,
    is_active
FROM public.facilities 
ORDER BY type, name;