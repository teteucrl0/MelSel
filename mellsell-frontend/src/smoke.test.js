import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

describe('smoke', () => {
  it('App exporta componente default', async () => {
    const mod = await import('./app/App.jsx')
    expect(typeof mod.default).toBe('function')
  })

  it('hero de rastreamento existe em png e webp', () => {
    const publicDir = resolve(import.meta.dirname, '../public/images')
    expect(existsSync(resolve(publicDir, 'bee-delivery-hero.png'))).toBe(true)
    expect(existsSync(resolve(publicDir, 'bee-delivery-hero.webp'))).toBe(true)
  })
})