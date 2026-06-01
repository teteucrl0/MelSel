import api from './api'

const list = (q, supplierId, page = 0, size = 20) => api.get('/api/products', { params: { q, supplierId, page, size } }).then(r => r.data)
const getById = (id) => api.get(`/api/products/${id}`).then(r => r.data)
const create = (payload) => api.post('/api/products', payload).then(r => r.data)
const update = (id, payload) => api.put(`/api/products/${id}`, payload).then(r => r.data)
const remove = (id) => api.delete(`/api/products/${id}`).then(r => r.data)

export default { list, getById, create, update, remove }
