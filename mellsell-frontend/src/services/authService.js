import api from './api'

const login = async (email, password) => {
  const r = await api.post('/api/auth/login', { email, password })
  if (r.data && r.data.token) {
    localStorage.setItem('token', r.data.token)
    localStorage.setItem('user', JSON.stringify(r.data))
  }
  return r.data
}

const register = (name, email, password, birthDate) => 
  api.post('/api/auth/register', { name, email, password, birthDate }).then(r => r.data)

const registerVendor = (name, email, password, birthDate, storeName) => 
  api.post('/api/auth/register/vendor', { name, email, password, birthDate, storeName }).then(r => r.data)

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export default { login, register, registerVendor, logout }
