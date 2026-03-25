import { useState, useEffect } from 'react'
import { backendUrl, isAdmin } from '../auth'
import { config } from '../config'

function StatusDot({ status }) {
  if (status === 'checking') return <span className="text-yellow-400">⏳ Checking…</span>
  if (status === 'online')   return <span className="text-green-400">● Online</span>
  return <span className="text-red-400">● Offline</span>
}

function Home() {
  const [stats, setStats] = useState({
    booths: 6,
    voters: 1250,
    transactions: 847,
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

  // Bump transactions counter every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({ ...prev, transactions: Math.floor(Math.random() * 1000) }))
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const admin = isAdmin()

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6 hover:border-blue-500 transition">
          <p className="text-gray-400 text-sm">Active Booths</p>
          <p className="text-4xl font-bold text-blue-400 mt-2">{stats.booths}</p>
          <p className="text-gray-500 text-xs mt-2">BOOTH_001 – BOOTH_006</p>
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6 hover:border-green-500 transition">
          <p className="text-gray-400 text-sm">Registered Voters</p>
          <p className="text-4xl font-bold text-green-400 mt-2">{stats.voters}</p>
          <p className="text-gray-500 text-xs mt-2">Face verified</p>
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6 hover:border-purple-500 transition">
          <p className="text-gray-400 text-sm">Blockchain Txs</p>
          <p className="text-4xl font-bold text-purple-400 mt-2">{stats.transactions}</p>
          <p className="text-gray-500 text-xs mt-2">On Ethereum</p>
        </div>
      </div>

      {/* Quick Links — all authenticated links to the backend */}
      <div className="bg-dark-800 border border-dark-700 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href={backendUrl('/vote')}
            target="_blank"
            rel="noreferrer"
            className="bg-dark-700 border border-dark-600 rounded-lg p-5 hover:border-blue-500 hover:bg-dark-600 transition group"
          >
            <p className="font-semibold text-blue-400 group-hover:text-blue-300 text-lg">🗳️ Vote</p>
            <p className="text-sm text-gray-400 mt-1">Cast your vote securely on-chain</p>
            <p className="text-xs text-gray-600 mt-3">Opens voting portal →</p>
          </a>

          {admin && (
            <a
              href={backendUrl('/admin')}
              target="_blank"
              rel="noreferrer"
              className="bg-dark-700 border border-dark-600 rounded-lg p-5 hover:border-red-500 hover:bg-dark-600 transition group"
            >
              <p className="font-semibold text-red-400 group-hover:text-red-300 text-lg">🔐 Admin Panel</p>
              <p className="text-sm text-gray-400 mt-1">Manage voters, approve registrations</p>
              <p className="text-xs text-gray-600 mt-3">Opens admin portal →</p>
            </a>
          )}

          <a
            href={backendUrl('/results')}
            target="_blank"
            rel="noreferrer"
            className="bg-dark-700 border border-dark-600 rounded-lg p-5 hover:border-green-500 hover:bg-dark-600 transition group"
          >
            <p className="font-semibold text-green-400 group-hover:text-green-300 text-lg">📊 Live Results</p>
            <p className="text-sm text-gray-400 mt-1">Real-time vote counts from blockchain</p>
            <p className="text-xs text-gray-600 mt-3">Opens results page →</p>
          </a>

          {admin && (
            <a
              href={backendUrl('/register')}
              target="_blank"
              rel="noreferrer"
              className="bg-dark-700 border border-dark-600 rounded-lg p-5 hover:border-yellow-500 hover:bg-dark-600 transition group"
            >
              <p className="font-semibold text-yellow-400 group-hover:text-yellow-300 text-lg">📝 Register</p>
              <p className="text-sm text-gray-400 mt-1">Register new voter with face biometrics</p>
              <p className="text-xs text-gray-600 mt-3">Opens registration portal →</p>
            </a>
          )}
        </div>
      </div>

      {/* System Status — live */}
      <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
        <div className="space-y-3">
          {[
            { label: 'Backend API', key: 'backend', url: config.backendUrl },
            { label: 'ML Service', key: 'ml', url: config.mlUrl },
            { label: 'Graph Service', key: 'graph', url: config.graphUrl },
          ].map(({ label, key, url }) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <div>
                <span className="text-gray-400">{label}</span>
                <span className="text-gray-600 text-xs ml-2">{url}</span>
              </div>
              <StatusDot status={health[key]} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home
