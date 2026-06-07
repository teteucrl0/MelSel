/** @returns {'out' | 'low' | 'ok'} */
export function getStockStatus(stock, lowStockThreshold = 5) {
  const qty = Number(stock ?? 0)
  const threshold = Math.max(1, Number(lowStockThreshold ?? 5) || 5)
  if (qty <= 0) return 'out'
  if (qty <= threshold) return 'low'
  return 'ok'
}

export const STOCK_STATUS_META = {
  out: { label: 'Esgotado', shortLabel: 'Esgotado' },
  low: { label: 'Estoque baixo', shortLabel: 'Acabando' },
  ok: { label: 'Em estoque', shortLabel: 'Normal' },
}