import api from './api'

const addItem = (productId, quantity) => api.post('/api/cart/items', { productId, quantity }).then(r => r.data)
const listCart = () => api.get('/api/cart').then(r => r.data)
const removeItem = (id) => api.delete(`/api/cart/items/${id}`).then(r => r.data)
const updateQuantity = (id, quantity) => api.put(`/api/cart/items/${id}`, { quantity }).then(r => r.data)
const checkout = (shippingAddress, paymentMethod, couponCode) => api.post('/api/cart/checkout', { shippingAddress, paymentMethod, couponCode: couponCode || undefined }).then(r => r.data)

export default { addItem, listCart, removeItem, updateQuantity, checkout }
