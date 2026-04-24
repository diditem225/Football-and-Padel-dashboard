import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

interface Facility {
  id: string
  name: string
  type: 'football_field' | 'padel_court'
  capacity: number
  hourly_rate: number
  is_active: boolean | null
  created_at: string | null
}

const FacilitiesManager = () => {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookingData, setBookingData] = useState<{[key: string]: boolean}>({})
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    type: 'football_field' as 'football_field' | 'padel_court',
    hourly_rate: 0,
    capacity: 22,
    is_active: true
  })
  const [isUpdating, setIsUpdating] = useState(false)

  // Time slots for editing
  const timeSlots = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 8
    return `${hour.toString().padStart(2, '0')}:00`
  })

  useEffect(() => {
    fetchFacilities()
  }, [])

  useEffect(() => {
    if (selectedFacility) {
      fetchBookingData()
    }
  }, [selectedFacility, selectedDate])

  const fetchBookingData = async () => {
    if (!selectedFacility) return
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('facility_id', selectedFacility.id)
        .eq('booking_date', selectedDate)
        .in('status', ['confirmed', 'pending_payment'])

      if (error) throw error

      const bookedSlots: {[key: string]: boolean} = {}
      data?.forEach(booking => {
        const startHour = parseInt(booking.start_time.split(':')[0])
        bookedSlots[`${startHour.toString().padStart(2, '0')}:00`] = true
      })

      setBookingData(bookedSlots)
    } catch (error) {
      console.error('Error fetching booking data:', error)
    }
  }

  const fetchFacilities = async () => {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .order('name')

      if (error) throw error
      setFacilities(data || [])
      if (data && data.length > 0) {
        setSelectedFacility(data[0])
      }
    } catch (error) {
      console.error('Error fetching facilities:', error)
      toast.error('Failed to load facilities')
    } finally {
      setLoading(false)
    }
  }

  const toggleFacilityStatus = async (facilityId: string, currentStatus: boolean | null) => {
    try {
      const { error } = await supabase
        .from('facilities')
        .update({ is_active: !currentStatus })
        .eq('id', facilityId)

      if (error) throw error

      toast.success(`Facility ${!currentStatus ? 'activated' : 'deactivated'}`)
      fetchFacilities()
    } catch (error) {
      toast.error('Failed to update facility status')
    }
  }

  const openEditModal = (facility: Facility) => {
    setEditForm({
      name: facility.name,
      type: facility.type,
      hourly_rate: facility.hourly_rate,
      capacity: facility.capacity,
      is_active: facility.is_active || false
    })
    setShowEditModal(true)
  }

  const handleUpdateFacility = async () => {
    if (!selectedFacility) return

    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('facilities')
        .update({
          name: editForm.name,
          type: editForm.type,
          hourly_rate: editForm.hourly_rate,
          capacity: editForm.capacity,
          is_active: editForm.is_active
        })
        .eq('id', selectedFacility.id)

      if (error) throw error

      toast.success('Facility updated successfully!')
      setShowEditModal(false)
      fetchFacilities()
      
      // Update selected facility
      setSelectedFacility({
        ...selectedFacility,
        ...editForm
      })
    } catch (error) {
      console.error('Error updating facility:', error)
      toast.error('Failed to update facility')
    } finally {
      setIsUpdating(false)
    }
  }

  const getSlotStatus = (time: string) => {
    return bookingData[time] ? 'booked' : 'available'
  }

  const getSlotColor = (time: string) => {
    const status = getSlotStatus(time)
    return status === 'booked' 
      ? 'bg-red-500 hover:bg-red-600 text-white' 
      : 'bg-green-500 hover:bg-green-600 text-white'
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Facilities & Slots</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Facilities List */}
        <div className="lg:col-span-1 space-y-4">
          {facilities.map((facility) => (
            <motion.div
              key={facility.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedFacility(facility)}
              className={`p-4 rounded-xl cursor-pointer transition-all ${
                selectedFacility?.id === facility.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{facility.name}</h3>
                  <p className={`text-sm ${
                    selectedFacility?.id === facility.id ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {facility.type === 'football_field' ? '⚽ Football' : '🎾 Padel'} • {facility.type === 'football_field' ? 'Outdoor' : 'Indoor'}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    facility.is_active
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                    {facility.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Add Facility Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
          >
            + Add facility
          </motion.button>
        </div>

        {/* Facility Details */}
        <div className="lg:col-span-2">
          {selectedFacility ? (
            <div className="space-y-6">
              {/* Facility Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedFacility.name} — details
                  </h3>
                  <button 
                    onClick={() => openEditModal(selectedFacility)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Type</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedFacility.type === 'football_field' ? 'Football Field' : 'Padel Court'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Capacity</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedFacility.capacity} players
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Price per slot</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedFacility.hourly_rate.toFixed(2)} TND
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Slot duration</p>
                    <p className="font-semibold text-gray-900 dark:text-white">60 min</p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</p>
                    <button
                      onClick={() => toggleFacilityStatus(selectedFacility.id, selectedFacility.is_active)}
                      className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                        selectedFacility.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}
                    >
                      {selectedFacility.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Available Time Slots */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Available time slots
                  </h3>
                  <div className="flex items-center gap-4">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button 
                      onClick={fetchBookingData}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {timeSlots.map((time) => (
                    <div
                      key={time}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${getSlotColor(time)}`}
                    >
                      <div className="text-center">
                        <div>{time}</div>
                        <div className="text-xs opacity-75">
                          {getSlotStatus(time)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-gray-600 dark:text-gray-400">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-gray-600 dark:text-gray-400">Booked</span>
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Select a facility to view details
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Facility Modal */}
      {showEditModal && selectedFacility && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit Facility
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Facility Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Facility Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter facility name"
                />
              </div>

              {/* Facility Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Facility Type
                </label>
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value as 'football_field' | 'padel_court' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="football_field">⚽ Football Field</option>
                  <option value="padel_court">🎾 Padel Court</option>
                </select>
              </div>

              {/* Hourly Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hourly Rate (TND)
                </label>
                <input
                  type="number"
                  value={editForm.hourly_rate}
                  onChange={(e) => setEditForm({ ...editForm, hourly_rate: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter hourly rate"
                />
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Capacity (Players)
                </label>
                <input
                  type="number"
                  value={editForm.capacity}
                  onChange={(e) => setEditForm({ ...editForm, capacity: parseInt(e.target.value) || 0 })}
                  min="1"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter capacity"
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Active Status</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Enable bookings for this facility</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateFacility}
                disabled={isUpdating || !editForm.name.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUpdating ? 'Updating...' : 'Update Facility'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default FacilitiesManager