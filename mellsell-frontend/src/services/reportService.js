import api from './api'

const salesReport = (from, to, format) => {
  const params = {}
  if (from) params.from = from
  if (to) params.to = to
  if (format) params.format = format
  const opts = { params }
  if (format && format.toLowerCase() === 'pdf') {
    opts.responseType = 'arraybuffer'
  }
  return api.get('/api/admin/reports/sales', opts).then(r => r.data)
}

export default { salesReport }
