import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveToken, isAdmin } from '../auth'
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
    } catch {
      setError('Cannot reach the server. Is it running on port 8080?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-400 mb-2">VoteChain</h1>
          <p className="text-gray-400">Decentralized Voting Dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Sign In</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Voter ID
              </label>
              <input
                type="text"
                value={voterId}
                onChange={(e) => setVoterId(e.target.value)}
                placeholder="e.g. admin or voter001"
                autoFocus
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>

            {error && (
              <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-lg px-4 py-3">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 pt-6 border-t border-dark-700">
            <p className="text-xs text-gray-500 mb-2">Demo credentials:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => { setVoterId('admin'); setPassword('Admin@123') }}
                className="bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded px-3 py-2 text-gray-300 text-left transition"
              >
                👤 <span className="font-mono">admin / Admin@123</span>
              </button>
              <button
                onClick={() => { setVoterId('voter001'); setPassword('Voter@001') }}
                className="bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded px-3 py-2 text-gray-300 text-left transition"
              >
                🗳️ <span className="font-mono">voter001 / Voter@001</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
