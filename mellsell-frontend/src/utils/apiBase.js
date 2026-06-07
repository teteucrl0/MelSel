/** Base da API: em dev usa proxy do Vite (mesma origem); em prod usa VITE_API_URL ou localhost. */
export function getApiBase() {
  const fromEnv = import.meta.env.VITE_API_URL
  if (fromEnv) return String(fromEnv).replace(/\/$/, '')
  if (import.meta.env.DEV) return ''
  return 'http://localhost:8080'
}