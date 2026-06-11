import { describe, expect, it } from 'vitest'
import {
  getPasswordRequirements,
  getPasswordStrengthScore,
  validateEmail,
  validatePasswordSecurity,
  validateCpf,
  validatePhone,
} from './validators'

describe('validators', () => {
  it('calcula requisitos de senha e força', () => {
    const requirements = getPasswordRequirements('Abcdef1!')
    expect(requirements).toEqual({
      length: true,
      lower: true,
      upper: true,
      digit: true,
      special: true,
    })
    expect(getPasswordStrengthScore('Abcdef1!')).toBe(5)
    expect(getPasswordStrengthScore('abc')).toBeLessThan(5)
  })

  it('valida e-mail obrigatório e formato', () => {
    expect(validateEmail('')).toBe('E-mail é obrigatório.')
    expect(validateEmail('invalido')).toBe('Informe um e-mail válido.')
    expect(validateEmail('user@example.com')).toBe('')
  })

  it('valida segurança mínima da senha', () => {
    expect(validatePasswordSecurity('')).toBe('Senha é obrigatória.')
    expect(validatePasswordSecurity('abc')).toBe('A senha não atende aos requisitos de segurança.')
    expect(validatePasswordSecurity('Abcdef1!')).toBe('')
  })

  it('valida formatos opcionais de telefone e cpf', () => {
    expect(validatePhone('')).toBe('')
    expect(validatePhone('(31) 99999-1111')).toBe('')
    expect(validatePhone('12345')).toBe('Telefone inválido.')

    expect(validateCpf('')).toBe('')
    expect(validateCpf('529.982.247-25')).toBe('')
    expect(validateCpf('111.111.111-11')).toBe('CPF inválido.')
    expect(validateCpf('123')).toBe('CPF inválido.')
  })
})
