import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { config } from '../config'

const BOOTHS = ['BOOTH_001', 'BOOTH_002', 'BOOTH_003', 'BOOTH_004', 'BOOTH_005', 'BOOTH_006']
const HOURS = Array.from({ length: 12 }, (_, i) => `${6 + i}:00`)

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white border border-surface-200 rounded-xl p-6">
        <div className="skeleton h-6 w-40 mb-4" />
        <div className="skeleton h-64 w-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white border border-surface-200 rounded-xl p-6">
            <div className="skeleton h-4 w-24 mb-3" />
            <div className="skeleton h-8 w-32" />
          </div>
        ))}
      </div>
    </div>
  )
}

function BoothManagement() {
  const [selectedBooth, setSelectedBooth] = useState('BOOTH_001')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [peakInfo, setPeakInfo] = useState(null)

  useEffect(() => {
    fetchBoothData()
  }, [selectedBooth])

  const fetchBoothData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${config.mlUrl}/predict/peak-hours/${selectedBooth}`)
      if (response.ok) {
        const result = await response.json()
        setPeakInfo(result)
        setData(result.congestion_forecast)
      } else {
        setData([15, 20, 40, 85, 90, 70, 50, 45, 80, 88, 60, 30])
        setPeakInfo({
          peak_hours: [85, 90, 88],
          quiet_hours: [15, 20, 30],
          recommended_slot: '14:00 - 15:00',
          congestion_forecast: [15, 20, 40, 85, 90, 70, 50, 45, 80, 88, 60, 30]
        })
      }
    } catch (error) {
      console.warn('Booth data fetch failed:', error.message)
      setData([15, 20, 40, 85, 90, 70, 50, 45, 80, 88, 60, 30])
      setPeakInfo({
        peak_hours: [85, 90, 88],
        quiet_hours: [15, 20, 30],
        recommended_slot: '14:00 - 15:00',
        congestion_forecast: [15, 20, 40, 85, 90, 70, 50, 45, 80, 88, 60, 30]
      })
    } finally {
      setLoading(false)
    }
  }

  const chartData = HOURS.map((hour, idx) => ({
    time: hour,
    congestion: data[idx] || 0
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-surface-800 animate-fadeIn">Booth Management</h1>

      {/* Booth Selector */}
      <div className="bg-white border border-surface-200 rounded-xl p-6 shadow-card animate-fadeIn delay-100">
        <label className="block text-sm font-medium text-surface-700 mb-3">Select Booth</label>
        <div className="flex flex-wrap gap-2">
          {BOOTHS.map(booth => (
            <button
              key={booth}
              onClick={() => setSelectedBooth(booth)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                selectedBooth === booth
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              {booth.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* Congestion Chart */}
          <div className="bg-white border border-surface-200 rounded-xl p-6 shadow-card animate-fadeIn delay-200">
            <h2 className="text-xl font-semibold text-surface-800 mb-4">Congestion Forecast</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                  formatter={(value) => [`${value}%`, 'Congestion']}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar
                  dataKey="congestion"
                  fill="#3b82f6"
                  radius={[8, 8, 0, 0]}
                  name="Congestion %"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Peak Info Cards */}
          {peakInfo && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 card-hover animate-fadeIn delay-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-red-500">⚠️</span>
                  <p className="text-red-700 text-sm font-semibold">Peak Hours</p>
                </div>
                <p className="text-2xl font-bold text-red-600 mt-2">{peakInfo.peak_hours.join(', ')}</p>
                <p className="text-xs text-red-500 mt-2">Congestion &gt; 70%</p>
              </div>

              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 card-hover animate-fadeIn delay-300">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-500">✓</span>
                  <p className="text-green-700 text-sm font-semibold">Quiet Hours</p>
                </div>
                <p className="text-2xl font-bold text-green-600 mt-2">{peakInfo.quiet_hours.join(', ')}</p>
                <p className="text-xs text-green-500 mt-2">Congestion &lt; 30%</p>
              </div>

              <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-6 card-hover animate-fadeIn delay-400">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-primary-500">⏰</span>
                  <p className="text-primary-700 text-sm font-semibold">Best Time to Vote</p>
                </div>
                <p className="text-2xl font-bold text-primary-600 mt-2">{peakInfo.recommended_slot}</p>
                <p className="text-xs text-primary-500 mt-2">Recommended slot</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default BoothManagement
