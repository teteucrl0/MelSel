import api from './api'
import { parseJwt, setRoles } from './authUtil'
import { clearAuthSession } from '../utils/authSession'

const persistSession = (responseData) => {
  if (responseData?.token) {
    localStorage.setItem('token', responseData.token)
  }
  if (responseData?.roles) {
    setRoles(Array.isArray(responseData.roles) ? responseData.roles : [...responseData.roles])
  }
  if (responseData?.profile?.avatarUrl != null) {
    if (responseData.profile.avatarUrl) {
      localStorage.setItem('avatarUrl', responseData.profile.avatarUrl)
    } else {
      localStorage.removeItem('avatarUrl')
    }
  }
  const token = responseData?.token || localStorage.getItem('token')
  const displayName = responseData?.displayName || responseData?.profile?.name
  if (displayName) {
    localStorage.setItem('displayName', displayName)
    return
  }
  if (!token) return
  const claims = parseJwt(token)
  const fromToken = claims?.displayName || claims?.name
  if (fromToken && !fromToken.includes('@')) {
    localStorage.setItem('displayName', fromToken)
  }
}

const persistDisplayName = (token, responseData) => {
  persistSession({ token, displayName: responseData?.displayName })
}

const login = async (email, password) => {
  const r = await api.post('/api/auth/login', { email, password })
  if (r.data?.token) {
    persistSession(r.data)
    persistDisplayName(r.data.token, r.data)
    localStorage.setItem('user', JSON.stringify(r.data))
  }
  return r.data
}

const register = (name, email, password, birthDate) =>
  api.post('/api/auth/register', {
    name: name.trim(),
    email: email.trim(),
    password,
    birthDate,
  }).then((r) => r.data)

const registerVendor = async (name, email, password, birthDate, storeName, supplierProfile = {}) => {
  const r = await api.post('/api/auth/register/vendor', {
    name: name.trim(),
    email: email.trim(),
    password,
    birthDate,
    storeName: storeName?.trim() || undefined,
    supplierDescription: supplierProfile.supplierDescription?.trim() || undefined,
    supplierCity: supplierProfile.supplierCity?.trim() || undefined,
    supplierState: supplierProfile.supplierState?.trim().toUpperCase() || undefined,
  })
  if (r.data?.token) {
    persistSession(r.data)
    if (r.data.displayName) localStorage.setItem('displayName', r.data.displayName)
    localStorage.setItem('user', JSON.stringify(r.data))
  }
  return r.data
}

const logout = () => {
  clearAuthSession()
}

export default { login, register, registerVendor, logout, persistSession, persistDisplayName }
