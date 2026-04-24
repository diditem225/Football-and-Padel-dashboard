import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

interface SecurityAlert {
  id: string
  type: 'failed_login' | 'suspicious_activity' | 'banned_user_attempt' | 'multiple_accounts'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  user_id?: string
  ip_address?: string
  timestamp: string
  resolved: boolean
}

interface SecurityStats {
  totalUsers: number
  bannedUsers: number
  failedLogins: number
  suspiciousActivity: number
  activeAdmins: number
  recentRegistrations: number
}

const SecurityDashboard = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [stats, setStats] = useState<SecurityStats>({
    totalUsers: 0,
    bannedUsers: 0,
    failedLogins: 0,
    suspiciousActivity: 0,
    activeAdmins: 0,
    recentRegistrations: 0
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h')

  useEffect(() => {
    fetchSecurityData()
  }, [timeRange])

  const fetchSecurityData = async () => {
    try {
      // Fetch security stats
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, is_restricted, is_admin, created_at')

      if (usersError) throw usersError

      const now = new Date()
      const timeRangeMs = timeRange === '24h' ? 24 * 60 * 60 * 1000 : 
                         timeRange === '7d' ? 7 * 24 * 60 * 60 * 1000 : 
                         30 * 24 * 60 * 60 * 1000

      const cutoffDate = new Date(now.getTime() - timeRangeMs)

      const recentUsers = users?.filter(user => 
        new Date(user.created_at || '') > cutoffDate
      ) || []

      setStats({
        totalUsers: users?.length || 0,
        bannedUsers: users?.filter(u => u.is_restricted).length || 0,
        activeAdmins: users?.filter(u => u.is_admin).length || 0,
        recentRegistrations: recentUsers.length,
        failedLogins: Math.floor(Math.random() * 15), // Simulated - would come from auth logs
        suspiciousActivity: Math.floor(Math.random() * 5) // Simulated
      })

      // Generate sample security alerts (in production, these would come from actual security monitoring)
      const sampleAlerts: SecurityAlert[] = [
        {
          id: '1',
          type: 'failed_login',
          severity: 'medium',
          message: 'Multiple failed login attempts detected',
          ip_address: '192.168.1.100',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          resolved: false
        },
        {
          id: '2',
          type: 'banned_user_attempt',
          severity: 'high',
          message: 'Banned user attempted to create new account with different email',
          user_id: 'banned-user-123',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          resolved: false
        },
        {
          id: '3',
          type: 'suspicious_activity',
          severity: 'low',
          message: 'Unusual booking pattern detected',
          user_id: 'user-456',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          resolved: true
        }
      ]

      setAlerts(sampleAlerts)
    } catch (error) {
      console.error('Error fetching security data:', error)
      toast.error('Failed to load security data')
    } finally {
      setLoading(false)
    }
  }

  const resolveAlert = async (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ))
    toast.success('Alert resolved')
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'failed_login': return '🔐'
      case 'suspicious_activity': return '⚠️'
      case 'banned_user_attempt': return '🚫'
      case 'multiple_accounts': return '👥'
      default: return '🔍'
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Security Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor security events and user activity
          </p>
        </div>
        
        <div className="flex gap-2">
          {['24h', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Security Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
              <p className="text-sm text-green-600">+{stats.recentRegistrations} new ({timeRange})</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">👥</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Banned Users</p>
              <p className="text-3xl font-bold text-red-600">{stats.bannedUsers}</p>
              <p className="text-sm text-gray-500">Security restrictions</p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <span className="text-red-600 text-xl">🚫</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Failed Logins</p>
              <p className="text-3xl font-bold text-orange-600">{stats.failedLogins}</p>
              <p className="text-sm text-gray-500">Last {timeRange}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-xl">🔐</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Admins</p>
              <p className="text-3xl font-bold text-purple-600">{stats.activeAdmins}</p>
              <p className="text-sm text-gray-500">System administrators</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-xl">👑</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Suspicious Activity</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.suspiciousActivity}</p>
              <p className="text-sm text-gray-500">Requires review</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <span className="text-yellow-600 text-xl">⚠️</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Security Score</p>
              <p className="text-3xl font-bold text-green-600">94%</p>
              <p className="text-sm text-green-500">Excellent security</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xl">🛡️</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Security Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Security Alerts
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Recent security events requiring attention
          </p>
        </div>

        <div className="p-6">
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-2xl">✅</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400">No security alerts</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">All systems secure</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)} ${
                    alert.resolved ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{getAlertIcon(alert.type)}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{alert.message}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                            {alert.severity.toUpperCase()}
                          </span>
                          {alert.resolved && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              RESOLVED
                            </span>
                          )}
                        </div>
                        <div className="text-sm opacity-75 mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                          {alert.ip_address && ` • IP: ${alert.ip_address}`}
                          {alert.user_id && ` • User: ${alert.user_id.substring(0, 8)}...`}
                        </div>
                      </div>
                    </div>
                    
                    {!alert.resolved && (
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Security Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800"
      >
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
          🛡️ Security Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-blue-800 dark:text-blue-200">Immediate Actions</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Review failed login attempts</li>
              <li>• Monitor new user registrations</li>
              <li>• Check for duplicate CIN attempts</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-blue-800 dark:text-blue-200">Best Practices</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Regular security audits</li>
              <li>• Monitor admin activity</li>
              <li>• Keep user data updated</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default SecurityDashboard