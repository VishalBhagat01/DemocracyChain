import { useState, useEffect } from 'react'
import { backendUrl, isAdmin, getAuthHeaders } from '../auth'
import { config } from '../config'

function StatusDot({ status }) {
  if (status === 'checking') {
    return (
      <span className="flex items-center gap-2 text-amber-600">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-soft" />
        Checking...
      </span>
    )
  }
  if (status === 'online') {
    return (
      <span className="flex items-center gap-2 text-green-600">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        Online
      </span>
    )
  }
  return (
    <span className="flex items-center gap-2 text-red-600">
      <span className="w-2 h-2 rounded-full bg-red-500" />
      Offline
    </span>
  )
}

function StatCard({ label, value, subtext, color, delay }) {
  const colorClasses = {
    blue: 'border-primary-200 hover:border-primary-400 text-primary-600',
    green: 'border-green-200 hover:border-green-400 text-green-600',
    purple: 'border-purple-200 hover:border-purple-400 text-purple-600',
  }

  return (
    <div
      className={`bg-white border-2 ${colorClasses[color].split(' ')[0]} rounded-xl p-6 shadow-card card-hover animate-fadeIn ${delay}`}
    >
      <p className="text-surface-500 text-sm font-medium">{label}</p>
      <p className={`text-4xl font-bold mt-2 ${colorClasses[color].split(' ').slice(-1)}`}>{value}</p>
      <p className="text-surface-400 text-xs mt-2">{subtext}</p>
    </div>
  )
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
      } catch (err) {
        console.warn(`Health check failed for ${key}:`, err.message)
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

  // Fetch actual stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${config.backendUrl}/api/voters`, {
          headers: getAuthHeaders()
        })
        if (res.ok) {
          const voters = await res.json()
          setStats(prev => ({ ...prev, voters: voters.length }))
        }
      } catch (err) {
        console.warn('Failed to fetch voter stats:', err.message)
      }
    }

    if (isAdmin()) {
      fetchStats()
    }
  }, [])

  const admin = isAdmin()

  const quickLinks = [
    {
      href: backendUrl('/vote'),
      icon: '🗳️',
      title: 'Vote',
      description: 'Cast your vote securely on-chain',
      color: 'blue',
      show: true,
    },
    {
      href: backendUrl('/admin'),
      icon: '🔐',
      title: 'Admin Panel',
      description: 'Manage voters, approve registrations',
      color: 'red',
      show: admin,
    },
    {
      href: backendUrl('/results'),
      icon: '📊',
      title: 'Live Results',
      description: 'Real-time vote counts from blockchain',
      color: 'green',
      show: true,
    },
    {
      href: backendUrl('/register'),
      icon: '📝',
      title: 'Register',
      description: 'Register new voter with face biometrics',
      color: 'amber',
      show: admin,
    },
  ]

  const colorMap = {
    blue: 'border-primary-200 hover:border-primary-400 text-primary-600 group-hover:text-primary-700',
    red: 'border-red-200 hover:border-red-400 text-red-600 group-hover:text-red-700',
    green: 'border-green-200 hover:border-green-400 text-green-600 group-hover:text-green-700',
    amber: 'border-amber-200 hover:border-amber-400 text-amber-600 group-hover:text-amber-700',
  }

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Active Booths"
          value={stats.booths}
          subtext="BOOTH_001 – BOOTH_006"
          color="blue"
          delay="delay-100"
        />
        <StatCard
          label="Registered Voters"
          value={stats.voters.toLocaleString()}
          subtext="Face verified"
          color="green"
          delay="delay-200"
        />
        <StatCard
          label="Blockchain Txs"
          value={stats.transactions.toLocaleString()}
          subtext="On Ethereum"
          color="purple"
          delay="delay-300"
        />
      </div>

      {/* Quick Links */}
      <div className="bg-white border border-surface-200 rounded-xl p-8 shadow-card animate-fadeIn delay-200">
        <h2 className="text-2xl font-bold text-surface-800 mb-6">Quick Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.filter(link => link.show).map((link, idx) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className={`bg-surface-50 border-2 ${colorMap[link.color].split(' ')[0]} rounded-xl p-5 card-hover group transition-all animate-fadeIn`}
              style={{ animationDelay: `${(idx + 1) * 100}ms` }}
            >
              <p className={`font-semibold text-lg flex items-center gap-2 ${colorMap[link.color].split(' ').slice(-2).join(' ')}`}>
                <span className="text-xl">{link.icon}</span>
                {link.title}
              </p>
              <p className="text-sm text-surface-500 mt-2">{link.description}</p>
              <p className="text-xs text-surface-400 mt-3 group-hover:text-surface-500 transition-colors">
                Opens in new tab →
              </p>
            </a>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white border border-surface-200 rounded-xl p-6 shadow-card animate-fadeIn delay-300">
        <h3 className="text-lg font-semibold text-surface-800 mb-4">System Status</h3>
        <div className="space-y-3">
          {[
            { label: 'Backend API', key: 'backend', url: config.backendUrl },
            { label: 'ML Service', key: 'ml', url: config.mlUrl },
            { label: 'Graph Service', key: 'graph', url: config.graphUrl },
          ].map(({ label, key, url }) => (
            <div key={key} className="flex items-center justify-between text-sm py-2 px-3 bg-surface-50 rounded-lg">
              <div>
                <span className="text-surface-700 font-medium">{label}</span>
                <span className="text-surface-400 text-xs ml-2">{url}</span>
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
