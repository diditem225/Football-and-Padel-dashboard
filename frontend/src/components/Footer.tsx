import { Link } from 'react-router-dom'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 dark:bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-football-500 to-padel-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">⚽</span>
              </div>
              <span className="text-xl font-bold">FiveStars</span>
            </div>
            <p className="text-gray-400 text-sm">
              Tunisia's premier FiveStars booking platform. Book football fields and padel courts with ease.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/booking" className="text-gray-400 hover:text-white transition-colors">
                  Book Now
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                  My Bookings
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Facilities */}
          <div>
            <h3 className="font-bold mb-4">Facilities</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>⚽ 6 Football Fields</li>
              <li>🎾 2 Padel Courts</li>
              <li>🏟️ Premium Quality</li>
              <li>💡 Night Lighting</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>📍 Tunisia</li>
              <li>📧 info@fivestars.tn</li>
              <li>📱 +216 XX XXX XXX</li>
              <li>🕐 24/7 Online Booking</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">
            © {currentYear} FiveStars. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
