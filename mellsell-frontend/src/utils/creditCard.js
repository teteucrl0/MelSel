/** Utilitários de cartão (cliente) — validação antes do checkout. */

export function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '')
}

export function formatCardNumber(value) {
  const d = digitsOnly(value).slice(0, 19)
  return d.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

export function formatExpiry(value) {
  const d = digitsOnly(value).slice(0, 4)
  if (d.length <= 2) return d
  return `${d.slice(0, 2)}/${d.slice(2)}`
}

export function parseExpiry(mmYy) {
  const d = digitsOnly(mmYy)
  if (d.length < 4) return { expMonth: '', expYear: '' }
  return { expMonth: d.slice(0, 2), expYear: d.slice(2) }
}

export function cardBrand(number) {
  const d = digitsOnly(number)
  if (/^4/.test(d)) return 'visa'
  if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) return 'mastercard'
  if (/^3[47]/.test(d)) return 'amex'
  if (/^6/.test(d)) return 'elo'
  return 'generic'
}

export function luhnCheck(number) {
  const d = digitsOnly(number)
  if (d.length < 13) return false
  let sum = 0
  let alt = false
  for (let i = d.length - 1; i >= 0; i--) {
    let n = parseInt(d[i], 10)
    if (alt) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    alt = !alt
  }
  return sum % 10 === 0
}

export function clampInstallments(installments) {
  return Math.max(1, Math.min(6, parseInt(String(installments), 10) || 1))
}

export function validateCreditCardFields({ holderName, number, expiry, cvv, installments }) {
  const name = (holderName || '').trim()
  if (name.length < 2) return 'Informe o nome impresso no cartão'
  const num = digitsOnly(number)
  if (num.length < 13) return 'Número do cartão incompleto'
  if (!luhnCheck(num)) return 'Número do cartão inválido'
  const declineTest = new Set(['4000000000000002', '4000000000000069'])
  if (declineTest.has(num)) return 'Cartão recusado pelo emissor. Tente outro cartão.'
  const { expMonth, expYear } = parseExpiry(expiry)
  if (!expMonth || expYear.length < 2) return 'Validade inválida (MM/AA)'
  const month = parseInt(expMonth, 10)
  if (month < 1 || month > 12) return 'Mês de validade inválido'
  const year = expYear.length === 2 ? 2000 + parseInt(expYear, 10) : parseInt(expYear, 10)
  const exp = new Date(year, month, 0)
  const now = new Date()
  if (exp < new Date(now.getFullYear(), now.getMonth(), 1)) return 'Cartão expirado'
  const cvvDigits = digitsOnly(cvv)
  const cvvLen = cardBrand(num) === 'amex' ? 4 : 3
  if (cvvDigits.length !== cvvLen) return `CVV deve ter ${cvvLen} dígitos`
  if (cvvDigits === '000' || cvvDigits === '0000') {
    return 'Cartão recusado pelo emissor. Verifique o CVV.'
  }
  const inst = parseInt(String(installments), 10)
  if (!Number.isFinite(inst) || inst < 1 || inst > 6) {
    return 'Parcelamento deve ser de 1 a 6 vezes'
  }
  return null
}

export function installmentAmount(total, installments) {
  const n = clampInstallments(installments)
  const t = Math.max(0, Number(total) || 0)
  return t / n
}

export function buildCreditCardPayload({ holderName, number, expiry, cvv, installments = 1 }) {
  const { expMonth, expYear } = parseExpiry(expiry)
  const inst = clampInstallments(installments)
  return {
    holderName: holderName.trim(),
    number: digitsOnly(number),
    expMonth,
    expYear,
    cvv: digitsOnly(cvv),
    installments: inst,
  }
}