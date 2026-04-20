import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { Database } from '../types/database.types'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

type Facility = Database['public']['Tables']['facilities']['Row']
type Booking = Database['public']['Tables']['bookings']['Row']

interface TimeSlot {
  time: string
  available: boolean
  bookingId?: string
}

interface BookingCalendarProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
}

export default function BookingCalendar({ selectedDate, onDateChange }: BookingCalendarProps) {
  const { user } = useAuth()
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<{ facilityId: string; time: string } | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)

  // Generate time slots from 8 AM to 11 PM
  const timeSlots = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 8
    return `${hour.toString().padStart(2, '0')}:00`
  })

  // Fetch facilities
  useEffect(() => {
    fetchFacilities()
  }, [])

  // Fetch bookings for selected date
  useEffect(() => {
    if (selectedDate) {
      fetchBookings()
    }
  }, [selectedDate])

  // Subscribe to real-time booking updates
  useEffect(() => {
    const channel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `booking_date=eq.${selectedDate.toISOString().split('T')[0]}`,
        },
        () => {
          fetchBookings()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedDate])

  const fetchFacilities = async () => {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setFacilities(data || [])
    } catch (error) {
      console.error('Error fetching facilities:', error)
      toast.error('Failed to load facilities')
    } finally {
      setLoading(false)
    }
  }

  const fetchBookings = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_date', dateStr)
        .in('status', ['confirmed', 'pending_payment'])

      if (error) throw error
      setBookings(data || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
    }
  }

  const isSlotBooked = (facilityId: string, time: string): boolean => {
    return bookings.some(
      (booking) =>
        booking.facility_id === facilityId &&
        booking.start_time === time
    )
  }

  const handleSlotClick = (facilityId: string, time: string) => {
    if (!user) {
      toast.error('Please sign in to book a slot')
      return
    }

    if (isSlotBooked(facilityId, time)) {
      toast.error('This slot is already booked')
      return
    }

    setSelectedSlot({ facilityId, time })
    setShowBookingModal(true)
  }

  const handleBooking = async () => {
    if (!selectedSlot || !user) return

    try {
      const facility = facilities.find((f) => f.id === selectedSlot.facilityId)
      if (!facility) return

      const startTime = selectedSlot.time
      const endHour = parseInt(startTime.split(':')[0]) + 1
      const endTime = `${endHour.toString().padStart(2, '0')}:00`

      // Generate confirmation code
      const confirmationCode = `${facility.type.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          facility_id: selectedSlot.facilityId,
          booking_date: selectedDate.toISOString().split('T')[0],
          start_time: startTime,
          end_time: endTime,
          confirmation_code: confirmationCode,
          status: 'confirmed',
        })
        .select()
        .single()

      if (error) throw error

      toast.success(`Booking confirmed! Code: ${confirmationCode}`)
      setShowBookingModal(false)
      setSelectedSlot(null)
      fetchBookings()
    } catch (error: any) {
      console.error('Error creating booking:', error)
      toast.error(error.message || 'Failed to create booking')
    }
  }

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    onDateChange(newDate)
  }

  const goToNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    onDateChange(newDate)
  }

  const goToToday = () => {
    onDateChange(new Date())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
        <button
          onClick={goToPreviousDay}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          ← Previous
        </button>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h2>
          <button
            onClick={goToToday}
            className="text-sm text-green-600 dark:text-green-400 hover:underline mt-1"
          >
            Go to Today
          </button>
        </div>

        <button
          onClick={goToNextDay}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Next →
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 sticky left-0 bg-gray-50 dark:bg-gray-700 z-10">
                  Time
                </th>
                {facilities.map((facility) => (
                  <th
                    key={facility.id}
                    className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[150px]"
                  >
                    <div>{facility.name}</div>
                    <div className="text-xs font-normal text-gray-500 dark:text-gray-400">
                      {facility.type === 'football_field' ? '⚽ Football' : '🎾 Padel'} • ${facility.hourly_rate}/hr
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((time) => (
                <tr key={time} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800 z-10">
                    {time}
                  </td>
                  {facilities.map((facility) => {
                    const booked = isSlotBooked(facility.id, time)
                    return (
                      <td key={`${facility.id}-${time}`} className="px-2 py-2">
                        <motion.button
                          whileHover={{ scale: booked ? 1 : 1.05 }}
                          whileTap={{ scale: booked ? 1 : 0.95 }}
                          onClick={() => handleSlotClick(facility.id, time)}
                          disabled={booked}
                          className={`w-full h-12 rounded-lg font-medium text-sm transition-all ${
                            booked
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 cursor-not-allowed'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 cursor-pointer'
                          }`}
                        >
                          {booked ? 'Booked' : 'Available'}
                        </motion.button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Confirmation Modal */}
      <AnimatePresence>
        {showBookingModal && selectedSlot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowBookingModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Confirm Booking
              </h3>
              
              {(() => {
                const facility = facilities.find((f) => f.id === selectedSlot.facilityId)
                const startHour = parseInt(selectedSlot.time.split(':')[0])
                const endTime = `${(startHour + 1).toString().padStart(2, '0')}:00`
                
                return (
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Facility</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {facility?.name}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Date & Time</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedDate.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-md text-gray-700 dark:text-gray-300">
                        {selectedSlot.time} - {endTime}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Price</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        ${facility?.hourly_rate}
                      </p>
                    </div>
                  </div>
                )
              })()}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBooking}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Confirm Booking
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
