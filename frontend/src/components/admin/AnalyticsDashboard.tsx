import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'

interface AnalyticsData {
  revenueThisMonth: number
  totalBookings: number
  cancellationRate: number
  avgBookingValue: number
  revenueByMonth: { month: string; revenue: number; bookings: number }[]
  bookingsByFacility: { facility: string; count: number; percentage: number; color: string; revenue: number }[]
  peakHours: { hour: string; bookings: number }[]
  monthlyGrowth: number
  bookingGrowth: number
  topPerformingFacility: string
  totalRevenue: number
}

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    revenueThisMonth: 0,
    totalBookings: 0,
    cancellationRate: 0,
    avgBookingValue: 0,
    revenueByMonth: [],
    bookingsByFacility: [],
    peakHours: [],
    monthlyGrowth: 0,
    bookingGrowth: 0,
    topPerformingFacility: '',
    totalRevenue: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalyticsData()
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('analytics-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' },
        () => fetchAnalyticsData()
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchAnalyticsData = async () => {
    try {
      await Promise.all([
        fetchRevenueAndBookings(),
        fetchRevenueByMonth(),
        fetchBookingsByFacility(),
        fetchPeakHours()
      ])
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRevenueAndBookings = async () => {
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]

    // Get total bookings
    const { count: totalBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })

    // Get this month's data (only paid bookings)
    const { data: thisMonthBookings } = await supabase
      .from('bookings')
      .select('facilities(hourly_rate), status')
      .gte('booking_date', thisMonth)
      .lte('booking_date', thisMonthEnd)
      .eq('is_paid', true)

    // Get last month's data for comparison (only paid bookings)
    const { data: lastMonthBookings } = await supabase
      .from('bookings')
      .select('facilities(hourly_rate), status')
      .gte('booking_date', lastMonth)
      .lte('booking_date', lastMonthEnd)
      .eq('is_paid', true)

    // Calculate this month's revenue
    const revenueThisMonth = thisMonthBookings?.reduce((sum, booking) => 
      sum + (booking.facilities?.hourly_rate || 0), 0) || 0

    // Calculate last month's revenue for growth
    const revenueLastMonth = lastMonthBookings?.reduce((sum, booking) => 
      sum + (booking.facilities?.hourly_rate || 0), 0) || 0

    // Get total revenue
    const { data: allBookings } = await supabase
      .from('bookings')
      .select('facilities(hourly_rate)')
      .eq('is_paid', true)

    const totalRevenue = allBookings?.reduce((sum, booking) => 
      sum + (booking.facilities?.hourly_rate || 0), 0) || 0

    // Calculate cancellation rate
    const cancelledCount = thisMonthBookings?.filter(b => b.status === 'cancelled').length || 0
    const cancellationRate = thisMonthBookings?.length ? 
      Math.round((cancelledCount / thisMonthBookings.length) * 100 * 10) / 10 : 0

    // Calculate average booking value
    const avgBookingValue = totalBookings ? Math.round(totalRevenue / totalBookings) : 0

    // Calculate growth rates
    const monthlyGrowth = revenueLastMonth ? 
      Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100) : 0
    
    const bookingGrowth = lastMonthBookings?.length ? 
      Math.round(((thisMonthBookings?.length || 0) - lastMonthBookings.length) / lastMonthBookings.length * 100) : 0

    setAnalytics(prev => ({
      ...prev,
      revenueThisMonth,
      totalBookings: totalBookings || 0,
      cancellationRate,
      avgBookingValue,
      monthlyGrowth,
      bookingGrowth,
      totalRevenue
    }))
  }

  const fetchRevenueByMonth = async () => {
    const months = []
    const now = new Date()
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStart = date.toISOString().split('T')[0]
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0]
      
      const { data: monthBookings } = await supabase
        .from('bookings')
        .select('facilities(hourly_rate)')
        .gte('booking_date', monthStart)
        .lte('booking_date', monthEnd)
        .eq('is_paid', true)

      const revenue = monthBookings?.reduce((sum, booking) => 
        sum + (booking.facilities?.hourly_rate || 0), 0) || 0

      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        revenue,
        bookings: monthBookings?.length || 0
      })
    }

    setAnalytics(prev => ({ ...prev, revenueByMonth: months }))
  }

  const fetchBookingsByFacility = async () => {
    const { data: facilityBookings } = await supabase
      .from('bookings')
      .select(`
        facility_id,
        facilities(name, hourly_rate)
      `)
      .gte('booking_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .eq('is_paid', true)

    const facilityStats: { [key: string]: { count: number; revenue: number; name: string } } = {}
    
    facilityBookings?.forEach(booking => {
      const facilityName = booking.facilities?.name || 'Unknown'
      if (!facilityStats[facilityName]) {
        facilityStats[facilityName] = { count: 0, revenue: 0, name: facilityName }
      }
      facilityStats[facilityName].count++
      facilityStats[facilityName].revenue += booking.facilities?.hourly_rate || 0
    })

    const totalBookings = Object.values(facilityStats).reduce((sum, stat) => sum + stat.count, 0)
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-yellow-500']
    
    const bookingsByFacility = Object.values(facilityStats)
      .sort((a, b) => b.count - a.count)
      .map((stat, index) => ({
        facility: stat.name,
        count: stat.count,
        percentage: totalBookings ? Math.round((stat.count / totalBookings) * 100) : 0,
        color: colors[index % colors.length],
        revenue: stat.revenue
      }))

    const topPerformingFacility = bookingsByFacility[0]?.facility || 'N/A'

    setAnalytics(prev => ({ ...prev, bookingsByFacility, topPerformingFacility }))
  }

  const fetchPeakHours = async () => {
    const { data: hourlyBookings } = await supabase
      .from('bookings')
      .select('start_time')
      .gte('booking_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

    const hourCounts: { [key: string]: number } = {}
    
    // Initialize all hours from 8 to 22
    for (let hour = 8; hour <= 22; hour++) {
      const hourStr = `${hour.toString().padStart(2, '0')}:00`
      hourCounts[hourStr] = 0
    }

    hourlyBookings?.forEach(booking => {
      const hour = booking.start_time.substring(0, 5)
      if (hourCounts[hour] !== undefined) {
        hourCounts[hour]++
      }
    })

    const peakHours = Object.entries(hourCounts)
      .map(([hour, bookings]) => ({ hour, bookings }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour))

    setAnalytics(prev => ({ ...prev, peakHours }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time insights and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-500 dark:text-gray-400">Live Data</span>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">💰</div>
              <div className={`text-sm font-medium ${analytics.monthlyGrowth >= 0 ? 'text-emerald-100' : 'text-red-200'}`}>
                {analytics.monthlyGrowth >= 0 ? '↗️' : '↘️'} {Math.abs(analytics.monthlyGrowth)}%
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{analytics.revenueThisMonth.toLocaleString()} TND</div>
            <div className="text-emerald-100 text-sm">Revenue This Month</div>
            <div className="text-xs text-emerald-200 mt-2">
              {analytics.monthlyGrowth >= 0 ? 'Growth' : 'Decline'} vs last month
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">📅</div>
              <div className={`text-sm font-medium ${analytics.bookingGrowth >= 0 ? 'text-blue-100' : 'text-red-200'}`}>
                {analytics.bookingGrowth >= 0 ? '↗️' : '↘️'} {Math.abs(analytics.bookingGrowth)}%
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{analytics.totalBookings}</div>
            <div className="text-blue-100 text-sm">Total Bookings</div>
            <div className="text-xs text-blue-200 mt-2">
              All time bookings
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">❌</div>
              <div className="text-sm font-medium text-red-100">
                This month
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{analytics.cancellationRate}%</div>
            <div className="text-red-100 text-sm">Cancellation Rate</div>
            <div className="text-xs text-red-200 mt-2">
              {analytics.cancellationRate < 10 ? 'Good' : analytics.cancellationRate < 20 ? 'Average' : 'High'} rate
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">📊</div>
              <div className="text-sm font-medium text-purple-100">
                Per booking
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{analytics.avgBookingValue} TND</div>
            <div className="text-purple-100 text-sm">Avg. Booking Value</div>
            <div className="text-xs text-purple-200 mt-2">
              Revenue per booking
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Revenue Trend — Last 6 Months
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Monthly revenue and booking volume
            </p>
          </div>
          
          <div className="p-6">
            {analytics.revenueByMonth.length > 0 ? (
              <div className="h-64 flex items-end justify-between gap-4">
                {analytics.revenueByMonth.map((data, index) => {
                  const maxRevenue = Math.max(...analytics.revenueByMonth.map(d => d.revenue))
                  const height = maxRevenue > 0 ? (data.revenue / maxRevenue) * 200 : 0
                  
                  return (
                    <div key={data.month} className="flex flex-col items-center flex-1 group">
                      <div className="relative">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${height}px` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                          className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg min-h-[20px] group-hover:from-blue-700 group-hover:to-blue-500 transition-colors"
                        ></motion.div>
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {data.revenue.toLocaleString()} TND<br/>
                          {data.bookings} bookings
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {(data.revenue / 1000).toFixed(1)}k
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{data.month}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="text-gray-500 dark:text-gray-400">No revenue data available</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Bookings by Facility - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Facility Performance
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Last 30 days
            </p>
          </div>

          <div className="p-6">
            {analytics.bookingsByFacility.length > 0 ? (
              <>
                {/* Simple Progress Bars instead of Donut Chart */}
                <div className="space-y-4 mb-6">
                  {analytics.bookingsByFacility.slice(0, 4).map((facility, index) => (
                    <motion.div
                      key={facility.facility}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {facility.facility.replace('Football Field ', 'Field ').replace('Padel Court ', 'Court ')}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {facility.count} bookings
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${facility.percentage}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                          className={`h-2 rounded-full ${facility.color}`}
                        ></motion.div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{facility.percentage}%</span>
                        <span>{facility.revenue.toLocaleString()} TND</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Top Performer</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {analytics.topPerformingFacility}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🏟️</div>
                <p className="text-gray-500 dark:text-gray-400">No facility data available</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Peak Booking Hours - Enhanced */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Peak Booking Hours
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Booking distribution by hour (last 30 days)
          </p>
        </div>
        
        <div className="p-6">
          {analytics.peakHours.length > 0 ? (
            <div className="h-48 flex items-end justify-between gap-2">
              {analytics.peakHours.map((data, index) => {
                const maxBookings = Math.max(...analytics.peakHours.map(d => d.bookings))
                const height = maxBookings > 0 ? (data.bookings / maxBookings) * 160 : 20
                
                return (
                  <div key={data.hour} className="flex flex-col items-center flex-1 group">
                    <div className="relative">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${height}px` }}
                        transition={{ duration: 1, delay: index * 0.05 }}
                        className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg min-h-[20px] group-hover:from-purple-700 group-hover:to-purple-500 transition-colors"
                      ></motion.div>
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {data.bookings} bookings
                      </div>
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{data.bookings}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{data.hour}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">⏰</div>
                <p className="text-gray-500 dark:text-gray-400">No booking time data available</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default AnalyticsDashboard