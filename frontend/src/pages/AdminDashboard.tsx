import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import AdminSidebar from '../components/admin/AdminSidebar.tsx'
import AdminTopBar from '../components/admin/AdminTopBar.tsx'
import DashboardOverview from '../components/admin/DashboardOverview.tsx'
import BookingsManager from '../components/admin/BookingsManager.tsx'
import FacilitiesManager from '../components/admin/FacilitiesManager.tsx'
import UsersManager from '../components/admin/UsersManager.tsx'
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard.tsx'
import DatabaseReset from '../components/admin/DatabaseReset.tsx'
import ReservationChecker from '../components/admin/ReservationChecker.tsx'
import SecurityDashboard from '../components/admin/SecurityDashboard.tsx'
import SecuritySettings from '../components/admin/SecuritySettings.tsx'
import AdvancedUserManager from '../components/admin/AdvancedUserManager.tsx'
import AuditLogs from '../components/admin/AuditLogs.tsx'

type AdminSection = 'dashboard' | 'bookings' | 'facilities' | 'users' | 'advanced-users' | 'checker' | 'security' | 'security-settings' | 'audit' | 'analytics' | 'reset'

const AdminDashboard = () => {
  const { user, isLoading } = useAuth()
  const [activeSection, setActiveSection] = useState<AdminSection>('bookings')
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null) // null = checking, false = not admin, true = admin

  useEffect(() => {
    // Check if user is admin
    const checkAdminStatus = async () => {
      if (user) {
        // You'll need to fetch the user profile to check is_admin
        // For now, we'll assume temimi.iyed@gmail.com is admin
        const isUserAdmin = user.email === 'temimi.iyed@gmail.com'
        setIsAdmin(isUserAdmin)
      }
    }
    checkAdminStatus()
  }, [user])

  if (isLoading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardOverview />
      case 'bookings':
        return <BookingsManager />
      case 'facilities':
        return <FacilitiesManager />
      case 'users':
        return <UsersManager />
      case 'advanced-users':
        return <AdvancedUserManager />
      case 'checker':
        return <ReservationChecker />
      case 'security':
        return <SecurityDashboard />
      case 'security-settings':
        return <SecuritySettings />
      case 'audit':
        return <AuditLogs />
      case 'analytics':
        return <AnalyticsDashboard />
      case 'reset':
        return <DatabaseReset />
      default:
        return <BookingsManager />
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <AdminSidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <AdminTopBar user={user} currentSection={activeSection} />
        
        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderActiveSection()}
          </motion.div>
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard