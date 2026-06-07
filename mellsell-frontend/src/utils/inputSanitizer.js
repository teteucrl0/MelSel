/**
 * Validação de texto alinhada ao backend (InputSanitizer.java).
 * Bloqueia fragmentos de injeção SQL/XSS em campos de formulário.
 */

export const FORBIDDEN_FRAGMENTS = [
  '--',
  ';',
  '/*',
  '*/',
  '@@',
  'char(',
  'nchar(',
  'varchar(',
  'nvarchar(',
  'xp_',
  '<script',
]

const SQL_KEYWORD = /\b(alter|create|delete|drop|exec|execute|insert|select|union|update)\b/i

const SAFE_NAME = /^[\p{L}0-9 .'-]{2,120}$/u
const SAFE_STORE = /^[\p{L}0-9 .'&-]{0,120}$/u
const SAFE_PRODUCT_NAME = /^[\p{L}0-9 .'&-]{2,120}$/u
const SAFE_ADDRESS_LINE = /^[\p{L}0-9 .,'/ºª°#-]{0,120}$/u
const SAFE_ADDRESS_NUMBER = /^[\p{L}0-9 ./-]{1,20}$/u
const SAFE_SHIPPING = /^[\p{L}0-9 .,'/ºª°#()\n—-]{10,500}$/u
const SAFE_DESCRIPTION = /^[\p{L}0-9 .,!?'\n\r-]{0,2000}$/u
const SAFE_REVIEW = /^[\p{L}0-9 .,!?'\n\r-]{1,1000}$/u

export function hasDangerousText(value) {
  const text = String(value ?? '')
  if (!text) return false
  const lower = text.toLowerCase()
  if (FORBIDDEN_FRAGMENTS.some((f) => lower.includes(f))) return true
  if (SQL_KEYWORD.test(text)) return true
  if (/[<>]/.test(text)) return true
  return false
}

export function getDangerousTextError(fieldLabel = 'Campo') {
  return `${fieldLabel} contém texto não permitido.`
}

export function getSafeNameError(value) {
  const trimmed = String(value ?? '').trim().replace(/\s+/g, ' ')
  if (!trimmed) return 'Nome completo é obrigatório.'
  if (hasDangerousText(trimmed)) return getDangerousTextError('Nome')
  if (!SAFE_NAME.test(trimmed)) {
    return 'Nome contém caracteres não permitidos. Use apenas letras, números, espaços e hífen.'
  }
  if (!trimmed.includes(' ')) {
    return 'Informe o nome completo (nome e sobrenome, separados por espaço).'
  }
  const parts = trimmed.split(' ')
  if (parts.length < 2) return 'Informe pelo menos nome e sobrenome.'
  if (parts.some((p) => p.length < 2)) {
    return 'Cada parte do nome deve ter pelo menos 2 caracteres.'
  }
  return null
}

export function getSafeStoreNameError(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return null
  if (hasDangerousText(trimmed)) return getDangerousTextError('Nome da loja')
  if (!SAFE_STORE.test(trimmed)) return 'Nome da loja contém caracteres não permitidos.'
  return null
}

/** Nome da loja obrigatório no cadastro de apicultor/fornecedor. */
export function getVendorStoreNameError(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return 'Informe o nome da sua loja ou apiário.'
  if (trimmed.length < 3) return 'Nome da loja deve ter pelo menos 3 caracteres.'
  return getSafeStoreNameError(trimmed)
}

/** Descrição da loja no cadastro de apicultor/fornecedor. */
export function getVendorDescriptionError(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return 'Descreva sua loja ou apiário.'
  if (trimmed.length < 20) return 'Descrição deve ter pelo menos 20 caracteres.'
  return getSafeProductDescriptionError(trimmed)
}

/** Cidade no cadastro de apicultor/fornecedor. */
export function getVendorCityError(value) {
  const trimmed = String(value ?? '').trim().replace(/\s+/g, ' ')
  if (!trimmed) return 'Cidade é obrigatória.'
  if (trimmed.length < 2) return 'Cidade deve ter pelo menos 2 caracteres.'
  return getSafeAddressLineError(trimmed, 'Cidade', false)
}

/** UF no cadastro de apicultor/fornecedor. */
export function getVendorStateError(value) {
  const state = String(value ?? '').trim().toUpperCase()
  if (!state) return 'UF é obrigatória.'
  if (hasDangerousText(state)) return getDangerousTextError('UF')
  if (!/^[A-Z]{2}$/.test(state)) return 'UF deve ter 2 letras (ex.: SP).'
  return null
}

export function getSafeProductNameError(value) {
  const trimmed = String(value ?? '').trim().replace(/\s+/g, ' ')
  if (!trimmed) return 'Nome do produto é obrigatório.'
  if (hasDangerousText(trimmed)) return getDangerousTextError('Nome do produto')
  if (!SAFE_PRODUCT_NAME.test(trimmed)) {
    return 'Nome do produto contém caracteres não permitidos.'
  }
  return null
}

export function getSafeProductDescriptionError(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return null
  if (hasDangerousText(trimmed)) return getDangerousTextError('Descrição')
  if (!SAFE_DESCRIPTION.test(trimmed)) return 'Descrição contém caracteres não permitidos.'
  return null
}

export function getSafeReviewCommentError(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return null
  if (hasDangerousText(trimmed)) return getDangerousTextError('Comentário')
  if (!SAFE_REVIEW.test(trimmed)) return 'Comentário contém caracteres não permitidos.'
  return null
}

export function getSafeAddressLineError(value, label, required = false) {
  const trimmed = String(value ?? '').trim().replace(/\s+/g, ' ')
  if (!trimmed) return required ? `${label} é obrigatório.` : null
  if (hasDangerousText(trimmed)) return getDangerousTextError(label)
  if (!SAFE_ADDRESS_LINE.test(trimmed)) return `${label} contém caracteres não permitidos.`
  return null
}

export function getSafeAddressNumberError(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return 'Número é obrigatório.'
  if (hasDangerousText(trimmed)) return getDangerousTextError('Número')
  if (!SAFE_ADDRESS_NUMBER.test(trimmed)) return 'Número contém caracteres não permitidos.'
  return null
}

export function getSafeShippingAddressError(value) {
  const trimmed = String(value ?? '').trim().replace(/[ \t]+/g, ' ')
  if (!trimmed) return 'Endereço de entrega é obrigatório.'
  if (hasDangerousText(trimmed)) return getDangerousTextError('Endereço')
  if (!SAFE_SHIPPING.test(trimmed)) return 'Endereço contém caracteres não permitidos.'
  return null
}

/** Valida campos do formulário de CEP antes do checkout. */
export function getAddressFieldsValidationError(fields) {
  const cepDigits = String(fields?.cep ?? '').replace(/\D/g, '')
  if (cepDigits.length !== 8) return 'Informe um CEP com 8 dígitos.'
  if (hasDangerousText(cepDigits)) return getDangerousTextError('CEP')

  const streetErr = getSafeAddressLineError(fields?.street, 'Logradouro', true)
  if (streetErr) return streetErr

  const numberErr = getSafeAddressNumberError(fields?.number)
  if (numberErr) return numberErr

  const complementErr = getSafeAddressLineError(fields?.complement, 'Complemento', false)
  if (complementErr) return complementErr

  const neighborhoodErr = getSafeAddressLineError(fields?.neighborhood, 'Bairro', true)
  if (neighborhoodErr) return neighborhoodErr

  const cityErr = getSafeAddressLineError(fields?.city, 'Cidade', true)
  if (cityErr) return cityErr

  const state = String(fields?.state ?? '').trim()
  if (!state) return 'UF é obrigatória.'
  if (hasDangerousText(state)) return getDangerousTextError('UF')
  if (!/^[A-Za-z]{2}$/.test(state)) return 'UF inválida.'

  return null
}

/** Remove caracteres de marcação HTML comuns em inputs de texto. */
export function stripMarkupChars(value) {
  return String(value ?? '').replace(/[<>]/g, '')
}

export function validateProductForm({ name, description }) {
  return getSafeProductNameError(name) || getSafeProductDescriptionError(description)
}