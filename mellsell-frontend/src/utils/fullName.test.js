import { describe, it, expect } from 'vitest'
import { getFullNameError, isValidFullName, normalizeFullName } from './fullName'

describe('fullName', () => {
  it('aceita nome e sobrenome', () => {
    expect(isValidFullName('Maria Silva')).toBe(true)
    expect(getFullNameError('Maria Silva')).toBeNull()
  })

  it('rejeita só o primeiro nome', () => {
    expect(isValidFullName('Maria')).toBe(false)
    expect(getFullNameError('Maria')).toMatch(/espaço/i)
  })

  it('rejeita mês 22 style typo no nome incompleto', () => {
    expect(isValidFullName('Jo')).toBe(false)
  })

  it('normaliza espaços', () => {
    expect(normalizeFullName('  Maria   Silva  ')).toBe('Maria Silva')
  })
})