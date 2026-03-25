import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { config } from '../config'

const CONSTITUENCIES = ['North Delhi', 'South Delhi', 'East Delhi']

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
      console.error('Fetch error:', error)
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
      <h1 className="text-3xl font-bold text-white">Analytics</h1>

      <div className="flex gap-2 border-b border-dark-700">
        {CONSTITUENCIES.map(constituency => (
          <button
            key={constituency}
            onClick={() => setActiveTab(constituency)}
            className={`px-4 py-2 border-b-2 transition ${
              activeTab === constituency
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {constituency}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-400">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.map((d, idx) => (
              <div key={idx} className="bg-dark-800 border border-dark-700 rounded-lg p-6">
                <p className="text-gray-400 text-sm">Registered Voters</p>
                <p className="text-3xl font-bold text-blue-400 mt-2">{d.voters}</p>
              </div>
            ))}
            {data.length === 0 && (
              <>
                <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
                  <p className="text-gray-400 text-sm">Registered Voters</p>
                  <p className="text-3xl font-bold text-blue-400 mt-2">4250</p>
                </div>
                <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
                  <p className="text-gray-400 text-sm">Active Booths</p>
                  <p className="text-3xl font-bold text-green-400 mt-2">6</p>
                </div>
                <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
                  <p className="text-gray-400 text-sm">Turnout</p>
                  <p className="text-3xl font-bold text-purple-400 mt-2">68%</p>
                </div>
              </>
            )}
          </div>

          <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Votes by Booth</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={mockChartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis type="category" dataKey="name" stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#f3f4f6' }}
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
