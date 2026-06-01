import api from './api'

const listOrders = () => api.get('/api/orders').then(r => r.data)
const getOrder = (id) => api.get(`/api/orders/${id}`).then(r => r.data)

export default { listOrders, getOrder }
