import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user from the auth header
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { facility_id, booking_date, start_time, end_time } = await req.json()

    // Validate required fields
    if (!facility_id || !booking_date || !start_time || !end_time) {
      throw new Error('Missing required fields')
    }

    // Check if user is restricted
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('is_restricted, restriction_end_date')
      .eq('id', user.id)
      .single()

    if (profileError) throw profileError

    if (profile.is_restricted) {
      const restrictionEnd = profile.restriction_end_date
        ? new Date(profile.restriction_end_date)
        : null
      if (!restrictionEnd || restrictionEnd > new Date()) {
        throw new Error('Your account is restricted from making bookings')
      }
    }

    // Check for double booking
    const { data: existingBookings, error: checkError } = await supabaseClient
      .from('bookings')
      .select('id')
      .eq('facility_id', facility_id)
      .eq('booking_date', booking_date)
      .eq('start_time', start_time)
      .in('status', ['confirmed', 'pending_payment'])

    if (checkError) throw checkError

    if (existingBookings && existingBookings.length > 0) {
      throw new Error('This time slot is already booked')
    }

    // Generate confirmation code
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substr(2, 6).toUpperCase()
    const confirmationCode = `BK-${timestamp}-${random}`

    // Create booking
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .insert({
        user_id: user.id,
        facility_id,
        booking_date,
        start_time,
        end_time,
        confirmation_code: confirmationCode,
        status: 'confirmed',
        is_paid: false,
      })
      .select(`
        *,
        facility:facilities(name, type, hourly_rate)
      `)
      .single()

    if (bookingError) throw bookingError

    return new Response(
      JSON.stringify({
        success: true,
        booking,
        message: 'Booking created successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
