-- Fix RLS Policies for Better Access Control
-- This fixes issues with facilities and bookings access

-- Drop existing facilities policies
DROP POLICY IF EXISTS "Anyone can view active facilities" ON public.facilities;
DROP POLICY IF EXISTS "Admins can manage facilities" ON public.facilities;

-- Create new facilities policies that work for both authenticated and anonymous users
CREATE POLICY "Public can view active facilities" ON public.facilities
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can view all facilities" ON public.facilities
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage facilities" ON public.facilities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Verify bookings policies are correct
-- The issue might be that bookings are trying to access facilities through joins
-- Let's make sure the facilities are accessible when querying bookings

-- Test query to verify:
-- SELECT * FROM public.facilities WHERE is_active = true;
