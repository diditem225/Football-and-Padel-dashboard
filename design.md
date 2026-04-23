# Design Document: Sports Complex Booking System

## Overview

The Sports Complex Booking System is a fullstack web application designed to manage facility bookings for a sports complex in Tunisia featuring 6 football fields and 2 padel courts. The system provides hourly booking capabilities, recurring weekly reservations, intelligent waitlist management with time-limited claim processes, no-show tracking, and comprehensive email notifications.

### System Goals

- Enable users to book sports facilities by the hour with real-time availability
- Implement smart waitlist management with cascading slot offers
- Prevent revenue loss through no-show tracking and user restrictions
- Provide a modern, animated user interface optimized for mobile and desktop
- Ensure secure authentication and data protection
- Support administrative oversight and facility management

### Technology Stack

**Frontend:**
- React 18+ with TypeScript
- Tailwind CSS for styling
- Framer Motion for animations
- React Router for navigation
- Supabase JavaScript Client for API communication
- Zustand or Redux for state management

**Backend (Supabase Managed Services):**
- Supabase Database (PostgreSQL 15+)
- Supabase Auth (JWT authentication)
- Supabase Auto-generated REST API
- Supabase Edge Functions (Deno runtime)
- Supabase Realtime for live updates

**Database:**
- Supabase Database (managed PostgreSQL)
- Database migrations via Supabase CLI

**Email Service:**
- SendGrid API (via Supabase Edge Functions)

**Deployment:**
- Frontend: Vercel/Netlify
- Backend: Supabase managed infrastructure
- Edge Functions: Supabase Edge Runtime

## Architecture

### High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Browser]
        MOBILE[Mobile Browser]
    end
    
    subgraph "Frontend Layer"
        REACT[React Application]
        ROUTER[React Router]
        STATE[State Management]
        ANIM[Animation Engine]
        SUPABASE_CLIENT[Supabase Client]
    end
    
    subgraph "Supabase Platform"
        subgraph "Supabase Services"
            AUTH[Supabase Auth]
            DB[Supabase Database]
            API[Auto-generated REST API]
            REALTIME[Supabase Realtime]
            EDGE[Edge Functions]
            STORAGE[Supabase Storage]
        end
    end
    
    subgraph "Edge Functions"
        WAITLIST_FN[Waitlist Cascade Function]
        NOSHOW_FN[No-Show Tracker Function]
        EMAIL_FN[Email Service Function]
        SCHEDULER_FN[Scheduled Tasks Function]
    end
    
    subgraph "External Services"
        SENDGRID[SendGrid API]
    end
    
    WEB --> REACT
    MOBILE --> REACT
    REACT --> ROUTER
    REACT --> STATE
    REACT --> ANIM
    REACT --> SUPABASE_CLIENT
    
    SUPABASE_CLIENT --> AUTH
    SUPABASE_CLIENT --> API
    SUPABASE_CLIENT --> REALTIME
    SUPABASE_CLIENT --> EDGE
    
    API --> DB
    AUTH --> DB
    REALTIME --> DB
    
    EDGE --> WAITLIST_FN
    EDGE --> NOSHOW_FN
    EDGE --> EMAIL_FN
    EDGE --> SCHEDULER_FN
    
    EMAIL_FN --> SENDGRID
    WAITLIST_FN --> DB
    NOSHOW_FN --> DB
    SCHEDULER_FN --> DB
```

### Component Architecture

**Frontend Components:**
- `App`: Root component with routing and theme provider
- `SupabaseProvider`: Supabase client context and authentication
- `Layout`: Common layout with header, footer, navigation
- `HomePage`: Hero section with animations and facility showcase
- `BookingCalendar`: Interactive calendar for slot selection with real-time updates
- `FacilityCard`: Animated facility display with live availability
- `WaitlistManager`: Waitlist join and position display
- `BookingHistory`: User's past and upcoming bookings
- `AdminDashboard`: Administrative control panel
- `ContactForm`: Contact page with form validation
- `ThemeToggle`: Light/Dark mode switcher

**Supabase Edge Functions:**
- `waitlist-cascade`: Handles waitlist slot offering and backup cancellation cascade
- `no-show-tracker`: Monitors bookings for no-shows and applies user restrictions
- `email-service`: Sends all email notifications using SendGrid
- `scheduled-tasks`: Handles reminders, no-show checks, and restriction lifting
- `booking-validation`: Complex booking validation and conflict resolution
- `statistics-calculator`: Calculates admin dashboard statistics

## Data Models

### Database Schema

**Supabase Database Tables:**

```mermaid
erDiagram
    User ||--o{ Booking : creates
    User ||--o{ WaitlistEntry : joins
    User ||--o{ Review : writes
    User ||--o{ NoShowRecord : has
    Facility ||--o{ Booking : hosts
    Facility ||--o{ Review : receives
    Booking ||--o{ WaitlistEntry : "has waitlist"
    
    User {
        uuid id PK
        string email UK
        string first_name
        string last_name
        string phone
        boolean is_admin
        boolean is_restricted
        timestamptz restriction_end_date
        timestamptz created_at
        timestamptz updated_at
    }
    
    Facility {
        uuid id PK
        string name UK
        facility_type type
        int capacity
        decimal hourly_rate
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }
    
    Booking {
        uuid id PK
        uuid user_id FK
        uuid facility_id FK
        date booking_date
        time start_time
        time end_time
        string confirmation_code UK
        booking_status status
        boolean is_paid
        boolean is_recurring
        uuid recurring_group_id
        timestamptz created_at
        timestamptz updated_at
        timestamptz cancelled_at
    }
    
    WaitlistEntry {
        uuid id PK
        uuid user_id FK
        uuid desired_booking_id FK
        uuid backup_booking_id FK
        int position
        string claim_token UK
        timestamptz claim_expires_at
        waitlist_status status
        timestamptz created_at
        timestamptz updated_at
    }
    
    Review {
        uuid id PK
        uuid user_id FK
        uuid facility_id FK
        uuid booking_id FK
        int rating
        text comment
        boolean is_visible
        timestamptz created_at
        timestamptz updated_at
    }
    
    NoShowRecord {
        uuid id PK
        uuid user_id FK
        uuid booking_id FK
        timestamptz booking_datetime
        timestamptz recorded_at
    }
    
    EmailLog {
        uuid id PK
        uuid user_id FK
        string email_type
        string recipient_email
        jsonb template_data
        email_status status
        string error_message
        timestamptz sent_at
        timestamptz created_at
    }
```

**Supabase Database Types:**

```sql
-- Custom types for Supabase
CREATE TYPE facility_type AS ENUM ('football_field', 'padel_court');
CREATE TYPE booking_status AS ENUM ('confirmed', 'completed', 'cancelled', 'pending_payment');
CREATE TYPE waitlist_status AS ENUM ('active', 'claim_pending', 'claimed', 'expired', 'cancelled');
CREATE TYPE email_status AS ENUM ('pending', 'sent', 'failed', 'delivered', 'bounced');
```

### Enums and Constants

**TypeScript Enums (Frontend):**
```typescript
// Facility Types
export enum FacilityType {
  FOOTBALL_FIELD = 'football_field',
  PADEL_COURT = 'padel_court'
}

// Booking Status
export enum BookingStatus {
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  PENDING_PAYMENT = 'pending_payment'
}

// Waitlist Status
export enum WaitlistStatus {
  ACTIVE = 'active',
  CLAIM_PENDING = 'claim_pending',
  CLAIMED = 'claimed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

// Email Types
export enum EmailType {
  BOOKING_CONFIRMATION = 'booking_confirmation',
  BOOKING_REMINDER = 'booking_reminder',
  WAITLIST_OFFER = 'waitlist_offer',
  REVIEW_REQUEST = 'review_request',
  CONTACT_CONFIRMATION = 'contact_confirmation',
  NO_SHOW_WARNING = 'no_show_warning',
  RESTRICTION_NOTICE = 'restriction_notice'
}
```

**Constants:**
```typescript
// Business Rules
export const CANCELLATION_WINDOW_HOURS = 96;
export const CLAIM_WINDOW_HOURS = 12;
export const REMINDER_HOURS_BEFORE = 24;
export const REVIEW_REQUEST_HOURS_AFTER = 2;
export const NO_SHOW_GRACE_MINUTES = 15;
export const NO_SHOW_THRESHOLD = 2;
export const NO_SHOW_LOOKBACK_DAYS = 30;
export const RESTRICTION_DURATION_DAYS = 14;
export const FOOTBALL_MIN_PLAYERS = 14;
```

### Database Indexes

**Supabase Database Indexes:**

```sql
-- User indexes
CREATE INDEX idx_user_email ON auth.users(email);
CREATE INDEX idx_user_is_restricted ON public.user_profiles(is_restricted);

-- Booking indexes
CREATE INDEX idx_booking_user_id ON public.bookings(user_id);
CREATE INDEX idx_booking_facility_id ON public.bookings(facility_id);
CREATE INDEX idx_booking_date_time ON public.bookings(booking_date, start_time);
CREATE INDEX idx_booking_status ON public.bookings(status);
CREATE INDEX idx_booking_confirmation_code ON public.bookings(confirmation_code);
CREATE INDEX idx_booking_recurring_group ON public.bookings(recurring_group_id);

-- Waitlist indexes
CREATE INDEX idx_waitlist_user_id ON public.waitlist_entries(user_id);
CREATE INDEX idx_waitlist_desired_booking ON public.waitlist_entries(desired_booking_id);
CREATE INDEX idx_waitlist_position ON public.waitlist_entries(position);
CREATE INDEX idx_waitlist_claim_token ON public.waitlist_entries(claim_token);
CREATE INDEX idx_waitlist_status ON public.waitlist_entries(status);

-- Review indexes
CREATE INDEX idx_review_facility_id ON public.reviews(facility_id);
CREATE INDEX idx_review_user_id ON public.reviews(user_id);
CREATE INDEX idx_review_rating ON public.reviews(rating);

-- No-show indexes
CREATE INDEX idx_noshow_user_id ON public.no_show_records(user_id);
CREATE INDEX idx_noshow_booking_datetime ON public.no_show_records(booking_datetime);
CREATE INDEX idx_noshow_recorded_at ON public.no_show_records(recorded_at);
```

## Components and Interfaces

### Supabase Integration

#### Supabase Client Setup

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Database type definitions
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

export type Facility = Tables<'facilities'>
export type Booking = Tables<'bookings'>
export type WaitlistEntry = Tables<'waitlist_entries'>
export type Review = Tables<'reviews'>
export type NoShowRecord = Tables<'no_show_records'>
```

#### Authentication with Supabase Auth

**User Registration:**
```typescript
// services/auth.ts
export const registerUser = async (userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}) => {
  const { data, error } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: {
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone,
        is_admin: false,
        is_restricted: false
      }
    }
  })

  if (error) throw error
  return data
}
```

**User Login:**
```typescript
export const loginUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) throw error
  return data
}
```

**Session Management:**
```typescript
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
```

### Supabase Auto-Generated REST API

#### Facility Operations

**Get All Facilities:**
```typescript
// GET /rest/v1/facilities
const { data: facilities, error } = await supabase
  .from('facilities')
  .select('*')
  .eq('is_active', true)
  .order('name')

// Response:
// [
//   {
//     "id": "uuid",
//     "name": "Football Field 1",
//     "type": "football_field",
//     "capacity": 14,
//     "hourly_rate": 50.00,
//     "is_active": true,
//     "created_at": "2024-01-01T00:00:00Z"
//   }
// ]
```

**Get Facility Availability:**
```typescript
// Custom function via Edge Function
const { data: availability, error } = await supabase.functions.invoke('get-facility-availability', {
  body: {
    facility_id: 'uuid',
    start_date: '2024-01-15',
    end_date: '2024-01-21'
  }
})

// Response:
// {
//   "facility_id": "uuid",
//   "availability": [
//     {
//       "date": "2024-01-15",
//       "slots": [
//         {
//           "start_time": "09:00",
//           "end_time": "10:00",
//           "status": "available"
//         }
//       ]
//     }
//   ]
// }
```

#### Booking Operations

**Create Booking:**
```typescript
// POST /rest/v1/bookings
const { data: booking, error } = await supabase
  .from('bookings')
  .insert({
    user_id: user.id,
    facility_id: 'uuid',
    booking_date: '2024-01-20',
    start_time: '14:00:00',
    end_time: '15:00:00',
    confirmation_code: generateConfirmationCode(),
    status: 'confirmed'
  })
  .select()
  .single()

// Trigger Edge Function for email notification
await supabase.functions.invoke('send-booking-confirmation', {
  body: { booking_id: booking.id }
})
```

**Cancel Booking:**
```typescript
// PATCH /rest/v1/bookings
const { data, error } = await supabase
  .from('bookings')
  .update({ 
    status: 'cancelled',
    cancelled_at: new Date().toISOString()
  })
  .eq('id', bookingId)
  .eq('user_id', user.id) // RLS ensures user can only cancel their own bookings

// Trigger waitlist cascade via Edge Function
await supabase.functions.invoke('handle-booking-cancellation', {
  body: { booking_id: bookingId }
})
```

**Get User Bookings:**
```typescript
// GET /rest/v1/bookings with joins
const { data: bookings, error } = await supabase
  .from('bookings')
  .select(`
    *,
    facilities (
      name,
      type
    )
  `)
  .eq('user_id', user.id)
  .order('booking_date', { ascending: false })
```

#### Waitlist Operations

**Join Waitlist:**
```typescript
// Use Edge Function for complex validation
const { data, error } = await supabase.functions.invoke('join-waitlist', {
  body: {
    user_id: user.id,
    desired_booking: {
      facility_id: 'uuid',
      booking_date: '2024-01-22',
      start_time: '18:00:00',
      end_time: '19:00:00'
    },
    backup_booking_id: 'uuid'
  }
})

// Response:
// {
//   "waitlist_entry": {
//     "id": "uuid",
//     "position": 3,
//     "desired_slot": "2024-01-22 18:00-19:00",
//     "backup_booking_code": "BACKUP123"
//   },
//   "message": "Added to waitlist at position 3."
// }
```

**Claim Waitlist Slot:**
```typescript
// Use Edge Function for complex cascade logic
const { data, error } = await supabase.functions.invoke('claim-waitlist-slot', {
  body: {
    claim_token: claimToken,
    user_id: user.id
  }
})

// Response:
// {
//   "booking": {
//     "id": "uuid",
//     "confirmation_code": "CLAIMED789",
//     "facility_name": "Football Field 3",
//     "booking_date": "2024-01-22",
//     "start_time": "18:00"
//   },
//   "backup_cancelled": true,
//   "message": "Slot claimed successfully."
// }
```

#### Review Operations

**Create Review:**
```typescript
// POST /rest/v1/reviews
const { data: review, error } = await supabase
  .from('reviews')
  .insert({
    user_id: user.id,
    facility_id: 'uuid',
    booking_id: 'uuid',
    rating: 5,
    comment: 'Great facility! Well maintained.',
    is_visible: true
  })
  .select()
  .single()
```

**Get Facility Reviews:**
```typescript
// GET /rest/v1/reviews with user info
const { data: reviews, error } = await supabase
  .from('reviews')
  .select(`
    *,
    user_profiles (
      first_name,
      last_name
    )
  `)
  .eq('facility_id', facilityId)
  .eq('is_visible', true)
  .order('created_at', { ascending: false })
  .range(offset, offset + limit - 1)
```

### Supabase Edge Functions

#### Waitlist Cascade Function

```typescript
// supabase/functions/waitlist-cascade/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { booking_id } = await req.json()

    // Get waitlist entries for this booking
    const { data: waitlistEntries, error: waitlistError } = await supabaseClient
      .from('waitlist_entries')
      .select('*')
      .eq('desired_booking_id', booking_id)
      .eq('status', 'active')
      .order('position')

    if (waitlistError) throw waitlistError

    if (waitlistEntries.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No waitlist entries found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const firstInLine = waitlistEntries[0]

    // Generate claim token
    const claimToken = crypto.randomUUID()
    const claimExpiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours

    // Update waitlist entry
    const { error: updateError } = await supabaseClient
      .from('waitlist_entries')
      .update({
        claim_token: claimToken,
        claim_expires_at: claimExpiresAt.toISOString(),
        status: 'claim_pending'
      })
      .eq('id', firstInLine.id)

    if (updateError) throw updateError

    // Send email notification
    await supabaseClient.functions.invoke('send-waitlist-offer', {
      body: {
        user_id: firstInLine.user_id,
        claim_token: claimToken,
        expires_at: claimExpiresAt.toISOString()
      }
    })

    // Schedule expiration check
    await supabaseClient.functions.invoke('schedule-claim-expiration', {
      body: {
        waitlist_entry_id: firstInLine.id,
        check_at: claimExpiresAt.toISOString()
      }
    })

    return new Response(
      JSON.stringify({ 
        message: 'Waitlist offer sent',
        user_id: firstInLine.user_id,
        claim_token: claimToken
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
```

#### No-Show Tracker Function

```typescript
// supabase/functions/no-show-tracker/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const cutoffTime = new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago

    // Find potential no-shows
    const { data: potentialNoShows, error: bookingsError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('status', 'confirmed')
      .eq('is_paid', false)
      .lt('booking_datetime', cutoffTime.toISOString())

    if (bookingsError) throw bookingsError

    for (const booking of potentialNoShows) {
      // Record no-show
      const { error: noShowError } = await supabaseClient
        .from('no_show_records')
        .insert({
          user_id: booking.user_id,
          booking_id: booking.id,
          booking_datetime: booking.booking_datetime,
          recorded_at: new Date().toISOString()
        })

      if (noShowError) throw noShowError

      // Update booking status
      await supabaseClient
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', booking.id)

      // Check if user should be restricted
      await checkAndApplyRestriction(supabaseClient, booking.user_id)
    }

    return new Response(
      JSON.stringify({ 
        message: `Processed ${potentialNoShows.length} no-shows`
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function checkAndApplyRestriction(supabaseClient: any, userId: string) {
  const lookbackDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago

  // Count recent no-shows
  const { count, error } = await supabaseClient
    .from('no_show_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('recorded_at', lookbackDate.toISOString())

  if (error) throw error

  if (count > 2) {
    const restrictionEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days

    // Apply restriction
    await supabaseClient
      .from('user_profiles')
      .update({
        is_restricted: true,
        restriction_end_date: restrictionEndDate.toISOString()
      })
      .eq('id', userId)

    // Send restriction notice
    await supabaseClient.functions.invoke('send-restriction-notice', {
      body: {
        user_id: userId,
        restriction_end_date: restrictionEndDate.toISOString()
      }
    })
  }
}
```

#### Email Service Function

```typescript
// supabase/functions/send-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  try {
    const { to, subject, html, template_type, template_data } = await req.json()

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: to }],
          dynamic_template_data: template_data
        }],
        from: { email: Deno.env.get('SENDGRID_FROM_EMAIL') },
        template_id: getTemplateId(template_type)
      })
    })

    if (!response.ok) {
      throw new Error(`SendGrid API error: ${response.status}`)
    }

    return new Response(
      JSON.stringify({ message: 'Email sent successfully' }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

function getTemplateId(templateType: string): string {
  const templates = {
    'booking_confirmation': 'd-xxx',
    'booking_reminder': 'd-yyy',
    'waitlist_offer': 'd-zzz',
    'review_request': 'd-aaa',
    'restriction_notice': 'd-bbb'
  }
  return templates[templateType] || templates['booking_confirmation']
}
```

### Supabase Realtime Integration

#### Live Availability Updates

```typescript
// hooks/useRealtimeAvailability.ts
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Booking } from '../types/database'

export const useRealtimeAvailability = (facilityId: string, date: string) => {
  const [availability, setAvailability] = useState<any[]>([])

  useEffect(() => {
    // Subscribe to booking changes for this facility and date
    const channel = supabase
      .channel('booking-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `facility_id=eq.${facilityId}`
        },
        (payload) => {
          console.log('Booking change detected:', payload)
          // Refresh availability when bookings change
          refreshAvailability()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [facilityId, date])

  const refreshAvailability = async () => {
    const { data, error } = await supabase.functions.invoke('get-facility-availability', {
      body: { facility_id: facilityId, date }
    })
    
    if (!error && data) {
      setAvailability(data.slots)
    }
  }

  return { availability, refreshAvailability }
}
```

#### Live Waitlist Position Updates

```typescript
// hooks/useRealtimeWaitlist.ts
export const useRealtimeWaitlist = (userId: string) => {
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([])

  useEffect(() => {
    const channel = supabase
      .channel('waitlist-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'waitlist_entries',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Waitlist change:', payload)
          refreshWaitlistEntries()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const refreshWaitlistEntries = async () => {
    const { data, error } = await supabase
      .from('waitlist_entries')
      .select(`
        *,
        facilities (name, type)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')

    if (!error && data) {
      setWaitlistEntries(data)
    }
  }

  return { waitlistEntries, refreshWaitlistEntries }
}
```

### Frontend State Management with Supabase

**Supabase Auth Store:**
```typescript
interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

// Implementation using Supabase Auth
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    
    set({
      user: data.user,
      session: data.session,
      isAuthenticated: true
    })
  },

  register: async (userData: RegisterData) => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone
        }
      }
    })
    
    if (error) throw error
    return data
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({
      user: null,
      session: null,
      isAuthenticated: false
    })
  },

  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  }
}))
```

**Supabase Booking Store:**
```typescript
interface BookingState {
  selectedFacility: Facility | null;
  selectedDate: Date | null;
  selectedTimeSlot: TimeSlot | null;
  userBookings: Booking[];
  isLoading: boolean;
  setSelectedFacility: (facility: Facility) => void;
  setSelectedDate: (date: Date) => void;
  setSelectedTimeSlot: (slot: TimeSlot) => void;
  createBooking: (bookingData: BookingData) => Promise<Booking>;
  cancelBooking: (bookingId: string) => Promise<void>;
  fetchUserBookings: () => Promise<void>;
}

// Implementation using Supabase
export const useBookingStore = create<BookingState>((set, get) => ({
  selectedFacility: null,
  selectedDate: null,
  selectedTimeSlot: null,
  userBookings: [],
  isLoading: false,

  setSelectedFacility: (facility) => set({ selectedFacility: facility }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedTimeSlot: (slot) => set({ selectedTimeSlot: slot }),

  createBooking: async (bookingData) => {
    set({ isLoading: true })
    try {
      // Use Edge Function for complex booking logic
      const { data, error } = await supabase.functions.invoke('create-booking', {
        body: bookingData
      })
      
      if (error) throw error
      
      // Refresh user bookings
      await get().fetchUserBookings()
      
      return data.booking
    } finally {
      set({ isLoading: false })
    }
  },

  cancelBooking: async (bookingId) => {
    set({ isLoading: true })
    try {
      const { error } = await supabase.functions.invoke('cancel-booking', {
        body: { booking_id: bookingId }
      })
      
      if (error) throw error
      
      // Refresh user bookings
      await get().fetchUserBookings()
    } finally {
      set({ isLoading: false })
    }
  },

  fetchUserBookings: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        facilities (name, type)
      `)
      .eq('user_id', user.id)
      .order('booking_date', { ascending: false })

    if (!error && data) {
      set({ userBookings: data })
    }
  }
}))
```

**Supabase Waitlist Store:**
```typescript
interface WaitlistState {
  userWaitlistEntries: WaitlistEntry[];
  isLoading: boolean;
  joinWaitlist: (data: WaitlistJoinData) => Promise<void>;
  claimSlot: (claimToken: string) => Promise<void>;
  fetchUserWaitlist: () => Promise<void>;
}

// Implementation using Supabase
export const useWaitlistStore = create<WaitlistState>((set, get) => ({
  userWaitlistEntries: [],
  isLoading: false,

  joinWaitlist: async (data) => {
    set({ isLoading: true })
    try {
      const { error } = await supabase.functions.invoke('join-waitlist', {
        body: data
      })
      
      if (error) throw error
      
      // Refresh waitlist entries
      await get().fetchUserWaitlist()
    } finally {
      set({ isLoading: false })
    }
  },

  claimSlot: async (claimToken) => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase.functions.invoke('claim-waitlist-slot', {
        body: { claim_token: claimToken }
      })
      
      if (error) throw error
      
      // Refresh both waitlist and bookings
      await get().fetchUserWaitlist()
      
      return data
    } finally {
      set({ isLoading: false })
    }
  },

  fetchUserWaitlist: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('waitlist_entries')
      .select(`
        *,
        facilities (name, type),
        backup_bookings:bookings!backup_booking_id (confirmation_code)
      `)
      .eq('user_id', user.id)
      .in('status', ['active', 'claim_pending'])

    if (!error && data) {
      set({ userWaitlistEntries: data })
    }
  }
}))
```

**Theme Store:**
```typescript
interface ThemeState {
  mode: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (mode: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'light',
  
  toggleTheme: () => set((state) => ({ 
    mode: state.mode === 'light' ? 'dark' : 'light' 
  })),
  
  setTheme: (mode) => set({ mode })
}))
```

### Row Level Security (RLS) Policies

**Supabase RLS Configuration:**

```sql
-- Enable RLS on all tables
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.no_show_records ENABLE ROW LEVEL SECURITY;

-- Bookings policies
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Waitlist policies
CREATE POLICY "Users can view their own waitlist entries" ON public.waitlist_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own waitlist entries" ON public.waitlist_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reviews policies
CREATE POLICY "Users can view visible reviews" ON public.reviews
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Users can create reviews for their bookings" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id = booking_id AND user_id = auth.uid()
    )
  );

-- No-show records policies (admin only)
CREATE POLICY "Only admins can view no-show records" ON public.no_show_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );
```

### Authentication and Authorization Flow with Supabase

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Supabase_Auth
    participant Supabase_DB
    participant Edge_Functions
    
    User->>Frontend: Enter credentials
    Frontend->>Supabase_Auth: signInWithPassword()
    Supabase_Auth->>Supabase_DB: Verify credentials
    Supabase_DB-->>Supabase_Auth: User data
    Supabase_Auth->>Supabase_Auth: Generate JWT tokens
    Supabase_Auth-->>Frontend: Session + JWT tokens
    Frontend->>Frontend: Store session
    Frontend-->>User: Redirect to dashboard
    
    Note over Frontend,Supabase_DB: Subsequent requests
    
    Frontend->>Supabase_DB: API request + JWT (auto-attached)
    Supabase_DB->>Supabase_DB: Validate JWT + RLS
    alt Token valid + RLS passed
        Supabase_DB-->>Frontend: Data response
    else Token expired
        Supabase_Auth->>Supabase_Auth: Auto-refresh token
        Supabase_Auth-->>Frontend: New session
        Frontend->>Supabase_DB: Retry request
    else RLS denied
        Supabase_DB-->>Frontend: 403 Forbidden
    end
    
    Note over Frontend,Edge_Functions: Complex operations
    
    Frontend->>Edge_Functions: Invoke function + JWT
    Edge_Functions->>Supabase_DB: Service role operations
    Edge_Functions-->>Frontend: Function response
```

### Waitlist Chain Management Logic with Supabase Edge Functions

The waitlist system implements a cascading mechanism where claiming a slot triggers automatic cancellation of the backup booking, which in turn offers that slot to its waitlist.

```mermaid
sequenceDiagram
    participant User1
    participant User2
    participant User3
    participant Frontend
    participant Edge_Functions
    participant Supabase_DB
    participant Email_Service
    
    Note over User1,User2: Initial State: User1 cancels Slot A
    
    User1->>Frontend: Cancel Slot A
    Frontend->>Edge_Functions: cancel-booking function
    Edge_Functions->>Supabase_DB: Update booking status
    Edge_Functions->>Edge_Functions: Invoke waitlist-cascade
    Edge_Functions->>Supabase_DB: Find User2 (position 1)
    Edge_Functions->>Email_Service: Send claim link to User2
    Email_Service-->>User2: Claim link for Slot A
    
    Note over User2,User3: User2 claims Slot A
    
    User2->>Frontend: Click claim link
    Frontend->>Edge_Functions: claim-waitlist-slot function
    Edge_Functions->>Supabase_DB: Create booking for User2 (Slot A)
    Edge_Functions->>Supabase_DB: Cancel User2's backup (Slot B)
    
    Note over Edge_Functions,User3: Cascade: Slot B now available
    
    Edge_Functions->>Edge_Functions: Invoke waitlist-cascade for Slot B
    Edge_Functions->>Supabase_DB: Find User3 (position 1)
    Edge_Functions->>Email_Service: Send claim link to User3
    Email_Service-->>User3: Claim link for Slot B
    
    Note over User3: User3 can now claim Slot B
```

**Waitlist Offering Algorithm (Edge Function):**

```typescript
// supabase/functions/waitlist-cascade/index.ts
export async function offerSlotToWaitlist(supabaseClient: any, bookingId: string) {
  // Get the waitlist for this booking, ordered by position
  const { data: waitlist, error } = await supabaseClient
    .from('waitlist_entries')
    .select('*')
    .eq('desired_booking_id', bookingId)
    .eq('status', 'active')
    .order('position')

  if (error || !waitlist.length) {
    return { message: 'No waitlist entries found' }
  }

  const firstInLine = waitlist[0]

  // Generate unique claim token
  const claimToken = crypto.randomUUID()
  const claimExpiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours

  // Update waitlist entry
  await supabaseClient
    .from('waitlist_entries')
    .update({
      claim_token: claimToken,
      claim_expires_at: claimExpiresAt.toISOString(),
      status: 'claim_pending'
    })
    .eq('id', firstInLine.id)

  // Send email with claim link
  await supabaseClient.functions.invoke('send-waitlist-offer', {
    body: {
      user_id: firstInLine.user_id,
      claim_token: claimToken,
      expires_at: claimExpiresAt.toISOString()
    }
  })

  // Schedule expiration check using Supabase cron
  await supabaseClient
    .from('scheduled_tasks')
    .insert({
      task_type: 'claim_expiration_check',
      scheduled_for: claimExpiresAt.toISOString(),
      payload: { waitlist_entry_id: firstInLine.id }
    })

  return { message: 'Waitlist offer sent', claim_token: claimToken }
}

export async function claimWaitlistSlot(supabaseClient: any, claimToken: string, userId: string) {
  // Validate claim token
  const { data: waitlistEntry, error } = await supabaseClient
    .from('waitlist_entries')
    .select('*')
    .eq('claim_token', claimToken)
    .single()

  if (error || !waitlistEntry) {
    throw new Error('Invalid claim token')
  }

  if (waitlistEntry.user_id !== userId) {
    throw new Error('Unauthorized claim attempt')
  }

  if (new Date() > new Date(waitlistEntry.claim_expires_at)) {
    // Expired - offer to next person
    await supabaseClient
      .from('waitlist_entries')
      .update({ status: 'expired' })
      .eq('id', waitlistEntry.id)
    
    await offerSlotToNextInLine(supabaseClient, waitlistEntry.desired_booking_id)
    throw new Error('Claim link has expired')
  }

  // Create the desired booking
  const { data: newBooking, error: bookingError } = await supabaseClient
    .from('bookings')
    .insert({
      user_id: userId,
      facility_id: waitlistEntry.desired_booking.facility_id,
      booking_date: waitlistEntry.desired_booking.booking_date,
      start_time: waitlistEntry.desired_booking.start_time,
      end_time: waitlistEntry.desired_booking.end_time,
      confirmation_code: generateConfirmationCode(),
      status: 'confirmed'
    })
    .select()
    .single()

  if (bookingError) throw bookingError

  // Mark waitlist entry as claimed
  await supabaseClient
    .from('waitlist_entries')
    .update({ status: 'claimed' })
    .eq('id', waitlistEntry.id)

  // Cancel backup booking (THIS TRIGGERS CASCADE)
  await supabaseClient
    .from('bookings')
    .update({ 
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    })
    .eq('id', waitlistEntry.backup_booking_id)

  // Trigger cascade for the backup booking
  await offerSlotToWaitlist(supabaseClient, waitlistEntry.backup_booking_id)

  // Send confirmation email
  await supabaseClient.functions.invoke('send-booking-confirmation', {
    body: { booking_id: newBooking.id }
  })

  return newBooking
}
```

### No-Show Tracking and User Restriction Logic with Supabase

```typescript
// supabase/functions/no-show-tracker/index.ts
export async function checkNoShows(supabaseClient: any) {
  const cutoffTime = new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
  
  // Find bookings that started more than 15 minutes ago and are not paid
  const { data: potentialNoShows, error } = await supabaseClient
    .from('bookings')
    .select('*')
    .eq('status', 'confirmed')
    .eq('is_paid', false)
    .lt('booking_datetime', cutoffTime.toISOString())

  if (error) throw error

  for (const booking of potentialNoShows) {
    // Record no-show
    await recordNoShow(supabaseClient, booking)
    
    // Check if user should be restricted
    await checkAndApplyRestriction(supabaseClient, booking.user_id)
  }

  return { processed: potentialNoShows.length }
}

async function recordNoShow(supabaseClient: any, booking: any) {
  // Insert no-show record
  await supabaseClient
    .from('no_show_records')
    .insert({
      user_id: booking.user_id,
      booking_id: booking.id,
      booking_datetime: booking.booking_datetime,
      recorded_at: new Date().toISOString()
    })

  // Update booking status
  await supabaseClient
    .from('bookings')
    .update({ status: 'completed' })
    .eq('id', booking.id)
}

async function checkAndApplyRestriction(supabaseClient: any, userId: string) {
  // Count no-shows in the last 30 days
  const lookbackDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  
  const { count, error } = await supabaseClient
    .from('no_show_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('recorded_at', lookbackDate.toISOString())

  if (error) throw error

  if (count > 2) {
    const restrictionEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

    // Apply restriction
    await supabaseClient
      .from('user_profiles')
      .update({
        is_restricted: true,
        restriction_end_date: restrictionEndDate.toISOString()
      })
      .eq('id', userId)

    // Send notification email
    await supabaseClient.functions.invoke('send-restriction-notice', {
      body: {
        user_id: userId,
        restriction_end_date: restrictionEndDate.toISOString()
      }
    })
  }
}

// Scheduled function to lift expired restrictions
export async function liftExpiredRestrictions(supabaseClient: any) {
  const now = new Date().toISOString()
  
  const { data: restrictedUsers, error } = await supabaseClient
    .from('user_profiles')
    .select('id')
    .eq('is_restricted', true)
    .lt('restriction_end_date', now)

  if (error) throw error

  if (restrictedUsers.length > 0) {
    await supabaseClient
      .from('user_profiles')
      .update({
        is_restricted: false,
        restriction_end_date: null
      })
      .in('id', restrictedUsers.map(u => u.id))
  }

  return { lifted: restrictedUsers.length }
}
```

### Supabase Cron Jobs

**Database Cron Configuration:**

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule no-show checks every 15 minutes
SELECT cron.schedule(
  'no-show-check',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/no-show-tracker',
    headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key') || '", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Schedule reminder emails daily at 9 AM
SELECT cron.schedule(
  'send-reminders',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/send-reminders',
    headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key') || '", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Schedule restriction lifting daily at midnight
SELECT cron.schedule(
  'lift-restrictions',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/lift-restrictions',
    headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key') || '", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Schedule review requests 2 hours after booking completion
SELECT cron.schedule(
  'send-review-requests',
  '0 */2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/send-review-requests',
    headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key') || '", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Before defining the correctness properties, I need to analyze which acceptance criteria are suitable for property-based testing.


### Property Reflection

After analyzing all acceptance criteria, I've identified the following properties suitable for property-based testing. Here's the reflection to eliminate redundancy:

**Redundancy Analysis:**

1. **Configuration Parser Properties (22.1, 22.2, 22.3, 22.4, 22.5)**: Property 22.4 (round-trip) is the most comprehensive and subsumes 22.1 and 22.3. We'll keep the round-trip property and the error handling property (22.2) and validation property (22.5) as they test different aspects.

2. **Template Parser Properties (23.1, 23.2, 23.3, 23.4, 23.5)**: Property 23.4 (round-trip) subsumes 23.1 and partially 23.3. We'll keep the round-trip, error handling (23.2), and variable support (23.5) properties.

3. **Waitlist Ordering (7.2) and First User Identification (8.1)**: Property 7.2 (waitlist ordering) implies that the first user can be correctly identified. Property 8.1 is redundant.

4. **Average Rating Calculation (14.1 and 14.3)**: These are identical properties. We'll keep only one.

5. **Booking History Sorting (15.1 and 15.2)**: These test the same sorting logic (ascending vs descending). We can combine into one property about correct sorting.

6. **Claim Cascade Properties (9.2 and 9.3)**: These are sequential steps in the same process. We can combine into one comprehensive cascade property.

7. **Cancellation Window Properties (6.1 and 6.2)**: These test opposite sides of the same rule. We can combine into one property about cancellation window enforcement.

8. **Email Content Properties (11.2, 12.2, 15.4)**: These all test that emails/displays contain required fields. We can generalize to properties about data completeness.

**Final Property Set (After Redundancy Elimination):**

- Configuration round-trip property
- Configuration error handling property
- Configuration validation property
- Template round-trip property
- Template error handling property
- Template variable support property
- Double-booking prevention property
- Waitlist ordering property
- Backup cancellation cascade property
- No-show counter property
- No-show restriction property
- Cancellation window enforcement property
- Admin cancellation bypass property
- Waitlist notification uniqueness property
- Claim link validity property
- Claim expiration cascade property
- Expired claim rejection property
- Confirmation code uniqueness property
- Recurring booking generation property
- Recurring availability validation property
- Availability calculation property
- Invalid credentials rejection property
- Waitlist backup requirement property
- Notification sending (single user) property
- Slot pending status property
- Rating validation property
- Average rating calculation property
- Booking history sorting property
- Statistics calculation property
- No-show detection property
- Restriction lifting property

### Property Definitions

### Property 1: Configuration Round-Trip Preservation

*For any* valid Configuration object, serializing it to a configuration file format and then parsing it back SHALL produce an equivalent Configuration object with all fields preserved.

**Validates: Requirements 22.4**

### Property 2: Configuration Error Reporting

*For any* invalid configuration file (missing required fields, malformed syntax, incorrect types), the Configuration_Parser SHALL return a descriptive error message that identifies the specific validation failure.

**Validates: Requirements 22.2, 22.5**

### Property 3: Template Round-Trip Preservation

*For any* valid Template object, rendering it with sample data and then parsing the template structure back SHALL produce an equivalent Template object with the same variable placeholders and structure.

**Validates: Requirements 23.4**

### Property 4: Template Error Reporting

*For any* invalid email template (malformed syntax, undefined variable references), the Template_Parser SHALL return a descriptive error message identifying the specific parsing failure.

**Validates: Requirements 23.2**

### Property 5: Template Variable Support

*For any* email template containing variables for booking details, user information, or claim links, the Template_Parser SHALL correctly identify and support substitution of all variable types.

**Validates: Requirements 23.5**

### Property 6: Double-Booking Prevention

*For any* sequence of booking attempts for the same facility at the same date and time, the Booking_System SHALL accept exactly one booking and reject all subsequent attempts, maintaining the invariant that no facility is double-booked.

**Validates: Requirements 3.2**

### Property 7: Waitlist FIFO Ordering

*For any* sequence of waitlist join requests with timestamps, the Booking_System SHALL assign positions that maintain first-come-first-served order, where earlier timestamps always receive lower position numbers.

**Validates: Requirements 7.2**

### Property 8: Backup Cancellation Cascade

*For any* successful waitlist slot claim, the Booking_System SHALL automatically cancel the user's backup booking AND immediately trigger waitlist slot offering for the newly vacated backup slot, creating a cascade effect.

**Validates: Requirements 9.2, 9.3**

### Property 9: No-Show Counter Accuracy

*For any* sequence of no-show events for a user with timestamps, the Booking_System SHALL maintain a counter that accurately counts only no-shows within the rolling 30-day window, excluding events older than 30 days.

**Validates: Requirements 27.2**

### Property 10: No-Show Restriction Trigger

*For any* user, when the no-show count within 30 days exceeds 2, the Booking_System SHALL restrict the user from creating new bookings for exactly 14 days and send a restriction notification.

**Validates: Requirements 27.3**

### Property 11: Cancellation Window Enforcement

*For any* booking cancellation attempt by a non-admin user, the Booking_System SHALL allow cancellation if and only if the booking is more than 96 hours in the future, rejecting cancellations within the window with a policy message.

**Validates: Requirements 6.1, 6.2**

### Property 12: Admin Cancellation Bypass

*For any* booking cancellation attempt by an admin user, the Booking_System SHALL allow the cancellation regardless of how soon the booking is scheduled, bypassing the 96-hour cancellation window.

**Validates: Requirements 6.4**

### Property 13: Waitlist Notification Uniqueness

*For any* booking cancellation that triggers waitlist slot offering, the Booking_System SHALL send exactly one notification to exactly one user (the first in the waitlist), not to multiple users.

**Validates: Requirements 8.3**

### Property 14: Claim Link Validity Period

*For any* generated claim link, the link SHALL be unique across all claim links and SHALL remain valid for exactly 12 hours from generation, after which it expires.

**Validates: Requirements 8.4**

### Property 15: Claim Expiration Cascade

*For any* claim link that expires without being used, the Booking_System SHALL automatically offer the slot to the next user in the waitlist, maintaining continuous slot offering until claimed or waitlist exhausted.

**Validates: Requirements 9.5**

### Property 16: Expired Claim Rejection

*For any* claim link used after its 12-hour expiration period, the Booking_System SHALL reject the claim attempt and display an expiration message, preventing late claims.

**Validates: Requirements 9.6**

### Property 17: Confirmation Code Uniqueness

*For any* set of bookings created in the system, each booking SHALL have a unique confirmation code that does not collide with any other booking's code.

**Validates: Requirements 10.1**

### Property 18: Recurring Booking Generation

*For any* recurring booking request with N weeks specified, the Booking_System SHALL create exactly N individual booking entities, one for each week at the same day and time.

**Validates: Requirements 4.1**

### Property 19: Recurring Availability Validation

*For any* recurring booking request, the Booking_System SHALL validate availability for all requested weeks and accurately report which specific weeks (if any) are unavailable.

**Validates: Requirements 4.3, 4.4**

### Property 20: Availability Calculation Correctness

*For any* facility at any given date and time, the availability status calculation SHALL correctly reflect the current booking state: available (no booking), booked (confirmed booking exists), or waitlist-available (booking exists with active waitlist).

**Validates: Requirements 2.4**

### Property 21: Invalid Credentials Rejection

*For any* login attempt with invalid credentials (wrong password, non-existent email, malformed input), the Authentication_System SHALL reject the attempt and return an authentication error.

**Validates: Requirements 1.4**

### Property 22: Waitlist Backup Requirement

*For any* waitlist join attempt, the Booking_System SHALL require the user to have a valid backup booking, rejecting waitlist joins without a backup booking reference.

**Validates: Requirements 7.3**

### Property 23: Slot Pending Status During Claim Window

*For any* slot with an active claim offer, the Booking_System SHALL mark the slot status as pending claim for the entire duration of the 12-hour claim window.

**Validates: Requirements 8.5**

### Property 24: Rating Range Validation

*For any* review submission, the Booking_System SHALL accept ratings only in the range 1-5 (inclusive), rejecting any rating value outside this range with a validation error.

**Validates: Requirements 13.3**

### Property 25: Average Rating Calculation

*For any* facility with a set of reviews, the calculated average rating SHALL equal the arithmetic mean of all review ratings for that facility, accurately reflecting the aggregate user feedback.

**Validates: Requirements 14.1, 14.3**

### Property 26: Booking History Sorting

*For any* user's booking history, upcoming bookings SHALL be sorted in ascending date order (earliest first) and past bookings SHALL be sorted in descending date order (most recent first).

**Validates: Requirements 15.1, 15.2**

### Property 27: Statistics Calculation Accuracy

*For any* time period, the admin statistics (total bookings, revenue, facility utilization) SHALL be calculated accurately based on all bookings in that period, with revenue equaling sum of paid bookings and utilization reflecting booked hours vs available hours.

**Validates: Requirements 16.4**

### Property 28: No-Show Detection Timing

*For any* booking, the Booking_System SHALL detect it as a no-show if and only if it is not marked as paid within 15 minutes after the session start time.

**Validates: Requirements 27.1**

### Property 29: Automatic Restriction Lifting

*For any* restricted user, the Booking_System SHALL automatically lift the restriction when the current date exceeds the restriction_end_date, restoring booking privileges.

**Validates: Requirements 27.6**

### Property 30: Email Content Completeness

*For any* booking confirmation email, the email SHALL contain all required fields: booking date, time, facility name, confirmation code, and cancellation policy.

**Validates: Requirements 11.2**

### Property 31: Recurring Booking Single Email

*For any* recurring booking creation with N weeks, the Email_Service SHALL send exactly one confirmation email that lists all N booked dates, not N separate emails.

**Validates: Requirements 11.4**

### Property 32: Reminder Exclusion for Cancelled Bookings

*For any* set of bookings including cancelled ones, the Email_Service SHALL send reminder emails only for non-cancelled bookings, excluding all cancelled bookings from reminders.

**Validates: Requirements 12.3**


## Error Handling

### Error Categories

**Validation Errors (400 Bad Request):**
- Invalid input data (missing required fields, wrong data types)
- Business rule violations (booking within cancellation window, double-booking attempts)
- Constraint violations (rating outside 1-5 range, invalid date/time combinations)

**Authentication Errors (401 Unauthorized):**
- Invalid credentials
- Expired JWT tokens
- Missing authentication tokens

**Authorization Errors (403 Forbidden):**
- Non-admin accessing admin endpoints
- User attempting to modify another user's booking
- Restricted user attempting to create bookings

**Not Found Errors (404 Not Found):**
- Non-existent resources (booking, facility, user)
- Invalid claim tokens
- Expired waitlist entries

**Conflict Errors (409 Conflict):**
- Double-booking attempts
- Concurrent booking conflicts
- Waitlist position conflicts

**Server Errors (500 Internal Server Error):**
- Database connection failures
- Email service failures
- Unexpected Edge Function errors

### Error Response Format

**Supabase Edge Function Error Response:**

```typescript
// Standard error response structure
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  }
}

// Example error responses
export function createErrorResponse(
  code: string,
  message: string,
  details?: any,
  status: number = 400
): Response {
  return new Response(
    JSON.stringify({
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString()
      }
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

// Usage in Edge Functions
if (!booking) {
  return createErrorResponse(
    'BOOKING_NOT_FOUND',
    'The requested booking does not exist',
    { booking_id: bookingId },
    404
  )
}

if (isWithinCancellationWindow) {
  return createErrorResponse(
    'CANCELLATION_WINDOW_VIOLATION',
    'Cannot cancel booking within 96 hours of start time',
    {
      booking_id: bookingId,
      hours_until_booking: hoursUntil,
      cancellation_window_hours: 96
    },
    400
  )
}
```

### Error Handling in Edge Functions

**Structured Error Handling:**

```typescript
// supabase/functions/_shared/errors.ts
export class BookingError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any,
    public status: number = 400
  ) {
    super(message)
    this.name = 'BookingError'
  }
}

export class ValidationError extends BookingError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, details, 400)
  }
}

export class NotFoundError extends BookingError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', `${resource} not found`, { id }, 404)
  }
}

export class ConflictError extends BookingError {
  constructor(message: string, details?: any) {
    super('CONFLICT', message, details, 409)
  }
}

export class AuthorizationError extends BookingError {
  constructor(message: string = 'Unauthorized access') {
    super('UNAUTHORIZED', message, undefined, 403)
  }
}

// Error handler middleware
export function handleError(error: unknown): Response {
  console.error('Error occurred:', error)

  if (error instanceof BookingError) {
    return createErrorResponse(
      error.code,
      error.message,
      error.details,
      error.status
    )
  }

  // Unexpected errors
  return createErrorResponse(
    'INTERNAL_ERROR',
    'An unexpected error occurred',
    process.env.NODE_ENV === 'development' ? { error: String(error) } : undefined,
    500
  )
}

// Usage in Edge Functions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleError, ValidationError, NotFoundError } from '../_shared/errors.ts'

serve(async (req) => {
  try {
    const { booking_id } = await req.json()

    if (!booking_id) {
      throw new ValidationError('booking_id is required')
    }

    const booking = await getBooking(booking_id)
    
    if (!booking) {
      throw new NotFoundError('Booking', booking_id)
    }

    // Process booking...
    
    return new Response(
      JSON.stringify({ success: true, data: booking }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return handleError(error)
  }
})
```

### Frontend Error Handling

**Error Handling with Supabase Client:**

```typescript
// hooks/useBooking.ts
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

export function useBooking() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createBooking = async (bookingData: BookingData) => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: functionError } = await supabase.functions.invoke('create-booking', {
        body: bookingData
      })

      if (functionError) {
        // Parse error response
        const errorData = functionError.context?.body
        
        if (errorData?.error) {
          const { code, message, details } = errorData.error
          
          // Handle specific error codes
          switch (code) {
            case 'DOUBLE_BOOKING':
              toast.error('This time slot is no longer available')
              break
            case 'CANCELLATION_WINDOW_VIOLATION':
              toast.error(`Cannot cancel within ${details.cancellation_window_hours} hours`)
              break
            case 'USER_RESTRICTED':
              toast.error('Your account is temporarily restricted due to no-shows')
              break
            default:
              toast.error(message || 'An error occurred')
          }
          
          setError(message)
          throw new Error(message)
        }
      }

      toast.success('Booking created successfully!')
      return data

    } catch (err) {
      console.error('Booking error:', err)
      const message = err instanceof Error ? err.message : 'Failed to create booking'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { createBooking, isLoading, error }
}
```

**Global Error Boundary:**

```typescript
// components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error boundary caught:', error, errorInfo)
    
    // Log to error tracking service (e.g., Sentry)
    // logErrorToService(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We're sorry for the inconvenience. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-football-600 text-white rounded-lg hover:bg-football-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

### Logging Strategy

**Edge Function Logging:**

```typescript
// supabase/functions/_shared/logger.ts
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  function_name: string
  user_id?: string
  details?: any
}

export class Logger {
  constructor(private functionName: string) {}

  private log(level: LogLevel, message: string, details?: any, userId?: string) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      function_name: this.functionName,
      user_id: userId,
      details
    }

    // Log to console (captured by Supabase)
    console.log(JSON.stringify(entry))

    // Optionally log to database for persistence
    if (level === LogLevel.ERROR || level === LogLevel.WARN) {
      this.persistLog(entry)
    }
  }

  private async persistLog(entry: LogEntry) {
    try {
      // Store critical logs in database
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      await supabaseClient.from('function_logs').insert({
        level: entry.level,
        message: entry.message,
        function_name: entry.function_name,
        user_id: entry.user_id,
        details: entry.details,
        created_at: entry.timestamp
      })
    } catch (error) {
      console.error('Failed to persist log:', error)
    }
  }

  debug(message: string, details?: any, userId?: string) {
    this.log(LogLevel.DEBUG, message, details, userId)
  }

  info(message: string, details?: any, userId?: string) {
    this.log(LogLevel.INFO, message, details, userId)
  }

  warn(message: string, details?: any, userId?: string) {
    this.log(LogLevel.WARN, message, details, userId)
  }

  error(message: string, details?: any, userId?: string) {
    this.log(LogLevel.ERROR, message, details, userId)
  }
}

// Usage in Edge Functions
import { Logger } from '../_shared/logger.ts'

const logger = new Logger('waitlist-cascade')

serve(async (req) => {
  try {
    logger.info('Waitlist cascade triggered', { booking_id })
    
    // Process logic...
    
    logger.info('Waitlist cascade completed', { 
      booking_id,
      next_user_id: nextUser.id 
    })

  } catch (error) {
    logger.error('Waitlist cascade failed', {
      error: error.message,
      stack: error.stack,
      booking_id
    })
    throw error
  }
})
```

### Retry Logic for External Services

**Email Service Retry:**

```typescript
// supabase/functions/_shared/retry.ts
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt)
        console.log(`Retry attempt ${attempt + 1} after ${delay}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError!
}

// Usage in email service
async function sendEmail(emailData: EmailData) {
  return retryWithBackoff(async () => {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    })

    if (!response.ok) {
      throw new Error(`SendGrid API error: ${response.status}`)
    }

    return response
  }, 3, 1000)
}
```

**Database Transaction Retry:**

```typescript
// Supabase handles connection pooling and retries automatically
// For critical operations, implement application-level retry

async function createBookingWithRetry(bookingData: BookingData) {
  return retryWithBackoff(async () => {
    const { data, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single()

    if (error) {
      // Check if error is retryable
      if (error.code === '40001' || error.code === '40P01') {
        // Serialization failure or deadlock - retry
        throw new Error('Transaction conflict, retrying...')
      }
      // Non-retryable error
      throw error
    }

    return data
  }, 3, 500)
}tent booking, facility, or user
- Invalid claim tokens
- Expired or used claim links

**Conflict Errors (409 Conflict):**
- Double-booking attempts
- Concurrent modification conflicts
- Waitlist position conflicts

**Server Errors (500 Internal Server Error):**
- Database connection failures
- Email service failures
- Unexpected exceptions

### Error Response Format

All API errors follow a consistent JSON structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "specific_field",
      "reason": "detailed explanation"
    },
    "timestamp": "2024-01-20T10:30:00Z",
    "request_id": "uuid"
  }
}
```

### Error Handling Strategies

**Backend Error Handling:**

```python
# Custom exception hierarchy
class BookingSystemException(Exception):
    """Base exception for all booking system errors"""
    def __init__(self, message: str, code: str, details: dict = None):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)

class ValidationError(BookingSystemException):
    """Raised for input validation failures"""
    pass

class CancellationWindowError(ValidationError):
    """Raised when attempting to cancel within 96-hour window"""
    pass

class DoubleBookingError(ValidationError):
    """Raised when attempting to book an already booked slot"""
    pass

class ClaimExpiredError(BookingSystemException):
    """Raised when claim link has expired"""
    pass

class NoShowRestrictionError(BookingSystemException):
    """Raised when restricted user attempts to book"""
    pass

# Global exception handler
@app.exception_handler(BookingSystemException)
async def booking_system_exception_handler(request: Request, exc: BookingSystemException):
    return JSONResponse(
        status_code=400,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
                "timestamp": datetime.utcnow().isoformat(),
                "request_id": str(uuid.uuid4())
            }
        }
    )

# Logging for all errors
logger.error(
    f"Error occurred: {exc.code}",
    extra={
        "error_code": exc.code,
        "user_id": current_user.id if current_user else None,
        "request_path": request.url.path,
        "details": exc.details
    }
)
```

**Frontend Error Handling:**

```typescript
// Centralized error handling
class ErrorHandler {
  static handle(error: ApiError): void {
    // Log to monitoring service
    this.logError(error);
    
    // Display user-friendly message
    switch (error.code) {
      case 'CANCELLATION_WINDOW_ERROR':
        toast.error('Cannot cancel booking within 96 hours of scheduled time');
        break;
      case 'DOUBLE_BOOKING_ERROR':
        toast.error('This slot is no longer available');
        break;
      case 'CLAIM_EXPIRED_ERROR':
        toast.error('This offer has expired. The slot was offered to the next person in line.');
        break;
      case 'NO_SHOW_RESTRICTION_ERROR':
        toast.error(`Your account is restricted until ${error.details.restriction_end_date} due to no-shows`);
        break;
      default:
        toast.error('An error occurred. Please try again.');
    }
  }
  
  static logError(error: ApiError): void {
    console.error('API Error:', {
      code: error.code,
      message: error.message,
      timestamp: error.timestamp,
      requestId: error.request_id
    });
    
    // Send to monitoring service (e.g., Sentry)
    if (window.Sentry) {
      window.Sentry.captureException(error);
    }
  }
}
```

### Retry Logic

**Email Service Retry:**
```python
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
    retry=retry_if_exception_type(EmailServiceError)
)
async def send_email(email_data: EmailData):
    """Send email with automatic retry on failure"""
    try:
        response = await sendgrid_client.send(email_data)
        log_email_success(email_data, response)
        return response
    except Exception as e:
        log_email_failure(email_data, e)
        raise EmailServiceError(f"Failed to send email: {str(e)}")
```

**Database Transaction Retry:**
```python
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=5),
    retry=retry_if_exception_type(OperationalError)
)
async def create_booking_with_retry(booking_data: BookingCreate):
    """Create booking with retry on database deadlock"""
    async with db.transaction():
        return await create_booking(booking_data)
```

## Testing Strategy

### Testing Approach

The Sports Complex Booking System will employ a comprehensive testing strategy combining property-based testing, unit testing, integration testing, and end-to-end testing, adapted for the Supabase architecture.

### Property-Based Testing

**Framework:** `fast-check` for TypeScript frontend and Edge Functions

**Configuration:**
- Minimum 100 iterations per property test
- Deterministic random seed for reproducibility
- Shrinking enabled for minimal failing examples

**Property Test Implementation:**

Each correctness property from the design document will be implemented as a property-based test with appropriate generators:

```typescript
// Example: Property 6 - Double-Booking Prevention
import fc from 'fast-check'
import { supabase } from '../lib/supabase'

describe('Property 6: Double-Booking Prevention', () => {
  test('For any sequence of booking attempts for the same facility at the same date and time, the system SHALL accept exactly one booking and reject all subsequent attempts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.date({ min: new Date(), max: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) }),
        fc.integer({ min: 8, max: 21 }),
        fc.array(fc.uuid(), { minLength: 2, maxLength: 10 }),
        async (facilityId, bookingDate, startHour, userIds) => {
          // Feature: sports-complex-booking-system
          // Property 6: Double-booking prevention
          
          const startTime = `${startHour.toString().padStart(2, '0')}:00:00`
          const endTime = `${(startHour + 1).toString().padStart(2, '0')}:00:00`
          
          const results = await Promise.allSettled(
            userIds.map(async (userId) => {
              const { data, error } = await supabase.functions.invoke('create-booking', {
                body: {
                  user_id: userId,
                  facility_id: facilityId,
                  booking_date: bookingDate.toISOString().split('T')[0],
                  start_time: startTime,
                  end_time: endTime
                }
              })
              
              if (error) throw error
              return data
            })
          )
          
          const successful = results.filter(r => r.status === 'fulfilled')
          const failed = results.filter(r => r.status === 'rejected')
          
          // Assert exactly one booking succeeded
          expect(successful).toHaveLength(1)
          // Assert all others failed
          expect(failed).toHaveLength(userIds.length - 1)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Example: Property 1 - Configuration Round-Trip
describe('Property 1: Configuration Round-Trip', () => {
  test('For any valid Configuration object, serializing and parsing SHALL produce an equivalent object', async () => {
    await fc.assert(
      fc.property(
        configurationArbitrary(),
        (config) => {
          // Feature: sports-complex-booking-system
          // Property 1: Configuration round-trip preservation
          
          // Serialize to string
          const configStr = JSON.stringify(config)
          
          // Parse back
          const parsedConfig = JSON.parse(configStr)
          
          // Assert equivalence
          expect(parsedConfig).toEqual(config)
          expect(parsedConfig.database_url).toBe(config.database_url)
          expect(parsedConfig.jwt_secret).toBe(config.jwt_secret)
          expect(parsedConfig.email_credentials).toEqual(config.email_credentials)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Example: Property 8 - Backup Cancellation Cascade
describe('Property 8: Backup Cancellation Cascade', () => {
  test('For any successful waitlist slot claim, the system SHALL automatically cancel the backup booking AND trigger waitlist offering for the vacated backup slot', async () => {
    await fc.assert(
      fc.asyncProperty(
        userArbitrary(),
        bookingSlotArbitrary(),
        bookingSlotArbitrary(),
        userArbitrary(),
        async (user, desiredSlot, backupSlot, nextWaitlistUser) => {
          // Feature: sports-complex-booking-system
          // Property 8: Backup cancellation cascade
          
          // Setup: Create backup booking and waitlist entry
          const { data: backupBooking } = await supabase.functions.invoke('create-booking', {
            body: { ...backupSlot, user_id: user.id }
          })
          
          const { data: waitlistEntry } = await supabase.functions.invoke('join-waitlist', {
            body: {
              user_id: user.id,
              desired_booking: desiredSlot,
              backup_booking_id: backupBooking.id
            }
          })
          
          // Setup: Add next user to backup slot's waitlist
          const { data: anotherBackup } = await supabase.functions.invoke('create-booking', {
            body: { ...generateBookingSlot(), user_id: nextWaitlistUser.id }
          })
          
          await supabase.functions.invoke('join-waitlist', {
            body: {
              user_id: nextWaitlistUser.id,
              desired_booking: backupSlot,
              backup_booking_id: anotherBackup.id
            }
          })
          
          // Generate claim token
          const claimToken = waitlistEntry.claim_token
          
          // Act: Claim the desired slot
          const { data: claimedBooking } = await supabase.functions.invoke('claim-waitlist-slot', {
            body: { claim_token: claimToken, user_id: user.id }
          })
          
          // Assert: Backup booking is cancelled
          const { data: backupAfter } = await supabase
            .from('bookings')
            .select('status')
            .eq('id', backupBooking.id)
            .single()
          
          expect(backupAfter.status).toBe('cancelled')
          
          // Assert: Next user in backup slot's waitlist received offer
          const { data: nextWaitlistEntry } = await supabase
            .from('waitlist_entries')
            .select('status, claim_token')
            .eq('user_id', nextWaitlistUser.id)
            .single()
          
          expect(nextWaitlistEntry.status).toBe('claim_pending')
          expect(nextWaitlistEntry.claim_token).toBeTruthy()
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

**Custom Generators for Supabase:**

```typescript
// Arbitraries for domain objects
const bookingSlotArbitrary = () => fc.record({
  facility_id: fc.uuid(),
  booking_date: fc.date({ min: new Date(), max: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) })
    .map(d => d.toISOString().split('T')[0]),
  start_time: fc.integer({ min: 8, max: 21 }).map(h => `${h.toString().padStart(2, '0')}:00:00`),
  end_time: fc.integer({ min: 9, max: 22 }).map(h => `${h.toString().padStart(2, '0')}:00:00`)
})

const configurationArbitrary = () => fc.record({
  database_url: fc.string({ minLength: 10 }).map(s => `postgresql://user:pass@localhost/${s}`),
  jwt_secret: fc.string({ minLength: 32, maxLength: 64 }),
  jwt_expiration_hours: fc.integer({ min: 1, max: 24 }),
  email_api_key: fc.string({ minLength: 20 }),
  email_from_address: fc.emailAddress(),
  cancellation_window_hours: fc.constant(96),
  claim_window_hours: fc.constant(12)
})

const userArbitrary = () => fc.record({
  id: fc.uuid(),
  email: fc.emailAddress(),
  first_name: fc.string({ minLength: 1, maxLength: 50 }),
  last_name: fc.string({ minLength: 1, maxLength: 50 }),
  phone: fc.string({ minLength: 10, maxLength: 15 }),
  is_admin: fc.boolean(),
  is_restricted: fc.boolean()
})
```

### Unit Testing

**Framework:** `Jest` and `Vitest` for TypeScript, `Deno Test` for Edge Functions

**Coverage Target:** 80% code coverage minimum

**Unit Test Categories:**

1. **Frontend Component Tests:**
   - React component rendering and behavior
   - State management logic
   - Custom hooks functionality
   - Utility functions

2. **Edge Function Tests:**
   - Individual function logic with mocked Supabase client
   - Business rule validation
   - Error handling paths

3. **Utility Function Tests:**
   - Date/time calculations
   - Token generation
   - Validation functions

**Example Unit Tests:**

```typescript
// Frontend component test
import { render, screen, fireEvent } from '@testing-library/react'
import { BookingCalendar } from '../components/BookingCalendar'
import { useRealtimeAvailability } from '../hooks/useRealtimeAvailability'

jest.mock('../hooks/useRealtimeAvailability')

describe('BookingCalendar', () => {
  test('displays available slots correctly', () => {
    const mockAvailability = [
      { start_time: '09:00', end_time: '10:00', status: 'available' },
      { start_time: '10:00', end_time: '11:00', status: 'booked' }
    ]
    
    ;(useRealtimeAvailability as jest.Mock).mockReturnValue({
      availability: mockAvailability,
      refreshAvailability: jest.fn()
    })

    render(<BookingCalendar facilityId="test-facility" date="2024-01-20" />)
    
    expect(screen.getByText('09:00 - 10:00')).toBeInTheDocument()
    expect(screen.getByText('Available')).toBeInTheDocument()
    expect(screen.getByText('Booked')).toBeInTheDocument()
  })

  test('handles slot selection', () => {
    const onSlotSelect = jest.fn()
    
    render(
      <BookingCalendar 
        facilityId="test-facility" 
        date="2024-01-20" 
        onSlotSelect={onSlotSelect}
      />
    )
    
    fireEvent.click(screen.getByTestId('slot-09:00'))
    
    expect(onSlotSelect).toHaveBeenCalledWith({
      start_time: '09:00',
      end_time: '10:00',
      status: 'available'
    })
  })
})

// Edge Function test
import { assertEquals, assertRejects } from 'https://deno.land/std@0.168.0/testing/asserts.ts'
import { checkNoShows } from '../supabase/functions/no-show-tracker/index.ts'

Deno.test('checkNoShows - identifies bookings past grace period', async () => {
  const mockSupabaseClient = {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          lt: () => ({
            data: [
              {
                id: 'booking-1',
                user_id: 'user-1',
                booking_datetime: new Date(Date.now() - 20 * 60 * 1000).toISOString() // 20 minutes ago
              }
            ],
            error: null
          })
        })
      }),
      insert: () => ({ error: null }),
      update: () => ({ eq: () => ({ error: null }) })
    }),
    functions: {
      invoke: () => ({ error: null })
    }
  }

  const result = await checkNoShows(mockSupabaseClient)
  
  assertEquals(result.processed, 1)
})

// Utility function test
import { calculateNoShowCount } from '../utils/noShowUtils'

describe('calculateNoShowCount', () => {
  test('counts only no-shows within 30-day window', () => {
    const now = new Date()
    const noShows = [
      { recorded_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) }, // 5 days ago
      { recorded_at: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000) }, // 15 days ago
      { recorded_at: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000) }  // 35 days ago (outside window)
    ]
    
    const count = calculateNoShowCount(noShows, now)
    
    expect(count).toBe(2) // Only the two within 30 days
  })

  test('returns 0 for empty no-show list', () => {
    const count = calculateNoShowCount([], new Date())
    expect(count).toBe(0)
  })
})

// State management test
import { useBookingStore } from '../stores/bookingStore'
import { renderHook, act } from '@testing-library/react'

jest.mock('../lib/supabase')

describe('useBookingStore', () => {
  test('creates booking successfully', async () => {
    const { result } = renderHook(() => useBookingStore())
    
    const mockBookingData = {
      facility_id: 'facility-1',
      booking_date: '2024-01-20',
      start_time: '14:00:00',
      end_time: '15:00:00'
    }

    await act(async () => {
      await result.current.createBooking(mockBookingData)
    })

    expect(result.current.isLoading).toBe(false)
    // Additional assertions based on expected state changes
  })
})
```

### Integration Testing

**Framework:** `Jest` with Supabase local development, `Playwright` for E2E

**Integration Test Categories:**

1. **Supabase Integration Tests:**
   - Database operations with test Supabase instance
   - Edge Function invocations
   - Real-time subscription testing
   - Authentication flow testing

2. **Email Service Integration:**
   - Email sending with mock SMTP server
   - Template rendering via Edge Functions
   - Delivery confirmation

3. **End-to-End Workflow Tests:**
   - Complete user journeys
   - Waitlist cascade testing
   - No-show detection and restriction

**Example Integration Tests:**

```typescript
// Supabase integration test
import { createClient } from '@supabase/supabase-js'

describe('Booking Integration Tests', () => {
  let supabase: any
  let testUser: any

  beforeAll(async () => {
    // Use local Supabase instance for testing
    supabase = createClient(
      process.env.SUPABASE_TEST_URL!,
      process.env.SUPABASE_TEST_ANON_KEY!
    )

    // Create test user
    const { data: authData } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword123',
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User',
          phone: '+1234567890'
        }
      }
    })
    testUser = authData.user
  })

  afterAll(async () => {
    // Cleanup test data
    await supabase.auth.signOut()
  })

  test('complete booking creation flow', async () => {
    // Create facility
    const { data: facility } = await supabase
      .from('facilities')
      .insert({
        name: 'Test Football Field',
        type: 'football_field',
        capacity: 14,
        hourly_rate: 50.00
      })
      .select()
      .single()

    // Create booking via Edge Function
    const { data: bookingResult, error } = await supabase.functions.invoke('create-booking', {
      body: {
        facility_id: facility.id,
        booking_date: '2024-02-01',
        start_time: '14:00:00',
        end_time: '15:00:00',
        player_count_confirmed: true
      }
    })

    expect(error).toBeNull()
    expect(bookingResult.booking).toBeDefined()
    expect(bookingResult.booking.confirmation_code).toBeTruthy()

    // Verify database persistence
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingResult.booking.id)
      .single()

    expect(booking).toBeTruthy()
    expect(booking.status).toBe('confirmed')
    expect(booking.user_id).toBe(testUser.id)

    // Verify email was logged
    const { data: emailLogs } = await supabase
      .from('email_logs')
      .select('*')
      .eq('user_id', testUser.id)
      .eq('email_type', 'booking_confirmation')

    expect(emailLogs).toHaveLength(1)
  })

  test('waitlist cascade integration', async () => {
    // Setup: Create facilities and users
    const { data: facility } = await supabase
      .from('facilities')
      .insert({
        name: 'Test Cascade Field',
        type: 'football_field',
        capacity: 14,
        hourly_rate: 50.00
      })
      .select()
      .single()

    // Create additional test users
    const { data: user2Auth } = await supabase.auth.signUp({
      email: 'user2@example.com',
      password: 'password123'
    })
    const { data: user3Auth } = await supabase.auth.signUp({
      email: 'user3@example.com',
      password: 'password123'
    })

    // User1 creates slot A
    const { data: slotA } = await supabase.functions.invoke('create-booking', {
      body: {
        facility_id: facility.id,
        booking_date: '2024-02-01',
        start_time: '18:00:00',
        end_time: '19:00:00'
      }
    })

    // User2 creates backup slot B and joins waitlist for slot A
    const { data: slotB } = await supabase.functions.invoke('create-booking', {
      body: {
        facility_id: facility.id,
        booking_date: '2024-02-01',
        start_time: '19:00:00',
        end_time: '20:00:00'
      }
    })

    await supabase.functions.invoke('join-waitlist', {
      body: {
        user_id: user2Auth.user.id,
        desired_booking: {
          facility_id: facility.id,
          booking_date: '2024-02-01',
          start_time: '18:00:00',
          end_time: '19:00:00'
        },
        backup_booking_id: slotB.booking.id
      }
    })

    // User3 creates backup slot C and joins waitlist for slot B
    const { data: slotC } = await supabase.functions.invoke('create-booking', {
      body: {
        facility_id: facility.id,
        booking_date: '2024-02-01',
        start_time: '20:00:00',
        end_time: '21:00:00'
      }
    })

    await supabase.functions.invoke('join-waitlist', {
      body: {
        user_id: user3Auth.user.id,
        desired_booking: {
          facility_id: facility.id,
          booking_date: '2024-02-01',
          start_time: '19:00:00',
          end_time: '20:00:00'
        },
        backup_booking_id: slotC.booking.id
      }
    })

    // Act: User1 cancels slot A
    await supabase.functions.invoke('cancel-booking', {
      body: { booking_id: slotA.booking.id }
    })

    // Wait for cascade to complete
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Assert: User2 received claim offer for slot A
    const { data: user2Waitlist } = await supabase
      .from('waitlist_entries')
      .select('*')
      .eq('user_id', user2Auth.user.id)
      .single()

    expect(user2Waitlist.status).toBe('claim_pending')
    expect(user2Waitlist.claim_token).toBeTruthy()

    // Act: User2 claims slot A
    await supabase.functions.invoke('claim-waitlist-slot', {
      body: {
        claim_token: user2Waitlist.claim_token,
        user_id: user2Auth.user.id
      }
    })

    // Wait for cascade to complete
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Assert: Slot B is cancelled (user2's backup)
    const { data: slotBAfter } = await supabase
      .from('bookings')
      .select('status')
      .eq('id', slotB.booking.id)
      .single()

    expect(slotBAfter.status).toBe('cancelled')

    // Assert: User3 received claim offer for slot B (cascade)
    const { data: user3Waitlist } = await supabase
      .from('waitlist_entries')
      .select('*')
      .eq('user_id', user3Auth.user.id)
      .single()

    expect(user3Waitlist.status).toBe('claim_pending')
    expect(user3Waitlist.claim_token).toBeTruthy()
  })
})

// Real-time integration test
describe('Real-time Integration Tests', () => {
  test('booking changes trigger real-time updates', async () => {
    const updates: any[] = []
    
    // Subscribe to booking changes
    const channel = supabase
      .channel('test-booking-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings'
      }, (payload) => {
        updates.push(payload)
      })
      .subscribe()

    // Create a booking
    await supabase.functions.invoke('create-booking', {
      body: {
        facility_id: 'test-facility',
        booking_date: '2024-02-01',
        start_time: '14:00:00',
        end_time: '15:00:00'
      }
    })

    // Wait for real-time update
    await new Promise(resolve => setTimeout(resolve, 500))

    expect(updates).toHaveLength(1)
    expect(updates[0].eventType).toBe('INSERT')
    expect(updates[0].new.status).toBe('confirmed')

    // Cleanup
    supabase.removeChannel(channel)
  })
})
```

### End-to-End Testing

**Framework:** `Playwright` for browser automation

**E2E Test Scenarios:**

1. **User Registration and Booking Flow:**
   - Register new account
   - Browse facilities
   - Create booking
   - Receive confirmation email
   - View booking in history

2. **Waitlist and Claim Flow:**
   - Join waitlist with backup booking
   - Receive claim email when slot available
   - Click claim link
   - Verify backup cancelled
   - Verify new booking confirmed

3. **Admin Management Flow:**
   - Login as admin
   - View all bookings
   - Mark booking as paid
   - Cancel user booking
   - View no-show statistics

**Example E2E Test:**

```typescript
test('complete waitlist claim flow', async ({ page, context }) => {
  // User1: Create booking for slot A
  await page.goto('/login');
  await page.fill('[name="email"]', 'user1@test.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await page.goto('/booking');
  await page.click('[data-facility="football-1"]');
  await page.click('[data-date="2024-02-01"]');
  await page.click('[data-time="14:00"]');
  await page.click('button:has-text("Confirm Booking")');
  
  await expect(page.locator('.confirmation-code')).toBeVisible();
  
  // User2: Create backup booking (slot B) and join waitlist for slot A
  await page.goto('/logout');
  await page.goto('/login');
  await page.fill('[name="email"]', 'user2@test.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Create backup booking
  await page.goto('/booking');
  await page.click('[data-facility="football-2"]');
  await page.click('[data-date="2024-02-01"]');
  await page.click('[data-time="14:00"]');
  await page.click('button:has-text("Confirm Booking")');
  
  // Join waitlist for slot A
  await page.goto('/booking');
  await page.click('[data-facility="football-1"]');
  await page.click('[data-date="2024-02-01"]');
  await page.click('[data-time="14:00"]');
  await page.click('button:has-text("Join Waitlist")');
  await page.selectOption('[name="backup_booking"]', { label: 'Football 2 - Feb 1, 14:00' });
  await page.click('button:has-text("Confirm Waitlist")');
  
  await expect(page.locator('.waitlist-position')).toContainText('Position: 1');
  
  // User1: Cancel slot A
  await page.goto('/logout');
  await page.goto('/login');
  await page.fill('[name="email"]', 'user1@test.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await page.goto('/bookings');
  await page.click('button[data-booking-id]:has-text("Cancel")');
  await page.click('button:has-text("Confirm Cancellation")');
  
  // Check email for user2 (in test environment, check database)
  const claimToken = await getClaimTokenFromDatabase('user2@test.com');
  
  // User2: Click claim link
  await page.goto(`/claim/${claimToken}`);
  await expect(page.locator('.success-message')).toContainText('Slot claimed successfully');
  
  // Verify backup booking cancelled
  await page.goto('/bookings');
  await expect(page.locator('[data-facility="football-2"]')).toContainText('Cancelled');
  
  // Verify new booking confirmed
  await expect(page.locator('[data-facility="football-1"]')).toContainText('Confirmed');
});
```

### Test Data Management

**Test Database with Supabase:**

```typescript
// tests/setup.ts
import { createClient } from '@supabase/supabase-js'

export class TestDatabase {
  private supabase: any

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_TEST_URL!,
      process.env.SUPABASE_TEST_SERVICE_ROLE_KEY!
    )
  }

  async reset() {
    // Clear all test data
    await this.supabase.from('waitlist_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await this.supabase.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await this.supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await this.supabase.from('no_show_records').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await this.supabase.from('user_profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  }

  async seedFacilities() {
    const facilities = [
      { name: 'Test Football Field 1', type: 'football_field', capacity: 14, hourly_rate: 50.00 },
      { name: 'Test Football Field 2', type: 'football_field', capacity: 14, hourly_rate: 50.00 },
      { name: 'Test Padel Court 1', type: 'padel_court', capacity: 4, hourly_rate: 40.00 }
    ]

    const { error } = await this.supabase.from('facilities').insert(facilities)
    if (error) throw error
  }

  async createUser(userData: {
    email: string
    password: string
    first_name: string
    last_name: string
    phone?: string
    is_admin?: boolean
  }) {
    // Create auth user
    const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone || '+1234567890'
      }
    })

    if (authError) throw authError

    // Create user profile
    const { data: profile, error: profileError } = await this.supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone || '+1234567890',
        is_admin: userData.is_admin || false
      })
      .select()
      .single()

    if (profileError) throw profileError

    return { ...authData.user, profile }
  }

  async cleanup() {
    await this.reset()
  }
}

// Test fixtures using Vitest
import { beforeEach, afterEach } from 'vitest'

let testDb: TestDatabase

beforeEach(async () => {
  testDb = new TestDatabase()
  await testDb.reset()
  await testDb.seedFacilities()
})

afterEach(async () => {
  await testDb.cleanup()
})

// Helper functions for tests
export async function createTestUser(overrides?: Partial<any>) {
  return testDb.createUser({
    email: 'test@example.com',
    password: 'password123',
    first_name: 'Test',
    last_name: 'User',
    ...overrides
  })
}

export async function createAdminUser(overrides?: Partial<any>) {
  return testDb.createUser({
    email: 'admin@example.com',
    password: 'admin123',
    first_name: 'Admin',
    last_name: 'User',
    is_admin: true,
    ...overrides
  })
}

export { testDb }
```

**Usage in Tests:**

```typescript
// tests/booking.test.ts
import { describe, test, expect } from 'vitest'
import { testDb, createTestUser } from './setup'
import { supabase } from '../src/lib/supabase'

describe('Booking Tests', () => {
  test('user can create a booking', async () => {
    const user = await createTestUser()

    // Get a facility
    const { data: facilities } = await supabase
      .from('facilities')
      .select('*')
      .limit(1)
      .single()

    // Create booking
    const { data: booking, error } = await supabase.functions.invoke('create-booking', {
      body: {
        facility_id: facilities.id,
        booking_date: '2024-02-01',
        start_time: '14:00:00',
        end_time: '15:00:00'
      }
    })

    expect(error).toBeNull()
    expect(booking).toBeDefined()
    expect(booking.confirmation_code).toBeTruthy()
  })

  test('admin can cancel any booking', async () => {
    const user = await createTestUser()
    const admin = await createAdminUser()

    // User creates booking
    const { data: booking } = await supabase.functions.invoke('create-booking', {
      body: {
        facility_id: 'test-facility-id',
        booking_date: '2024-02-01',
        start_time: '14:00:00',
        end_time: '15:00:00'
      }
    })

    // Admin cancels booking
    const { error } = await supabase.functions.invoke('cancel-booking', {
      body: {
        booking_id: booking.id,
        admin_override: true
      }
    })

    expect(error).toBeNull()

    // Verify booking is cancelled
    const { data: cancelledBooking } = await supabase
      .from('bookings')
      .select('status')
      .eq('id', booking.id)
      .single()

    expect(cancelledBooking.status).toBe('cancelled')
  })
})
```

### Continuous Integration

**CI Pipeline (GitHub Actions):**

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  property-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run property-based tests
        run: npm run test:property
        
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm run test:unit -- --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
        
  integration-tests:
    runs-on: ubuntu-latest
    services:
      supabase:
        image: supabase/postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install Supabase CLI
        run: npm install -g supabase
      - name: Start Supabase local
        run: supabase start
      - name: Run integration tests
        run: npm run test:integration
        env:
          SUPABASE_TEST_URL: http://localhost:54321
          SUPABASE_TEST_ANON_KEY: ${{ secrets.SUPABASE_TEST_ANON_KEY }}
        
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Run E2E tests
        run: npx playwright test
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_TEST_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_TEST_ANON_KEY }}

  edge-function-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Deno
        uses: denoland/setup-deno@v1
        with:
          deno-version: v1.x
      - name: Run Edge Function tests
        run: deno test --allow-all supabase/functions/**/*_test.ts
```

**Package.json Scripts:**

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:property": "vitest run tests/property",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch"
  }
}
```

### Test Coverage Goals

- **Property-based tests:** All 32 correctness properties implemented
- **Unit tests:** 80%+ code coverage
- **Integration tests:** All API endpoints covered
- **E2E tests:** Critical user journeys covered
- **Total test execution time:** < 10 minutes in CI


## Deployment Architecture

### Supabase + Frontend Deployment

**Architecture Overview:**
- **Frontend**: Deployed to Vercel/Netlify (static hosting)
- **Backend**: Supabase managed infrastructure
- **Database**: Supabase Database (managed PostgreSQL)
- **Edge Functions**: Supabase Edge Runtime (Deno)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage (if needed for file uploads)

### Project Structure

```
sports-complex-booking/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   └── supabase.ts
│   │   ├── types/
│   │   │   └── database.types.ts
│   │   └── stores/
│   ├── package.json
│   ├── next.config.js
│   └── .env.local
├── supabase/
│   ├── functions/
│   │   ├── waitlist-cascade/
│   │   ├── no-show-tracker/
│   │   ├── send-email/
│   │   ├── booking-validation/
│   │   └── scheduled-tasks/
│   ├── migrations/
│   │   ├── 20240101000000_initial_schema.sql
│   │   ├── 20240101000001_rls_policies.sql
│   │   └── 20240101000002_cron_jobs.sql
│   ├── seed.sql
│   └── config.toml
├── .env.example
└── README.md
```

### Supabase Configuration

**supabase/config.toml:**

```toml
[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[auth]
enabled = true
site_url = "https://yourdomain.com"
additional_redirect_urls = ["https://localhost:3000"]
jwt_expiry = 3600
refresh_token_rotation_enabled = true
security_update_password_require_reauthentication = true

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = true

[auth.sms]
enable_signup = false

[auth.external.google]
enabled = false

[db]
port = 54322
shadow_port = 54320
major_version = 15

[realtime]
enabled = true
ip_version = "IPv4"

[storage]
enabled = true
file_size_limit = "50MiB"
image_transformation = true

[edge_functions]
enabled = true
ip_version = "IPv4"

[analytics]
enabled = false
```

### Environment Variables

**.env.local (Frontend):**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Application Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_ENVIRONMENT=production

# Business Rules
NEXT_PUBLIC_CANCELLATION_WINDOW_HOURS=96
NEXT_PUBLIC_CLAIM_WINDOW_HOURS=12
NEXT_PUBLIC_FOOTBALL_MIN_PLAYERS=14
```

**Supabase Secrets (via Dashboard):**

```bash
# Email Service
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com

# Application Secrets
JWT_SECRET=your-jwt-secret-key
SERVICE_ROLE_KEY=your-service-role-key

# Business Configuration
CANCELLATION_WINDOW_HOURS=96
CLAIM_WINDOW_HOURS=12
REMINDER_HOURS_BEFORE=24
REVIEW_REQUEST_HOURS_AFTER=2
NO_SHOW_GRACE_MINUTES=15
NO_SHOW_THRESHOLD=2
NO_SHOW_LOOKBACK_DAYS=30
RESTRICTION_DURATION_DAYS=14
```

### Database Migrations

**supabase/migrations/20240101000000_initial_schema.sql:**

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

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
  
  -- Computed column for easier querying
  booking_datetime TIMESTAMPTZ GENERATED ALWAYS AS (
    (booking_date + start_time)::TIMESTAMPTZ
  ) STORED,
  
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
  desired_booking_id UUID, -- Reference to a "template" booking
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
  booking_datetime TIMESTAMPTZ NOT NULL,
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

-- Create indexes
CREATE INDEX idx_user_profiles_email ON public.user_profiles(id);
CREATE INDEX idx_user_profiles_is_restricted ON public.user_profiles(is_restricted);

CREATE INDEX idx_booking_user_id ON public.bookings(user_id);
CREATE INDEX idx_booking_facility_id ON public.bookings(facility_id);
CREATE INDEX idx_booking_date_time ON public.bookings(booking_date, start_time);
CREATE INDEX idx_booking_status ON public.bookings(status);
CREATE INDEX idx_booking_confirmation_code ON public.bookings(confirmation_code);
CREATE INDEX idx_booking_recurring_group ON public.bookings(recurring_group_id);
CREATE INDEX idx_booking_datetime ON public.bookings(booking_datetime);

CREATE INDEX idx_waitlist_user_id ON public.waitlist_entries(user_id);
CREATE INDEX idx_waitlist_desired_booking ON public.waitlist_entries(desired_booking_id);
CREATE INDEX idx_waitlist_position ON public.waitlist_entries(position);
CREATE INDEX idx_waitlist_claim_token ON public.waitlist_entries(claim_token);
CREATE INDEX idx_waitlist_status ON public.waitlist_entries(status);

CREATE INDEX idx_review_facility_id ON public.reviews(facility_id);
CREATE INDEX idx_review_user_id ON public.reviews(user_id);
CREATE INDEX idx_review_rating ON public.reviews(rating);

CREATE INDEX idx_noshow_user_id ON public.no_show_records(user_id);
CREATE INDEX idx_noshow_booking_datetime ON public.no_show_records(booking_datetime);
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
```

### Deployment Steps

**Initial Supabase Setup:**

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Initialize project
supabase init

# 4. Link to remote project
supabase link --project-ref your-project-ref

# 5. Push database migrations
supabase db push

# 6. Deploy Edge Functions
supabase functions deploy waitlist-cascade
supabase functions deploy no-show-tracker
supabase functions deploy send-email
supabase functions deploy booking-validation
supabase functions deploy scheduled-tasks

# 7. Set secrets
supabase secrets set SENDGRID_API_KEY=your-key
supabase secrets set SENDGRID_FROM_EMAIL=noreply@yourdomain.com
supabase secrets set ADMIN_EMAIL=admin@yourdomain.com

# 8. Seed initial data
supabase db reset --linked
```

**Frontend Deployment (Vercel):**

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy to Vercel
vercel --prod

# 3. Set environment variables in Vercel dashboard
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# NEXT_PUBLIC_APP_URL
```

**Database Seeding:**

```sql
-- supabase/seed.sql
-- Insert facilities
INSERT INTO public.facilities (name, type, capacity, hourly_rate) VALUES
('Football Field 1', 'football_field', 14, 50.00),
('Football Field 2', 'football_field', 14, 50.00),
('Football Field 3', 'football_field', 14, 50.00),
('Football Field 4', 'football_field', 14, 50.00),
('Football Field 5', 'football_field', 14, 50.00),
('Football Field 6', 'football_field', 14, 50.00),
('Padel Court 1', 'padel_court', 4, 40.00),
('Padel Court 2', 'padel_court', 4, 40.00);

-- Create admin user (will be created via auth, then profile updated)
-- This would be done through the application after initial deployment
```

**Monitoring and Logs:**

```bash
# View Edge Function logs
supabase functions logs waitlist-cascade

# View database logs
supabase logs db

# Monitor real-time connections
supabase logs realtime

# Check function invocations
supabase functions list
```

### Scaling Considerations

**Supabase Scaling:**

1. **Database Scaling:**
   - Supabase automatically handles connection pooling
   - Upgrade to larger database instances as needed
   - Use read replicas for read-heavy workloads

2. **Edge Functions Scaling:**
   - Supabase Edge Functions auto-scale based on demand
   - Monitor function execution times and memory usage
   - Optimize function code for better performance

3. **Real-time Scaling:**
   - Supabase Realtime handles scaling automatically
   - Monitor concurrent connections
   - Use channel-based filtering to reduce load

**Frontend Scaling:**

1. **CDN and Caching:**
   - Vercel provides global CDN automatically
   - Implement proper caching headers
   - Use ISR (Incremental Static Regeneration) for dynamic content

2. **Performance Optimization:**
   - Code splitting and lazy loading
   - Image optimization
   - Bundle size optimization

### Backup and Recovery

**Database Backups:**

```bash
# Supabase provides automatic daily backups
# Manual backup
supabase db dump --file backup.sql

# Restore from backup
supabase db reset --linked
psql -h db.your-project.supabase.co -U postgres -d postgres -f backup.sql
```

**Point-in-Time Recovery:**
- Supabase Pro plans include point-in-time recovery
- Can restore to any point within the last 7 days
- Managed through Supabase dashboard

### Monitoring and Alerting

**Supabase Dashboard Monitoring:**
- Database performance metrics
- API usage and response times
- Edge Function execution metrics
- Real-time connection counts
- Authentication metrics

**Custom Monitoring:**

```typescript
// Add monitoring to Edge Functions
export async function monitoredFunction(req: Request) {
  const startTime = Date.now()
  
  try {
    const result = await yourFunction(req)
    
    // Log success metrics
    console.log({
      function: 'your-function',
      duration: Date.now() - startTime,
      status: 'success'
    })
    
    return result
  } catch (error) {
    // Log error metrics
    console.error({
      function: 'your-function',
      duration: Date.now() - startTime,
      status: 'error',
      error: error.message
    })
    
    throw error
  }
}
```

**Health Checks:**

```typescript
// supabase/functions/health-check/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Test database connection
    const { data, error } = await supabaseClient
      .from('facilities')
      .select('count')
      .limit(1)

    if (error) throw error

    return new Response(
      JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'up',
          functions: 'up'
        }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})
```

## UI/UX Implementation Details

### Animation Strategy

**Framer Motion Configuration:**

```typescript
// Animation variants
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const scaleIn = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 0.2 }
};

// Hero section animation
<motion.div
  initial="initial"
  animate="animate"
  variants={staggerContainer}
>
  <motion.h1 variants={fadeInUp}>
    Book Your Game
  </motion.h1>
  <motion.p variants={fadeInUp}>
    6 Football Fields • 2 Padel Courts
  </motion.p>
  <motion.button variants={scaleIn}>
    Book Now
  </motion.button>
</motion.div>
```

**Scroll Animations (AOS):**

```typescript
// Initialize AOS
import AOS from 'aos';
import 'aos/dist/aos.css';

useEffect(() => {
  AOS.init({
    duration: 800,
    once: true,
    offset: 100
  });
}, []);

// Apply to components
<div data-aos="fade-up" data-aos-delay="100">
  <FacilityCard />
</div>
```

**Micro-interactions:**

```typescript
// Button hover effect
const buttonVariants = {
  hover: {
    scale: 1.05,
    boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.95 }
};

<motion.button
  variants={buttonVariants}
  whileHover="hover"
  whileTap="tap"
>
  Book Now
</motion.button>
```

### Theme Implementation

**Tailwind Configuration:**

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Football green theme
        football: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          900: '#14532d'
        },
        // Padel blue theme
        padel: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a'
        }
      },
      backgroundImage: {
        'gradient-football': 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
        'gradient-padel': 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
      },
      backdropBlur: {
        xs: '2px'
      }
    }
  }
};
```

**Theme Context:**

```typescript
// ThemeContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
```

**Glass-morphism Components:**

```typescript
// GlassCard.tsx
export function GlassCard({ children, className = '' }: Props) {
  return (
    <div className={`
      backdrop-blur-md bg-white/10 dark:bg-black/10
      border border-white/20 dark:border-white/10
      rounded-xl shadow-xl
      ${className}
    `}>
      {children}
    </div>
  );
}
```

### Responsive Design

**Breakpoints:**

```typescript
// Mobile: < 640px
// Tablet: 640px - 1024px
// Desktop: > 1024px

// Example responsive component
<div className="
  grid grid-cols-1 gap-4
  md:grid-cols-2 md:gap-6
  lg:grid-cols-3 lg:gap-8
">
  {facilities.map(facility => (
    <FacilityCard key={facility.id} facility={facility} />
  ))}
</div>
```

**Mobile Optimizations:**

```typescript
// Touch-friendly button sizes
<button className="
  min-h-[44px] min-w-[44px]
  px-6 py-3
  text-base
">
  Book Now
</button>

// Mobile navigation
<nav className="
  fixed bottom-0 left-0 right-0
  md:static
  bg-white dark:bg-gray-900
  border-t md:border-t-0
  z-50
">
  {/* Navigation items */}
</nav>
```

## Security Considerations

### Input Validation

**TypeScript Validation with Zod:**

```typescript
// supabase/functions/_shared/validation.ts
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

export const BookingCreateSchema = z.object({
  facility_id: z.string().uuid(),
  booking_date: z.string().refine((date) => {
    const bookingDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 90)
    
    return bookingDate >= today && bookingDate <= maxDate
  }, {
    message: 'Booking date must be between today and 90 days in the future'
  }),
  start_time: z.string().regex(/^([0-1][0-9]|2[0-3]):00:00$/, {
    message: 'Start time must be on hourly boundaries (e.g., 14:00:00)'
  }),
  end_time: z.string().regex(/^([0-1][0-9]|2[0-3]):00:00$/, {
    message: 'End time must be on hourly boundaries (e.g., 15:00:00)'
  }),
  player_count_confirmed: z.boolean().optional().default(false)
}).refine((data) => {
  const start = parseInt(data.start_time.split(':')[0])
  const end = parseInt(data.end_time.split(':')[0])
  return end > start
}, {
  message: 'End time must be after start time',
  path: ['end_time']
})

export type BookingCreate = z.infer<typeof BookingCreateSchema>

// Usage in Edge Function
import { BookingCreateSchema } from '../_shared/validation.ts'

serve(async (req) => {
  try {
    const body = await req.json()
    
    // Validate input
    const validatedData = BookingCreateSchema.parse(body)
    
    // Process validated data...
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors
          }
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    throw error
  }
})
```

**Additional Validation Schemas:**

```typescript
export const UserRegistrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  first_name: z.string().min(1).max(50),
  last_name: z.string().min(1).max(50),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, {
    message: 'Invalid phone number format'
  })
})

export const WaitlistJoinSchema = z.object({
  user_id: z.string().uuid(),
  desired_booking: z.object({
    facility_id: z.string().uuid(),
    booking_date: z.string(),
    start_time: z.string(),
    end_time: z.string()
  }),
  backup_booking_id: z.string().uuid()
})

export const ReviewCreateSchema = z.object({
  facility_id: z.string().uuid(),
  booking_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional()
})
```

### Rate Limiting

**Supabase Edge Functions Rate Limiting:**

```typescript
// supabase/functions/_shared/rate-limit.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

export class RateLimiter {
  constructor(
    private supabaseClient: any,
    private config: RateLimitConfig
  ) {}

  async checkLimit(identifier: string, endpoint: string): Promise<boolean> {
    const key = `ratelimit:${endpoint}:${identifier}`
    const now = Date.now()
    const windowStart = now - this.config.windowMs

    // Get recent requests from database
    const { data: requests, error } = await this.supabaseClient
      .from('rate_limit_log')
      .select('created_at')
      .eq('key', key)
      .gte('created_at', new Date(windowStart).toISOString())

    if (error) throw error

    if (requests && requests.length >= this.config.maxRequests) {
      return false // Rate limit exceeded
    }

    // Log this request
    await this.supabaseClient
      .from('rate_limit_log')
      .insert({
        key,
        endpoint,
        identifier,
        created_at: new Date(now).toISOString()
      })

    return true // Within rate limit
  }
}

// Usage in Edge Function
import { RateLimiter } from '../_shared/rate-limit.ts'

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Get user identifier (IP or user ID)
  const authHeader = req.headers.get('Authorization')
  const identifier = authHeader || req.headers.get('x-forwarded-for') || 'anonymous'

  // Check rate limit
  const rateLimiter = new RateLimiter(supabaseClient, {
    maxRequests: 10,
    windowMs: 60 * 1000 // 1 minute
  })

  const allowed = await rateLimiter.checkLimit(identifier, 'create-booking')

  if (!allowed) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          retry_after: 60
        }
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60'
        }
      }
    )
  }

  // Process request...
})
```

**Alternative: Using Supabase Edge Function Middleware:**

```typescript
// supabase/functions/_shared/middleware.ts
export function withRateLimit(
  handler: (req: Request) => Promise<Response>,
  config: RateLimitConfig
) {
  return async (req: Request): Promise<Response> => {
    const rateLimiter = new RateLimiter(supabaseClient, config)
    const identifier = getIdentifier(req)
    const endpoint = new URL(req.url).pathname

    const allowed = await rateLimiter.checkLimit(identifier, endpoint)

    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests'
          }
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return handler(req)
  }
}

// Usage
serve(withRateLimit(async (req) => {
  // Your handler logic
}, { maxRequests: 5, windowMs: 60000 }))
```

### SQL Injection Prevention

**Supabase Automatic Protection:**

Supabase's auto-generated REST API and client libraries use parameterized queries automatically, preventing SQL injection:

```typescript
// SAFE: Supabase client uses parameterized queries
const { data, error } = await supabase
  .from('bookings')
  .select('*')
  .eq('user_id', userId) // Automatically parameterized

// SAFE: Edge Functions with Supabase client
const { data, error } = await supabaseClient
  .from('bookings')
  .insert({
    user_id: userId,
    facility_id: facilityId,
    booking_date: date
  }) // All values are automatically escaped

// DANGEROUS (never do this): Raw SQL without parameterization
// const query = `SELECT * FROM bookings WHERE user_id = '${userId}'`
// This is vulnerable to SQL injection!

// SAFE: If you must use raw SQL, use parameterized queries
const { data, error } = await supabaseClient.rpc('custom_function', {
  p_user_id: userId,
  p_facility_id: facilityId
})
```

**Row Level Security (RLS) as Additional Protection:**

```sql
-- RLS policies prevent unauthorized data access even if SQL injection occurs
CREATE POLICY "Users can only view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

-- This ensures that even if an attacker manipulates a query,
-- they can only access data they're authorized to see
```

### CSRF Protection

**Supabase CSRF Protection:**

Supabase handles CSRF protection automatically through its authentication system:

```typescript
// Supabase uses JWT tokens in Authorization headers, not cookies
// This makes it immune to CSRF attacks by default

// Frontend: Token is sent in Authorization header
const { data, error } = await supabase.functions.invoke('create-booking', {
  body: bookingData
  // Supabase client automatically adds: Authorization: Bearer <jwt-token>
})

// Edge Function: Verify JWT token
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Get JWT from Authorization header
  const authHeader = req.headers.get('Authorization')
  
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Missing authorization' } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Supabase automatically validates JWT when using the client
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: authHeader }
      }
    }
  )

  // Get authenticated user
  const { data: { user }, error } = await supabaseClient.auth.getUser()

  if (error || !user) {
    return new Response(
      JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // User is authenticated, proceed with request
  // ...
})
```

**Additional Security Headers:**

```typescript
// Add security headers to Edge Function responses
export function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers)
  
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('X-XSS-Protection', '1; mode=block')
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  headers.set('Content-Security-Policy', "default-src 'self'")

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}

// Usage
serve(async (req) => {
  const response = await handleRequest(req)
  return addSecurityHeaders(response)
})
```

## Performance Optimization

### Database Query Optimization

**Supabase Query Optimization:**

```typescript
// Use select() to fetch only needed columns
const { data: bookings } = await supabase
  .from('bookings')
  .select('id, booking_date, start_time, status')
  .eq('user_id', userId)

// Use joins to prevent N+1 queries
const { data: bookings } = await supabase
  .from('bookings')
  .select(`
    *,
    facilities (
      id,
      name,
      type
    ),
    user_profiles (
      first_name,
      last_name
    )
  `)
  .eq('user_id', userId)

// Use indexes for common queries (defined in migration)
// CREATE INDEX idx_booking_facility_date ON bookings(facility_id, booking_date);

// Use composite indexes for complex queries
const { data: availability } = await supabase
  .from('bookings')
  .select('start_time, end_time')
  .eq('facility_id', facilityId)
  .eq('booking_date', date)
  .eq('status', 'confirmed')
  // This query benefits from idx_booking_facility_date index

// Use .range() for pagination
const { data: bookings, count } = await supabase
  .from('bookings')
  .select('*', { count: 'exact' })
  .eq('user_id', userId)
  .order('booking_date', { ascending: false })
  .range(offset, offset + limit - 1)

// Use .limit() when you don't need pagination
const { data: recentBookings } = await supabase
  .from('bookings')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(10)
```

**Database Function for Complex Queries:**

```sql
-- Create a database function for complex availability calculation
CREATE OR REPLACE FUNCTION get_facility_availability(
  p_facility_id UUID,
  p_date DATE
)
RETURNS TABLE (
  time_slot TEXT,
  status TEXT,
  booking_id UUID
) AS $
BEGIN
  RETURN QUERY
  WITH time_slots AS (
    SELECT generate_series(8, 21) AS hour
  ),
  bookings_on_date AS (
    SELECT 
      EXTRACT(HOUR FROM start_time)::INTEGER AS start_hour,
      id AS booking_id,
      status
    FROM bookings
    WHERE facility_id = p_facility_id
      AND booking_date = p_date
      AND status IN ('confirmed', 'pending_payment')
  )
  SELECT 
    ts.hour::TEXT || ':00' AS time_slot,
    COALESCE(b.status::TEXT, 'available') AS status,
    b.booking_id
  FROM time_slots ts
  LEFT JOIN bookings_on_date b ON ts.hour = b.start_hour
  ORDER BY ts.hour;
END;
$ LANGUAGE plpgsql;

-- Call from Edge Function
const { data, error } = await supabaseClient.rpc('get_facility_availability', {
  p_facility_id: facilityId,
  p_date: date
})
```

### Caching Strategy

**Supabase Caching with Edge Functions:**

```typescript
// supabase/functions/_shared/cache.ts
interface CacheEntry<T> {
  data: T
  expiresAt: number
}

export class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()

  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data as T
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }
}

// Global cache instance (persists across function invocations)
const cache = new MemoryCache()

// Usage in Edge Function
import { cache } from '../_shared/cache.ts'

serve(async (req) => {
  const { facility_id, date } = await req.json()
  const cacheKey = `availability:${facility_id}:${date}`

  // Check cache first
  const cached = cache.get(cacheKey)
  if (cached) {
    return new Response(
      JSON.stringify({ data: cached, cached: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Calculate availability
  const availability = await calculateAvailability(facility_id, date)

  // Cache for 1 minute
  cache.set(cacheKey, availability, 60)

  return new Response(
    JSON.stringify({ data: availability, cached: false }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

**Cache Invalidation:**

```typescript
// Invalidate cache when booking is created or cancelled
async function createBooking(bookingData: BookingCreate) {
  const { data: booking, error } = await supabaseClient
    .from('bookings')
    .insert(bookingData)
    .select()
    .single()

  if (error) throw error

  // Invalidate availability cache
  const cacheKey = `availability:${booking.facility_id}:${booking.booking_date}`
  cache.delete(cacheKey)

  return booking
}

async function cancelBooking(bookingId: string) {
  // Get booking details first
  const { data: booking } = await supabaseClient
    .from('bookings')
    .select('facility_id, booking_date')
    .eq('id', bookingId)
    .single()

  // Cancel booking
  const { error } = await supabaseClient
    .from('bookings')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', bookingId)

  if (error) throw error

  // Invalidate cache
  if (booking) {
    const cacheKey = `availability:${booking.facility_id}:${booking.booking_date}`
    cache.delete(cacheKey)
  }
}
```

**Frontend Caching with React Query:**

```typescript
// hooks/useAvailability.ts
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useAvailability(facilityId: string, date: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['availability', facilityId, date],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-facility-availability', {
        body: { facility_id: facilityId, date }
      })
      
      if (error) throw error
      return data
    },
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
    cacheTime: 5 * 60 * 1000 // Keep in cache for 5 minutes
  })

  const invalidate = () => {
    queryClient.invalidateQueries(['availability', facilityId, date])
  }

  return { ...query, invalidate }
}

// Usage in component
function BookingCalendar({ facilityId, date }: Props) {
  const { data: availability, isLoading, invalidate } = useAvailability(facilityId, date)

  const handleBookingCreated = () => {
    // Invalidate cache after booking
    invalidate()
  }

  // ...
}
```

### Frontend Performance

```typescript
// Code splitting
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const BookingCalendar = lazy(() => import('./components/BookingCalendar'));

// Memoization
const MemoizedFacilityCard = memo(FacilityCard);

// Virtual scrolling for long lists
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={bookings.length}
  itemSize={80}
>
  {({ index, style }) => (
    <div style={style}>
      <BookingItem booking={bookings[index]} />
    </div>
  )}
</FixedSizeList>
```

## Conclusion

This design document provides a comprehensive technical blueprint for the Sports Complex Booking System. The architecture emphasizes:

1. **Correctness**: 32 property-based tests ensure system behavior is correct across all inputs
2. **Scalability**: Docker-based deployment with horizontal scaling capabilities
3. **User Experience**: Modern, animated UI with light/dark mode optimized for mobile
4. **Reliability**: Comprehensive error handling, logging, and monitoring
5. **Security**: Input validation, rate limiting, and secure authentication
6. **Maintainability**: Clear separation of concerns, well-documented APIs, and extensive test coverage

The system is designed to handle the complex waitlist cascade logic, no-show tracking, and email notifications while providing a delightful user experience for booking sports facilities.

