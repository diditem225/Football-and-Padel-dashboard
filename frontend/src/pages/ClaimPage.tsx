import { useParams } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'

const ClaimPage = () => {
  const { token } = useParams()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Claim Your Slot
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Claim token: {token}
        </p>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Claim functionality coming soon...
        </p>
      </div>
      <Footer />
    </div>
  )
}

export default ClaimPage
