/** Rótulo do produtor/fornecedor do mel */
import FlaticonIcon from './FlaticonIcon'

export default function ProductSupplierLabel({ name, variant = 'card' }) {
  if (!name?.trim()) return null

  if (variant === 'detail') {
    return (
      <p className="product-supplier product-supplier--detail">
        <span className="product-supplier-icon" aria-hidden>
          <FlaticonIcon name="vendor" size="sm" className="flaticon-icon--vendor-stall" />
        </span>
        <span className="product-supplier-detail-text">
          <span className="product-supplier-kicker">Produtor · </span>
          <span className="product-supplier-name">{name}</span>
        </span>
      </p>
    )
  }

  return (
    <p className="product-supplier product-supplier--card mt-0.5 flex items-center gap-1 text-[11px]" title={`Produtor: ${name}`}>
      <span className="inline-block">
        <FlaticonIcon name="store" size="xs" />
      </span>
      <span className="font-medium text-muted tracking-tight">{name}</span>
    </p>
  )
}