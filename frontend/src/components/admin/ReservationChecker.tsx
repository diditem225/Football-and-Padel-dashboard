import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

interface BookingDetails {
  booking_id: string
  user_name: string
  facility_name: string
  booking_date: string
  start_time: string
  end_time: string
  status: string
  is_paid: boolean
  already_checked_in: boolean
}

const ReservationChecker = () => {
  const [confirmationCode, setConfirmationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null)
  const [isCheckingIn, setIsCheckingIn] = useState(false)

  const validateCode = async () => {
    if (!confirmationCode.trim()) {
      toast.error('Please enter a confirmation code')
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .rpc('validate_booking_code', { confirmation_code: confirmationCode.trim() })

      if (error) throw error

      if (!data || data.length === 0) {
        toast.error('Invalid confirmation code')
        setBookingDetails(null)
        return
      }

      const booking = data[0]
      setBookingDetails(booking)

      if (booking.already_checked_in) {
        toast.success('✅ Valid booking - Already checked in')
      } else if (booking.status !== 'confirmed') {
        toast.warning('⚠️ Valid booking but not confirmed')
      } else if (!booking.is_paid) {
        toast.warning('⚠️ Valid booking but payment pending')
      } else {
        toast.success('✅ Valid booking - Ready for check-in')
      }
    } catch (error) {
      console.error('Error validating code:', error)
      toast.error('Failed to validate confirmation code')
      setBookingDetails(null)
    } finally {
      setIsLoading(false)
    }
  }

  const checkInBooking = async () => {
    if (!bookingDetails) return

    setIsCheckingIn(true)
    try {
      const { error } = await supabase
        .from('booking_checkins')
        .insert({
          booking_id: bookingDetails.booking_id,
          notes: `Checked in via admin dashboard at ${new Date().toLocaleString()}`
        })

      if (error) throw error

      toast.success('Customer checked in successfully!')
      
      // Refresh booking details
      await validateCode()
    } catch (error) {
      console.error('Error checking in:', error)
      toast.error('Failed to check in customer')
    } finally {
      setIsCheckingIn(false)
    }
  }

  const formatTime = (time: string) => {
    return time.slice(0, 5) // Remove seconds
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Reservation Checker
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Validate booking confirmation codes for customer arrivals
          </p>
        </div>
      </div>

      {/* Code Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Enter Confirmation Code
        </h2>
        
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value.toUpperCase())}
              placeholder="Enter booking confirmation code"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              onKeyPress={(e) => e.key === 'Enter' && validateCode()}
            />
          </div>
          <button
            onClick={validateCode}
            disabled={isLoading || !confirmationCode.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Validating...' : 'Validate'}
          </button>
        </div>
      </motion.div>

      {/* Booking Details */}
      {bookingDetails && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Booking Details
            </h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(bookingDetails.status)}`}>
              {bookingDetails.status.charAt(0).toUpperCase() + bookingDetails.status.slice(1)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Customer Name
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {bookingDetails.user_name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Facility
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {bookingDetails.facility_name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Date
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatDate(bookingDetails.booking_date)}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Time Slot
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatTime(bookingDetails.start_time)} - {formatTime(bookingDetails.end_time)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Payment Status
                </label>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  bookingDetails.is_paid 
                    ? 'text-green-600 bg-green-100' 
                    : 'text-red-600 bg-red-100'
                }`}>
                  {bookingDetails.is_paid ? 'Paid' : 'Pending Payment'}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Check-in Status
                </label>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  bookingDetails.already_checked_in 
                    ? 'text-green-600 bg-green-100' 
                    : 'text-yellow-600 bg-yellow-100'
                }`}>
                  {bookingDetails.already_checked_in ? 'Already Checked In' : 'Not Checked In'}
                </span>
              </div>
            </div>
          </div>

          {/* Check-in Button */}
          {!bookingDetails.already_checked_in && bookingDetails.status === 'confirmed' && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={checkInBooking}
                disabled={isCheckingIn}
                className="w-full md:w-auto px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCheckingIn ? 'Checking In...' : 'Check In Customer'}
              </button>
            </div>
          )}

          {/* Warnings */}
          {bookingDetails.status !== 'confirmed' && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                ⚠️ This booking is not confirmed. Please verify with the customer before allowing access.
              </p>
            </div>
          )}

          {!bookingDetails.is_paid && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200 text-sm">
                💳 Payment is still pending. Please collect payment before allowing access.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800"
      >
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          How to Use
        </h3>
        <ul className="space-y-2 text-blue-800 dark:text-blue-200 text-sm">
          <li>• Ask customers for their booking confirmation code</li>
          <li>• Enter the code above and click "Validate"</li>
          <li>• Verify the booking details match the customer's information</li>
          <li>• Check payment status before allowing facility access</li>
          <li>• Click "Check In Customer" to record their arrival</li>
        </ul>
      </motion.div>
    </div>
  )
}

export default ReservationChecker