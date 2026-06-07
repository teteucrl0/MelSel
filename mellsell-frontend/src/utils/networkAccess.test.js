import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getApiBase } from './apiBase'
import { getWsUrl } from './wsUrl'

describe('acesso por outro IP na rede', () => {
  beforeEach(() => {
    vi.stubEnv('DEV', true)
    vi.stubEnv('VITE_API_URL', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('getApiBase em dev usa proxy (base vazia) — funciona com host LAN no navegador', () => {
    expect(getApiBase()).toBe('')
  })

  it('getWsUrl usa o host da página quando cliente abre http://192.168.x.x:5173', () => {
    vi.stubGlobal('window', {
      location: {
        protocol: 'http:',
        host: '192.168.1.42:5173',
      },
    })
    expect(getWsUrl()).toBe('http://192.168.1.42:5173/ws')
  })

  it('getWsUrl usa o host da página para rede 10.x.x.x', () => {
    vi.stubGlobal('window', {
      location: {
        protocol: 'http:',
        host: '10.0.0.8:5173',
      },
    })
    expect(getWsUrl()).toBe('http://10.0.0.8:5173/ws')
  })

  it('getWsUrl em build com VITE_API_URL aponta para o backend explícito', () => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('VITE_API_URL', 'http://192.168.1.42:8080')
    vi.stubGlobal('window', undefined)
    expect(getWsUrl()).toBe('http://192.168.1.42:8080/ws')
  })
})