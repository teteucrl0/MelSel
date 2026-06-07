import { useEffect, useState, useCallback } from 'react'
import cartService from '../services/cartService'
import { getApiErrorMessage } from '../utils/apiErrorMessage'
import { CART_UPDATED_EVENT, notifyCartUpdated } from '../utils/cartEvents'
import { Link, useNavigate } from 'react-router-dom'
import ShopPageHeader from '../components/shop/ShopPageHeader'
import PageLoadPlaceholder from '../components/PageLoadPlaceholder'
import QuantityInput from '../components/QuantityInput'
import FlaticonIcon from '../components/FlaticonIcon'

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Cart() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')
  const navigate = useNavigate()

  const loadCart = useCallback(async () => {
    try {
      setLoading(true)
      setActionError('')
      const data = await cartService.listCart()
      setItems(data)
    } catch (err) {
      setItems([])
      setActionError(getApiErrorMessage(err, 'Não foi possível carregar o carrinho.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCart()
    const onCart = () => loadCart()
    window.addEventListener(CART_UPDATED_EVENT, onCart)
    return () => window.removeEventListener(CART_UPDATED_EVENT, onCart)
  }, [loadCart])

  const remove = async (id) => {
    if (busyId != null) return
    setBusyId(id)
    setActionError('')
    try {
      await cartService.removeItem(id)
      await loadCart()
      notifyCartUpdated({ action: 'remove', itemId: id })
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Erro ao remover item.'))
    } finally {
      setBusyId(null)
    }
  }

  const updateQuantity = async (id, quantity) => {
    if (busyId != null) return
    if (quantity < 1) {
      await remove(id)
      return
    }
    setBusyId(id)
    setActionError('')
    try {
      await cartService.updateQuantity(id, quantity)
      await loadCart()
      notifyCartUpdated({ action: 'update', itemId: id, quantity })
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Erro ao atualizar quantidade.'))
      await loadCart()
    } finally {
      setBusyId(null)
    }
  }

  const totalPrice = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const supplierIds = new Set(items.map((i) => i.supplierId).filter(Boolean))
  const shipmentCount = supplierIds.size || (items.length > 0 ? 1 : 0)

  const itemsBySupplier = items.reduce((acc, item) => {
    const key = item.supplierId ?? 'unknown'
    if (!acc[key]) {
      acc[key] = { supplierName: item.supplierName || 'Produtor', items: [] }
    }
    acc[key].items.push(item)
    return acc
  }, {})

  if (loading) return <PageLoadPlaceholder />

  return (
    <div className="shop-account" style={{ maxWidth: '56rem' }}>
      <ShopPageHeader
        title="Carrinho"
        description={
          shipmentCount > 1
            ? `${shipmentCount} entregas separadas (um rastreio por produtor).`
            : 'Revise os itens e finalize sua compra.'
        }
      />

      {actionError && (
        <div className="shop-toast shop-toast--err mb-4" style={{ position: 'static', transform: 'none', width: '100%' }}>
          {actionError}
        </div>
      )}

      {items.length === 0 ? (
        <div className="shop-empty">
          <span className="shop-empty-icon" aria-hidden>
            <FlaticonIcon name="cart" size="hero" />
          </span>
          <h2>Seu carrinho está vazio</h2>
          <p>Explore a loja e adicione mel artesanal dos nossos produtores.</p>
          <Link to="/" className="shop-btn-primary mt-4" style={{ maxWidth: '14rem' }}>
            Ver produtos
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            {Object.entries(itemsBySupplier).map(([key, group]) => (
              <section key={key}>
                {shipmentCount > 1 && (
                  <p className="mb-2 text-sm font-medium" style={{ color: 'var(--shop-honey)' }}>
                    {group.supplierName}
                  </p>
                )}
                {group.items.map((item) => (
                  <div key={item.id} className="shop-panel mb-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold" style={{ color: 'var(--shop-text)' }}>
                        {item.productId ? (
                          <Link to={`/product/${item.productId}`} style={{ color: 'inherit' }}>
                            {item.productName}
                          </Link>
                        ) : (
                          item.productName
                        )}
                      </h3>
                      <p className="mt-0.5 text-sm" style={{ color: 'var(--shop-muted)' }}>
                        {money.format(item.unitPrice)} / un.
                      </p>
                      <div className="mt-3 max-w-[10rem]">
                        <QuantityInput
                          label="Qtd"
                          value={item.quantity}
                          onChange={(q) => updateQuantity(item.id, q)}
                          min={1}
                          max={item.stockRemaining != null ? Math.max(1, item.stockRemaining + item.quantity) : 999}
                          disabled={busyId != null}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                      <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--shop-text)' }}>
                        {money.format(item.unitPrice * item.quantity)}
                      </p>
                      <button
                        type="button"
                        className="shop-btn-ghost text-sm"
                        style={{ color: '#dc2626' }}
                        disabled={busyId != null}
                        onClick={() => remove(item.id)}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            ))}
          </div>

          <aside className="shop-panel h-fit lg:sticky lg:top-20">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--shop-text)' }}>Resumo</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt style={{ color: 'var(--shop-muted)' }}>Subtotal</dt>
                <dd className="font-medium tabular-nums">{money.format(totalPrice)}</dd>
              </div>
              {shipmentCount > 1 && (
                <div className="flex justify-between">
                  <dt style={{ color: 'var(--shop-muted)' }}>Entregas</dt>
                  <dd>{shipmentCount}</dd>
                </div>
              )}
              <div className="flex justify-between border-t pt-3 text-base font-bold" style={{ borderColor: 'var(--shop-border)' }}>
                <dt>Total</dt>
                <dd className="tabular-nums" style={{ color: 'var(--shop-honey)' }}>{money.format(totalPrice)}</dd>
              </div>
            </dl>
            <button
              type="button"
              className="shop-btn-primary mt-5"
              disabled={busyId != null}
              onClick={() => navigate('/checkout')}
            >
              Finalizar compra
            </button>
            <Link to="/" className="mt-3 block text-center text-sm font-medium" style={{ color: 'var(--shop-honey)' }}>
              Continuar comprando
            </Link>
          </aside>
        </div>
      )}
    </div>
  )
}