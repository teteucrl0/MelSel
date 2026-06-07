import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getDisplayName,
  getRoles,
  hasRole,
  parseJwt,
  resolvePostLoginPath,
  setRoles,
} from './authUtil'

function storageMock() {
  const store = new Map()
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  }
}

function encodeJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${header}.${body}.sig`
}

describe('authUtil', () => {
  beforeEach(() => {
    globalThis.localStorage = storageMock()
    vi.stubGlobal('window', { dispatchEvent: vi.fn() })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('parseJwt', () => {
    it('retorna null para token vazio ou inválido', () => {
      expect(parseJwt(null)).toBeNull()
      expect(parseJwt('')).toBeNull()
      expect(parseJwt('not-a-jwt')).toBeNull()
    })

    it('decodifica payload com roles e displayName', () => {
      const token = encodeJwt({
        roles: ['CLIENT'],
        displayName: 'Maria Silva',
      })
      expect(parseJwt(token)).toMatchObject({
        roles: ['CLIENT'],
        displayName: 'Maria Silva',
      })
    })
  })

  describe('setRoles / getRoles', () => {
    it('normaliza prefixo ROLE_ e persiste no localStorage', () => {
      setRoles(['ROLE_VENDOR', 'CLIENT'])
      expect(JSON.parse(localStorage.getItem('roles'))).toEqual(['VENDOR', 'CLIENT'])
      expect(getRoles()).toEqual(['VENDOR', 'CLIENT'])
      expect(window.dispatchEvent).toHaveBeenCalled()
    })

    it('remove roles quando array vazio', () => {
      localStorage.setItem('roles', '["X"]')
      setRoles([])
      expect(localStorage.getItem('roles')).toBeNull()
      expect(getRoles()).toEqual([])
    })

    it('lê roles do JWT quando não há roles armazenadas', () => {
      const token = encodeJwt({ roles: ['ADMIN'] })
      localStorage.setItem('token', token)
      expect(getRoles()).toEqual(['ADMIN'])
    })
  })

  describe('hasRole', () => {
    it('detecta role normalizada após setRoles', () => {
      setRoles(['VENDOR'])
      expect(hasRole('VENDOR')).toBe(true)
      expect(hasRole('ADMIN')).toBe(false)
    })

    it('aceita ROLE_ no argumento quando o token guarda role com prefixo', () => {
      const token = encodeJwt({ roles: ['ROLE_VENDOR'] })
      localStorage.setItem('token', token)
      expect(hasRole('VENDOR')).toBe(true)
    })
  })

  describe('resolvePostLoginPath', () => {
    it('envia apicultor ao painel do fornecedor', () => {
      expect(resolvePostLoginPath({ roles: ['VENDEDOR'] })).toBe('/vendor/dashboard')
      expect(resolvePostLoginPath({ roles: ['ROLE_VENDEDOR'] })).toBe('/vendor/dashboard')
    })

    it('envia admin ao painel administrativo', () => {
      expect(resolvePostLoginPath({ roles: ['ADMIN'] })).toBe('/admin/dashboard')
    })

    it('respeita fallback para comprador', () => {
      setRoles(['CLIENTE'])
      expect(resolvePostLoginPath(null, '/cart')).toBe('/cart')
      expect(resolvePostLoginPath({ roles: ['CLIENTE'] }, '/login')).toBe('/')
    })
  })

  describe('getDisplayName', () => {
    it('prefere displayName no localStorage', () => {
      localStorage.setItem('displayName', 'Loja Mel')
      expect(getDisplayName()).toBe('Loja Mel')
    })

    it('ignora e-mail em displayName e usa nome do user JSON', () => {
      localStorage.setItem('displayName', 'user@test.com')
      localStorage.setItem(
        'user',
        JSON.stringify({ name: 'João Apiário', email: 'user@test.com' }),
      )
      expect(getDisplayName()).toBe('João Apiário')
    })

    it('usa claim do token quando não há nome local', () => {
      const token = encodeJwt({ name: 'Ana Colmeia' })
      localStorage.setItem('token', token)
      expect(getDisplayName()).toBe('Ana Colmeia')
    })
  })
})