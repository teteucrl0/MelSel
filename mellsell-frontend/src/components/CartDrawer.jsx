import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import cartService from '../services/cartService'
import { getApiErrorMessage } from '../utils/apiErrorMessage'
import { CART_UPDATED_EVENT, notifyCartUpdated } from '../utils/cartEvents'
import { MotionDrawer, AnimatedList, variants } from './motion/Motion'
import FlaticonIcon from './FlaticonIcon'

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export default function CartDrawer({ open, onClose }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(null)
  const [actionError, setActionError] = useState('')

  const load = useCallback(async () => {
    if (!open) return
    setLoading(true)
    try {
      const data = await cartService.listCart()
      setItems(data)
      setActionError('')
    } catch (err) {
      setItems([])
      setActionError(getApiErrorMessage(err, 'Não foi possível carregar o carrinho.'))
    } finally {
      setLoading(false)
    }
  }, [open])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!open) return undefined
    const onCart = () => load()
    window.addEventListener(CART_UPDATED_EVENT, onCart)
    return () => window.removeEventListener(CART_UPDATED_EVENT, onCart)
  }, [open, load])

  const removeItem = async (id) => {
    if (updating != null) return
    setUpdating(id)
    setActionError('')
    try {
      await cartService.removeItem(id)
      await load()
      notifyCartUpdated({ action: 'remove', itemId: id })
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Erro ao remover item.'))
      await load()
    } finally {
      setUpdating(null)
    }
  }

  const changeQty = async (id, qty) => {
    if (updating != null) return
    if (qty < 1) {
      await removeItem(id)
      return
    }
    setUpdating(id)
    setActionError('')
    try {
      await cartService.updateQuantity(id, qty)
      await load()
      notifyCartUpdated({ action: 'update', itemId: id, quantity: qty })
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Erro ao atualizar quantidade.'))
      await load()
    } finally {
      setUpdating(null)
    }
  }

  const total = items.reduce((sum, it) => sum + (it.unitPrice || 0) * (it.quantity || 0), 0)

  return (
    <MotionDrawer open={open} onClose={onClose} side="right" width="380px" className="shop-cart-drawer flex flex-col">
      <div className="drawer-header flex items-center justify-between px-5" style={{ borderColor: 'var(--shop-border)' }}>
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold tracking-tight" style={{ color: 'var(--shop-text)' }}>
            Carrinho
          </div>
          <div className="shop-badge">
            {items.length} item{items.length === 1 ? '' : 's'}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shop-btn-ghost text-2xl leading-none"
          aria-label="Fechar"
        >
          ×
        </button>
      </div>

      {actionError && (
        <p className="mx-5 mt-3 text-xs" style={{ color: 'var(--shop-danger)' }} role="alert">
          {actionError}
        </p>
      )}

      <div className="flex-1 overflow-y-auto p-5">
        {loading && items.length === 0 ? (
          <div className="py-8 text-center text-sm shop-text-muted">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="shop-empty" style={{ minHeight: 'auto', padding: '2.5rem 1.5rem' }}>
            <span className="shop-empty-icon" aria-hidden>
              <FlaticonIcon name="honey" size="xl" />
            </span>
            <h2>Seu carrinho está vazio</h2>
            <p>Adicione mels incríveis do catálogo.</p>
            <Link to="/" onClick={onClose} className="shop-btn-primary mt-2 max-w-xs">
              Ir ao catálogo
            </Link>
          </div>
        ) : (
          <AnimatedList className="space-y-4">
            {items.map((item, idx) => (
              <motion.div
                key={item.id || idx}
                layout
                variants={variants.popIn}
                className="shop-panel flex gap-3 !p-3"
              >
                <div
                  className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg"
                  style={{ background: 'var(--shop-surface-hover)' }}
                >
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {item.productId ? (
                        <Link
                          to={`/product/${item.productId}`}
                          onClick={onClose}
                          className="line-clamp-2 text-sm font-medium leading-snug"
                          style={{ color: 'var(--shop-text)' }}
                        >
                          {item.productName || 'Produto'}
                        </Link>
                      ) : (
                        <div className="line-clamp-2 text-sm font-medium leading-snug" style={{ color: 'var(--shop-text)' }}>
                          {item.productName || 'Produto'}
                        </div>
                      )}
                      <div className="text-[11px] shop-text-muted">{item.supplierName || ''}</div>
                    </div>
                    <div className="text-right text-sm font-semibold tabular-nums" style={{ color: 'var(--shop-text)' }}>
                      {money.format((item.unitPrice || 0) * (item.quantity || 0))}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs">
                      <button
                        type="button"
                        onClick={() => changeQty(item.id, (item.quantity || 1) - 1)}
                        disabled={updating != null}
                        className="shop-btn-ghost flex h-7 w-7 items-center justify-center !p-0 text-base"
                      >
                        −
                      </button>
                      <span className="min-w-[1.75rem] text-center tabular-nums" style={{ color: 'var(--shop-text)' }}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => changeQty(item.id, (item.quantity || 1) + 1)}
                        disabled={updating != null}
                        className="shop-btn-ghost flex h-7 w-7 items-center justify-center !p-0 text-base"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={updating != null}
                      className="text-xs font-medium"
                      style={{ color: 'var(--shop-danger)' }}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatedList>
        )}
      </div>

      {items.length > 0 && (
        <div className="p-5" style={{ borderTop: '1px solid var(--shop-border)' }}>
          <div className="mb-3 flex items-baseline justify-between text-sm">
            <span className="shop-text-muted">Total</span>
            <span className="text-lg font-semibold tabular-nums" style={{ color: 'var(--shop-accent-bright)' }}>
              {money.format(total)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/cart" onClick={onClose} className="shop-btn-secondary justify-center py-2.5 text-sm">
              Ver carrinho completo
            </Link>
            <Link
              to={items.length > 0 ? '/checkout' : '/cart'}
              onClick={onClose}
              className="shop-btn-primary justify-center py-2.5 text-sm"
            >
              Finalizar pedido
            </Link>
          </div>
          <p className="mt-2 text-center text-[10px] shop-text-muted">Frete calculado no checkout</p>
        </div>
      )}
    </MotionDrawer>
  )
}