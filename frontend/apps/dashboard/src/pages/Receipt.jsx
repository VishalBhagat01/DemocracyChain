import { useState } from 'react'
import { config } from '../config'

function Receipt() {
  const [txHash, setTxHash] = useState('')
  const [receipt, setReceipt] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchReceipt = async () => {
    if (!txHash.trim()) {
      setError('Please enter a transaction hash')
      return
    }

    setLoading(true)
    setError('')
    setReceipt(null)

    try {
      const response = await fetch(`${config.backendUrl}/api/receipt/${txHash}`)
      if (response.ok) {
        const data = await response.json()
        setReceipt(data)
      } else {
        setError('Transaction not found')
      }
    } catch (err) {
      setError('Error fetching receipt')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') fetchReceipt()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Transaction Receipt</h1>

      <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Transaction Hash (0x...)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="0x..."
            className="flex-1 bg-dark-700 border border-dark-600 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={fetchReceipt}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded transition"
          >
            {loading ? 'Loading...' : 'Search'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-4">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {receipt && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-900 bg-opacity-20 border border-green-700 rounded-lg p-6">
            <p className="text-green-300 text-sm font-medium">✓ Transaction Confirmed</p>
            <div className="space-y-4 mt-4">
              <div>
                <p className="text-gray-400 text-xs">Hash</p>
                <p className="text-white font-mono text-sm break-all">{receipt.tx_hash}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Block Number</p>
                <p className="text-white">{receipt.block_number}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg p-6">
            <p className="text-blue-300 text-sm font-medium">Election Details</p>
            <div className="space-y-4 mt-4">
              <div>
                <p className="text-gray-400 text-xs">Election ID</p>
                <p className="text-white">{receipt.election_id}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Timestamp</p>
                <p className="text-white">{new Date(receipt.timestamp * 1000).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-900 bg-opacity-20 border border-purple-700 rounded-lg p-6 md:col-span-2">
            <p className="text-purple-300 text-sm font-medium">Voter Hash</p>
            <p className="text-white font-mono text-sm break-all mt-2">{receipt.voter_hash}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Receipt
