/** Sugestões de autocomplete da busca da loja (fornecedores + produtos). */

export function buildSuggestions(products, query) {
  const q = query.trim().toLowerCase()
  if (!q) return { suppliers: [], products: [] }

  const supplierMap = new Map()
  const productHits = []

  for (const p of products) {
    const supplierName = p.supplierName || ''
    const nameMatch = (p.name || '').toLowerCase().includes(q)
    const descMatch = (p.description || '').toLowerCase().includes(q)
    const supplierMatch = supplierName.toLowerCase().includes(q)

    if (supplierMatch && p.supplierId != null) {
      const key = p.supplierId
      if (!supplierMap.has(key)) {
        supplierMap.set(key, {
          id: p.supplierId,
          name: supplierName,
          productCount: 0,
        })
      }
      supplierMap.get(key).productCount += 1
    }

    if (nameMatch || descMatch || supplierMatch) {
      productHits.push(p)
    }
  }

  return {
    suppliers: [...supplierMap.values()].slice(0, 5),
    products: productHits.slice(0, 6),
  }
}