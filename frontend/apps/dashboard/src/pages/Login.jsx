import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveToken } from '../auth'
import { config } from '../config'

function Login() {
  const [voterId, setVoterId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!voterId.trim() || !password.trim()) {
      setError('Please enter your Voter ID and password')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${config.backendUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voter_id: voterId.trim(), password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Invalid credentials')
        return
      }

      saveToken(data.token)
      navigate('/')
    } catch (err) {
      console.error('Login failed:', err.message)
      setError('Cannot reach the server. Is it running on port 8080?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-surface-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fadeIn">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
            <span className="text-3xl">🗳️</span>
          </div>
          <h1 className="text-3xl font-bold text-surface-800 mb-2">VoteChain</h1>
          <p className="text-surface-500">Decentralized Voting Dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-surface-200 rounded-2xl p-8 shadow-soft animate-scaleIn">
          <h2 className="text-xl font-semibold text-surface-800 mb-6">Sign In</h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Voter ID
              </label>
              <input
                type="text"
                value={voterId}
                onChange={(e) => setVoterId(e.target.value)}
                placeholder="Enter your voter ID"
                autoFocus
                className="w-full bg-surface-50 border border-surface-300 rounded-xl px-4 py-3 text-surface-800 placeholder-surface-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-50 border border-surface-300 rounded-xl px-4 py-3 text-surface-800 placeholder-surface-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 animate-fadeIn">
                <p className="text-red-600 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all btn-press shadow-sm hover:shadow-md focus-ring"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Info hint (no auto-fill for security) */}
          <div className="mt-6 pt-6 border-t border-surface-200">
            <p className="text-xs text-surface-400 text-center">
              Contact your administrator for account credentials
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-surface-400 text-sm mt-6">
          Secured by Ethereum blockchain
        </p>
      </div>
    </div>
  )
}

export default Login
