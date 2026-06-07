export function normalizeCep(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 8)
}

export function formatCepDisplay(value) {
  const digits = normalizeCep(value)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export function isValidCep(value) {
  return normalizeCep(value).length === 8
}

export function buildShippingAddress({ street, number, complement, neighborhood, city, state, cep }) {
  const parts = []
  const line1 = [street, number].filter(Boolean).join(', ')
  if (line1) parts.push(line1)
  if (complement?.trim()) parts.push(complement.trim())
  const line2 = [neighborhood, city && state ? `${city}/${state}` : city || state]
    .filter(Boolean)
    .join(' - ')
  if (line2) parts.push(line2)
  if (cep) parts.push(`CEP ${formatCepDisplay(cep)}`)
  return parts.join(' — ')
}