import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, FileText, Send, Activity, LogOut, Wallet, Copy } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { formatAddress } from '../utils/wallet'
import toast from 'react-hot-toast'

const Layout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { address, username, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Register Device', href: '/register-device', icon: FileText },
    { name: 'Send/Receive', href: '/send-receive', icon: Send },
    { name: 'Activity', href: '/activity', icon: Activity },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              {/* Try full logo first, then mark, then fallback icon */}
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                title="Go to Dashboard"
              >
                <img
                  src="/logo-full.png"
                  alt="BigWater Protocol"
                  className="h-10 object-contain drop-shadow-lg"
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = '/logomark.png'
                  }}
                />
              </button>
              <div className="hidden items-center justify-center h-12 w-12 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                <Wallet className="h-7 w-7 text-white" />
              </div>
              {/* Remove text label as requested */}
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-sm bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center space-x-2">
                <div className="text-white/80 text-xs">Welcome, {username}</div>
                <div className="font-mono text-white font-medium">{formatAddress(address)}</div>
                <button
                  onClick={() => {
                    if (address) {
                      navigator.clipboard.writeText(address)
                      toast.success('Address copied')
                    }
                  }}
                  className="p-1.5 hover:bg-white/20 rounded-md text-white"
                  title="Copy address"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={handleLogout}
                className="p-2.5 text-white hover:bg-white/20 rounded-lg transition-all shadow-md hover:shadow-lg"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center space-x-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-all
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 mt-auto shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-white/90">
            © 2025 BigWater DePIN. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Layout

