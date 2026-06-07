import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import useStompTopic from '../hooks/useStompTopic'
import { VENDOR_NOTIFICATION_EVENT } from '../utils/vendorNotificationEvent'

const MAX = 6
const AUTO_DISMISS_MS = 12000

const TYPE_LABELS = {
  CART_RESERVE: 'Reserva no carrinho',
  CART_RELEASE: 'Estoque liberado',
  ORDER_CONFIRMED: 'Nova venda',
  OUT_OF_STOCK: 'Produto esgotado',
}

const TYPE_BORDER = {
  ORDER_CONFIRMED: 'border-emerald-500',
  OUT_OF_STOCK: 'border-red-500',
  CART_RESERVE: 'border-brand-500',
  CART_RELEASE: 'border-stone-400',
}

export default function VendorNotificationStack({ supplierId, onEvent }) {
  const [items, setItems] = useState([])

  const onNotification = useCallback(
    (payload) => {
      if (supplierId && payload.supplierId !== supplierId) return
      const id = `${payload.type}-${payload.orderId || ''}-${payload.productId}-${Date.now()}`
      const entry = { ...payload, id }
      setItems((prev) => [entry, ...prev].slice(0, MAX))
      onEvent?.(payload)
      window.dispatchEvent(new CustomEvent(VENDOR_NOTIFICATION_EVENT, { detail: payload }))
      setTimeout(() => {
        setItems((prev) => prev.filter((n) => n.id !== id))
      }, AUTO_DISMISS_MS)
    },
    [supplierId, onEvent],
  )

  useStompTopic('/topic/vendor-notifications', onNotification, Boolean(supplierId))

  if (!supplierId) return null

  return (
    <div
      className="pointer-events-none fixed bottom-6 right-6 z-[60] flex w-full max-w-sm flex-col gap-3"
      aria-live="polite"
      aria-label="Notificações da loja"
    >
      <AnimatePresence>
        {items.map((n) => (
          <motion.div
            key={n.id}
            layout
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className={`pointer-events-auto surface-elevated border-l-4 p-4 shadow-lg ${
              TYPE_BORDER[n.type] || 'border-brand-500'
            }`}
            role="status"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-400">
              {TYPE_LABELS[n.type] || 'Atualização'}
            </p>
            {n.productName && (
              <p className="mt-1 text-sm font-semibold text-stone-900 dark:text-stone-50">{n.productName}</p>
            )}
            <p className="mt-1 text-sm text-muted">{n.message}</p>
            {n.type === 'ORDER_CONFIRMED' && n.orderId && (
              <Link
                to="/vendor/dashboard"
                className="mt-3 inline-block text-xs font-semibold text-brand-700 hover:underline dark:text-brand-400"
              >
                Ver no painel →
              </Link>
            )}
            {n.type === 'OUT_OF_STOCK' && (
              <Link
                to="/vendor/products"
                className="mt-3 inline-block text-xs font-semibold text-red-700 hover:underline dark:text-red-400"
              >
                Repor estoque →
              </Link>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}