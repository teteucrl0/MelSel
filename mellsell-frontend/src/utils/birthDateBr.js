const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function maxDayInMonth(month, year) {
  if (month < 1 || month > 12) return 31
  if (month === 2 && year != null && !isLeapYear(year)) return 28
  return DAYS_IN_MONTH[month - 1]
}

/** Converte yyyy-mm-dd (API) para dd/mm/aaaa. */
export function isoToBrDate(iso) {
  if (!iso) return ''
  const [y, m, d] = String(iso).split('T')[0].split('-')
  if (!y || !m || !d) return ''
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`
}

/** Converte dd/mm/aaaa para yyyy-mm-dd (API). */
export function brDateToIso(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.length !== 8) return null
  const day = digits.slice(0, 2)
  const month = digits.slice(2, 4)
  const year = digits.slice(4, 8)
  return `${year}-${month}-${day}`
}

/** Máscara enquanto digita: dd/mm/aaaa */
export function maskBirthDateBr(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

/**
 * Validação progressiva (dia/mês/ano) — mês máximo 12, dia coerente com o mês.
 * Retorna null se OK ou ainda incompleto sem erro; string = mensagem de erro.
 */
export function getBirthDateValidationError(value, { required = true } = {}) {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits.length) {
    return required ? 'Data de nascimento é obrigatória.' : null
  }

  if (digits.length >= 2) {
    const day = parseInt(digits.slice(0, 2), 10)
    if (Number.isNaN(day) || day < 1 || day > 31) {
      return 'Dia inválido (use 01 a 31).'
    }
  }

  if (digits.length >= 4) {
    const month = parseInt(digits.slice(2, 4), 10)
    if (Number.isNaN(month) || month < 1 || month > 12) {
      return 'Mês inválido (use 01 a 12).'
    }
    const day = parseInt(digits.slice(0, 2), 10)
    const year = digits.length >= 8 ? parseInt(digits.slice(4, 8), 10) : null
    const maxDay = maxDayInMonth(month, year)
    if (day > maxDay) {
      return `Dia inválido para o mês ${String(month).padStart(2, '0')} (máx. ${maxDay}).`
    }
  }

  if (digits.length >= 8) {
    const year = parseInt(digits.slice(4, 8), 10)
    const currentYear = new Date().getFullYear()
    if (Number.isNaN(year) || year < 1900 || year > currentYear) {
      return `Ano inválido (use 1900 a ${currentYear}).`
    }
    if (!isValidBrBirthDate(value)) {
      return 'Data de nascimento inválida.'
    }
  }

  return null
}

export function isValidBrBirthDate(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.length !== 8) return false

  const day = parseInt(digits.slice(0, 2), 10)
  const month = parseInt(digits.slice(2, 4), 10)
  const year = parseInt(digits.slice(4, 8), 10)

  if (month < 1 || month > 12) return false
  if (day < 1 || day > maxDayInMonth(month, year)) return false

  const currentYear = new Date().getFullYear()
  if (year < 1900 || year > currentYear) return false

  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}