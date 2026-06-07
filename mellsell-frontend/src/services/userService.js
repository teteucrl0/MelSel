import api from './api'

const getProfile = () => api.get('/api/me/profile').then((r) => r.data)

const updateProfile = (payload) => api.put('/api/me/profile', payload).then((r) => r.data)

const uploadAvatar = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api
    .post('/api/me/profile/avatar', form, {
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

const removeAvatar = () => api.delete('/api/me/profile/avatar').then((r) => r.data)

const changePassword = (currentPassword, newPassword) =>
  api.put('/api/me/password', { currentPassword, newPassword }).then((r) => r.data)

const becomeVendor = (payload) =>
  api.post('/api/profile/become-vendor', payload).then((r) => r.data)

export default { getProfile, updateProfile, uploadAvatar, removeAvatar, changePassword, becomeVendor }