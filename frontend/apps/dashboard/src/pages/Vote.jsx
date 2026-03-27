import { useState, useEffect, useRef, useCallback } from 'react'
import { getUser, getAuthHeaders, getToken } from '../auth'
import { config } from '../config'
import Web3 from 'web3'

function Vote() {
  const [elections, setElections] = useState([])
  const [activeElection, setActiveElection] = useState('')
  const [electionInfo, setElectionInfo] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [contract, setContract] = useState(null)

  // Face verification state
  const [verificationStep, setVerificationStep] = useState('select') // 'select' | 'verify' | 'processing' | 'success' | 'error'
  const [faceModelsLoaded, setFaceModelsLoaded] = useState(false)
  const [cameraStream, setCameraStream] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [txHash, setTxHash] = useState('')

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const faceapiRef = useRef(null)

  const user = getUser()

  // Load face-api.js dynamically
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js'
    script.async = true
    script.onload = async () => {
      faceapiRef.current = window.faceapi
      try {
        await Promise.all([
          window.faceapi.nets.ssdMobilenetv1.loadFromUri(`${config.backendUrl}/models`),
          window.faceapi.nets.faceLandmark68Net.loadFromUri(`${config.backendUrl}/models`),
          window.faceapi.nets.faceRecognitionNet.loadFromUri(`${config.backendUrl}/models`)
        ])
        setFaceModelsLoaded(true)
      } catch (err) {
        console.error('Failed to load face models:', err)
      }
    }
    document.body.appendChild(script)
    return () => document.body.removeChild(script)
  }, [])

  // Initialize Web3
  useEffect(() => {
    async function init() {
      try {
        const resp = await fetch(`${config.backendUrl}/contract.json`)
        if (!resp.ok) return
        const info = await resp.json()

        const w3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'))
        const c = new w3.eth.Contract(info.abi, info.address)
        setContract(c)

        // Load elections
        const ids = await c.methods.getElectionIds().call()
        const electionData = []
        for (const id of [...ids].reverse()) {
          const details = await c.methods.getElection(id).call()
          electionData.push({ id, name: details[1] })
        }
        setElections(electionData)
        if (electionData.length > 0) setActiveElection(electionData[0].id)
      } catch (err) {
        console.error('Init failed:', err)
      }
    }
    init()
  }, [])

  const loadCandidates = useCallback(async () => {
    if (!contract || !activeElection) return
    setLoading(true)
    setSelectedCandidate(null)

    try {
      const details = await contract.methods.getElection(activeElection).call()
      setElectionInfo({
        name: details[1],
        startDate: new Date(Number(details[2]) * 1000),
        endDate: new Date(Number(details[3]) * 1000)
      })

      const count = Number(await contract.methods.getCandidateCount(activeElection).call())
      const candidateList = []

      for (let i = 1; i <= count; i++) {
        const raw = await contract.methods.getCandidate(activeElection, i).call()
        const id = Number(raw[0])
        if (id === 0) continue
        candidateList.push({
          id,
          name: raw[1],
          party: raw[2]
        })
      }
      setCandidates(candidateList)
    } catch (err) {
      console.error('Failed to load candidates:', err)
    } finally {
      setLoading(false)
    }
  }, [contract, activeElection])

  useEffect(() => {
    loadCandidates()
  }, [loadCandidates])

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [cameraStream])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      setCameraStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      setErrorMessage('Camera access denied. Please allow camera access to vote.')
      setVerificationStep('error')
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
  }

  const handleProceedToVerify = () => {
    if (!selectedCandidate) {
      alert('Please select a candidate')
      return
    }
    if (!faceModelsLoaded) {
      alert('Face verification loading. Please wait...')
      return
    }
    setVerificationStep('verify')
    startCamera()
  }

  const handleCastVote = async () => {
    setVerificationStep('processing')

    try {
      const faceapi = faceapiRef.current
      if (!faceapi || !videoRef.current) {
        throw new Error('Face verification not ready')
      }

      // Detect face and get descriptor
      const detection = await faceapi
        .detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!detection) {
        throw new Error('Face not detected. Please ensure your face is clearly visible.')
      }

      // Send vote to backend
      const res = await fetch(`${config.backendUrl}/api/cast-vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          electionId: activeElection,
          candidateId: selectedCandidate,
          face_embedding: Array.from(detection.descriptor)
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Vote casting failed')
      }

      stopCamera()
      setTxHash(data.transactionHash)
      setVerificationStep('success')
    } catch (err) {
      setErrorMessage(err.message)
      setVerificationStep('error')
    }
  }

  const handleBack = () => {
    stopCamera()
    setVerificationStep('select')
    setErrorMessage('')
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  // Candidate icons
  const icons = ['🦁', '🦊', '🐺', '🦅', '🌟', '🔥', '⚡', '🌊']

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-surface-800">Cast Your Vote</h1>
          <p className="text-surface-500 mt-1">Select a candidate and verify your identity</p>
        </div>

        {verificationStep === 'select' && (
          <select
            value={activeElection}
            onChange={(e) => setActiveElection(e.target.value)}
            className="bg-surface-50 border border-surface-300 rounded-lg px-4 py-2 text-sm text-surface-700 focus:outline-none focus:border-primary-500"
          >
            {elections.length === 0 ? (
              <option value="">No elections</option>
            ) : (
              elections.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))
            )}
          </select>
        )}
      </div>

      {/* Voter Badge */}
      <div className="bg-surface-100 border border-surface-200 rounded-lg px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium">
          {user?.name?.charAt(0) || '👤'}
        </div>
        <span className="text-surface-700">{user?.name || 'Voter'}</span>
      </div>

      {/* Step: Select Candidate */}
      {verificationStep === 'select' && (
        <>
          {/* Election Info */}
          {electionInfo && (
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                  Active
                </span>
                <span className="text-sm text-surface-500">
                  {formatDate(electionInfo.startDate)} – {formatDate(electionInfo.endDate)}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-surface-800">{electionInfo.name}</h2>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : candidates.length === 0 ? (
            <div className="bg-white border border-surface-200 rounded-xl p-12 text-center">
              <p className="text-4xl mb-3">🗳️</p>
              <p className="text-surface-500">No candidates available</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {candidates.map((c, idx) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCandidate(c.id)}
                    className={`bg-white border-2 rounded-xl p-5 cursor-pointer transition-all ${
                      selectedCandidate === c.id
                        ? 'border-primary-500 bg-primary-50 shadow-md'
                        : 'border-surface-200 hover:border-surface-300 hover:bg-surface-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-surface-100 rounded-full flex items-center justify-center text-2xl">
                        {icons[idx % icons.length]}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-surface-800">{c.name}</h3>
                        <p className="text-surface-500">{c.party}</p>
                      </div>
                      {selectedCandidate === c.id && (
                        <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleProceedToVerify}
                disabled={!selectedCandidate}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors"
              >
                Verify Identity & Vote
              </button>
            </>
          )}
        </>
      )}

      {/* Step: Face Verification */}
      {verificationStep === 'verify' && (
        <div className="bg-white border border-surface-200 rounded-xl p-6 shadow-card">
          <h2 className="text-lg font-medium text-surface-800 text-center mb-2">Face Verification</h2>
          <p className="text-surface-500 text-center mb-6">Position your face in the frame</p>

          <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden mb-6">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleBack}
              className="flex-1 bg-surface-100 hover:bg-surface-200 text-surface-700 font-medium py-3 rounded-xl transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleCastVote}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Capture & Vote
            </button>
          </div>
        </div>
      )}

      {/* Step: Processing */}
      {verificationStep === 'processing' && (
        <div className="bg-white border border-surface-200 rounded-xl p-12 text-center shadow-card">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-semibold text-surface-800 mb-2">Verifying & Recording Vote</h2>
          <p className="text-surface-500">Please wait while your vote is recorded on the blockchain...</p>
        </div>
      )}

      {/* Step: Success */}
      {verificationStep === 'success' && (
        <div className="bg-white border-2 border-green-200 rounded-xl p-8 text-center shadow-card">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-surface-800 mb-2">Vote Recorded!</h2>
          <p className="text-surface-500 mb-6">Your vote has been securely stored on the blockchain.</p>

          {txHash && (
            <div className="bg-surface-50 rounded-lg p-4 mb-6">
              <p className="text-xs text-surface-500 mb-1">Transaction Hash</p>
              <p className="font-mono text-sm text-surface-700 break-all">{txHash}</p>
            </div>
          )}

          <a
            href="/results"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-3 rounded-xl transition-colors"
          >
            View Results
          </a>
        </div>
      )}

      {/* Step: Error */}
      {verificationStep === 'error' && (
        <div className="bg-white border-2 border-red-200 rounded-xl p-8 text-center shadow-card">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-surface-800 mb-2">Verification Failed</h2>
          <p className="text-surface-500 mb-6">{errorMessage || 'An error occurred'}</p>

          <button
            onClick={handleBack}
            className="bg-surface-100 hover:bg-surface-200 text-surface-700 font-medium px-6 py-3 rounded-xl transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}

export default Vote
