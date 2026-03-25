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
  } catch {
    return null
  }
}

export function isLoggedIn() {
  const token = getToken()
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 > Date.now()
  } catch {
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

// Build a URL to the backend voting page with token injected as query param
export function backendUrl(path) {
  const token = getToken()
  const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'
  if (token) {
    return `${base}${path}?Authorization=Bearer ${token}`
  }
  return `${base}${path}`
}
