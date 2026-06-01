import api from './api'

const exportByRole = (role) => {
  return api.get('/api/admin/users/export', { params: { role }, responseType: 'arraybuffer' }).then(r => r.data)
}

export default { exportByRole }
