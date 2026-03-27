import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import BoothManagement from './pages/BoothManagement'
import Analytics from './pages/Analytics'
import Receipt from './pages/Receipt'
import Login from './pages/Login'
import Elections from './pages/Elections'
import Candidates from './pages/Candidates'
import Voters from './pages/Voters'
import Vote from './pages/Vote'
import Results from './pages/Results'
import Profile from './pages/Profile'
import { isLoggedIn, clearToken, getUser, isAdmin } from './auth'

// Guard: redirects to /login if not authenticated
function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />
}

// Guard: allows only admin role
function AdminRoute({ children }) {
  return isAdmin() ? children : <Navigate to="/" replace />
}

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getUser()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const admin = isAdmin()

  const handleLogout = () => {
    clearToken()
    navigate('/login', { replace: true })
  }

  // Different navigation for admin vs voter
  const navLinks = admin ? [
    { to: '/', label: 'Dashboard' },
    { to: '/elections', label: 'Elections' },
    { to: '/candidates', label: 'Candidates' },
    { to: '/voters', label: 'Voters' },
    { to: '/booth-management', label: 'Booths' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/results', label: 'Results' },
  ] : [
    { to: '/', label: 'Home' },
    { to: '/vote', label: 'Vote' },
    { to: '/results', label: 'Results' },
    { to: '/receipt', label: 'Receipt' },
    { to: '/profile', label: 'Profile' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <nav className="bg-white border-b border-surface-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-surface-800 hover:text-primary-600 transition-colors">
            <span className="text-xl">🗳️</span>
            <span>VoteChain</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(link.to)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-surface-600 hover:text-surface-800 hover:bg-surface-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User & Logout */}
          <div className="hidden md:flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-50 rounded-lg">
                <span className={`w-2 h-2 rounded-full ${admin ? 'bg-amber-500' : 'bg-green-500'}`} />
                <span className="text-sm text-surface-600">{user.name || user.id}</span>
                <span className="text-xs text-surface-400 border-l border-surface-300 pl-2">
                  {admin ? 'Admin' : 'Voter'}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-surface-500 hover:text-red-600 px-3 py-1.5 rounded-lg transition-colors"
            >
              Sign out
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-surface-600 hover:text-surface-800 transition-colors rounded-lg"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-surface-100">
            <div className="flex flex-col gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(link.to)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-surface-600 hover:bg-surface-100'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="my-2 border-surface-200" />
              {user && (
                <div className="px-3 py-2 flex items-center gap-2 text-sm text-surface-500">
                  <span className={`w-2 h-2 rounded-full ${admin ? 'bg-amber-500' : 'bg-green-500'}`} />
                  {user.name || user.id} ({admin ? 'Admin' : 'Voter'})
                </div>
              )}
              <button
                onClick={handleLogout}
                className="text-left text-red-600 hover:bg-red-50 text-sm font-medium py-2 px-3 rounded-lg transition-colors"
              >
                Sign out
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
          {/* Common routes */}
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/results" element={<PrivateRoute><Results /></PrivateRoute>} />
          <Route path="/receipt" element={<PrivateRoute><Receipt /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

          {/* Voter routes */}
          <Route path="/vote" element={<PrivateRoute><Vote /></PrivateRoute>} />

          {/* Admin routes */}
          <Route path="/elections" element={<PrivateRoute><AdminRoute><Elections /></AdminRoute></PrivateRoute>} />
          <Route path="/candidates" element={<PrivateRoute><AdminRoute><Candidates /></AdminRoute></PrivateRoute>} />
          <Route path="/voters" element={<PrivateRoute><AdminRoute><Voters /></AdminRoute></PrivateRoute>} />
          <Route path="/booth-management" element={<PrivateRoute><AdminRoute><BoothManagement /></AdminRoute></PrivateRoute>} />
          <Route path="/analytics" element={<PrivateRoute><AdminRoute><Analytics /></AdminRoute></PrivateRoute>} />
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
