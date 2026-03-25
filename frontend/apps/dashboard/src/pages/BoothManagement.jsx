import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { config } from '../config'

const BOOTHS = ['BOOTH_001', 'BOOTH_002', 'BOOTH_003', 'BOOTH_004', 'BOOTH_005', 'BOOTH_006']
const HOURS = Array.from({ length: 12 }, (_, i) => `${6 + i}:00`)

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
      console.error('Fetch error:', error)
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
      <h1 className="text-3xl font-bold text-white">Booth Management</h1>

      <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">Select Booth</label>
        <select
          value={selectedBooth}
          onChange={(e) => setSelectedBooth(e.target.value)}
          className="w-full bg-dark-700 border border-dark-600 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
        >
          {BOOTHS.map(booth => (
            <option key={booth} value={booth}>{booth}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center text-gray-400">Loading...</div>
      ) : (
        <>
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Congestion Forecast</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="congestion" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {peakInfo && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-6">
                <p className="text-red-300 text-sm font-medium">Peak Hours</p>
                <p className="text-2xl font-bold text-red-400 mt-2">{peakInfo.peak_hours.join(', ')}</p>
                <p className="text-xs text-gray-400 mt-2">Congestion &gt; 70%</p>
              </div>

              <div className="bg-green-900 bg-opacity-20 border border-green-700 rounded-lg p-6">
                <p className="text-green-300 text-sm font-medium">Quiet Hours</p>
                <p className="text-2xl font-bold text-green-400 mt-2">{peakInfo.quiet_hours.join(', ')}</p>
                <p className="text-xs text-gray-400 mt-2">Congestion &lt; 30%</p>
              </div>

              <div className="bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg p-6">
                <p className="text-blue-300 text-sm font-medium">Best Time to Vote</p>
                <p className="text-2xl font-bold text-blue-400 mt-2">{peakInfo.recommended_slot}</p>
                <p className="text-xs text-gray-400 mt-2">Recommended slot</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default BoothManagement
