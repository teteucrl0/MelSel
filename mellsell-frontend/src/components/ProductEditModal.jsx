import { useEffect, useState } from 'react'
import productService from '../services/productService'
import { MotionModal } from './motion/Motion'
import QuantityInput from './QuantityInput'
import ProductImageUpload from './ProductImageUpload'
import ProductImage from './ProductImage'
import { parseMoneyBr } from '../utils/parseMoneyBr'
import { formatApiError } from '../utils/apiValidationError'
import { stripMarkupChars, validateProductForm } from '../utils/inputSanitizer'

const emptyForm = {
  name: '',
  description: '',
  price: '',
  stock: 0,
  lowStockThreshold: 5,
  imageUrl: '',
  active: true,
}

function productToForm(product) {
  if (!product) return { ...emptyForm }
  return {
    name: product.name || '',
    description: product.description || '',
    price: String(product.price ?? ''),
    stock: Number(product.stock ?? 0),
    lowStockThreshold: Number(product.lowStockThreshold ?? 5),
    imageUrl: product.imageUrl || '',
    active: product.active !== false,
  }
}

export default function ProductEditModal({ product, open, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && product) {
      setForm(productToForm(product))
      setError('')
    }
  }, [open, product])

  const submit = async (e) => {
    e.preventDefault()
    if (!product?.id) return
    const productErr = validateProductForm(form)
    if (productErr) {
      setError(productErr)
      return
    }
    const price = parseMoneyBr(form.price)
    if (!form.price || !Number.isFinite(price) || price <= 0) {
      setError('Informe um preço válido (ex.: 120,20).')
      return
    }
    if (Number(form.stock) < 0) {
      setError('O estoque não pode ser negativo.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await productService.update(product.id, {
        name: form.name.trim(),
        description: form.description?.trim() || '',
        price,
        stock: Number(form.stock),
        lowStockThreshold: Number(form.lowStockThreshold) || 5,
        imageUrl: form.imageUrl || null,
        active: Boolean(form.active),
      })
      onSaved?.()
      onClose()
    } catch (err) {
      setError(formatApiError(err, 'Não foi possível salvar as alterações.'))
    } finally {
      setSaving(false)
    }
  }

  const requestClose = () => {
    if (!saving) onClose?.()
  }

  return (
    <MotionModal
      open={open && Boolean(product)}
      onClose={requestClose}
      maxWidth="42rem"
      className="flex max-h-[min(92vh,720px)] flex-col overflow-hidden"
    >
      {!product ? null : (
      <div
        className="flex min-h-0 flex-1 flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-edit-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header shrink-0">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-brand-700 dark:text-brand-400">
              Editar no estoque
            </p>
            <h2 id="product-edit-title" className="mt-1 text-lg font-semibold text-stone-900 dark:text-stone-50">
              {form.name || product.name}
            </h2>
          </div>
          <button
            type="button"
            className="icon-btn icon-btn-secondary shrink-0"
            onClick={requestClose}
            disabled={saving}
            aria-label="Fechar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="modal-body min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="modal-product-preview">
            <div className="modal-product-thumb">
              <ProductImage
                imageUrl={form.imageUrl || product.imageUrl}
                alt={form.name}
                className="product-media product-media--thumb h-full"
              />
            </div>
            <p className="text-sm text-muted">
              Ajuste quantidade, preço e demais dados. As mudanças refletem no catálogo na hora.
            </p>
          </div>

          <form id="product-edit-form" onSubmit={submit} className="modal-form space-y-4">
            {error && <div className="alert alert-error text-sm">{error}</div>}

            <div>
              <label className="label" htmlFor="edit-name">Nome do produto</label>
              <input
                id="edit-name"
                className="input-field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: stripMarkupChars(e.target.value) })}
                maxLength={120}
                required
              />
            </div>

            <ProductImageUpload
              imageUrl={form.imageUrl}
              onImageUrlChange={(imageUrl) => setForm({ ...form, imageUrl })}
              disabled={saving}
            />

            <div>
              <label className="label" htmlFor="edit-desc">Descrição</label>
              <textarea
                id="edit-desc"
                className="input-field resize-none"
                rows={3}
                placeholder="Peso, florada, origem..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: stripMarkupChars(e.target.value) })}
                maxLength={2000}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="edit-price">Preço (R$)</label>
                <input
                  id="edit-price"
                  className="input-field"
                  type="text"
                  inputMode="decimal"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^0-9.,]/g, '') })}
                  required
                />
              </div>
              <QuantityInput
                label="Quantidade em estoque"
                value={form.stock}
                onChange={(stock) => setForm({ ...form, stock })}
                min={0}
                max={99999}
                disabled={saving}
              />
            </div>

            <QuantityInput
              label="Alerta de estoque baixo"
              value={form.lowStockThreshold}
              onChange={(lowStockThreshold) => setForm({ ...form, lowStockThreshold })}
              min={1}
              max={999}
              disabled={saving}
            />

            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-stone-200 px-4 py-3 dark:border-stone-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                disabled={saving}
              />
              <span className="text-sm">
                <span className="font-medium text-stone-900 dark:text-stone-50">Visível no catálogo</span>
                <span className="mt-0.5 block text-muted">Desmarque para ocultar sem excluir o produto.</span>
              </span>
            </label>
          </form>
        </div>

        <footer className="flex shrink-0 justify-end gap-3 border-t border-stone-200 bg-stone-50 px-5 py-4 dark:border-stone-800 dark:bg-stone-950">
          <button type="button" onClick={requestClose} className="btn-secondary" disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="product-edit-form" className="btn-primary" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </footer>
      </div>
      )}
    </MotionModal>
  )
}