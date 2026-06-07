import { useState } from 'react'
import { restockProduct } from '../utils/productRestock'
import { getStockStatus } from '../utils/stockStatus'
import { formatApiError } from '../utils/apiValidationError'

const DEFAULT_DELTA = 10

/**
 * Botão rápido "Repor +N" para produtos com estoque baixo ou esgotado.
 */
export default function ProductRestockButton({
  product,
  delta = DEFAULT_DELTA,
  onRestocked,
  onError,
  className = 'btn-primary text-sm',
  disabled = false,
}) {
  const [loading, setLoading] = useState(false)

  if (!product?.id) return null

  const stockState = getStockStatus(product.stock, product.lowStockThreshold)
  if (stockState === 'ok') return null

  const handleClick = async () => {
    setLoading(true)
    try {
      const updated = await restockProduct(product, delta)
      onRestocked?.(updated)
    } catch (err) {
      onError?.(formatApiError(err, 'Não foi possível repor o estoque.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      disabled={disabled || loading}
      title={`Adicionar ${delta} unidades ao estoque`}
    >
      {loading ? 'Repondo...' : `Repor +${delta}`}
    </button>
  )
}