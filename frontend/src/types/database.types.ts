// Generated TypeScript types for Supabase database schema
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type FacilityType = 'football_field' | 'padel_court'
export type BookingStatus = 'confirmed' | 'completed' | 'cancelled' | 'pending_payment'
export type WaitlistStatus = 'active' | 'claim_pending' | 'claimed' | 'expired' | 'cancelled'
export type EmailStatus = 'pending' | 'sent' | 'failed' | 'delivered' | 'bounced'

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          first_name: string
          last_name: string
          phone: string | null
          is_admin: boolean
          is_restricted: boolean
          restriction_end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name: string
          last_name: string
          phone?: string | null
          is_admin?: boolean
          is_restricted?: boolean
          restriction_end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          phone?: string | null
          is_admin?: boolean
          is_restricted?: boolean
          restriction_end_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      facilities: {
        Row: {
          id: string
          name: string
          type: FacilityType
          capacity: number
          hourly_rate: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: FacilityType
          capacity: number
          hourly_rate: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: FacilityType
          capacity?: number
          hourly_rate?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          facility_id: string
          booking_date: string
          start_time: string
          end_time: string
          confirmation_code: string
          status: BookingStatus
          is_paid: boolean
          is_recurring: boolean
          recurring_group_id: string | null
          created_at: string
          updated_at: string
          cancelled_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          facility_id: string
          booking_date: string
          start_time: string
          end_time: string
          confirmation_code: string
          status?: BookingStatus
          is_paid?: boolean
          is_recurring?: boolean
          recurring_group_id?: string | null
          created_at?: string
          updated_at?: string
          cancelled_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          facility_id?: string
          booking_date?: string
          start_time?: string
          end_time?: string
          confirmation_code?: string
          status?: BookingStatus
          is_paid?: boolean
          is_recurring?: boolean
          recurring_group_id?: string | null
          created_at?: string
          updated_at?: string
          cancelled_at?: string | null
        }
      }
      waitlist_entries: {
        Row: {
          id: string
          user_id: string
          facility_id: string
          desired_date: string
          desired_start_time: string
          desired_end_time: string
          backup_booking_id: string
          position: number
          claim_token: string | null
          claim_expires_at: string | null
          status: WaitlistStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          facility_id: string
          desired_date: string
          desired_start_time: string
          desired_end_time: string
          backup_booking_id: string
          position: number
          claim_token?: string | null
          claim_expires_at?: string | null
          status?: WaitlistStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          facility_id?: string
          desired_date?: string
          desired_start_time?: string
          desired_end_time?: string
          backup_booking_id?: string
          position?: number
          claim_token?: string | null
          claim_expires_at?: string | null
          status?: WaitlistStatus
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          facility_id: string
          booking_id: string
          rating: number
          comment: string | null
          is_visible: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          facility_id: string
          booking_id: string
          rating: number
          comment?: string | null
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          facility_id?: string
          booking_id?: string
          rating?: number
          comment?: string | null
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      no_show_records: {
        Row: {
          id: string
          user_id: string
          booking_id: string
          booking_date: string
          booking_start_time: string
          recorded_at: string
        }
        Insert: {
          id?: string
          user_id: string
          booking_id: string
          booking_date: string
          booking_start_time: string
          recorded_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          booking_id?: string
          booking_date?: string
          booking_start_time?: string
          recorded_at?: string
        }
      }
      email_logs: {
        Row: {
          id: string
          user_id: string | null
          email_type: string
          recipient_email: string
          template_data: Json | null
          status: EmailStatus
          error_message: string | null
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          email_type: string
          recipient_email: string
          template_data?: Json | null
          status?: EmailStatus
          error_message?: string | null
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          email_type?: string
          recipient_email?: string
          template_data?: Json | null
          status?: EmailStatus
          error_message?: string | null
          sent_at?: string | null
          created_at?: string
        }
      }
    }
  }
}

// Helper types for joined queries
export type FacilityWithBookings = Database['public']['Tables']['facilities']['Row'] & {
  bookings?: Database['public']['Tables']['bookings']['Row'][]
}

export type BookingWithDetails = Database['public']['Tables']['bookings']['Row'] & {
  facility?: Database['public']['Tables']['facilities']['Row']
  user_profile?: Database['public']['Tables']['user_profiles']['Row']
}

export type WaitlistWithDetails = Database['public']['Tables']['waitlist_entries']['Row'] & {
  facility?: Database['public']['Tables']['facilities']['Row']
  backup_booking?: Database['public']['Tables']['bookings']['Row']
}
