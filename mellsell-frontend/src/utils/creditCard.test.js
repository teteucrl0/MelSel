import { describe, expect, it } from 'vitest'
import {
  buildCreditCardPayload,
  cardBrand,
  digitsOnly,
  formatCardNumber,
  formatExpiry,
  installmentAmount,
  luhnCheck,
  parseExpiry,
  validateCreditCardFields,
} from './creditCard'

describe('creditCard', () => {
  it('formatCardNumber groups digits', () => {
    expect(formatCardNumber('4111111111111111')).toBe('4111 1111 1111 1111')
  })

  it('luhnCheck accepts valid test visa', () => {
    expect(luhnCheck('4111111111111111')).toBe(true)
  })

  it('validate rejects empty name', () => {
    expect(
      validateCreditCardFields({
        holderName: '',
        number: '4111111111111111',
        expiry: '12/30',
        cvv: '123',
      }),
    ).toBeTruthy()
  })

  it('buildCreditCardPayload strips formatting', () => {
    const p = buildCreditCardPayload({
      holderName: 'Maria Silva',
      number: '4111 1111 1111 1111',
      expiry: '12/30',
      cvv: '123',
    })
    expect(p.number).toBe('4111111111111111')
    expect(p.expMonth).toBe('12')
    expect(p.expYear).toBe('30')
    expect(p.installments).toBe(1)
  })

  it('buildCreditCardPayload includes installments', () => {
    const p = buildCreditCardPayload({
      holderName: 'Maria',
      number: '4111111111111111',
      expiry: '12/30',
      cvv: '123',
      installments: 6,
    })
    expect(p.installments).toBe(6)
  })

  it('digitsOnly remove caracteres não numéricos', () => {
    expect(digitsOnly('41 11-1111')).toBe('41111111')
    expect(digitsOnly(null)).toBe('')
  })

  it('formatExpiry insere barra após MM', () => {
    expect(formatExpiry('1230')).toBe('12/30')
    expect(formatExpiry('1')).toBe('1')
  })

  it('parseExpiry retorna vazio quando incompleto', () => {
    expect(parseExpiry('12')).toEqual({ expMonth: '', expYear: '' })
    expect(parseExpiry('12/30')).toEqual({ expMonth: '12', expYear: '30' })
  })

  it('cardBrand identifica bandeiras comuns', () => {
    expect(cardBrand('4111111111111111')).toBe('visa')
    expect(cardBrand('5555555555554444')).toBe('mastercard')
    expect(cardBrand('378282246310005')).toBe('amex')
    expect(cardBrand('6362970000457013')).toBe('elo')
    expect(cardBrand('9999999999999999')).toBe('generic')
  })

  it('luhnCheck rejeita número inválido', () => {
    expect(luhnCheck('4111111111111112')).toBe(false)
    expect(luhnCheck('123')).toBe(false)
  })

  it('validate rejeita cartão expirado', () => {
    expect(
      validateCreditCardFields({
        holderName: 'Maria Silva',
        number: '4111111111111111',
        expiry: '01/20',
        cvv: '123',
      }),
    ).toBe('Cartão expirado')
  })

  it('validate exige 4 dígitos de CVV para Amex', () => {
    expect(
      validateCreditCardFields({
        holderName: 'Maria Silva',
        number: '378282246310005',
        expiry: '12/30',
        cvv: '123',
      }),
    ).toBe('CVV deve ter 4 dígitos')
  })

  it('installmentAmount divide total e limita parcelas', () => {
    expect(installmentAmount(120, 3)).toBe(40)
    expect(installmentAmount(100, 99)).toBe(100 / 6)
    expect(installmentAmount(50, 0)).toBe(50)
  })

  it('validate detecta cartão de teste recusado', () => {
    expect(
      validateCreditCardFields({
        holderName: 'Maria Silva',
        number: '4000000000000002',
        expiry: '12/30',
        cvv: '123',
        installments: 1,
      }),
    ).toContain('recusado')
  })

  it('validate exige parcelas entre 1 e 6', () => {
    expect(
      validateCreditCardFields({
        holderName: 'Maria Silva',
        number: '4111111111111111',
        expiry: '12/30',
        cvv: '123',
        installments: 9,
      }),
    ).toBe('Parcelamento deve ser de 1 a 6 vezes')
  })

  it('buildCreditCardPayload limita parcelas entre 1 e 6', () => {
    const p = buildCreditCardPayload({
      holderName: ' Maria ',
      number: '4111111111111111',
      expiry: '12/30',
      cvv: '123',
      installments: 12,
    })
    expect(p.holderName).toBe('Maria')
    expect(p.installments).toBe(6)
  })
})