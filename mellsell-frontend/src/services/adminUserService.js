import api from './api'

const list = (params = {}) =>
  api.get('/api/admin/users', { params: { page: 0, size: 50, ...params } }).then((r) => r.data)

const getById = (id) => api.get(`/api/admin/users/${id}`).then((r) => r.data)

const updateUser = (id, payload) => api.put(`/api/admin/users/${id}`, payload).then((r) => r.data)

const setActive = (id, active) =>
  api.patch(`/api/admin/users/${id}/active`, { active }).then((r) => r.data)

const updateRoles = (id, roles) =>
  api.patch(`/api/admin/users/${id}/roles`, { roles }).then((r) => r.data)

const unlock = (id) => api.patch(`/api/admin/users/${id}/unlock`)

/** Exportação PDF exige Authorization — use api.get com responseType blob (ver AdminUsers). */
const exportPdf = (role, params = {}) =>
  api.get('/api/admin/users/export', {
    params: { role, ...params },
    responseType: 'blob',
  })

export default { list, getById, updateUser, setActive, updateRoles, unlock, exportPdf }