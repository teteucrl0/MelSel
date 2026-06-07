import { getStockStatus, STOCK_STATUS_META } from '../utils/stockStatus'

/**
 * Bolinha de status do estoque (vendedor).
 * Vermelho = esgotado · Amarelo = acabando · Verde = ok
 */
export default function StockStatusDot({
  stock,
  lowStockThreshold = 5,
  showLabel = false,
  pulse = true,
  className = '',
}) {
  const status = getStockStatus(stock, lowStockThreshold)
  const meta = STOCK_STATUS_META[status]
  const pulseClass = pulse && status !== 'ok' ? 'stock-dot--pulse' : ''

  return (
    <span
      className={`stock-status ${className}`.trim()}
      title={`${meta.label} (${Number(stock ?? 0)} un.)`}
    >
      <span
        className={`stock-dot stock-dot--${status} ${pulseClass}`}
        aria-hidden
      />
      {showLabel && (
        <span className={`stock-status-label stock-status-label--${status}`}>{meta.shortLabel}</span>
      )}
      <span className="sr-only">
        {meta.label}: {Number(stock ?? 0)} unidades
      </span>
    </span>
  )
}