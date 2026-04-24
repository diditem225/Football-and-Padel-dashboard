-- Add CIN and Check-in Features
-- Run this in Supabase SQL Editor

-- Add CIN column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS cin VARCHAR(8) UNIQUE;

-- Add check-in tracking table
CREATE TABLE IF NOT EXISTS public.booking_checkins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  checked_in_by UUID REFERENCES public.user_profiles(id), -- Admin who checked them in
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_cin ON public.user_profiles(cin);
CREATE INDEX IF NOT EXISTS idx_booking_checkins_booking_id ON public.booking_checkins(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_checkins_checked_in_at ON public.booking_checkins(checked_in_at);

-- Add trigger for updated_at on checkins (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_booking_checkins_updated_at') THEN
    CREATE TRIGGER update_booking_checkins_updated_at 
      BEFORE UPDATE ON public.booking_checkins 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add constraint to ensure CIN is 8 digits
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cin_format') THEN
    ALTER TABLE public.user_profiles 
    ADD CONSTRAINT cin_format CHECK (cin ~ '^[0-9]{8}$');
  END IF;
END $$;

-- Add function to check if CIN is banned
CREATE OR REPLACE FUNCTION public.is_cin_restricted(cin_number TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE cin = cin_number 
    AND is_restricted = TRUE 
    AND (restriction_end_date IS NULL OR restriction_end_date > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to validate booking code
CREATE OR REPLACE FUNCTION public.validate_booking_code(confirmation_code TEXT)
RETURNS TABLE (
  booking_id UUID,
  user_name TEXT,
  facility_name TEXT,
  booking_date DATE,
  start_time TIME,
  end_time TIME,
  status TEXT,
  is_paid BOOLEAN,
  already_checked_in BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    CONCAT(up.first_name, ' ', up.last_name) as user_name,
    f.name as facility_name,
    b.booking_date,
    b.start_time,
    b.end_time,
    b.status::TEXT,
    b.is_paid,
    EXISTS(SELECT 1 FROM public.booking_checkins bc WHERE bc.booking_id = b.id) as already_checked_in
  FROM public.bookings b
  JOIN public.user_profiles up ON b.user_id = up.id
  JOIN public.facilities f ON b.facility_id = f.id
  WHERE b.confirmation_code = validate_booking_code.confirmation_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the handle_new_user function to include CIN
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, first_name, last_name, phone, cin, is_admin, is_restricted)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'cin', ''),
    COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, FALSE),
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;