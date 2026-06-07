import api from './api'

const getTracking = (orderId) => api.get(`/api/orders/${orderId}/tracking`).then((r) => r.data)

export default { getTracking }