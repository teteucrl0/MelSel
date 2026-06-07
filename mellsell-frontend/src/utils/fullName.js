import { getSafeNameError } from './inputSanitizer'

/** Nome completo: pelo menos nome + sobrenome separados por espaço. */
export function isValidFullName(value) {
  const trimmed = String(value || '').trim().replace(/\s+/g, ' ')
  if (trimmed.length < 3) return false
  const parts = trimmed.split(' ')
  if (parts.length < 2) return false
  return parts.every((p) => p.length >= 2)
}

export function getFullNameError(value) {
  return getSafeNameError(value)
}

export function normalizeFullName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ')
}