import { motion } from 'framer-motion'

interface AdminSidebarProps {
  activeSection: string
  onSectionChange: (section: 'dashboard' | 'bookings' | 'facilities' | 'users' | 'advanced-users' | 'checker' | 'security' | 'security-settings' | 'audit' | 'analytics' | 'reset') => void
}

const AdminSidebar = ({ activeSection, onSectionChange }: AdminSidebarProps) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', category: 'overview' },
    { id: 'bookings', label: 'Bookings', icon: '📅', category: 'management' },
    { id: 'facilities', label: 'Facilities', icon: '🏟️', category: 'management' },
    { id: 'users', label: 'Users', icon: '👥', category: 'management' },
    { id: 'advanced-users', label: 'Advanced Users', icon: '👑', category: 'security' },
    { id: 'checker', label: 'Reservation Checker', icon: '🎫', category: 'operations' },
    { id: 'security', label: 'Security Dashboard', icon: '🛡️', category: 'security' },
    { id: 'security-settings', label: 'Security Settings', icon: '⚙️', category: 'security' },
    { id: 'audit', label: 'Audit Logs', icon: '📋', category: 'security' },
    { id: 'analytics', label: 'Analytics', icon: '📈', category: 'insights' },
    { id: 'reset', label: 'Reset Database', icon: '🔄', category: 'system' },
  ]

  const categories = {
    overview: 'Overview',
    management: 'Management',
    operations: 'Operations', 
    security: 'Security & Compliance',
    insights: 'Analytics & Insights',
    system: 'System Administration'
  }

  return (
    <div className="w-64 bg-slate-800 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold">
          <span className="text-blue-400">FiveStars</span> Admin
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {Object.entries(categories).map(([categoryKey, categoryLabel]) => {
          const categoryItems = menuItems.filter(item => item.category === categoryKey)
          
          return (
            <div key={categoryKey} className="mb-6">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-4">
                {categoryLabel}
              </h3>
              <ul className="space-y-1">
                {categoryItems.map((item) => (
                  <li key={item.id}>
                    <motion.button
                      whileHover={{ x: 4 }}
                      onClick={() => onSectionChange(item.id as any)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeSection === item.id
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="font-medium text-sm">{item.label}</span>
                      {item.id === 'security' && (
                        <span className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                      )}
                    </motion.button>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </nav>
    </div>
  )
}

export default AdminSidebar