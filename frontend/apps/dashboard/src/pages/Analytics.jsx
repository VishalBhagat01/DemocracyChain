import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { config } from '../config'

const CONSTITUENCIES = ['North Delhi', 'South Delhi', 'East Delhi']

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white border border-surface-200 rounded-xl p-6">
            <div className="skeleton h-4 w-24 mb-3" />
            <div className="skeleton h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="bg-white border border-surface-200 rounded-xl p-6">
        <div className="skeleton h-6 w-32 mb-4" />
        <div className="skeleton h-64 w-full" />
      </div>
    </div>
  )
}

function Analytics() {
  const [activeTab, setActiveTab] = useState('North Delhi')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [activeTab])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${config.graphUrl}/analytics/constituency/${activeTab.replace(' ', '%20')}`)
      if (response.ok) {
        const result = await response.json()
        setData(Array.isArray(result) ? result : [result])
      } else {
        setData([
          { name: activeTab, voters: 4250, booths: 6, turnout: 68 }
        ])
      }
    } catch (error) {
      console.warn('Analytics fetch failed:', error.message)
      setData([
        { name: activeTab, voters: 4250, booths: 6, turnout: 68 }
      ])
    } finally {
      setLoading(false)
    }
  }

  const mockChartData = [
    { name: 'Booth 1', votes: 450 },
    { name: 'Booth 2', votes: 520 },
    { name: 'Booth 3', votes: 380 },
    { name: 'Booth 4', votes: 620 },
    { name: 'Booth 5', votes: 540 },
    { name: 'Booth 6', votes: 470 },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-surface-800 animate-fadeIn">Analytics</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 p-1 rounded-xl w-fit animate-fadeIn delay-100">
        {CONSTITUENCIES.map(constituency => (
          <button
            key={constituency}
            onClick={() => setActiveTab(constituency)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === constituency
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-surface-600 hover:text-surface-800'
            }`}
          >
            {constituency}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.length > 0 ? (
              <>
                <div className="bg-white border border-surface-200 rounded-xl p-6 shadow-card card-hover animate-fadeIn delay-100">
                  <p className="text-surface-500 text-sm font-medium">Registered Voters</p>
                  <p className="text-3xl font-bold text-primary-600 mt-2">{data[0]?.voters?.toLocaleString() || '4,250'}</p>
                </div>
                <div className="bg-white border border-surface-200 rounded-xl p-6 shadow-card card-hover animate-fadeIn delay-200">
                  <p className="text-surface-500 text-sm font-medium">Active Booths</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{data[0]?.booths || 6}</p>
                </div>
                <div className="bg-white border border-surface-200 rounded-xl p-6 shadow-card card-hover animate-fadeIn delay-300">
                  <p className="text-surface-500 text-sm font-medium">Turnout</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">{data[0]?.turnout || 68}%</p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white border border-surface-200 rounded-xl p-6 shadow-card animate-fadeIn delay-100">
                  <p className="text-surface-500 text-sm font-medium">Registered Voters</p>
                  <p className="text-3xl font-bold text-primary-600 mt-2">4,250</p>
                </div>
                <div className="bg-white border border-surface-200 rounded-xl p-6 shadow-card animate-fadeIn delay-200">
                  <p className="text-surface-500 text-sm font-medium">Active Booths</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">6</p>
                </div>
                <div className="bg-white border border-surface-200 rounded-xl p-6 shadow-card animate-fadeIn delay-300">
                  <p className="text-surface-500 text-sm font-medium">Turnout</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">68%</p>
                </div>
              </>
            )}
          </div>

          {/* Chart */}
          <div className="bg-white border border-surface-200 rounded-xl p-6 shadow-card animate-fadeIn delay-300">
            <h2 className="text-xl font-semibold text-surface-800 mb-4">Votes by Booth</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={mockChartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" />
                <YAxis type="category" dataKey="name" stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="votes" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}

export default Analytics
