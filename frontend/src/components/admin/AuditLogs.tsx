import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

interface AuditLog {
  id: string
  admin_id: string
  admin_name: string
  action: string
  target_type: 'user' | 'booking' | 'facility' | 'system'
  target_id?: string
  target_name?: string
  details: string
  ip_address?: string
  user_agent?: string
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'user' | 'booking' | 'facility' | 'system'>('all')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all')
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchAuditLogs()
  }, [timeRange, filter, severityFilter])

  const fetchAuditLogs = async () => {
    try {
      // In production, this would fetch from an actual audit_logs table
      // For now, we'll generate sample data based on recent activities
      
      const sampleLogs: AuditLog[] = [
        {
          id: '1',
          admin_id: 'admin-123',
          admin_name: 'Iyed Temimi',
          action: 'User Banned',
          target_type: 'user',
          target_id: 'user-456',
          target_name: 'John Doe',
          details: 'User banned for violating terms of service - multiple no-shows',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          severity: 'high'
        },
        {
          id: '2',
          admin_id: 'admin-123',
          admin_name: 'Iyed Temimi',
          action: 'Booking Cancelled',
          target_type: 'booking',
          target_id: 'booking-789',
          target_name: 'BK-ABC123',
          details: 'Booking cancelled due to facility maintenance',
          ip_address: '192.168.1.100',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          severity: 'medium'
        },
        {
          id: '3',
          admin_id: 'admin-123',
          admin_name: 'Iyed Temimi',
          action: 'Payment Marked as Paid',
          target_type: 'booking',
          target_id: 'booking-101',
          target_name: 'BK-XYZ789',
          details: 'Manual payment confirmation for cash payment',
          ip_address: '192.168.1.100',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          severity: 'low'
        },
        {
          id: '4',
          admin_id: 'admin-123',
          admin_name: 'Iyed Temimi',
          action: 'Facility Updated',
          target_type: 'facility',
          target_id: 'facility-202',
          target_name: 'Football Field 1',
          details: 'Updated hourly rate from 100 TND to 120 TND',
          ip_address: '192.168.1.100',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          severity: 'medium'
        },
        {
          id: '5',
          admin_id: 'system',
          admin_name: 'System',
          action: 'Database Reset',
          target_type: 'system',
          details: 'Database reset performed - all user data cleared except admin',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          severity: 'critical'
        },
        {
          id: '6',
          admin_id: 'admin-123',
          admin_name: 'Iyed Temimi',
          action: 'User Promoted',
          target_type: 'user',
          target_id: 'user-303',
          target_name: 'Jane Smith',
          details: 'User promoted to admin role',
          ip_address: '192.168.1.100',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          severity: 'high'
        },
        {
          id: '7',
          admin_id: 'admin-123',
          admin_name: 'Iyed Temimi',
          action: 'Reservation Checked In',
          target_type: 'booking',
          target_id: 'booking-404',
          target_name: 'BK-DEF456',
          details: 'Customer checked in for reservation',
          ip_address: '192.168.1.100',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          severity: 'low'
        }
      ]

      // Filter by time range
      const now = new Date()
      const timeRangeMs = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      }[timeRange]

      const cutoffDate = new Date(now.getTime() - timeRangeMs)
      const filteredLogs = sampleLogs.filter(log => 
        new Date(log.timestamp) > cutoffDate
      )

      setLogs(filteredLogs)
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      toast.error('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getActionIcon = (action: string) => {
    if (action.includes('Ban')) return '🚫'
    if (action.includes('Unban')) return '✅'
    if (action.includes('Promote')) return '⬆️'
    if (action.includes('Cancel')) return '❌'
    if (action.includes('Payment')) return '💰'
    if (action.includes('Check')) return '🎫'
    if (action.includes('Reset')) return '🔄'
    if (action.includes('Update')) return '✏️'
    return '📝'
  }

  const getTargetTypeColor = (type: string) => {
    switch (type) {
      case 'user': return 'bg-blue-100 text-blue-800'
      case 'booking': return 'bg-green-100 text-green-800'
      case 'facility': return 'bg-purple-100 text-purple-800'
      case 'system': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.admin_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filter === 'all' || log.target_type === filter
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter

    return matchesSearch && matchesFilter && matchesSeverity
  })

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Admin', 'Action', 'Target Type', 'Target', 'Details', 'Severity', 'IP Address'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.admin_name,
        log.action,
        log.target_type,
        log.target_name || '',
        `"${log.details}"`,
        log.severity,
        log.ip_address || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Audit logs exported successfully')
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
            Audit Logs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track all administrative actions and system events
          </p>
        </div>
        
        <button
          onClick={exportLogs}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          📥 Export Logs
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {/* Time Range */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          {/* Target Type Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="user">User Actions</option>
            <option value="booking">Booking Actions</option>
            <option value="facility">Facility Actions</option>
            <option value="system">System Actions</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['low', 'medium', 'high', 'critical'].map((severity) => {
          const count = filteredLogs.filter(log => log.severity === severity).length
          return (
            <motion.div
              key={severity}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border ${getSeverityColor(severity)}`}
            >
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm font-medium capitalize">{severity} Severity</div>
            </motion.div>
          )
        })}
      </div>

      {/* Logs Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Severity
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        {log.admin_name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {log.admin_name}
                        </div>
                        {log.ip_address && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {log.ip_address}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getActionIcon(log.action)}</span>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {log.action}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTargetTypeColor(log.target_type)}`}>
                        {log.target_type}
                      </span>
                      {log.target_name && (
                        <div className="text-sm text-gray-900 dark:text-white">
                          {log.target_name}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                      {log.details}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(log.severity)}`}>
                      {log.severity.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-2xl">📋</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400">No audit logs found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {searchTerm || filter !== 'all' || severityFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'No actions have been logged in this time period'}
            </p>
          </div>
        )}
      </motion.div>

      {/* Summary */}
      {filteredLogs.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Showing {filteredLogs.length} of {logs.length} audit logs
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              Time range: {timeRange} • Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditLogs