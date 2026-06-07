import axios from 'axios'
import { getApiBase } from '../utils/apiBase'
import {
  clearAuthSession,
  handleApiUnauthorized,
  isTokenExpired,
} from '../utils/authSession'

const api = axios.create({ baseURL: getApiBase() })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (!token) return config
  if (isTokenExpired(token)) {
    clearAuthSession()
    return config
  }
  config.headers = config.headers || {}
  config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    if (status === 401) {
      handleApiUnauthorized(error?.config?.url || '')
    }
    return Promise.reject(error)
  },
)

export default api