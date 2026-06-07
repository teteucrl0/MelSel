/** Parâmetros de busca do catálogo (GET /api/products) — alinhados com o backend. */

export const SEARCH_DEBOUNCE_MS = 300

/** q vazio ou só espaços → null (não enviar ?q= na API). */
export function normalizeQuery(q) {
  if (q == null) return null
  const trimmed = String(q).trim()
  return trimmed.length > 0 ? trimmed : null
}

/** supplierId da URL ou número → id válido ou null. */
export function parseSupplierId(value) {
  if (value == null || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n) || n < 1) return null
  return Math.trunc(n)
}

/** Monta params do axios omitindo q/supplierId inválidos. */
export function buildProductListParams(q, supplierId, page = 0, size = 20) {
  const params = { page, size }
  const query = normalizeQuery(q)
  const sid = parseSupplierId(supplierId)
  if (query) params.q = query
  if (sid != null) params.supplierId = sid
  return params
}