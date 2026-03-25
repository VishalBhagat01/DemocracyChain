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

  const handleLogout = () => {
    clearToken()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="bg-dark-800 border-b border-dark-700">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-bold text-blue-400">
            🗳️ VoteChain
          </Link>
          <div className="flex gap-6">
            <Link to="/" className="text-gray-400 hover:text-white transition">Home</Link>
            {isAdmin() && (
              <>
                <Link to="/booth-management" className="text-gray-400 hover:text-white transition">Booths</Link>
                <Link to="/analytics" className="text-gray-400 hover:text-white transition">Analytics</Link>
              </>
            )}
            <Link to="/receipt" className="text-gray-400 hover:text-white transition">Receipt</Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm text-gray-400">
              {user.role === 'admin' ? '🔴' : '🟢'} {user.name || user.id}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-red-400 border border-dark-600 hover:border-red-500 px-3 py-1 rounded transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

function AppLayout() {
  return (
    <div className="min-h-screen bg-dark-900">
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
