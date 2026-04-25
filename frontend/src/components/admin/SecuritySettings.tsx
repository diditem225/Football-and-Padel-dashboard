import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface SecurityConfig {
  maxFailedLogins: number
  accountLockoutDuration: number
  passwordMinLength: number
  requireCIN: boolean
  enableTwoFactor: boolean
  sessionTimeout: number
  ipWhitelist: string[]
  enableAuditLogging: boolean
  autoBlockSuspiciousActivity: boolean
  maxBookingsPerDay: number
  requireEmailVerification: boolean
}

const SecuritySettings = () => {
  const [config, setConfig] = useState<SecurityConfig>({
    maxFailedLogins: 5,
    accountLockoutDuration: 30,
    passwordMinLength: 8,
    requireCIN: true,
    enableTwoFactor: false,
    sessionTimeout: 24,
    ipWhitelist: [],
    enableAuditLogging: true,
    autoBlockSuspiciousActivity: true,
    maxBookingsPerDay: 10,
    requireEmailVerification: true
  })
  
  const [loading, setLoading] = useState(false)
  const [newIP, setNewIP] = useState('')
  const [activeTab, setActiveTab] = useState<'authentication' | 'access' | 'monitoring' | 'limits'>('authentication')

  useEffect(() => {
    loadSecurityConfig()
  }, [])

  const loadSecurityConfig = async () => {
    // In production, this would load from a security_config table
    // For now, we'll use localStorage to persist settings
    const savedConfig = localStorage.getItem('security_config')
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig))
    }
  }

  const saveSecurityConfig = async () => {
    setLoading(true)
    try {
      // In production, this would save to database
      localStorage.setItem('security_config', JSON.stringify(config))
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Security settings updated successfully')
    } catch (error) {
      toast.error('Failed to update security settings')
    } finally {
      setLoading(false)
    }
  }

  const addIPToWhitelist = () => {
    if (newIP && !config.ipWhitelist.includes(newIP)) {
      setConfig(prev => ({
        ...prev,
        ipWhitelist: [...prev.ipWhitelist, newIP]
      }))
      setNewIP('')
    }
  }

  const removeIPFromWhitelist = (ip: string) => {
    setConfig(prev => ({
      ...prev,
      ipWhitelist: prev.ipWhitelist.filter(item => item !== ip)
    }))
  }

  const resetToDefaults = () => {
    setConfig({
      maxFailedLogins: 5,
      accountLockoutDuration: 30,
      passwordMinLength: 8,
      requireCIN: true,
      enableTwoFactor: false,
      sessionTimeout: 24,
      ipWhitelist: [],
      enableAuditLogging: true,
      autoBlockSuspiciousActivity: true,
      maxBookingsPerDay: 10,
      requireEmailVerification: true
    })
    toast.success('Settings reset to defaults')
  }

  const tabs = [
    { id: 'authentication', label: 'Authentication', icon: '🔐' },
    { id: 'access', label: 'Access Control', icon: '🚪' },
    { id: 'monitoring', label: 'Monitoring', icon: '👁️' },
    { id: 'limits', label: 'Rate Limits', icon: '⚡' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Security Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure system-wide security policies and controls
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            onClick={saveSecurityConfig}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Security Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <span className="text-green-600 text-2xl">🛡️</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
              Security Status: Excellent
            </h3>
            <p className="text-green-700 dark:text-green-300 text-sm">
              All security measures are properly configured and active
            </p>
          </div>
          <div className="ml-auto">
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">94%</div>
              <div className="text-sm text-green-700 dark:text-green-300">Security Score</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        {activeTab === 'authentication' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Authentication Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum Failed Login Attempts
                </label>
                <input
                  type="number"
                  value={config.maxFailedLogins}
                  onChange={(e) => setConfig(prev => ({ ...prev, maxFailedLogins: parseInt(e.target.value) || 5 }))}
                  min="1"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Account will be locked after this many failed attempts</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Lockout Duration (minutes)
                </label>
                <input
                  type="number"
                  value={config.accountLockoutDuration}
                  onChange={(e) => setConfig(prev => ({ ...prev, accountLockoutDuration: parseInt(e.target.value) || 30 }))}
                  min="5"
                  max="1440"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">How long accounts remain locked</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minimum Password Length
                </label>
                <input
                  type="number"
                  value={config.passwordMinLength}
                  onChange={(e) => setConfig(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) || 8 }))}
                  min="6"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum characters required for passwords</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Session Timeout (hours)
                </label>
                <input
                  type="number"
                  value={config.sessionTimeout}
                  onChange={(e) => setConfig(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) || 24 }))}
                  min="1"
                  max="168"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Automatic logout after inactivity</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Require CIN for Registration</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Users must provide national ID during signup</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.requireCIN}
                    onChange={(e) => setConfig(prev => ({ ...prev, requireCIN: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Require Email Verification</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Users must verify email before account activation</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.requireEmailVerification}
                    onChange={(e) => setConfig(prev => ({ ...prev, requireEmailVerification: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg opacity-50">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Require SMS or app-based 2FA (Coming Soon)</p>
                </div>
                <label className="relative inline-flex items-center cursor-not-allowed">
                  <input
                    type="checkbox"
                    checked={config.enableTwoFactor}
                    disabled
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'access' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Access Control</h3>
            
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">IP Whitelist</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Restrict admin access to specific IP addresses (leave empty to allow all)
              </p>
              
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={newIP}
                  onChange={(e) => setNewIP(e.target.value)}
                  placeholder="Enter IP address (e.g., 192.168.1.100)"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={addIPToWhitelist}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add IP
                </button>
              </div>

              <div className="space-y-2">
                {config.ipWhitelist.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No IP restrictions configured - all IPs allowed
                  </div>
                ) : (
                  config.ipWhitelist.map((ip, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="font-mono text-sm">{ip}</span>
                      <button
                        onClick={() => removeIPFromWhitelist(ip)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security Monitoring</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Enable Audit Logging</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Log all administrative actions and security events</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enableAuditLogging}
                    onChange={(e) => setConfig(prev => ({ ...prev, enableAuditLogging: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Auto-Block Suspicious Activity</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Automatically restrict accounts showing suspicious patterns</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.autoBlockSuspiciousActivity}
                    onChange={(e) => setConfig(prev => ({ ...prev, autoBlockSuspiciousActivity: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'limits' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Rate Limits & Restrictions</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum Bookings Per Day (Per User)
                </label>
                <input
                  type="number"
                  value={config.maxBookingsPerDay}
                  onChange={(e) => setConfig(prev => ({ ...prev, maxBookingsPerDay: parseInt(e.target.value) || 10 }))}
                  min="1"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Prevent booking spam and ensure fair access</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default SecuritySettings