import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const DatabaseReset = () => {
  const [isResetting, setIsResetting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const resetDatabase = async () => {
    setIsResetting(true)
    try {
      // Step 1: Clear all bookings and related data
      const { error: bookingsError } = await supabase
        .from('bookings')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

      if (bookingsError) throw bookingsError

      // Step 2: Clear reviews
      const { error: reviewsError } = await supabase
        .from('reviews')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

      if (reviewsError) throw reviewsError

      // Step 3: Clear waitlist entries
      const { error: waitlistError } = await supabase
        .from('waitlist_entries')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

      if (waitlistError) throw waitlistError

      // Step 4: Clear email logs
      const { error: emailError } = await supabase
        .from('email_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

      if (emailError) throw emailError

      // Step 5: Clear no-show records
      const { error: noshowError } = await supabase
        .from('no_show_records')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

      if (noshowError) throw noshowError

      // Step 6: Get admin user ID
      const { data: adminUser } = await supabase.auth.getUser()
      const adminId = adminUser?.user?.id

      if (adminId) {
        // Step 7: Delete non-admin user profiles
        const { error: profilesError } = await supabase
          .from('user_profiles')
          .delete()
          .neq('id', adminId)

        if (profilesError) throw profilesError
      }

      // Step 8: Reset all facilities to active
      const { error: facilitiesError } = await supabase
        .from('facilities')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .neq('id', '00000000-0000-0000-0000-000000000000') // Update all

      if (facilitiesError) throw facilitiesError

      toast.success('Database reset successfully! All bookings cleared, facilities reset.')
      setShowConfirmation(false)
      
      // Refresh the page to show updated data
      setTimeout(() => {
        window.location.reload()
      }, 2000)

    } catch (error: any) {
      console.error('Reset error:', error)
      toast.error(`Reset failed: ${error.message}`)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Database Reset
        </h2>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Warning: This action cannot be undone!
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>This will permanently delete:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>All bookings and reservations</li>
                  <li>All user accounts (except admin)</li>
                  <li>All reviews and ratings</li>
                  <li>All waitlist entries</li>
                  <li>All email logs</li>
                  <li>All revenue data</li>
                </ul>
                <p className="mt-2 font-medium">
                  Facilities will be reset to active status with default pricing.
                </p>
              </div>
            </div>
          </div>
        </div>

        {!showConfirmation ? (
          <button
            onClick={() => setShowConfirmation(true)}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Reset Database
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <p className="text-gray-900 dark:text-white font-medium">
              Are you absolutely sure? Type "RESET" to confirm:
            </p>
            
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Type RESET to confirm"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value === 'RESET') {
                    resetDatabase()
                  }
                }}
              />
              
              <button
                onClick={resetDatabase}
                disabled={isResetting}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResetting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Resetting...
                  </div>
                ) : (
                  'Confirm Reset'
                )}
              </button>
              
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={isResetting}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-blue-400 text-xl">ℹ️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Alternative: Manual SQL Reset
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>For more control, you can run the SQL reset script directly in Supabase:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Go to your Supabase Dashboard → SQL Editor</li>
                <li>Run the reset script from: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">supabase/reset_database.sql</code></li>
                <li>This gives you more control and shows detailed results</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DatabaseReset