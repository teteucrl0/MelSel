import { describe, it, expect } from 'vitest'
import {
  getSafeNameError,
  getSafeProductNameError,
  getSafeReviewCommentError,
  getAddressFieldsValidationError,
  getVendorStoreNameError,
  getVendorDescriptionError,
  getVendorCityError,
  getVendorStateError,
  hasDangerousText,
} from './inputSanitizer'

describe('inputSanitizer', () => {
  it('aceita nomes com substrings SQL (Valter, Walter)', () => {
    expect(getSafeNameError('Valter Viado')).toBeNull()
    expect(getSafeNameError('Walter Silva')).toBeNull()
  })

  it('rejeita palavras SQL inteiras e fragmentos', () => {
    expect(hasDangerousText('Robert Drop')).toBe(true)
    expect(getSafeNameError('João --')).toMatch(/não permitido/i)
  })

  it('valida produto e review', () => {
    expect(getSafeProductNameError('Mel Silvestre 500g')).toBeNull()
    expect(getSafeProductNameError('<script>')).toMatch(/não permitido|caracteres/i)
    expect(getSafeReviewCommentError('Ótimo mel, recomendo!')).toBeNull()
    expect(getSafeReviewCommentError("'; DROP TABLE users; --")).toMatch(/não permitido/i)
  })

  it('valida perfil do fornecedor (cadastro e upgrade)', () => {
    expect(getVendorStoreNameError('Apiário Silva')).toBeNull()
    expect(getVendorStoreNameError('')).toMatch(/loja ou apiário/i)
    expect(
      getVendorDescriptionError('Mel silvestre e florada de laranjeira da Serra da Mantiqueira.'),
    ).toBeNull()
    expect(getVendorDescriptionError('curto')).toMatch(/20 caracteres/i)
    expect(getVendorCityError('Ouro Preto')).toBeNull()
    expect(getVendorCityError('A')).toMatch(/2 caracteres/i)
    expect(getVendorStateError('sp')).toBeNull()
    expect(getVendorStateError('São Paulo')).toMatch(/2 letras/i)
  })

  it('valida endereço de entrega', () => {
    expect(
      getAddressFieldsValidationError({
        cep: '01310-100',
        street: 'Av Paulista',
        number: '1000',
        complement: 'Apto 12',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
      }),
    ).toBeNull()
    expect(
      getAddressFieldsValidationError({
        cep: '01310100',
        street: 'Rua X',
        number: '<img>',
        neighborhood: 'Centro',
        city: 'SP',
        state: 'SP',
      }),
    ).toMatch(/Número/)
  })
})