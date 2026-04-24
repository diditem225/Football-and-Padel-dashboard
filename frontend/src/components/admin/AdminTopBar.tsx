import { User } from '@supabase/supabase-js'

interface AdminTopBarProps {
  user: User
  currentSection?: string
}

const AdminTopBar = ({ user, currentSection = 'Dashboard' }: AdminTopBarProps) => {
  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  const getSectionTitle = (section: string) => {
    switch (section) {
      case 'dashboard': return 'Dashboard'
      case 'bookings': return 'Bookings'
      case 'facilities': return 'Facilities & Slots'
      case 'users': return 'Users'
      case 'analytics': return 'Analytics'
      case 'reset': return 'Database Reset'
      default: return 'Dashboard'
    }
  }

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {getSectionTitle(currentSection)}
          </h2>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-gray-600 dark:text-gray-400">Admin</span>
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {getInitials(user.email || 'AD')}
          </div>
        </div>
      </div>
    </header>
  )
}

export default AdminTopBar