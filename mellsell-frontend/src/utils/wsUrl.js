import { getApiBase } from './apiBase'

export function getWsUrl() {
  const base = getApiBase()
  if (base) return `${base}/ws`
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}/ws`
  }
  return 'http://localhost:8080/ws'
}