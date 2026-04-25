import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'

interface DashboardStats {
  totalBookings: number
  todayBookings: number
  weeklyBookings: number
  monthlyRevenue: number
  totalRevenue: number
  activeFacilities: number
  totalUsers: number
  pendingPayments: number
  completionRate: number
  averageBookingValue: number
  peakHour: string
  topFacility: string
  weeklyGrowth: number
  dailyGrowth: number
}

interface RecentActivity {
  id: string
  type: 'booking' | 'cancellation' | 'payment' | 'user_registration'
  description: string
  timestamp: string
  amount?: number
  user?: string
  facility?: string
}

interface UpcomingBooking {
  id: string
  confirmation_code: string
  facility_name: string
  user_name: string
  start_time: string
  end_time: string
  booking_date: string
  status: string
  amount: number
}

const DashboardOverview = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    todayBookings: 0,
    weeklyBookings: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
    activeFacilities: 0,
    totalUsers: 0,
    pendingPayments: 0,
    completionRate: 0,
    averageBookingValue: 0,
    peakHour: '18:00',
    topFacility: 'Football Field 1',
    weeklyGrowth: 0,
    dailyGrowth: 0
  })
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBooking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    
    // Set up real-time subscription for bookings
    const subscription = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' },
        () => fetchDashboardData()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'user_profiles' },
        () => fetchDashboardData()
      )
      .subscribe()

    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)

    return () => {
      subscription.unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const fetchDashboardData = async () => {
    try {
      await Promise.all([
        fetchStats(),
        fetchRecentActivity(),
        fetchUpcomingBookings()
      ])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

    // Get total bookings
    const { count: totalBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })

    // Get today's bookings
    const { count: todayBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('booking_date', today)

    // Get yesterday's bookings for growth calculation
    const { count: yesterdayBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('booking_date', yesterday)

    // Get weekly bookings
    const { count: weeklyBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('booking_date', weekAgo)

    // Get last week's bookings for growth calculation
    const lastWeekStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { count: lastWeekBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('booking_date', lastWeekStart)
      .lt('booking_date', weekAgo)

    // Get monthly revenue
    const { data: monthlyBookings } = await supabase
      .from('bookings')
      .select('facilities(hourly_rate)')
      .gte('booking_date', monthStart)
      .eq('is_paid', true)

    const monthlyRevenue = monthlyBookings?.reduce((sum, booking) => 
      sum + (booking.facilities?.hourly_rate || 0), 0) || 0

    // Get total revenue
    const { data: allPaidBookings } = await supabase
      .from('bookings')
      .select('facilities(hourly_rate)')
      .eq('is_paid', true)

    const totalRevenue = allPaidBookings?.reduce((sum, booking) => 
      sum + (booking.facilities?.hourly_rate || 0), 0) || 0

    // Get active facilities
    const { count: activeFacilities } = await supabase
      .from('facilities')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Get total users
    const { count: totalUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })

    // Get pending payments
    const { count: pendingPayments } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending_payment')

    // Calculate completion rate
    const { count: completedBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    const completionRate = totalBookings ? Math.round((completedBookings || 0) / totalBookings * 100) : 0

    // Calculate average booking value
    const averageBookingValue = totalBookings ? Math.round(totalRevenue / totalBookings) : 0

    // Get peak hour (most popular booking time)
    const { data: timeSlots } = await supabase
      .from('bookings')
      .select('start_time')
      .gte('booking_date', weekAgo)

    const hourCounts: { [key: string]: number } = {}
    timeSlots?.forEach(booking => {
      const hour = booking.start_time.substring(0, 5)
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })

    const peakHour = Object.keys(hourCounts).reduce((a, b) => 
      hourCounts[a] > hourCounts[b] ? a : b, '18:00')

    // Get top facility
    const { data: facilityBookings } = await supabase
      .from('bookings')
      .select('facility_id, facilities(name)')
      .gte('booking_date', weekAgo)

    const facilityCounts: { [key: string]: number } = {}
    facilityBookings?.forEach(booking => {
      const name = booking.facilities?.name || 'Unknown'
      facilityCounts[name] = (facilityCounts[name] || 0) + 1
    })

    const topFacility = Object.keys(facilityCounts).reduce((a, b) => 
      facilityCounts[a] > facilityCounts[b] ? a : b, 'Football Field 1')

    // Calculate growth rates
    const dailyGrowth = yesterdayBookings ? 
      Math.round(((todayBookings || 0) - yesterdayBookings) / yesterdayBookings * 100) : 0
    
    const weeklyGrowth = lastWeekBookings ? 
      Math.round(((weeklyBookings || 0) - lastWeekBookings) / lastWeekBookings * 100) : 0

    setStats({
      totalBookings: totalBookings || 0,
      todayBookings: todayBookings || 0,
      weeklyBookings: weeklyBookings || 0,
      monthlyRevenue,
      totalRevenue,
      activeFacilities: activeFacilities || 0,
      totalUsers: totalUsers || 0,
      pendingPayments: pendingPayments || 0,
      completionRate,
      averageBookingValue,
      peakHour,
      topFacility,
      weeklyGrowth,
      dailyGrowth
    })
  }

  const fetchRecentActivity = async () => {
    // Get recent bookings
    const { data: recentBookings } = await supabase
      .from('bookings')
      .select(`
        id, confirmation_code, created_at, status,
        user_profiles(first_name, last_name),
        facilities(name, hourly_rate)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    const activities: RecentActivity[] = recentBookings?.map(booking => ({
      id: booking.id,
      type: booking.status === 'cancelled' ? 'cancellation' : 'booking',
      description: `${booking.user_profiles?.first_name} ${booking.user_profiles?.last_name} ${
        booking.status === 'cancelled' ? 'cancelled' : 'booked'
      } ${booking.facilities?.name}`,
      timestamp: booking.created_at || '',
      amount: booking.status !== 'cancelled' ? booking.facilities?.hourly_rate : undefined,
      user: `${booking.user_profiles?.first_name} ${booking.user_profiles?.last_name}`,
      facility: booking.facilities?.name
    })) || []

    setRecentActivity(activities)
  }

  const fetchUpcomingBookings = async () => {
    const today = new Date().toISOString().split('T')[0]
    
    const { data: upcoming } = await supabase
      .from('bookings')
      .select(`
        id, confirmation_code, booking_date, start_time, end_time, status,
        user_profiles(first_name, last_name),
        facilities(name, hourly_rate)
      `)
      .gte('booking_date', today)
      .in('status', ['confirmed', 'pending_payment'])
      .order('booking_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(8)

    const bookings: UpcomingBooking[] = upcoming?.map(booking => ({
      id: booking.id,
      confirmation_code: booking.confirmation_code,
      facility_name: booking.facilities?.name || '',
      user_name: `${booking.user_profiles?.first_name} ${booking.user_profiles?.last_name}`,
      start_time: booking.start_time,
      end_time: booking.end_time,
      booking_date: booking.booking_date,
      status: booking.status || '',
      amount: booking.facilities?.hourly_rate || 0
    })) || []

    setUpcomingBookings(bookings)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking': return '📅'
      case 'payment': return '💰'
      case 'cancellation': return '❌'
      case 'user_registration': return '👤'
      default: return '📋'
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'booking': return 'text-green-600 dark:text-green-400'
      case 'payment': return 'text-blue-600 dark:text-blue-400'
      case 'cancellation': return 'text-red-600 dark:text-red-400'
      case 'user_registration': return 'text-purple-600 dark:text-purple-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'pending_payment':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600 dark:text-green-400'
    if (growth < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return '↗️'
    if (growth < 0) return '↘️'
    return '➡️'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here's what's happening at FiveStars today
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Key Metrics - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-16 h-16 bg-white/5 rounded-full"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">📅</div>
              <div className={`text-sm font-medium ${getGrowthColor(stats.dailyGrowth)}`}>
                {getGrowthIcon(stats.dailyGrowth)} {Math.abs(stats.dailyGrowth)}%
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.todayBookings}</div>
            <div className="text-blue-100 text-sm">Today's Bookings</div>
            <div className="text-xs text-blue-200 mt-2">
              vs yesterday: {stats.dailyGrowth > 0 ? '+' : ''}{stats.dailyGrowth}%
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-16 h-16 bg-white/5 rounded-full"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">💰</div>
              <div className="text-sm font-medium text-emerald-100">
                {stats.averageBookingValue} TND avg
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.monthlyRevenue.toLocaleString()} TND</div>
            <div className="text-emerald-100 text-sm">Monthly Revenue</div>
            <div className="text-xs text-emerald-200 mt-2">
              Total: {stats.totalRevenue.toLocaleString()} TND
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-16 h-16 bg-white/5 rounded-full"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">👥</div>
              <div className={`text-sm font-medium ${getGrowthColor(stats.weeklyGrowth)}`}>
                {getGrowthIcon(stats.weeklyGrowth)} {Math.abs(stats.weeklyGrowth)}%
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.totalUsers}</div>
            <div className="text-purple-100 text-sm">Total Users</div>
            <div className="text-xs text-purple-200 mt-2">
              Weekly growth: {stats.weeklyGrowth > 0 ? '+' : ''}{stats.weeklyGrowth}%
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-16 h-16 bg-white/5 rounded-full"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">🏟️</div>
              <div className="text-sm font-medium text-orange-100">
                {stats.completionRate}% complete
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.activeFacilities}</div>
            <div className="text-orange-100 text-sm">Active Facilities</div>
            <div className="text-xs text-orange-200 mt-2">
              Peak hour: {stats.peakHour}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Weekly Performance</h3>
            <div className="text-2xl">📊</div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total Bookings</span>
              <span className="font-semibold text-gray-900 dark:text-white">{stats.weeklyBookings}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Pending Payments</span>
              <span className="font-semibold text-orange-600">{stats.pendingPayments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Top Facility</span>
              <span className="font-semibold text-gray-900 dark:text-white text-sm">{stats.topFacility}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Stats</h3>
            <div className="text-2xl">⚡</div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Completion Rate</span>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${stats.completionRate}%` }}
                  ></div>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white text-sm">{stats.completionRate}%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Avg. Booking Value</span>
              <span className="font-semibold text-gray-900 dark:text-white">{stats.averageBookingValue} TND</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Peak Hour</span>
              <span className="font-semibold text-gray-900 dark:text-white">{stats.peakHour}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">System Status</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 dark:text-green-400">Online</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Database</span>
              <span className="text-green-600 dark:text-green-400 text-sm">✓ Connected</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Real-time Updates</span>
              <span className="text-green-600 dark:text-green-400 text-sm">✓ Active</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Last Sync</span>
              <span className="text-gray-900 dark:text-white text-sm">Just now</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Activity & Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Activity
              </h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Live</span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.slice(0, 6).map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-white truncate">
                          {activity.user}
                        </span>
                        <span className={`text-sm ${getActivityColor(activity.type)}`}>
                          {activity.type === 'booking' && 'booked'}
                          {activity.type === 'payment' && 'paid for'}
                          {activity.type === 'cancellation' && 'cancelled'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {activity.facility}
                        </span>
                        <div className="flex items-center gap-2">
                          {activity.amount && (
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                              +{activity.amount} TND
                            </span>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {formatTimeAgo(activity.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📊</div>
                <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Upcoming Bookings - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Upcoming Bookings
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Next {upcomingBookings.length} bookings
              </span>
            </div>
          </div>
          
          <div className="p-6">
            {upcomingBookings.length > 0 ? (
              <div className="space-y-4">
                {upcomingBookings.slice(0, 6).map((booking, index) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {booking.user_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {booking.user_name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {booking.facility_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(booking.booking_date).toLocaleDateString()} • {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                      <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                        {booking.amount} TND
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📅</div>
                <p className="text-gray-500 dark:text-gray-400">No upcoming bookings</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions - Enhanced */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quick Actions
          </h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="group p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/30 dark:hover:to-blue-700/30 transition-all duration-200 border border-blue-200 dark:border-blue-800">
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">📅</div>
              <div className="text-sm font-medium text-blue-900 dark:text-blue-100">New Booking</div>
              <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">Create booking</div>
            </button>
            
            <button className="group p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl hover:from-emerald-100 hover:to-emerald-200 dark:hover:from-emerald-800/30 dark:hover:to-emerald-700/30 transition-all duration-200 border border-emerald-200 dark:border-emerald-800">
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">🏟️</div>
              <div className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Manage Facilities</div>
              <div className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">View & edit</div>
            </button>
            
            <button className="group p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-800/30 dark:hover:to-purple-700/30 transition-all duration-200 border border-purple-200 dark:border-purple-800">
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">👥</div>
              <div className="text-sm font-medium text-purple-900 dark:text-purple-100">User Management</div>
              <div className="text-xs text-purple-700 dark:text-purple-300 mt-1">View users</div>
            </button>
            
            <button className="group p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl hover:from-orange-100 hover:to-orange-200 dark:hover:from-orange-800/30 dark:hover:to-orange-700/30 transition-all duration-200 border border-orange-200 dark:border-orange-800">
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">📊</div>
              <div className="text-sm font-medium text-orange-900 dark:text-orange-100">Analytics</div>
              <div className="text-xs text-orange-700 dark:text-orange-300 mt-1">View reports</div>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default DashboardOverview