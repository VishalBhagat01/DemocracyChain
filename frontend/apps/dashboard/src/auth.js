// Auth utility — manages JWT token in localStorage

export function getToken() {
  return localStorage.getItem('votechain_token')
}

export function getUser() {
  const token = getToken()
  if (!token) return null
  try {
    // JWT payload is base64 encoded in the middle segment
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload
  } catch (error) {
    console.warn('Failed to parse JWT token:', error.message)
    return null
  }
}

export function isLoggedIn() {
  const token = getToken()
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 > Date.now()
  } catch (error) {
    console.warn('Failed to validate token expiry:', error.message)
    return false
  }
}

export function saveToken(token) {
  localStorage.setItem('votechain_token', token)
}

export function clearToken() {
  localStorage.removeItem('votechain_token')
}

export function isAdmin() {
  const user = getUser()
  return user?.role === 'admin'
}

// Get Authorization headers for API requests (secure method)
export function getAuthHeaders() {
  const token = getToken()
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

// Build a URL to the backend page (for navigation links)
// Note: Token will be passed via Authorization header in fetch requests
export function backendUrl(path) {
  const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'
  return `${base}${path}`
}

// Make authenticated fetch request
export async function authFetch(url, options = {}) {
  const headers = {
    ...options.headers,
    ...getAuthHeaders()
  }
  return fetch(url, { ...options, headers })
}
