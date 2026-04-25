import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'framer-motion'

const Header = () => {
  const { isAuthenticated, user, signOut } = useAuth()
  const isDemoMode = import.meta.env.VITE_SUPABASE_URL === 'https://demo.supabase.co'

  return (
    <>
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-center py-2 px-4 text-sm font-medium">
          🎭 <strong>Demo Mode:</strong> UI fully functional! Set up Supabase for booking features. 
          <a href="#setup" className="underline ml-2 hover:text-gray-800">Setup Guide</a>
        </div>
      )}
      
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800"
      >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-football-500 to-padel-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <span className="text-white text-xl font-bold">⚽</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-football-600 to-padel-600 bg-clip-text text-transparent">
              FiveStars
            </span>
          </Link>

          {/* Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-gray-700 dark:text-gray-300 hover:text-football-600 dark:hover:text-football-400 transition-colors duration-200"
            >
              Home
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/booking"
                  className="text-gray-700 dark:text-gray-300 hover:text-football-600 dark:hover:text-football-400 transition-colors duration-200"
                >
                  Book Now
                </Link>
                <Link
                  to="/dashboard"
                  className="text-gray-700 dark:text-gray-300 hover:text-football-600 dark:hover:text-football-400 transition-colors duration-200"
                >
                  My Bookings
                </Link>
                {/* Admin Link - only show for admin users */}
                {user?.email === 'temimi.iyed@gmail.com' && (
                  <Link
                    to="/admin"
                    className="text-gray-700 dark:text-gray-300 hover:text-football-600 dark:hover:text-football-400 transition-colors duration-200"
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
            <Link
              to="/contact"
              className="text-gray-700 dark:text-gray-300 hover:text-football-600 dark:hover:text-football-400 transition-colors duration-200"
            >
              Contact
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-400">
                  {user?.email}
                </span>
                <button
                  onClick={signOut}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-football-600 dark:hover:text-football-400 transition-colors duration-200"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-football-600 dark:hover:text-football-400 transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-gradient-to-r from-football-600 to-padel-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </motion.header>
    </>
  )
}

export default Header
