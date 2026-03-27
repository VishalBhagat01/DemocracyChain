import { useState, useEffect } from 'react'
import { getUser, getAuthHeaders } from '../auth'
import { config } from '../config'

function Profile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const user = getUser()

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch(`${config.backendUrl}/api/me`, {
          headers: getAuthHeaders()
        })
        if (res.ok) {
          const data = await res.json()
          setProfile(data)
        }
      } catch (err) {
        console.error('Failed to load profile:', err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const displayData = profile || user

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
          {displayData?.full_name?.charAt(0) || displayData?.name?.charAt(0) || '👤'}
        </div>
        <h1 className="text-2xl font-semibold text-surface-800">
          {displayData?.full_name || displayData?.name || 'Voter'}
        </h1>
        <p className="text-surface-500 mt-1">
          {displayData?.role === 'admin' ? 'Administrator' : 'Registered Voter'}
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white border border-surface-200 rounded-xl p-6 shadow-card">
        <h2 className="text-lg font-medium text-surface-800 mb-5">Profile Information</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-surface-100">
            <span className="text-surface-500">Voter ID</span>
            <span className="font-medium text-surface-800">{displayData?.voter_id || displayData?.id || 'N/A'}</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-surface-100">
            <span className="text-surface-500">Full Name</span>
            <span className="font-medium text-surface-800">{displayData?.full_name || displayData?.name || 'N/A'}</span>
          </div>

          {displayData?.email && (
            <div className="flex items-center justify-between py-3 border-b border-surface-100">
              <span className="text-surface-500">Email</span>
              <span className="font-medium text-surface-800">{displayData.email}</span>
            </div>
          )}

          {displayData?.booth_id && (
            <div className="flex items-center justify-between py-3 border-b border-surface-100">
              <span className="text-surface-500">Booth ID</span>
              <span className="font-medium text-surface-800">{displayData.booth_id}</span>
            </div>
          )}

          <div className="flex items-center justify-between py-3 border-b border-surface-100">
            <span className="text-surface-500">Role</span>
            <span className={`px-2.5 py-1 text-sm font-medium rounded-lg ${
              displayData?.role === 'admin'
                ? 'bg-red-100 text-red-700'
                : 'bg-primary-100 text-primary-700'
            }`}>
              {displayData?.role || 'voter'}
            </span>
          </div>

          <div className="flex items-center justify-between py-3">
            <span className="text-surface-500">Status</span>
            <span className={`px-2.5 py-1 text-sm font-medium rounded-lg ${
              displayData?.status === 'approved'
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {displayData?.status || 'approved'}
            </span>
          </div>
        </div>
      </div>

      {/* Biometric Status */}
      <div className="bg-white border border-surface-200 rounded-xl p-6 shadow-card">
        <h2 className="text-lg font-medium text-surface-800 mb-5">Security</h2>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-surface-800">Face Biometrics</p>
              <p className="text-sm text-surface-500">Registered and verified</p>
            </div>
          </div>
          <span className="px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-lg">
            Active
          </span>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-surface-50 border border-surface-200 rounded-xl p-5 text-center text-sm text-surface-500">
        <p>Your vote is secured by Ethereum blockchain and face biometric verification.</p>
        <p className="mt-1">Contact an administrator if you need to update your information.</p>
      </div>
    </div>
  )
}

export default Profile
