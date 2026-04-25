import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

interface Booking {
  id: string
  confirmation_code: string
  user_id: string
  facility_id: string
  booking_date: string
  start_time: string
  end_time: string
  status: 'confirmed' | 'pending_payment' | 'cancelled' | 'completed' | null
  is_paid: boolean | null
  created_at: string | null
  user_profiles?: {
    first_name: string
    last_name: string
    phone: string | null
  }
  facilities?: {
    name: string
    type: string
    hourly_rate: number
  }
}

interface BookingStats {
  totalBookings: number
  revenueThisMonth: number
  activeFacilities: number
  registeredUsers: number
  todayBookings: number
  pendingPayments: number
}

const BookingsManager = () => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled' | 'completed'>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [stats, setStats] = useState<BookingStats>({
    totalBookings: 0,
    revenueThisMonth: 0,
    activeFacilities: 0,
    registeredUsers: 0,
    todayBookings: 0,
    pendingPayments: 0
  })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchBookings()
    fetchStats()
  }, [dateFilter])

  useEffect(() => {
    fetchBookings()
  }, [filter])

  const fetchBookings = async () => {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          user_profiles(first_name, last_name, phone),
          facilities(name, type, hourly_rate)
        `)
        .order('created_at', { ascending: false })

      // Apply date filter
      if (dateFilter === 'today') {
        const today = new Date().toISOString().split('T')[0]
        query = query.eq('booking_date', today)
      } else if (dateFilter === 'week') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        query = query.gte('booking_date', weekAgo.toISOString().split('T')[0])
      } else if (dateFilter === 'month') {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        query = query.gte('booking_date', monthAgo.toISOString().split('T')[0])
      }

      const { data, error } = await query.limit(100)

      if (error) throw error
      setBookings(data || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Get total bookings
      const { count: totalBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })

      // Get today's bookings
      const today = new Date().toISOString().split('T')[0]
      const { count: todayBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('booking_date', today)

      // Get pending payments
      const { count: pendingPayments } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_payment')

      // Get active facilities
      const { count: activeFacilities } = await supabase
        .from('facilities')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // Get registered users
      const { count: registeredUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })

      // Calculate revenue this month
      const firstDayOfMonth = new Date()
      firstDayOfMonth.setDate(1)
      const { data: monthlyBookings } = await supabase
        .from('bookings')
        .select(`
          facilities(hourly_rate)
        `)
        .gte('booking_date', firstDayOfMonth.toISOString().split('T')[0])
        .eq('is_paid', true)

      const revenueThisMonth = monthlyBookings?.reduce((total, booking) => {
        return total + (booking.facilities?.hourly_rate || 0)
      }, 0) || 0

      setStats({
        totalBookings: totalBookings || 0,
        revenueThisMonth,
        activeFacilities: activeFacilities || 0,
        registeredUsers: registeredUsers || 0,
        todayBookings: todayBookings || 0,
        pendingPayments: pendingPayments || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (error) throw error

      toast.success('Booking marked as completed')
      fetchBookings()
      fetchStats()
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete booking')
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase.functions.invoke('cancel-booking', {
        body: { booking_id: bookingId }
      })

      if (error) throw error

      toast.success('Booking cancelled successfully')
      fetchBookings()
      fetchStats()
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel booking')
    }
  }

  const handleMarkPaid = async (bookingId: string) => {
    try {
      const { error } = await supabase.functions.invoke('mark-booking-paid', {
        body: { booking_id: bookingId }
      })

      if (error) throw error

      toast.success('Booking marked as paid')
      fetchBookings()
      fetchStats()
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark as paid')
    }
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'pending_payment':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const filteredBookings = bookings.filter(booking => {
    // Status filter
    const matchesStatus = filter === 'all' || 
      (filter === 'confirmed' && booking.status === 'confirmed') ||
      (filter === 'pending' && booking.status === 'pending_payment') ||
      (filter === 'cancelled' && booking.status === 'cancelled') ||
      (filter === 'completed' && booking.status === 'completed')

    // Search filter
    const matchesSearch = !searchTerm || 
      booking.confirmation_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.user_profiles?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.user_profiles?.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.facilities?.name.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesStatus && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total bookings</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalBookings.toLocaleString()}</p>
              <p className="text-sm text-blue-600">All time</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">📅</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Revenue this month</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.revenueThisMonth.toLocaleString()} TND</p>
              <p className="text-sm text-green-600">Paid bookings</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xl">💰</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Today's bookings</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.todayBookings}</p>
              <p className="text-sm text-purple-600">Active today</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-xl">🏃</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending payments</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pendingPayments}</p>
              <p className="text-sm text-orange-600">Needs attention</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-xl">⏳</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bookings Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bookings Management</h3>
            
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              
              {/* Status Filter */}
              <div className="flex gap-2">
                {['all', 'confirmed', 'pending', 'completed', 'cancelled'].map((filterOption) => (
                  <button
                    key={filterOption}
                    onClick={() => setFilter(filterOption as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === filterOption
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Booking ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Facility
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      #{booking.confirmation_code}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(booking.created_at || '').toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {booking.user_profiles?.first_name} {booking.user_profiles?.last_name}
                    </div>
                    {booking.user_profiles?.phone && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {booking.user_profiles.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {booking.facilities?.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {booking.facilities?.type === 'football_field' ? '⚽ Football' : '🎾 Padel'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {new Date(booking.booking_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {booking.facilities?.hourly_rate || 0} TND
                    </div>
                    <div className={`text-xs ${booking.is_paid ? 'text-green-600' : 'text-red-600'}`}>
                      {booking.is_paid ? 'Paid' : 'Unpaid'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                      {booking.status?.replace('_', ' ') || 'unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {!booking.is_paid && booking.status === 'confirmed' && (
                      <button
                        onClick={() => handleMarkPaid(booking.id)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3"
                      >
                        Mark Paid
                      </button>
                    )}
                    {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Cancel
                      </button>
                    )}
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => handleCompleteBooking(booking.id)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 ml-3"
                      >
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        {filteredBookings.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Showing {filteredBookings.length} of {bookings.length} bookings
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                Total Revenue: {filteredBookings.reduce((sum, booking) => 
                  sum + (booking.is_paid ? (booking.facilities?.hourly_rate || 0) : 0), 0
                ).toLocaleString()} TND
              </span>
            </div>
          </div>
        )}

        {filteredBookings.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || filter !== 'all' ? 'No bookings match your filters' : 'No bookings found'}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default BookingsManager