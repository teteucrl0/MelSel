import api from './api'

const list = () => api.get('/api/admin/suppliers').then((r) => r.data)

const approve = (id) => api.patch(`/api/admin/suppliers/${id}/approve`).then((r) => r.data)

const reject = (id) => api.patch(`/api/admin/suppliers/${id}/reject`).then((r) => r.data)

export default { list, approve, reject }