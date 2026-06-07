import { useRef, useState } from 'react'
import productService from '../services/productService'
import { resolveProductImageUrl } from '../utils/productImageUrl'
import { formatUploadError } from '../utils/uploadError'

export default function ProductImageUpload({ imageUrl, onImageUrlChange, disabled = false }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const preview = resolveProductImageUrl(imageUrl)

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const { imageUrl: url } = await productService.uploadImage(file)
      onImageUrlChange(url)
    } catch (err) {
      console.error('upload image', err)
      setError(formatUploadError(err))
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="product-image-upload">
      <label className="label">Foto do produto</label>
      <div className="product-image-upload-row">
        <div className="product-image-upload-preview">
          {preview ? (
            <img src={preview} alt="Pré-visualização" />
          ) : (
            <span className="text-xs text-muted">Sem imagem</span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
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
            {uploading ? 'Enviando...' : preview ? 'Trocar foto' : 'Escolher foto'}
          </button>
          {preview && (
            <button
              type="button"
              className="btn-ghost text-xs text-muted"
              disabled={disabled || uploading}
              onClick={() => onImageUrlChange('')}
            >
              Remover imagem
            </button>
          )}
          <p className="text-xs text-muted">
            JPG, PNG, WebP ou GIF · até 5 MB. Prefira foto do seu pote; imagens de exemplo só para teste.
          </p>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}