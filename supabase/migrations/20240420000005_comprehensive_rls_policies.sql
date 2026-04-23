-- Comprehensive Row Level Security (RLS) Policies
-- This migration consolidates and improves all RLS policies for the Sports Complex Booking System

-- ============================================================================
-- Sub-task 6.1: Enable RLS on all tables (verify and ensure)
-- ============================================================================

-- Ensure RLS is enabled on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.no_show_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Drop all existing policies to start fresh
-- ============================================================================

-- User Profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

-- Facilities
DROP POLICY IF EXISTS "Everyone can view active facilities" ON public.facilities;
DROP POLICY IF EXISTS "Anyone can view active facilities" ON public.facilities;
DROP POLICY IF EXISTS "Public can view active facilities" ON public.facilities;
DROP POLICY IF EXISTS "Authenticated users can view all facilities" ON public.facilities;
DROP POLICY IF EXISTS "Admins can manage facilities" ON public.facilities;

-- Bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;

-- Waitlist Entries
DROP POLICY IF EXISTS "Users can view their own waitlist entries" ON public.waitlist_entries;
DROP POLICY IF EXISTS "Users can create their own waitlist entries" ON public.waitlist_entries;
DROP POLICY IF EXISTS "Users can update their own waitlist entries" ON public.waitlist_entries;
DROP POLICY IF EXISTS "Admins can view all waitlist entries" ON public.waitlist_entries;

-- Reviews
DROP POLICY IF EXISTS "Anyone can view visible reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can create reviews for their bookings" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;

-- No-Show Records
DROP POLICY IF EXISTS "Only admins can view no-show records" ON public.no_show_records;

-- Email Logs
DROP POLICY IF EXISTS "Only admins can view email logs" ON public.email_logs;

-- ============================================================================
-- Helper function to check if user is admin
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- USER PROFILES POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "user_profiles_select_own" ON public.user_profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Users can update their own profile (but not admin status or restriction fields)
CREATE POLICY "user_profiles_update_own" ON public.user_profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Prevent users from modifying these fields
    is_admin = (SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()) AND
    is_restricted = (SELECT is_restricted FROM public.user_profiles WHERE id = auth.uid()) AND
    restriction_end_date IS NOT DISTINCT FROM (SELECT restriction_end_date FROM public.user_profiles WHERE id = auth.uid())
  );

-- ============================================================================
-- Sub-task 6.6: Admin bypass policies for user_profiles
-- ============================================================================

-- Admins can view all profiles
CREATE POLICY "user_profiles_admin_select_all" ON public.user_profiles
  FOR SELECT 
  USING (public.is_admin());

-- Admins can update all profiles
CREATE POLICY "user_profiles_admin_update_all" ON public.user_profiles
  FOR UPDATE 
  USING (public.is_admin());

-- Admins can insert profiles (for manual user creation)
CREATE POLICY "user_profiles_admin_insert" ON public.user_profiles
  FOR INSERT 
  WITH CHECK (public.is_admin());

-- Admins can delete profiles
CREATE POLICY "user_profiles_admin_delete" ON public.user_profiles
  FOR DELETE 
  USING (public.is_admin());

-- ============================================================================
-- FACILITIES POLICIES
-- ============================================================================

-- Public read access to active facilities (unauthenticated users can view)
CREATE POLICY "facilities_public_select_active" ON public.facilities
  FOR SELECT 
  USING (is_active = true);

-- Authenticated users can view all facilities (including inactive)
CREATE POLICY "facilities_authenticated_select_all" ON public.facilities
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- Sub-task 6.6: Admin bypass policies for facilities
-- ============================================================================

-- Admins can insert facilities
CREATE POLICY "facilities_admin_insert" ON public.facilities
  FOR INSERT 
  WITH CHECK (public.is_admin());

-- Admins can update facilities
CREATE POLICY "facilities_admin_update" ON public.facilities
  FOR UPDATE 
  USING (public.is_admin());

-- Admins can delete facilities
CREATE POLICY "facilities_admin_delete" ON public.facilities
  FOR DELETE 
  USING (public.is_admin());

-- ============================================================================
-- Sub-task 6.2: BOOKINGS POLICIES
-- Users can view/create/update their own bookings
-- ============================================================================

-- Users can view their own bookings
CREATE POLICY "bookings_select_own" ON public.bookings
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can create their own bookings (must be authenticated and not restricted)
CREATE POLICY "bookings_insert_own" ON public.bookings
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    NOT EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND is_restricted = true 
      AND (restriction_end_date IS NULL OR restriction_end_date > NOW())
    )
  );

-- Users can update their own bookings (mainly for cancellation)
CREATE POLICY "bookings_update_own" ON public.bookings
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users cannot delete bookings (only cancel via status update)
-- No delete policy for regular users

-- ============================================================================
-- Sub-task 6.6: Admin bypass policies for bookings
-- ============================================================================

-- Admins can view all bookings
CREATE POLICY "bookings_admin_select_all" ON public.bookings
  FOR SELECT 
  USING (public.is_admin());

-- Admins can insert any booking
CREATE POLICY "bookings_admin_insert" ON public.bookings
  FOR INSERT 
  WITH CHECK (public.is_admin());

-- Admins can update any booking
CREATE POLICY "bookings_admin_update_all" ON public.bookings
  FOR UPDATE 
  USING (public.is_admin());

-- Admins can delete any booking
CREATE POLICY "bookings_admin_delete" ON public.bookings
  FOR DELETE 
  USING (public.is_admin());

-- ============================================================================
-- Sub-task 6.3: WAITLIST ENTRIES POLICIES
-- Users can view/create their own waitlist entries
-- ============================================================================

-- Users can view their own waitlist entries
CREATE POLICY "waitlist_entries_select_own" ON public.waitlist_entries
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can create their own waitlist entries
CREATE POLICY "waitlist_entries_insert_own" ON public.waitlist_entries
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own waitlist entries (for claiming slots)
CREATE POLICY "waitlist_entries_update_own" ON public.waitlist_entries
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own waitlist entries (to leave waitlist)
CREATE POLICY "waitlist_entries_delete_own" ON public.waitlist_entries
  FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================================================
-- Sub-task 6.6: Admin bypass policies for waitlist_entries
-- ============================================================================

-- Admins can view all waitlist entries
CREATE POLICY "waitlist_entries_admin_select_all" ON public.waitlist_entries
  FOR SELECT 
  USING (public.is_admin());

-- Admins can insert any waitlist entry
CREATE POLICY "waitlist_entries_admin_insert" ON public.waitlist_entries
  FOR INSERT 
  WITH CHECK (public.is_admin());

-- Admins can update any waitlist entry
CREATE POLICY "waitlist_entries_admin_update_all" ON public.waitlist_entries
  FOR UPDATE 
  USING (public.is_admin());

-- Admins can delete any waitlist entry
CREATE POLICY "waitlist_entries_admin_delete" ON public.waitlist_entries
  FOR DELETE 
  USING (public.is_admin());

-- ============================================================================
-- Sub-task 6.4: REVIEWS POLICIES
-- Users can view visible reviews, create reviews for their own bookings
-- ============================================================================

-- Anyone (including unauthenticated) can view visible reviews
CREATE POLICY "reviews_select_visible" ON public.reviews
  FOR SELECT 
  USING (is_visible = true);

-- Authenticated users can view their own reviews (even if not visible)
CREATE POLICY "reviews_select_own" ON public.reviews
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can create reviews only for their own completed bookings
CREATE POLICY "reviews_insert_own_bookings" ON public.reviews
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id = booking_id 
      AND user_id = auth.uid() 
      AND status = 'completed'
    )
  );

-- Users can update their own reviews
CREATE POLICY "reviews_update_own" ON public.reviews
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "reviews_delete_own" ON public.reviews
  FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================================================
-- Sub-task 6.6: Admin bypass policies for reviews
-- ============================================================================

-- Admins can view all reviews (including hidden ones)
CREATE POLICY "reviews_admin_select_all" ON public.reviews
  FOR SELECT 
  USING (public.is_admin());

-- Admins can update any review (for moderation)
CREATE POLICY "reviews_admin_update_all" ON public.reviews
  FOR UPDATE 
  USING (public.is_admin());

-- Admins can delete any review
CREATE POLICY "reviews_admin_delete" ON public.reviews
  FOR DELETE 
  USING (public.is_admin());

-- ============================================================================
-- Sub-task 6.5: NO-SHOW RECORDS POLICIES (Admin only)
-- ============================================================================

-- Only admins can view no-show records
CREATE POLICY "no_show_records_admin_select" ON public.no_show_records
  FOR SELECT 
  USING (public.is_admin());

-- Only admins can insert no-show records
CREATE POLICY "no_show_records_admin_insert" ON public.no_show_records
  FOR INSERT 
  WITH CHECK (public.is_admin());

-- Only admins can update no-show records
CREATE POLICY "no_show_records_admin_update" ON public.no_show_records
  FOR UPDATE 
  USING (public.is_admin());

-- Only admins can delete no-show records
CREATE POLICY "no_show_records_admin_delete" ON public.no_show_records
  FOR DELETE 
  USING (public.is_admin());

-- ============================================================================
-- EMAIL LOGS POLICIES (Admin only)
-- ============================================================================

-- Only admins can view email logs
CREATE POLICY "email_logs_admin_select" ON public.email_logs
  FOR SELECT 
  USING (public.is_admin());

-- Only admins can insert email logs (typically done by Edge Functions with service role)
CREATE POLICY "email_logs_admin_insert" ON public.email_logs
  FOR INSERT 
  WITH CHECK (public.is_admin());

-- Only admins can update email logs
CREATE POLICY "email_logs_admin_update" ON public.email_logs
  FOR UPDATE 
  USING (public.is_admin());

-- Only admins can delete email logs
CREATE POLICY "email_logs_admin_delete" ON public.email_logs
  FOR DELETE 
  USING (public.is_admin());

-- ============================================================================
-- Grant necessary permissions
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Grant select on all tables to authenticated users (RLS will filter)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated, anon;

-- Grant insert, update, delete to authenticated users (RLS will filter)
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON POLICY "user_profiles_select_own" ON public.user_profiles IS 
  'Users can view their own profile information';

COMMENT ON POLICY "bookings_insert_own" ON public.bookings IS 
  'Users can create bookings only if they are not restricted';

COMMENT ON POLICY "reviews_insert_own_bookings" ON public.reviews IS 
  'Users can only review facilities for their own completed bookings';

COMMENT ON POLICY "no_show_records_admin_select" ON public.no_show_records IS 
  'No-show records are admin-only for privacy and security';

COMMENT ON FUNCTION public.is_admin() IS 
  'Helper function to check if the current user is an admin';

