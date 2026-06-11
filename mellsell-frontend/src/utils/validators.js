import { getBirthDateValidationError } from './birthDateBr'

export const PASSWORD_REQUIREMENT_LABELS = {
  length: 'Mínimo 8 caracteres',
  lower: 'Letra minúscula',
  upper: 'Letra maiúscula',
  digit: 'Número',
  special: 'Caractere especial (ex.: ! @ # _)',
}

export function getPasswordRequirements(password = '') {
  return {
    length: password.length >= 8,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    digit: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }
}

export function getPasswordStrengthScore(password = '') {
  if (!password) return 0
  return Object.values(getPasswordRequirements(password)).filter(Boolean).length
}

export function validateRequired(value, message = 'Este campo é obrigatório.') {
  if (value === null || value === undefined || String(value).trim() === '') return message
  return ''
}

export function validateEmail(email) {
  const requiredError = validateRequired(email, 'E-mail é obrigatório.')
  if (requiredError) return requiredError
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())
  return valid ? '' : 'Informe um e-mail válido.'
}

export function validatePasswordSecurity(password) {
  const requiredError = validateRequired(password, 'Senha é obrigatória.')
  if (requiredError) return requiredError
  const requirements = getPasswordRequirements(password)
  return Object.values(requirements).every(Boolean)
    ? ''
    : 'A senha não atende aos requisitos de segurança.'
}

export function validatePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return ''
  return digits.length >= 10 && digits.length <= 11 ? '' : 'Telefone inválido.'
}

export function validateCpf(cpf) {
  const digits = String(cpf || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return 'CPF inválido.'

  const calcCheckDigit = (sliceLength) => {
    let sum = 0
    for (let i = 0; i < sliceLength; i += 1) {
      sum += Number(digits[i]) * (sliceLength + 1 - i)
    }
    const rest = (sum * 10) % 11
    return rest === 10 ? 0 : rest
  }

  const firstDigit = calcCheckDigit(9)
  const secondDigit = calcCheckDigit(10)
  return firstDigit === Number(digits[9]) && secondDigit === Number(digits[10]) ? '' : 'CPF inválido.'
}

export function validateBirthDateBr(value, { required = true } = {}) {
  return getBirthDateValidationError(value, { required }) || ''
}
