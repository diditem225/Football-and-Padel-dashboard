import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CANCELLATION_WINDOW_HOURS = 96

serve(async (req) => {
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

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { booking_id } = await req.json()

    if (!booking_id) {
      throw new Error('Booking ID is required')
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*, user_profiles!inner(is_admin)')
      .eq('id', booking_id)
      .single()

    if (bookingError) throw bookingError

    if (!booking) {
      throw new Error('Booking not found')
    }

    // Check if user owns the booking or is admin
    const isAdmin = booking.user_profiles?.is_admin || false
    const isOwner = booking.user_id === user.id

    if (!isOwner && !isAdmin) {
      throw new Error('You do not have permission to cancel this booking')
    }

    // Check cancellation window (skip for admins)
    if (!isAdmin) {
      const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`)
      const now = new Date()
      const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

      if (hoursUntilBooking < CANCELLATION_WINDOW_HOURS) {
        throw new Error(
          `Bookings can only be cancelled at least ${CANCELLATION_WINDOW_HOURS} hours in advance`
        )
      }
    }

    // Cancel the booking
    const { error: updateError } = await supabaseClient
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', booking_id)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Booking cancelled successfully',
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
