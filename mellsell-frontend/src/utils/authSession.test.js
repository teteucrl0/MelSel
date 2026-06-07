import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import {
  clearAuthSession,
  handleApiUnauthorized,
  hasValidLocalSession,
  isAuthPublicRequest,
  isTokenExpired,
  UNAUTHORIZED_EVENT,
} from './authSession'

function storageMock() {
  const store = new Map()
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  }
}

function makeJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${header}.${body}.sig`
}

describe('authSession', () => {
  beforeEach(() => {
    globalThis.localStorage = storageMock()
    vi.stubGlobal('window', {
      location: { pathname: '/orders', search: '', hash: '' },
      dispatchEvent: vi.fn((event) => {
        if (event?.type) globalThis.__lastEvent = event
      }),
      setTimeout: (fn, ms) => setTimeout(fn, ms),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('detecta rotas públicas de auth', () => {
    expect(isAuthPublicRequest('/api/auth/login')).toBe(true)
    expect(isAuthPublicRequest('/api/orders')).toBe(false)
  })

  it('invalida token expirado', () => {
    const expired = makeJwt({ exp: Math.floor(Date.now() / 1000) - 60 })
    expect(isTokenExpired(expired)).toBe(true)
    const valid = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 })
    expect(isTokenExpired(valid)).toBe(false)
  })

  it('hasValidLocalSession limpa token expirado', () => {
    localStorage.setItem('token', makeJwt({ exp: Math.floor(Date.now() / 1000) - 10 }))
    expect(hasValidLocalSession()).toBe(false)
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('handleApiUnauthorized dispara evento uma vez', () => {
    const handler = vi.fn()
    const listeners = new Map()
    vi.stubGlobal('window', {
      location: { pathname: '/orders', search: '', hash: '' },
      addEventListener: (type, fn) => listeners.set(type, fn),
      removeEventListener: () => {},
      dispatchEvent: (event) => {
        const fn = listeners.get(event.type)
        if (fn) fn(event)
      },
      setTimeout: (fn) => fn(),
    })

    window.addEventListener(UNAUTHORIZED_EVENT, handler)
    localStorage.setItem('token', makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 }))

    handleApiUnauthorized('/api/orders')
    handleApiUnauthorized('/api/orders')

    expect(handler).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('não redireciona em login com credenciais inválidas', () => {
    const handler = vi.fn()
    const listeners = new Map()
    vi.stubGlobal('window', {
      location: { pathname: '/orders', search: '', hash: '' },
      addEventListener: (type, fn) => listeners.set(type, fn),
      removeEventListener: () => {},
      dispatchEvent: (event) => {
        const fn = listeners.get(event.type)
        if (fn) fn(event)
      },
      setTimeout: (fn) => fn(),
    })

    window.addEventListener(UNAUTHORIZED_EVENT, handler)
    handleApiUnauthorized('/api/auth/login')
    expect(handler).not.toHaveBeenCalled()
  })
})