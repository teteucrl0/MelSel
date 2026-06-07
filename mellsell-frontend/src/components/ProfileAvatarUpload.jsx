import { useRef, useState } from 'react'
import userService from '../services/userService'
import authService from '../services/authService'
import { resolveProductImageUrl } from '../utils/productImageUrl'
import { formatUploadError } from '../utils/uploadError'

export default function ProfileAvatarUpload({ avatarUrl, onUpdated, disabled = false }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const preview = resolveProductImageUrl(avatarUrl)

  const applyResponse = (data) => {
    authService.persistSession(data)
    onUpdated?.(data.profile)
  }

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const data = await userService.uploadAvatar(file)
      applyResponse(data)
    } catch (err) {
      setError(formatUploadError(err))
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const remove = async () => {
    setError('')
    setUploading(true)
    try {
      const data = await userService.removeAvatar()
      applyResponse(data)
    } catch (err) {
      setError(formatUploadError(err))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="profile-avatar-upload">
      <div className="profile-avatar-preview">
        {preview ? (
          <img src={preview} alt="Sua foto de perfil" />
        ) : (
          <span className="profile-avatar-placeholder" aria-hidden>
            ?
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          disabled={disabled || uploading}
          onChange={onFile}
        />
        <button
          type="button"
          className="btn-secondary text-sm"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Enviando...' : preview ? 'Trocar foto' : 'Adicionar foto'}
        </button>
        {preview && (
          <button
            type="button"
            className="btn-ghost text-xs text-muted"
            disabled={disabled || uploading}
            onClick={remove}
          >
            Remover foto
          </button>
        )}
        <p className="text-xs text-muted">JPG, PNG, WebP ou GIF · até 5 MB</p>
      </div>
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}