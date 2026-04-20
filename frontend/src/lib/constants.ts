// Business Rules Constants
export const CANCELLATION_WINDOW_HOURS = Number(import.meta.env.VITE_CANCELLATION_WINDOW_HOURS) || 96
export const CLAIM_WINDOW_HOURS = Number(import.meta.env.VITE_CLAIM_WINDOW_HOURS) || 12
export const REMINDER_HOURS_BEFORE = 24
export const REVIEW_REQUEST_HOURS_AFTER = 2
export const NO_SHOW_GRACE_MINUTES = 15
export const NO_SHOW_THRESHOLD = 2
export const NO_SHOW_LOOKBACK_DAYS = 30
export const RESTRICTION_DURATION_DAYS = 14
export const FOOTBALL_MIN_PLAYERS = Number(import.meta.env.VITE_FOOTBALL_MIN_PLAYERS) || 14

// Facility Types
export enum FacilityType {
  FOOTBALL_FIELD = 'football_field',
  PADEL_COURT = 'padel_court',
}

// Booking Status
export enum BookingStatus {
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  PENDING_PAYMENT = 'pending_payment',
}

// Waitlist Status
export enum WaitlistStatus {
  ACTIVE = 'active',
  CLAIM_PENDING = 'claim_pending',
  CLAIMED = 'claimed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

// Email Types
export enum EmailType {
  BOOKING_CONFIRMATION = 'booking_confirmation',
  BOOKING_REMINDER = 'booking_reminder',
  WAITLIST_OFFER = 'waitlist_offer',
  REVIEW_REQUEST = 'review_request',
  CONTACT_CONFIRMATION = 'contact_confirmation',
  NO_SHOW_WARNING = 'no_show_warning',
  RESTRICTION_NOTICE = 'restriction_notice',
}

// UI Constants
export const FOOTBALL_COLORS = {
  50: '#f0fdf4',
  100: '#dcfce7',
  500: '#22c55e',
  600: '#16a34a',
  700: '#15803d',
  900: '#14532d',
}

export const PADEL_COLORS = {
  50: '#eff6ff',
  100: '#dbeafe',
  500: '#3b82f6',
  600: '#2563eb',
  700: '#1d4ed8',
  900: '#1e3a8a',
}
