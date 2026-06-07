import { describe, it, expect } from 'vitest'
import { buildProductListParams, normalizeQuery, parseSupplierId } from './catalogSearch'

describe('catalogSearch', () => {
  it('normalizeQuery retorna null para vazio ou espaços', () => {
    expect(normalizeQuery(null)).toBeNull()
    expect(normalizeQuery('')).toBeNull()
    expect(normalizeQuery('   ')).toBeNull()
    expect(normalizeQuery('  mel  ')).toBe('mel')
  })

  it('parseSupplierId rejeita inválidos', () => {
    expect(parseSupplierId(null)).toBeNull()
    expect(parseSupplierId('')).toBeNull()
    expect(parseSupplierId('abc')).toBeNull()
    expect(parseSupplierId('0')).toBeNull()
    expect(parseSupplierId('-1')).toBeNull()
    expect(parseSupplierId('12.9')).toBe(12)
    expect(parseSupplierId(5)).toBe(5)
  })

  it('buildProductListParams omite q e supplierId vazios', () => {
    expect(buildProductListParams('', null, 0, 24)).toEqual({ page: 0, size: 24 })
    expect(buildProductListParams('  ', 'x', 1, 10)).toEqual({ page: 1, size: 10 })
    expect(buildProductListParams('mel', '3', 0, 20)).toEqual({
      page: 0,
      size: 20,
      q: 'mel',
      supplierId: 3,
    })
  })
})