import api from './api'

const listByProduct = (productId, page = 0, size = 20) => api.get(`/api/reviews/product/${productId}`, { params: { page, size } }).then(r => r.data)
const addReview = (payload) => api.post('/api/reviews', payload).then(r => r.data)

// admin endpoints
const listPending = (page = 0, size = 20) => api.get(`/api/admin/reviews/pending`, { params: { page, size } }).then(r => r.data)
const approveReview = (id) => api.post(`/api/admin/reviews/${id}/approve`).then(r => r.data)
const rejectReview = (id) => api.post(`/api/admin/reviews/${id}/reject`).then(r => r.data)

export default { listByProduct, addReview, listPending, approveReview, rejectReview }
