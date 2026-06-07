import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import orderService from '../services/orderService'
import ShopPageHeader from '../components/shop/ShopPageHeader'
import PageLoadPlaceholder from '../components/PageLoadPlaceholder'
import { resolveOrderDeliveryPreview } from '../utils/orderDeliveryPreview'
import { formatApiError } from '../utils/apiValidationError'
import FlaticonIcon from '../components/FlaticonIcon'

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function statusLabel(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'CONFIRMED' || s === 'COMPLETED') return { className: 'shop-badge shop-badge--ok', label: 'Confirmado' }
  if (s === 'PENDING') return { className: 'shop-badge shop-badge--warn', label: 'Pendente' }
  if (s === 'CANCELLED') return { className: 'shop-badge shop-badge--err', label: 'Cancelado' }
  return { className: 'shop-badge', label: status || 'Em andamento' }
}

function itemsSubtotal(order) {
  return (order.items || []).reduce((sum, item) => sum + Number(item.subtotal || 0), 0)
}

function itemCount(order) {
  return (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)
}

function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function OrderCard({ order }) {
  const [showProducts, setShowProducts] = useState(false)
  const badge = statusLabel(order.status)
  const delivery = resolveOrderDeliveryPreview(order)
  const products = order.items || []
  const qty = itemCount(order)
  const subtotal = itemsSubtotal(order)
  const shipping = Number(order.shippingCost || 0)
  const discount = Number(order.discount || 0)

  return (
    <article className="shop-order-card">
      {order.supplierName && (
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--shop-honey)' }}>
          {order.supplierName}
        </p>
      )}

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs" style={{ color: 'var(--shop-muted)' }}>Pedido</p>
          <p className="text-xl font-bold" style={{ color: 'var(--shop-text)' }}>#{order.id}</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--shop-muted)' }}>{formatDateTime(order.createdAt)}</p>
        </div>
        <div className="text-left sm:text-right">
          <span className={badge.className}>{badge.label}</span>
          <p className="mt-2 text-2xl font-bold tabular-nums" style={{ color: 'var(--shop-honey)' }}>
            {money.format(Number(order.total))}
          </p>
        </div>
      </div>

      <dl className="order-details-grid mt-5 text-sm" style={{ color: 'var(--shop-text)' }}>
        <div className="order-detail-item">
          <dt style={{ color: 'var(--shop-muted)' }}>Itens</dt>
          <dd>
            {qty} {qty === 1 ? 'unidade' : 'unidades'} · {products.length}{' '}
            {products.length === 1 ? 'produto' : 'produtos'}
          </dd>
        </div>
        <div className="order-detail-item">
          <dt style={{ color: 'var(--shop-muted)' }}>Subtotal</dt>
          <dd>{money.format(subtotal)}</dd>
        </div>
        <div className="order-detail-item">
          <dt style={{ color: 'var(--shop-muted)' }}>Frete</dt>
          <dd>{shipping > 0 ? money.format(shipping) : 'Grátis'}</dd>
        </div>
        {discount > 0 && (
          <div className="order-detail-item">
            <dt style={{ color: 'var(--shop-muted)' }}>Desconto</dt>
            <dd style={{ color: 'var(--shop-success)' }}>− {money.format(discount)}</dd>
          </div>
        )}
        {order.shippingAddress && (
          <div className="order-detail-item sm:col-span-2">
            <dt style={{ color: 'var(--shop-muted)' }}>Entrega</dt>
            <dd>{order.shippingAddress}</dd>
          </div>
        )}
      </dl>

      {delivery && (
        <div className="order-delivery-preview">
          <div className="order-delivery-preview-head">
            <div className="order-delivery-preview-bee-wrap" aria-hidden>
              <picture>
                <source srcSet="/images/bee-delivery-hero.webp" type="image/webp" />
                <img
                  src="/images/bee-delivery-hero.png"
                  alt=""
                  className="order-delivery-preview-bee"
                  width={64}
                  height={80}
                  decoding="async"
                />
              </picture>
            </div>
            <div className="order-delivery-preview-meta">
              <p className="order-delivery-preview-label">
                Entrega · {delivery.carrier}
              </p>
              <p className="order-delivery-preview-code">{delivery.trackingCode}</p>
              <p className="order-delivery-preview-status">
                {delivery.delivered ? 'Entregue' : delivery.status}
              </p>
            </div>
          </div>

          <div className="order-delivery-preview-progress">
            <div
              className="order-delivery-preview-track"
              role="progressbar"
              aria-valuenow={delivery.progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${delivery.progress}% do trajeto`}
            >
              <div
                className="order-delivery-preview-fill"
                style={{ width: `${delivery.progress}%` }}
              />
            </div>
            <span className="order-delivery-preview-pct">{delivery.progress}%</span>
          </div>

          <Link to={`/orders/${order.id}/tracking`} className="order-delivery-preview-link shop-btn-primary">
            {delivery.delivered ? 'Ver rastreamento' : 'Rastrear entrega'}
            <span className="order-delivery-preview-link-arrow" aria-hidden>→</span>
          </Link>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2 border-t pt-4" style={{ borderColor: 'var(--shop-border)' }}>
        <button type="button" className="shop-btn-secondary text-sm" onClick={() => setShowProducts((v) => !v)}>
          {showProducts ? 'Ocultar itens' : `Ver itens${products.length ? ` (${products.length})` : ''}`}
        </button>
      </div>

      {showProducts && (
        <ul className="order-products-list mt-4">
          {products.length === 0 ? (
            <li className="text-sm" style={{ color: 'var(--shop-muted)' }}>Nenhum item listado.</li>
          ) : (
            products.map((item, idx) => (
              <li key={`${item.productId}-${idx}`} className="order-product-row">
                <div className="min-w-0 flex-1">
                  <p className="font-medium" style={{ color: 'var(--shop-text)' }}>{item.productName}</p>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--shop-muted)' }}>
                    {item.quantity} un. × {money.format(Number(item.unitPrice))}
                  </p>
                </div>
                <p className="shrink-0 font-semibold tabular-nums">{money.format(Number(item.subtotal))}</p>
              </li>
            ))
          )}
        </ul>
      )}
    </article>
  )
}

export default function Orders() {
  const [searchParams] = useSearchParams()
  const justPlaced = searchParams.get('placed') === '1'
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    setLoadError('')
    orderService
      .listOrders()
      .then((data) => {
        setOrders(data || [])
        setLoadError('')
      })
      .catch((err) => {
        setOrders([])
        setLoadError(formatApiError(err, 'Não foi possível carregar seus pedidos.'))
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoadPlaceholder />

  return (
    <div className="shop-account">
      <ShopPageHeader
        title="Meus pedidos"
        description="Acompanhe compras, valores e entrega de cada pedido."
      />

      {justPlaced && (
        <div className="shop-alert shop-alert--success">
          Pedido confirmado! Os detalhes e o rastreio aparecem abaixo.
        </div>
      )}

      {loadError && (
        <div className="shop-alert shop-alert--err" role="alert">
          {loadError}
        </div>
      )}

      {orders.length === 0 && !loadError ? (
        <div className="shop-empty">
          <span className="shop-empty-icon" aria-hidden>
            <FlaticonIcon name="package" size="hero" animated />
          </span>
          <h2>Nenhum pedido ainda</h2>
          <p>Quando você finalizar uma compra no checkout, ela aparecerá aqui com rastreamento.</p>
          <Link to="/" className="shop-btn-primary mt-4" style={{ maxWidth: '14rem' }}>
            Ir à loja
          </Link>
        </div>
      ) : orders.length > 0 ? (
        <div>
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      ) : null}
    </div>
  )
}