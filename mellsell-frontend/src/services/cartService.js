import api from './api'
import { getApiErrorMessage } from '../utils/apiErrorMessage'

/** Serializa mutações para evitar corridas em +/- rápidos e estoque inconsistente. */
let mutationChain = Promise.resolve()

function withCartMutex(fn) {
  const run = mutationChain.then(() => fn(), () => fn())
  mutationChain = run.catch(() => {})
  return run
}

export function normalizeCartItems(data) {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.items)) return data.items
  if (data && Array.isArray(data.content)) return data.content
  return []
}

export function cartItemCount(items) {
  return normalizeCartItems(items).reduce((sum, it) => sum + Number(it.quantity || 0), 0)
}

export function cartSubtotal(items) {
  return normalizeCartItems(items).reduce(
    (sum, it) => sum + Number(it.unitPrice || 0) * Number(it.quantity || 0),
    0,
  )
}

const addItem = (productId, quantity) =>
  withCartMutex(() =>
    api.post('/api/cart/items', { productId, quantity }).then((r) => r.data),
  )

const listCart = () => api.get('/api/cart').then((r) => normalizeCartItems(r.data))

const removeItem = (id) =>
  withCartMutex(() => api.delete(`/api/cart/items/${id}`).then((r) => r.data))

const updateQuantity = (id, quantity) =>
  withCartMutex(() => api.put(`/api/cart/items/${id}`, { quantity }).then((r) => r.data))

const checkout = (shippingAddress, paymentMethod, couponCode, creditCard) =>
  withCartMutex(() =>
    api
      .post('/api/cart/checkout', {
        shippingAddress,
        paymentMethod,
        couponCode: couponCode || undefined,
        creditCard: creditCard || undefined,
      })
      .then((r) => r.data),
  )

export { getApiErrorMessage }

export default { addItem, listCart, removeItem, updateQuantity, checkout }