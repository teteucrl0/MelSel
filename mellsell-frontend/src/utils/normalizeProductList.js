/** Normaliza resposta paginada ou array da API, removendo entradas nulas/inválidas. */
export function normalizeProductList(data) {
  const raw = data?.content ?? data
  if (!Array.isArray(raw)) return []
  return raw.filter((p) => p != null && p.id != null)
}