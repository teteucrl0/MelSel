import { getApiBase } from './apiBase'

const UNSAFE_SCHEME = /^(javascript|data|vbscript|file):/i

/** URL absoluta para exibir imagem do produto (apenas upload local /uploads/...). */
export function resolveProductImageUrl(imageUrl) {
  if (!imageUrl) return null
  const trimmed = String(imageUrl).trim()
  if (UNSAFE_SCHEME.test(trimmed)) return null
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return null
  }
  if (!trimmed.startsWith('/uploads/')) return null
  const base = getApiBase()
  if (trimmed.startsWith('/')) {
    return base ? `${base}${trimmed}` : trimmed
  }
  return base ? `${base}/${trimmed}` : `/${trimmed}`
}