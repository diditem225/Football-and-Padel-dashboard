import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

interface User {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string | null
  cin?: string | null
  is_admin: boolean | null
  is_restricted: boolean | null
  restriction_end_date?: string | null
  created_at: string | null
  last_login?: string
  booking_count?: number
  total_spent?: number
  risk_score?: number
}

interface UserAction {
  id: string
  user_id: string
  action: string
  reason: string
  admin_id: string
  timestamp: string
}

const AdvancedUserManager = () => {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userActions, setUserActions] = useState<UserAction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'banned' | 'high_risk' | 'admins'>('all')
  const [showUserModal, setShowUserModal] = useState(false)
  const [actionReason, setActionReason] = useState('')
  const [restrictionDays, setRestrictionDays] = useState(30)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      // Get user profiles with enhanced data
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          bookings(id, facilities(hourly_rate), is_paid)
        `)
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      // Calculate enhanced user metrics
      const enhancedUsers = profiles?.map(profile => {
        const bookings = Array.isArray(profile.bookings) ? profile.bookings : []
        const paidBookings = bookings.filter(b => b.is_paid)
        const totalSpent = paidBookings.reduce((sum, booking) => 
          sum + (booking.facilities?.hourly_rate || 0), 0
        )
        
        // Calculate risk score based on various factors
        let riskScore = 0
        if (profile.is_restricted) riskScore += 50
        if (bookings.length > 20) riskScore += 20 // High activity
        if (totalSpent > 1000) riskScore -= 10 // Good customer
        if (profile.created_at && new Date(profile.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
          riskScore += 15 // New user
        }
        
        return {
          ...profile,
          booking_count: bookings.length,
          total_spent: totalSpent,
          risk_score: Math.max(0, Math.min(100, riskScore)),
          email: `user-${profile.id.substring(0, 8)}@fivestars.tn` // Simulated email
        }
      }) || []

      setUsers(enhancedUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserActions = async (userId: string) => {
    // Simulated user actions - in production, this would come from an audit log table
    const sampleActions: UserAction[] = [
      {
        id: '1',
        user_id: userId,
        action: 'Account Created',
        reason: 'New user registration',
        admin_id: 'system',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        user_id: userId,
        action: 'Profile Updated',
        reason: 'User updated phone number',
        admin_id: 'system',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
    setUserActions(sampleActions)
  }

  const handleUserAction = async (userId: string, action: 'ban' | 'unban' | 'promote' | 'demote', reason: string) => {
    try {
      let updateData: any = {}
      
      switch (action) {
        case 'ban':
          updateData = {
            is_restricted: true,
            restriction_end_date: new Date(Date.now() + restrictionDays * 24 * 60 * 60 * 1000).toISOString()
          }
          break
        case 'unban':
          updateData = {
            is_restricted: false,
            restriction_end_date: null
          }
          break
        case 'promote':
          updateData = { is_admin: true }
          break
        case 'demote':
          updateData = { is_admin: false }
          break
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId)

      if (error) throw error

      // Log the action (in production, this would go to an audit log table)
      console.log(`Admin action: ${action} user ${userId} - Reason: ${reason}`)

      toast.success(`User ${action}ned successfully`)
      fetchUsers()
      setShowUserModal(false)
      setActionReason('')
    } catch (error) {
      toast.error(`Failed to ${action} user`)
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-600 bg-red-100'
    if (score >= 40) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const getRiskLabel = (score: number) => {
    if (score >= 70) return 'High Risk'
    if (score >= 40) return 'Medium Risk'
    return 'Low Risk'
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.cin?.includes(searchTerm)

    const matchesFilter = 
      filter === 'all' || 
      (filter === 'active' && !user.is_restricted) ||
      (filter === 'banned' && user.is_restricted) ||
      (filter === 'high_risk' && (user.risk_score || 0) >= 70) ||
      (filter === 'admins' && user.is_admin)

    return matchesSearch && matchesFilter
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Advanced User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Enhanced user management with security monitoring
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, email, or CIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'All Users' },
            { key: 'active', label: 'Active' },
            { key: 'banned', label: 'Banned' },
            { key: 'high_risk', label: 'High Risk' },
            { key: 'admins', label: 'Admins' }
          ].map((filterOption) => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === filterOption.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
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
                  User Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  CIN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Risk Score
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
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.first_name} {user.last_name}
                          </div>
                          {user.is_admin && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            📞 {user.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-900 dark:text-white">
                      {user.cin || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {user.booking_count || 0} bookings
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {user.total_spent || 0} TND spent
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(user.risk_score || 0)}`}>
                      {getRiskLabel(user.risk_score || 0)} ({user.risk_score || 0}%)
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_restricted
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {user.is_restricted ? 'Banned' : 'Active'}
                      </span>
                      {user.is_restricted && user.restriction_end_date && (
                        <div className="text-xs text-gray-500">
                          Until {new Date(user.restriction_end_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedUser(user)
                        fetchUserActions(user.id)
                        setShowUserModal(true)
                      }}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                    >
                      Manage
                    </button>
                    <button
                      onClick={() => {
                        const action = user.is_restricted ? 'unban' : 'ban'
                        handleUserAction(user.id, action, `Quick ${action} action`)
                      }}
                      className={`${
                        user.is_restricted
                          ? 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                          : 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'
                      }`}
                    >
                      {user.is_restricted ? 'Unban' : 'Ban'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No users found</p>
          </div>
        )}
      </motion.div>

      {/* User Management Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Manage User: {selectedUser.first_name} {selectedUser.last_name}
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            {/* User Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">User Information</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Email:</strong> {selectedUser.email}</div>
                  <div><strong>Phone:</strong> {selectedUser.phone || 'N/A'}</div>
                  <div><strong>CIN:</strong> {selectedUser.cin || 'N/A'}</div>
                  <div><strong>Joined:</strong> {new Date(selectedUser.created_at || '').toLocaleDateString()}</div>
                  <div><strong>Risk Score:</strong> 
                    <span className={`ml-2 px-2 py-1 text-xs rounded ${getRiskColor(selectedUser.risk_score || 0)}`}>
                      {selectedUser.risk_score || 0}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Activity Summary</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Total Bookings:</strong> {selectedUser.booking_count || 0}</div>
                  <div><strong>Total Spent:</strong> {selectedUser.total_spent || 0} TND</div>
                  <div><strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 text-xs rounded ${
                      selectedUser.is_restricted ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {selectedUser.is_restricted ? 'Banned' : 'Active'}
                    </span>
                  </div>
                  <div><strong>Admin:</strong> {selectedUser.is_admin ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>

            {/* Action Reason */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Action Reason (Required)
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Provide a reason for this action..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>

            {/* Restriction Duration */}
            {!selectedUser.is_restricted && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Restriction Duration (Days)
                </label>
                <input
                  type="number"
                  value={restrictionDays}
                  onChange={(e) => setRestrictionDays(parseInt(e.target.value) || 30)}
                  min="1"
                  max="365"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {!selectedUser.is_restricted ? (
                <button
                  onClick={() => handleUserAction(selectedUser.id, 'ban', actionReason)}
                  disabled={!actionReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Ban User
                </button>
              ) : (
                <button
                  onClick={() => handleUserAction(selectedUser.id, 'unban', actionReason)}
                  disabled={!actionReason.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Unban User
                </button>
              )}

              {!selectedUser.is_admin ? (
                <button
                  onClick={() => handleUserAction(selectedUser.id, 'promote', actionReason)}
                  disabled={!actionReason.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Promote to Admin
                </button>
              ) : (
                <button
                  onClick={() => handleUserAction(selectedUser.id, 'demote', actionReason)}
                  disabled={!actionReason.trim()}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Remove Admin
                </button>
              )}

              <button
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>

            {/* Recent Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Recent Actions</h4>
              <div className="space-y-2">
                {userActions.map((action) => (
                  <div key={action.id} className="text-sm p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{action.action}</div>
                        <div className="text-gray-600 dark:text-gray-400">{action.reason}</div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(action.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default AdvancedUserManager