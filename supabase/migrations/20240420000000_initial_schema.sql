-- Sports Complex Booking System - Initial Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE facility_type AS ENUM ('football_field', 'padel_court');
CREATE TYPE booking_status AS ENUM ('confirmed', 'completed', 'cancelled', 'pending_payment');
CREATE TYPE waitlist_status AS ENUM ('active', 'claim_pending', 'claimed', 'expired', 'cancelled');
CREATE TYPE email_status AS ENUM ('pending', 'sent', 'failed', 'delivered', 'bounced');

-- Create user profiles table (extends auth.users)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_restricted BOOLEAN DEFAULT FALSE,
  restriction_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create facilities table
CREATE TABLE public.facilities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type facility_type NOT NULL,
  capacity INTEGER NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  confirmation_code TEXT NOT NULL UNIQUE,
  status booking_status DEFAULT 'confirmed',
  is_paid BOOLEAN DEFAULT FALSE,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_group_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_time_slot CHECK (end_time > start_time),
  CONSTRAINT hourly_boundaries CHECK (
    EXTRACT(MINUTE FROM start_time) = 0 AND 
    EXTRACT(MINUTE FROM end_time) = 0
  )
);

-- Create waitlist entries table
CREATE TABLE public.waitlist_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE NOT NULL,
  desired_date DATE NOT NULL,
  desired_start_time TIME NOT NULL,
  desired_end_time TIME NOT NULL,
  backup_booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  position INTEGER NOT NULL,
  claim_token TEXT UNIQUE,
  claim_expires_at TIMESTAMPTZ,
  status waitlist_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create no-show records table
CREATE TABLE public.no_show_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  booking_date DATE NOT NULL,
  booking_start_time TIME NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email log table
CREATE TABLE public.email_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  template_data JSONB,
  status email_status DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_profiles_email ON public.user_profiles(id);
CREATE INDEX idx_user_profiles_is_restricted ON public.user_profiles(is_restricted);

CREATE INDEX idx_booking_user_id ON public.bookings(user_id);
CREATE INDEX idx_booking_facility_id ON public.bookings(facility_id);
CREATE INDEX idx_booking_date_time ON public.bookings(booking_date, start_time);
CREATE INDEX idx_booking_status ON public.bookings(status);
CREATE INDEX idx_booking_confirmation_code ON public.bookings(confirmation_code);
CREATE INDEX idx_booking_recurring_group ON public.bookings(recurring_group_id);

CREATE INDEX idx_waitlist_user_id ON public.waitlist_entries(user_id);
CREATE INDEX idx_waitlist_facility_id ON public.waitlist_entries(facility_id);
CREATE INDEX idx_waitlist_position ON public.waitlist_entries(position);
CREATE INDEX idx_waitlist_claim_token ON public.waitlist_entries(claim_token);
CREATE INDEX idx_waitlist_status ON public.waitlist_entries(status);

CREATE INDEX idx_review_facility_id ON public.reviews(facility_id);
CREATE INDEX idx_review_user_id ON public.reviews(user_id);
CREATE INDEX idx_review_rating ON public.reviews(rating);

CREATE INDEX idx_noshow_user_id ON public.no_show_records(user_id);
CREATE INDEX idx_noshow_booking_date ON public.no_show_records(booking_date);
CREATE INDEX idx_noshow_recorded_at ON public.no_show_records(recorded_at);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_facilities_updated_at BEFORE UPDATE ON public.facilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_waitlist_entries_updated_at BEFORE UPDATE ON public.waitlist_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create helper function to get booking datetime
CREATE OR REPLACE FUNCTION public.get_booking_datetime(booking_date DATE, start_time TIME)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN (booking_date + start_time)::TIMESTAMPTZ;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, first_name, last_name, phone, is_admin, is_restricted)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, FALSE),
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed initial facilities (6 football fields, 2 padel courts) with TND pricing
INSERT INTO public.facilities (name, type, capacity, hourly_rate) VALUES
('Football Field 1', 'football_field', 14, 120.00),
('Football Field 2', 'football_field', 14, 120.00),
('Football Field 3', 'football_field', 14, 120.00),
('Football Field 4', 'football_field', 14, 120.00),
('Football Field 5', 'football_field', 14, 120.00),
('Football Field 6', 'football_field', 14, 120.00),
('Padel Court 1', 'padel_court', 4, 90.00),
('Padel Court 2', 'padel_court', 4, 90.00);
