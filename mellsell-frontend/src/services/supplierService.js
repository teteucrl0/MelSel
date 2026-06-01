import api from './api'

const getMySupplier = () => api.get('/api/suppliers/me').then(r => r.data)

export default { getMySupplier }
