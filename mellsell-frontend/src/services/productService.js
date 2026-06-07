import api from './api'
import { buildProductListParams } from '../utils/catalogSearch'

const list = (q, supplierId, page = 0, size = 20) =>
  api.get('/api/products', { params: buildProductListParams(q, supplierId, page, size) }).then((r) => r.data)
/** Catálogo do apicultor logado (inclui inativos) — exige papel VENDEDOR. */
const listMy = (page = 0, size = 50) =>
  api.get('/api/admin/products/my', { params: { page, size } }).then((r) => r.data)
const getById = (id) => api.get(`/api/products/${id}`).then(r => r.data)
const create = (payload) => api.post('/api/products', payload).then(r => r.data)
const update = (id, payload) => api.put(`/api/products/${id}`, payload).then(r => r.data)
const remove = (id) => api.delete(`/api/products/${id}`).then(r => r.data)

const MIME_BY_EXT = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
}

function fileForUpload(file) {
  const ext = file.name?.split('.').pop()?.toLowerCase()
  const typeFromExt = MIME_BY_EXT[ext]
  const generic = !file.type || file.type === 'application/octet-stream'
  if (typeFromExt && generic) {
    return new File([file], file.name, { type: typeFromExt })
  }
  if (file.type?.startsWith('image/')) return file
  if (typeFromExt) return new File([file], file.name, { type: typeFromExt })
  return file
}

function uploadFilename(file) {
  if (file.name?.includes('.')) return file.name
  const ext = file.type?.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
  return `imagem.${ext}`
}

const uploadImage = (file) => {
  const prepared = fileForUpload(file)
  const form = new FormData()
  form.append('file', prepared, uploadFilename(prepared))
  return api
    .post('/api/vendor/upload/product-image', form, {
      timeout: 60000,
      transformRequest: [
        (data, headers) => {
          if (data instanceof FormData) {
            delete headers['Content-Type']
          }
          return data
        },
      ],
    })
    .then((r) => r.data)
}

export default { list, listMy, getById, create, update, remove, uploadImage }
