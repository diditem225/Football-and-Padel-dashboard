import { useState } from 'react'
import { motion } from 'framer-motion'
import Header from '../components/Header'
import Footer from '../components/Footer'
import BookingCalendar from '../components/BookingCalendar'

const BookingPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date())

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Book Your <span className="text-green-600 dark:text-green-400">Slot</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Choose your preferred facility and time
            </p>
          </div>

          <BookingCalendar 
            selectedDate={selectedDate} 
            onDateChange={setSelectedDate}
          />

          {/* Legend */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Legend
            </h3>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <div className="w-12 h-8 bg-green-100 dark:bg-green-900/30 rounded border-2 border-green-500"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-8 bg-red-100 dark:bg-red-900/30 rounded border-2 border-red-500"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚽</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">Football Field</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎾</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">Padel Court</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}

export default BookingPage
