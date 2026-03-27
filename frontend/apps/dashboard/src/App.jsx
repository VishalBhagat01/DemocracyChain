import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import BoothManagement from './pages/BoothManagement'
import Analytics from './pages/Analytics'
import Receipt from './pages/Receipt'
import Login from './pages/Login'
import { isLoggedIn, clearToken, getUser, isAdmin } from './auth'

// Guard: redirects to /login if not authenticated
function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />
}

// Guard: allows only admin role, redirects non-admin users to home
function AdminRoute({ children }) {
  return isAdmin() ? children : <Navigate to="/" replace />
}

function Navbar() {
  const navigate = useNavigate()
  const user = getUser()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    clearToken()
    navigate('/login', { replace: true })
  }

  const navLinks = [
    { to: '/', label: 'Home', show: true },
    { to: '/booth-management', label: 'Booths', show: isAdmin() },
    { to: '/analytics', label: 'Analytics', show: isAdmin() },
    { to: '/receipt', label: 'Receipt', show: true },
  ]

  return (
    <nav className="bg-white border-b border-surface-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary-600 hover:text-primary-700 transition-colors">
            <span className="text-2xl">🗳️</span>
            <span>VoteChain</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.filter(link => link.show).map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="text-surface-600 hover:text-primary-600 font-medium transition-colors focus-ring rounded px-2 py-1"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User & Logout */}
          <div className="hidden md:flex items-center gap-4">
            {user && (
              <span className="text-sm text-surface-500 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${user.role === 'admin' ? 'bg-red-500' : 'bg-green-500'}`} />
                {user.name || user.id}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-surface-600 hover:text-red-600 border border-surface-300 hover:border-red-400 px-4 py-1.5 rounded-lg transition-all btn-press focus-ring"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-surface-600 hover:text-primary-600 transition-colors focus-ring rounded"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-2 animate-fadeIn">
            <div className="flex flex-col gap-2">
              {navLinks.filter(link => link.show).map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-surface-600 hover:text-primary-600 hover:bg-surface-100 font-medium py-2 px-3 rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <hr className="my-2 border-surface-200" />
              {user && (
                <span className="text-sm text-surface-500 px-3 py-2 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${user.role === 'admin' ? 'bg-red-500' : 'bg-green-500'}`} />
                  {user.name || user.id}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="text-left text-red-600 hover:bg-red-50 font-medium py-2 px-3 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

function AppLayout() {
  return (
    <div className="min-h-screen bg-surface-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/booth-management" element={<PrivateRoute><AdminRoute><BoothManagement /></AdminRoute></PrivateRoute>} />
          <Route path="/analytics" element={<PrivateRoute><AdminRoute><Analytics /></AdminRoute></PrivateRoute>} />
          <Route path="/receipt" element={<PrivateRoute><Receipt /></PrivateRoute>} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </Router>
  )
}

export default App
