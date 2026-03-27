import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { isAdmin, getAuthHeaders, getUser } from '../auth'
import { config } from '../config'

function StatusIndicator({ status }) {
  if (status === 'checking') {
    return (
      <span className="flex items-center gap-2 text-amber-600 text-sm">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        Checking
      </span>
    )
  }
  if (status === 'online') {
    return (
      <span className="flex items-center gap-2 text-green-600 text-sm">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        Online
      </span>
    )
  }
  return (
    <span className="flex items-center gap-2 text-red-600 text-sm">
      <span className="w-2 h-2 rounded-full bg-red-500" />
      Offline
    </span>
  )
}

function Home() {
  const admin = isAdmin()
  const user = getUser()

  const [stats, setStats] = useState({
    voters: 0,
    elections: 0,
  })

  const [health, setHealth] = useState({
    backend: 'checking',
    ml: 'checking',
    graph: 'checking',
  })

  // Live health checks
  useEffect(() => {
    const check = async (url, key) => {
      try {
        const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(3000) })
        setHealth(prev => ({ ...prev, [key]: res.ok ? 'online' : 'offline' }))
      } catch {
        setHealth(prev => ({ ...prev, [key]: 'offline' }))
      }
    }

    check(config.backendUrl, 'backend')
    check(config.mlUrl, 'ml')
    check(config.graphUrl, 'graph')

    const interval = setInterval(() => {
      check(config.backendUrl, 'backend')
      check(config.mlUrl, 'ml')
      check(config.graphUrl, 'graph')
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // Fetch stats for admin
  useEffect(() => {
    if (!admin) return

    const fetchStats = async () => {
      try {
        const res = await fetch(`${config.backendUrl}/api/voters`, {
          headers: getAuthHeaders()
        })
        if (res.ok) {
          const voters = await res.json()
          const realVoters = voters.filter(v => v.role !== 'admin')
          setStats(prev => ({ ...prev, voters: realVoters.length }))
        }
      } catch (err) {
        console.warn('Failed to fetch stats:', err.message)
      }
    }
    fetchStats()
  }, [admin])

  // Admin Dashboard
  if (admin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-surface-800">Dashboard</h1>
          <p className="text-surface-500 mt-1">System overview and quick actions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-surface-200 rounded-xl p-5 shadow-card">
            <p className="text-sm text-surface-500">Registered Voters</p>
            <p className="text-3xl font-semibold text-surface-800 mt-1">{stats.voters}</p>
          </div>
          <div className="bg-white border border-surface-200 rounded-xl p-5 shadow-card">
            <p className="text-sm text-surface-500">Backend Status</p>
            <div className="mt-2">
              <StatusIndicator status={health.backend} />
            </div>
          </div>
          <div className="bg-white border border-surface-200 rounded-xl p-5 shadow-card">
            <p className="text-sm text-surface-500">ML Service</p>
            <div className="mt-2">
              <StatusIndicator status={health.ml} />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-surface-200 rounded-xl p-6 shadow-card">
          <h2 className="text-lg font-medium text-surface-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              to="/elections"
              className="flex flex-col items-center gap-2 p-4 bg-surface-50 rounded-lg border border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
            >
              <span className="text-2xl">📅</span>
              <span className="text-sm font-medium text-surface-700 group-hover:text-primary-700">Elections</span>
            </Link>
            <Link
              to="/candidates"
              className="flex flex-col items-center gap-2 p-4 bg-surface-50 rounded-lg border border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
            >
              <span className="text-2xl">👤</span>
              <span className="text-sm font-medium text-surface-700 group-hover:text-primary-700">Candidates</span>
            </Link>
            <Link
              to="/voters"
              className="flex flex-col items-center gap-2 p-4 bg-surface-50 rounded-lg border border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
            >
              <span className="text-2xl">👥</span>
              <span className="text-sm font-medium text-surface-700 group-hover:text-primary-700">Voters</span>
            </Link>
            <Link
              to="/results"
              className="flex flex-col items-center gap-2 p-4 bg-surface-50 rounded-lg border border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
            >
              <span className="text-2xl">📊</span>
              <span className="text-sm font-medium text-surface-700 group-hover:text-primary-700">Results</span>
            </Link>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white border border-surface-200 rounded-xl p-6 shadow-card">
          <h2 className="text-lg font-medium text-surface-800 mb-4">System Status</h2>
          <div className="space-y-3">
            {[
              { label: 'Backend API', key: 'backend', url: config.backendUrl },
              { label: 'ML Service', key: 'ml', url: config.mlUrl },
              { label: 'Graph Service', key: 'graph', url: config.graphUrl },
            ].map(({ label, key, url }) => (
              <div key={key} className="flex items-center justify-between py-3 px-4 bg-surface-50 rounded-lg">
                <div>
                  <span className="font-medium text-surface-700">{label}</span>
                  <span className="text-surface-400 text-xs ml-2">{url}</span>
                </div>
                <StatusIndicator status={health[key]} />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Voter Dashboard
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Welcome */}
      <div className="text-center py-6">
        <h1 className="text-2xl font-semibold text-surface-800">
          Welcome, {user?.name || 'Voter'}
        </h1>
        <p className="text-surface-500 mt-1">Cast your vote securely with blockchain technology</p>
      </div>

      {/* Main Action */}
      <Link
        to="/vote"
        className="block bg-primary-600 hover:bg-primary-700 text-white rounded-xl p-6 text-center transition-colors shadow-card"
      >
        <span className="text-3xl block mb-2">🗳️</span>
        <span className="text-xl font-semibold">Cast Your Vote</span>
        <p className="text-primary-100 text-sm mt-1">Secure, verifiable, and anonymous</p>
      </Link>

      {/* Secondary Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          to="/results"
          className="bg-white border border-surface-200 rounded-xl p-5 text-center hover:border-surface-300 transition-colors shadow-card"
        >
          <span className="text-2xl block mb-2">📊</span>
          <span className="font-medium text-surface-700">View Results</span>
          <p className="text-surface-500 text-sm mt-1">Live blockchain data</p>
        </Link>
        <Link
          to="/receipt"
          className="bg-white border border-surface-200 rounded-xl p-5 text-center hover:border-surface-300 transition-colors shadow-card"
        >
          <span className="text-2xl block mb-2">🧾</span>
          <span className="font-medium text-surface-700">My Receipt</span>
          <p className="text-surface-500 text-sm mt-1">Verify your vote</p>
        </Link>
      </div>

      {/* Profile Link */}
      <Link
        to="/profile"
        className="flex items-center gap-4 bg-white border border-surface-200 rounded-xl p-4 hover:border-surface-300 transition-colors shadow-card"
      >
        <div className="w-12 h-12 bg-surface-100 rounded-full flex items-center justify-center text-xl">
          {user?.name?.charAt(0) || '👤'}
        </div>
        <div className="flex-1">
          <p className="font-medium text-surface-700">{user?.name || 'Voter'}</p>
          <p className="text-sm text-surface-500">View your profile</p>
        </div>
        <svg className="w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>

      {/* Info */}
      <div className="bg-surface-100 border border-surface-200 rounded-xl p-5 text-center text-sm text-surface-500">
        <p>Your vote is secured by Ethereum blockchain and face biometric verification.</p>
        <p className="mt-1">Each vote is recorded immutably and can be verified.</p>
      </div>
    </div>
  )
}

export default Home
