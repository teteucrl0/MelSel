import productService from '../services/productService'

/** Payload completo exigido pelo PUT /api/products/{id}. */
export function buildProductUpdatePayload(product, overrides = {}) {
  return {
    name: (overrides.name ?? product.name ?? '').trim(),
    description: (overrides.description ?? product.description ?? '').trim(),
    price: Number(overrides.price ?? product.price),
    stock: Number(overrides.stock ?? product.stock ?? 0),
    lowStockThreshold: Number(overrides.lowStockThreshold ?? product.lowStockThreshold ?? 5) || 5,
    imageUrl: overrides.imageUrl !== undefined ? overrides.imageUrl : product.imageUrl || null,
    active: overrides.active !== undefined ? Boolean(overrides.active) : product.active !== false,
  }
}

/** Aumenta o estoque do produto (padrão +10) via productService.update. */
export async function restockProduct(product, delta = 10) {
  if (!product?.id) throw new Error('Produto inválido')
  const add = Math.max(1, Number(delta) || 10)
  let base = product
  try {
    base = await productService.getById(product.id)
  } catch {
    /* usa cópia local se GET falhar */
  }
  const current = Number(base.stock ?? product.stock ?? 0)
  const payload = buildProductUpdatePayload(base, { stock: current + add })
  const updated = await productService.update(product.id, payload)
  return { ...base, ...updated }
}