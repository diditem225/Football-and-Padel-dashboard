-- Seed Facilities Migration
-- This migration seeds the database with 6 football fields and 2 padel courts
-- It is idempotent - can be run multiple times safely

-- Delete existing facilities if they exist (for clean re-seeding)
-- This is safe because of CASCADE constraints
DELETE FROM public.facilities WHERE name IN (
  'Football Field 1', 'Football Field 2', 'Football Field 3', 
  'Football Field 4', 'Football Field 5', 'Football Field 6',
  'Padel Court 1', 'Padel Court 2'
);

-- Insert 6 Football Fields
-- Football fields require 14 players minimum (capacity = 14)
-- Hourly rate set to 50.00 TND (Tunisian Dinar)
INSERT INTO public.facilities (name, type, capacity, hourly_rate, is_active) VALUES
('Football Field 1', 'football_field', 14, 50.00, true),
('Football Field 2', 'football_field', 14, 50.00, true),
('Football Field 3', 'football_field', 14, 50.00, true),
('Football Field 4', 'football_field', 14, 50.00, true),
('Football Field 5', 'football_field', 14, 50.00, true),
('Football Field 6', 'football_field', 14, 50.00, true);

-- Insert 2 Padel Courts
-- Padel courts have capacity of 4 players (2v2 standard)
-- Hourly rate set to 40.00 TND (Tunisian Dinar)
INSERT INTO public.facilities (name, type, capacity, hourly_rate, is_active) VALUES
('Padel Court 1', 'padel_court', 4, 40.00, true),
('Padel Court 2', 'padel_court', 4, 40.00, true);

-- Verify the seed data
SELECT 
  id,
  name,
  type,
  capacity,
  hourly_rate,
  is_active,
  created_at
FROM public.facilities
ORDER BY type, name;
