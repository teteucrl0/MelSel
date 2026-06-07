import { parseJwt } from '../services/authUtil'

/** Limpa credenciais locais (evita import circular api ↔ authService). */
export function clearAuthSession() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('displayName')
  localStorage.removeItem('avatarUrl')
  localStorage.removeItem('roles')
}

export const UNAUTHORIZED_EVENT = 'mellsell:unauthorized'

const AUTH_PUBLIC_PATHS = /^\/api\/auth\/(login|register)/

let unauthorizedRedirectLock = false
let lastUnauthorizedAt = 0
const UNAUTHORIZED_DEBOUNCE_MS = 2500

export function isAuthPublicRequest(url = '') {
  const path = String(url).replace(/^https?:\/\/[^/]+/i, '')
  return AUTH_PUBLIC_PATHS.test(path)
}

export function isTokenExpired(token) {
  if (!token) return true
  const claims = parseJwt(token)
  if (!claims?.exp) return false
  return Date.now() >= Number(claims.exp) * 1000
}

/**
 * Valida token local. Se expirado, limpa storage e retorna expired: true.
 * @returns {{ valid: boolean, expired: boolean }}
 */
export function validateLocalSession() {
  const token = localStorage.getItem('token')
  if (!token) return { valid: false, expired: false }
  if (isTokenExpired(token)) {
    clearAuthSession()
    return { valid: false, expired: true }
  }
  return { valid: true, expired: false }
}

/** Token presente e ainda dentro do prazo do JWT (evita loop login ↔ rota protegida). */
export function hasValidLocalSession() {
  return validateLocalSession().valid
}

export function shouldRedirectOn401() {
  const path = window.location.pathname
  return path !== '/login' && path !== '/register'
}

export function isUnauthorizedRedirectInProgress() {
  return unauthorizedRedirectLock
}

/**
 * Resposta 401 em rota autenticada: limpa sessão e dispara redirect no máximo uma vez por janela.
 */
export function handleApiUnauthorized(requestUrl = '') {
  if (isAuthPublicRequest(requestUrl)) return

  clearAuthSession()

  if (!shouldRedirectOn401()) return

  const now = Date.now()
  if (unauthorizedRedirectLock || now - lastUnauthorizedAt < UNAUTHORIZED_DEBOUNCE_MS) {
    return
  }

  unauthorizedRedirectLock = true
  lastUnauthorizedAt = now

  const from =
    window.location.pathname + window.location.search + window.location.hash

  window.dispatchEvent(
    new CustomEvent(UNAUTHORIZED_EVENT, { detail: { from, sessionExpired: true } }),
  )

  window.setTimeout(() => {
    unauthorizedRedirectLock = false
  }, UNAUTHORIZED_DEBOUNCE_MS)
}