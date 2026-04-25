-- Database Indexes and Constraints Enhancement
-- Task 5: Add additional indexes and constraints for optimal query performance

-- ============================================================================
-- Sub-task 5.1: Add indexes on user_id, facility_id, booking_date
-- ============================================================================
-- Note: Many of these indexes already exist from initial schema
-- This migration adds any missing indexes and composite indexes

-- Verify and add missing single-column indexes if needed
-- (Most already exist, but we'll use IF NOT EXISTS for safety)

-- Booking indexes (some already exist, adding missing ones)
DO $$ 
BEGIN
  -- Index for booking_date alone (for date-based queries)
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_booking_date') THEN
    CREATE INDEX idx_booking_date ON public.bookings(booking_date);
  END IF;
  
  -- Index for recurring group queries
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_booking_recurring_group') THEN
    CREATE INDEX idx_booking_recurring_group ON public.bookings(recurring_group_id) WHERE recurring_group_id IS NOT NULL;
  END IF;
END $$;

-- Waitlist indexes for facility and date queries
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_waitlist_desired_date') THEN
    CREATE INDEX idx_waitlist_desired_date ON public.waitlist_entries(desired_date);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_waitlist_facility_date') THEN
    CREATE INDEX idx_waitlist_facility_date ON public.waitlist_entries(facility_id, desired_date);
  END IF;
END $$;

-- ============================================================================
-- Sub-task 5.2: Add composite indexes for common queries
-- ============================================================================

-- Composite index for booking availability queries (facility + date + time)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_booking_facility_date_time') THEN
    CREATE INDEX idx_booking_facility_date_time ON public.bookings(facility_id, booking_date, start_time, end_time);
  END IF;
END $$;

-- Composite index for user's upcoming bookings (user + date + status)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_booking_user_date_status') THEN
    CREATE INDEX idx_booking_user_date_status ON public.bookings(user_id, booking_date, status) 
    WHERE status IN ('confirmed', 'pending_payment');
  END IF;
END $$;

-- Composite index for facility bookings by date and status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_booking_facility_status_date') THEN
    CREATE INDEX idx_booking_facility_status_date ON public.bookings(facility_id, status, booking_date);
  END IF;
END $$;

-- Composite index for waitlist queries (facility + date + status + position)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_waitlist_facility_date_status_position') THEN
    CREATE INDEX idx_waitlist_facility_date_status_position 
    ON public.waitlist_entries(facility_id, desired_date, status, position)
    WHERE status = 'active';
  END IF;
END $$;

-- Composite index for user's active waitlist entries
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_waitlist_user_status') THEN
    CREATE INDEX idx_waitlist_user_status ON public.waitlist_entries(user_id, status)
    WHERE status IN ('active', 'claim_pending');
  END IF;
END $$;

-- Composite index for no-show tracking (user + date range)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_noshow_user_recorded') THEN
    CREATE INDEX idx_noshow_user_recorded ON public.no_show_records(user_id, recorded_at DESC);
  END IF;
END $$;

-- Composite index for review queries (facility + rating + visibility)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_review_facility_visible_rating') THEN
    CREATE INDEX idx_review_facility_visible_rating ON public.reviews(facility_id, is_visible, rating)
    WHERE is_visible = true;
  END IF;
END $$;

-- Composite index for email log queries (user + type + status)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_email_user_type_status') THEN
    CREATE INDEX idx_email_user_type_status ON public.email_logs(user_id, email_type, status);
  END IF;
END $$;

-- ============================================================================
-- Sub-task 5.3: Add unique constraints on confirmation_code and claim_token
-- ============================================================================
-- Note: These constraints already exist in the initial schema as UNIQUE
-- Verifying they are present and adding if missing

-- Verify confirmation_code unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bookings_confirmation_code_key'
  ) THEN
    ALTER TABLE public.bookings 
    ADD CONSTRAINT bookings_confirmation_code_key UNIQUE (confirmation_code);
  END IF;
END $$;

-- Verify claim_token unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'waitlist_entries_claim_token_key'
  ) THEN
    ALTER TABLE public.waitlist_entries 
    ADD CONSTRAINT waitlist_entries_claim_token_key UNIQUE (claim_token);
  END IF;
END $$;

-- ============================================================================
-- Sub-task 5.4: Add foreign key constraints with proper cascade rules
-- ============================================================================
-- Note: Most foreign keys already exist from initial schema
-- This section ensures all relationships have appropriate CASCADE rules

-- Verify and update foreign key constraints with proper CASCADE behavior

-- User profiles foreign key (already exists with CASCADE)
-- Bookings foreign keys (already exist with CASCADE)
-- Waitlist foreign keys (already exist with CASCADE)
-- Reviews foreign keys (already exist with CASCADE)
-- No-show records foreign keys (already exist with CASCADE)

-- Add missing foreign key for waitlist desired_booking_id if needed
-- This represents the slot the user wants (not yet in initial schema)
DO $$
BEGIN
  -- Check if we need to add facility_id and time fields to waitlist
  -- The initial schema has these fields, so we're good
  
  -- Ensure backup_booking_id has proper CASCADE
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'waitlist_entries_backup_booking_id_fkey'
  ) THEN
    ALTER TABLE public.waitlist_entries
    ADD CONSTRAINT waitlist_entries_backup_booking_id_fkey
    FOREIGN KEY (backup_booking_id) 
    REFERENCES public.bookings(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Add constraint to prevent booking conflicts (same facility, overlapping times)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'no_booking_conflicts'
  ) THEN
    -- Create a unique index to prevent double-booking
    CREATE UNIQUE INDEX idx_no_booking_conflicts 
    ON public.bookings(facility_id, booking_date, start_time)
    WHERE status IN ('confirmed', 'pending_payment');
  END IF;
END $$;

-- Add constraint to ensure waitlist entries don't duplicate
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'no_duplicate_waitlist'
  ) THEN
    CREATE UNIQUE INDEX idx_no_duplicate_waitlist
    ON public.waitlist_entries(user_id, facility_id, desired_date, desired_start_time)
    WHERE status IN ('active', 'claim_pending');
  END IF;
END $$;

-- Add check constraint for claim token expiration logic
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'claim_token_with_expiration'
  ) THEN
    ALTER TABLE public.waitlist_entries
    ADD CONSTRAINT claim_token_with_expiration
    CHECK (
      (claim_token IS NULL AND claim_expires_at IS NULL) OR
      (claim_token IS NOT NULL AND claim_expires_at IS NOT NULL)
    );
  END IF;
END $$;

-- Add check constraint for user restriction logic
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'restriction_with_end_date'
  ) THEN
    ALTER TABLE public.user_profiles
    ADD CONSTRAINT restriction_with_end_date
    CHECK (
      (is_restricted = false AND restriction_end_date IS NULL) OR
      (is_restricted = true AND restriction_end_date IS NOT NULL)
    );
  END IF;
END $$;

-- ============================================================================
-- Performance optimization: Add partial indexes for common filtered queries
-- ============================================================================

-- Index for active bookings only (most common query)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_booking_active') THEN
    CREATE INDEX idx_booking_active ON public.bookings(booking_date, start_time)
    WHERE status IN ('confirmed', 'pending_payment');
  END IF;
END $$;

-- Index for pending claim waitlist entries
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_waitlist_pending_claims') THEN
    CREATE INDEX idx_waitlist_pending_claims ON public.waitlist_entries(claim_expires_at)
    WHERE status = 'claim_pending' AND claim_expires_at IS NOT NULL;
  END IF;
END $$;

-- Index for restricted users
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_restricted') THEN
    CREATE INDEX idx_user_restricted ON public.user_profiles(restriction_end_date)
    WHERE is_restricted = true;
  END IF;
END $$;

-- Index for unpaid bookings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_booking_unpaid') THEN
    CREATE INDEX idx_booking_unpaid ON public.bookings(booking_date, start_time)
    WHERE is_paid = false AND status = 'confirmed';
  END IF;
END $$;

-- ============================================================================
-- Add helpful comments for documentation
-- ============================================================================

COMMENT ON INDEX idx_booking_facility_date_time IS 'Composite index for availability queries - checks if facility is available at specific date/time';
COMMENT ON INDEX idx_booking_user_date_status IS 'Composite index for user booking history queries - finds user bookings by date and status';
COMMENT ON INDEX idx_waitlist_facility_date_status_position IS 'Composite index for waitlist ordering - finds active waitlist entries in order';
COMMENT ON INDEX idx_no_booking_conflicts IS 'Unique index to prevent double-booking of facilities';
COMMENT ON INDEX idx_no_duplicate_waitlist IS 'Unique index to prevent duplicate waitlist entries for same slot';

-- ============================================================================
-- Verification queries (commented out - for manual testing)
-- ============================================================================

-- Verify all indexes exist:
-- SELECT schemaname, tablename, indexname, indexdef 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, indexname;

-- Verify all foreign keys exist:
-- SELECT conname, conrelid::regclass AS table_name, 
--        confrelid::regclass AS referenced_table,
--        pg_get_constraintdef(oid) AS constraint_definition
-- FROM pg_constraint
-- WHERE contype = 'f' AND connamespace = 'public'::regnamespace
-- ORDER BY conrelid::regclass::text;

-- Verify unique constraints:
-- SELECT conname, conrelid::regclass AS table_name,
--        pg_get_constraintdef(oid) AS constraint_definition
-- FROM pg_constraint
-- WHERE contype = 'u' AND connamespace = 'public'::regnamespace
-- ORDER BY conrelid::regclass::text;

