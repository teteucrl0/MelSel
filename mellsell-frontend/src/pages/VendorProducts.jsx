import { useEffect, useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import productService from '../services/productService'
import supplierService from '../services/supplierService'
import PageHeader from '../components/PageHeader'
import QuantityInput from '../components/QuantityInput'
import ProductImageUpload from '../components/ProductImageUpload'
import useStockSync from '../hooks/useStockSync'
import { MotionPage, MotionAlert } from '../components/motion/Motion'
import ProductImage from '../components/ProductImage'
import ProductEditModal from '../components/ProductEditModal'
import ProductRestockButton from '../components/ProductRestockButton'
import { parseMoneyBr } from '../utils/parseMoneyBr'
import { formatApiError } from '../utils/apiValidationError'
import { validateProductForm } from '../utils/inputSanitizer'
import StockStatusDot from '../components/StockStatusDot'
import StockStatusLegend from '../components/StockStatusLegend'
import { getStockStatus } from '../utils/stockStatus'
import { normalizeProductList } from '../utils/normalizeProductList'
import VendorPendingBanner from '../components/VendorPendingBanner'

/** Estoque do apicultor — bolinhas: vermelho esgotado, amarelo baixo, verde ok. */
export default function VendorProducts() {
  const [products, setProducts] = useState([])
  const [supplierId, setSupplierId] = useState(null)
  const [supplierPending, setSupplierPending] = useState(false)
  const [loadingSupplier, setLoadingSupplier] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: 0, lowStockThreshold: 5, imageUrl: '' })

  const load = () =>
    productService
      .listMy(0, 50)
      .then((r) => setProducts(normalizeProductList(r)))
      .catch((err) => {
        setProducts([])
        if (err?.response?.status === 403) {
          setNotice({
            type: 'error',
            text: 'Acesso só para apicultores (VENDEDOR). Entre com conta vendedor ou cadastre-se em Criar conta.',
          })
        }
      })

  const handleStockUpdate = useCallback((update) => {
    setProducts((prev) =>
      prev
        .filter(Boolean)
        .map((p) => (Number(p.id) === Number(update.productId) ? { ...p, stock: update.stock } : p)),
    )
  }, [])
  useStockSync(handleStockUpdate)

  useEffect(() => {
    supplierService
      .getMySupplier()
      .then((supplier) => {
        setSupplierId(supplier.id)
        setSupplierPending(supplier.pendingApproval === true || supplier.active === false)
        return load()
      })
      .catch((err) => {
        setProducts([])
        const status = err?.response?.status
        if (status === 403) {
          setNotice({
            type: 'error',
            text: 'Acesso só para apicultores. Entre com conta vendedor ou cadastre-se em Criar conta.',
          })
        } else if (!err?.response) {
          setNotice({
            type: 'error',
            text: 'Servidor indisponível. Rode ./run-presentation.sh no backend.',
          })
        } else {
          setNotice({
            type: 'error',
            text: err?.response?.data?.message || 'Não foi possível carregar sua loja.',
          })
        }
      })
      .finally(() => setLoadingSupplier(false))
  }, [])

  useEffect(() => {
    if (!notice) return undefined
    const t = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(t)
  }, [notice])

  const submit = async (e) => {
    e.preventDefault()
    if (supplierPending) {
      setNotice({
        type: 'error',
        text: 'Aguardando aprovação da equipe MelSell para cadastrar produtos.',
      })
      return
    }
    const productErr = validateProductForm(form)
    if (productErr) {
      setNotice({ type: 'error', text: productErr })
      return
    }
    const price = parseMoneyBr(form.price)
    if (!form.price || !Number.isFinite(price) || price <= 0) {
      setNotice({ type: 'error', text: 'Informe um preço válido (ex.: 120,20).' })
      return
    }
    if (Number(form.stock) < 0) {
      setNotice({ type: 'error', text: 'O estoque não pode ser negativo.' })
      return
    }

    setSaving(true)
    try {
      await productService.create({
        ...form,
        name: form.name.trim(),
        price,
        stock: Number(form.stock),
        lowStockThreshold: Number(form.lowStockThreshold) || 5,
        supplierId,
      })
      setForm({ name: '', description: '', price: '', stock: 0, lowStockThreshold: 5, imageUrl: '' })
      await load()
      setNotice({ type: 'success', text: 'Produto adicionado ao estoque com sucesso.' })
    } catch (err) {
      setNotice({
        type: 'error',
        text: formatApiError(err, 'Não foi possível salvar o produto.'),
      })
    } finally {
      setSaving(false)
    }
  }

  const handleProductRestocked = (updated) => {
    if (!updated?.id) return
    setProducts((prev) =>
      prev
        .filter(Boolean)
        .map((p) => (Number(p.id) === Number(updated.id) ? { ...p, ...updated } : p)),
    )
    if (editingProduct && Number(editingProduct.id) === Number(updated.id)) {
      setEditingProduct((prev) => (prev ? { ...prev, ...updated } : prev))
    }
    setNotice({ type: 'success', text: `Estoque reposto (+10 un.). Agora: ${updated.stock} un.` })
  }

  const del = (id) => {
    if (!confirm('Confirma exclusão deste produto?')) return
    productService
      .remove(id)
      .then(() => {
        load()
        setNotice({ type: 'success', text: 'Produto removido.' })
      })
      .catch(() => setNotice({ type: 'error', text: 'Falha ao excluir produto.' }))
  }

  return (
    <>
      <ProductEditModal
        product={editingProduct}
        open={Boolean(editingProduct)}
        onClose={() => setEditingProduct(null)}
        onSaved={() => {
          load()
          setNotice({ type: 'success', text: 'Produto atualizado.' })
        }}
      />

      <MotionPage className="mx-auto max-w-3xl">
      <PageHeader title="Estoque" description="Cadastre produtos do zero. O catálogo público começa vazio." />

      <AnimatePresence>
        {notice && (
          <MotionAlert className={`alert mb-6 ${notice.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {notice.text}
          </MotionAlert>
        )}
      </AnimatePresence>

      {loadingSupplier && <div className="mb-4 min-h-6" aria-busy="true" />}

      {supplierPending && <VendorPendingBanner />}

      {!supplierPending && (
      <form onSubmit={submit} className="surface mb-8 space-y-4 p-6">
        <h2 className="section-title">Adicionar ao estoque</h2>
        <div>
          <label className="label">Nome do produto</label>
          <input
            className="input-field"
            placeholder="Ex: Mel de eucalipto 500g"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <ProductImageUpload
          imageUrl={form.imageUrl}
          onImageUrlChange={(imageUrl) => setForm({ ...form, imageUrl })}
          disabled={saving}
        />
        <p className="text-xs text-muted -mt-2">
          Use foto do seu produto real. Fotos de exemplo são aceitas no teste, mas na loja o peso e o texto
          devem combinar com a imagem.
        </p>
        <div>
          <label className="label">Descrição</label>
          <textarea
            className="input-field resize-none"
            rows={3}
            placeholder="Ex: Mel de laranjeira, pote 500g, colheita 2025, apiário em Minas Gerais..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <p className="mt-1 text-xs text-muted">
            Inclua peso, florada e origem — deve bater com o nome e com a foto.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Preço (R$)</label>
            <input
              className="input-field"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^0-9.,]/g, '') })}
              required
            />
          </div>
          <QuantityInput
            label="Unidades em estoque"
            value={form.stock}
            onChange={(stock) => setForm({ ...form, stock })}
            min={0}
            max={99999}
          />
        </div>
        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={!supplierId || saving}>
          {saving ? 'Salvando...' : 'Adicionar ao estoque'}
        </button>
      </form>
      )}

      <h2 className="section-title mb-2">Seu catálogo ({products.length})</h2>
      {products.length > 0 && <StockStatusLegend className="mb-4" />}
      {products.length === 0 ? (
        <div className="surface px-6 py-12 text-center">
          <p className="font-medium text-stone-900 dark:text-stone-50">Nenhum produto ainda</p>
          <p className="mt-2 text-sm text-muted">
            Use o formulário acima para publicar seu primeiro item na loja.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {products.filter(Boolean).map((p) => {
            const stockState = getStockStatus(p.stock, p.lowStockThreshold)
            const rowAccent =
              stockState === 'out' ? 'vendor-product-row--out' : stockState === 'low' ? 'vendor-product-row--low' : ''
            return (
            <li key={p.id} className={`surface flex items-center gap-4 p-4 ${rowAccent}`}>
              <StockStatusDot
                stock={p.stock}
                lowStockThreshold={p.lowStockThreshold}
                showLabel
                className="shrink-0 self-center"
              />
              <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg">
                <ProductImage imageUrl={p.imageUrl} alt={p.name} className="product-media product-media--thumb h-full" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-muted">
                  R$ {Number(p.price).toFixed(2)} · <span className="tabular-nums">{p.stock} un.</span> em estoque
                  {p.lowStockThreshold != null && stockState === 'low' && (
                    <span className="text-amber-700 dark:text-amber-400"> · alerta abaixo de {p.lowStockThreshold} un.</span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                <ProductRestockButton
                  product={p}
                  onRestocked={handleProductRestocked}
                  onError={(text) => setNotice({ type: 'error', text })}
                />
                <button
                  type="button"
                  onClick={() => setEditingProduct(p)}
                  className="btn-secondary text-sm"
                >
                  Editar
                </button>
                <button type="button" onClick={() => del(p.id)} className="btn-ghost text-sm text-red-600 dark:text-red-400">
                  Excluir
                </button>
              </div>
            </li>
            )
          })}
        </ul>
      )}
      </MotionPage>
    </>
  )
}