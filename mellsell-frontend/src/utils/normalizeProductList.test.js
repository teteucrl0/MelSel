import { describe, expect, it } from 'vitest'
import { normalizeProductList } from './normalizeProductList'

describe('normalizeProductList', () => {
  it('remove entradas nulas e sem id', () => {
    const data = {
      content: [{ id: 1, name: 'A' }, null, { name: 'B' }, { id: 2, name: 'C' }],
    }
    expect(normalizeProductList(data)).toEqual([
      { id: 1, name: 'A' },
      { id: 2, name: 'C' },
    ])
  })

  it('aceita array direto', () => {
    expect(normalizeProductList([{ id: 5 }])).toEqual([{ id: 5 }])
  })

  it('retorna vazio para payload inválido', () => {
    expect(normalizeProductList(null)).toEqual([])
    expect(normalizeProductList({})).toEqual([])
  })
})