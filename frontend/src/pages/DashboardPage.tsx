import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { BookingWithDetails } from '../types/database.types'
import toast from 'react-hot-toast'

const DashboardPage = () => {
  const { user } = useAuth()
  const [upcomingBookings, setUpcomingBookings] = useState<BookingWithDetails[]>([])
  const [pastBookings, setPastBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchBookings()
    }
  }, [user])

  // Subscribe to real-time booking updates
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('user-bookings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchBookings()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const fetchBookings = async () => {
    if (!user) return

    try {
      const today = new Date().toISOString().split('T')[0]

      // Fetch upcoming bookings
      const { data: upcoming, error: upcomingError } = await supabase
        .from('bookings')
        .select(`
          *,
          facility:facilities(*)
        `)
        .eq('user_id', user.id)
        .gte('booking_date', today)
        .in('status', ['confirmed', 'pending_payment'])
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true })

      if (upcomingError) throw upcomingError

      // Fetch past bookings
      const { data: past, error: pastError } = await supabase
        .from('bookings')
        .select(`
          *,
          facility:facilities(*)
        `)
        .eq('user_id', user.id)
        .lt('booking_date', today)
        .order('booking_date', { ascending: false })
        .order('start_time', { ascending: false })
        .limit(10)

      if (pastError) throw pastError

      setUpcomingBookings(upcoming || [])
      setPastBookings(past || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (error) throw error

      toast.success('Booking cancelled successfully')
      fetchBookings()
    } catch (error: any) {
      console.error('Error cancelling booking:', error)
      toast.error(error.message || 'Failed to cancel booking')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      pending_payment: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-8">
            My <span className="text-green-600 dark:text-green-400">Dashboard</span>
          </h1>

          {/* Upcoming Bookings */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Upcoming Bookings
            </h2>
            {upcomingBookings.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-lg">
                <p className="text-gray-600 dark:text-gray-400">
                  No upcoming bookings. <a href="/booking" className="text-green-600 hover:underline">Book now!</a>
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {upcomingBookings.map((booking, index) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {booking.facility?.name}
                          </h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <div className="space-y-1 text-gray-600 dark:text-gray-400">
                          <p className="flex items-center gap-2">
                            <span>📅</span>
                            {new Date(booking.booking_date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="flex items-center gap-2">
                            <span>🕐</span>
                            {booking.start_time} - {booking.end_time}
                          </p>
                          <p className="flex items-center gap-2">
                            <span>🎫</span>
                            <span className="font-mono text-sm">{booking.confirmation_code}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                        >
                          Cancel Booking
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Past Bookings */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Past Bookings
            </h2>
            {pastBookings.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-lg">
                <p className="text-gray-600 dark:text-gray-400">No past bookings</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pastBookings.map((booking, index) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg opacity-75"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {booking.facility?.name}
                          </h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <div className="space-y-1 text-gray-600 dark:text-gray-400">
                          <p className="flex items-center gap-2">
                            <span>📅</span>
                            {new Date(booking.booking_date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="flex items-center gap-2">
                            <span>🕐</span>
                            {booking.start_time} - {booking.end_time}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}

export default DashboardPage
