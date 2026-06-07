/**
 * Converte preço em formato brasileiro (ex.: "120,20" ou "1.234,56") para número.
 */
export function parseMoneyBr(value) {
  if (value == null || value === '') return NaN
  const raw = String(value).trim().replace(/\s/g, '')
  if (!raw) return NaN
  const normalized = raw.includes(',')
    ? raw.replace(/\./g, '').replace(',', '.')
    : raw
  const n = Number(normalized)
  return Number.isFinite(n) ? n : NaN
}