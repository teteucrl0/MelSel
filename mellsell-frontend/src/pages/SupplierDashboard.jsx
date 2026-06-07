import { useEffect, useState, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import api from '../services/api'
import productService from '../services/productService'
import useStockSync from '../hooks/useStockSync'
import PageHeader from '../components/PageHeader'
import { VENDOR_NOTIFICATION_EVENT } from '../utils/vendorNotificationEvent'
import QuantityInput from '../components/QuantityInput'
import ProductImageUpload from '../components/ProductImageUpload'
import ProductImage from '../components/ProductImage'
import ProductEditModal from '../components/ProductEditModal'
import ProductRestockButton from '../components/ProductRestockButton'
import { MotionPage, MotionAlert, AnimatedNumber, StaggerContainer, StaggerItem } from '../components/motion/Motion'
import { parseMoneyBr } from '../utils/parseMoneyBr'
import { formatApiError } from '../utils/apiValidationError'
import { validateProductForm } from '../utils/inputSanitizer'
import StockStatusDot from '../components/StockStatusDot'
import StockStatusLegend from '../components/StockStatusLegend'
import { getStockStatus } from '../utils/stockStatus'
import PageLoadPlaceholder from '../components/PageLoadPlaceholder'
import { normalizeProductList } from '../utils/normalizeProductList'
import VendorPendingBanner from '../components/VendorPendingBanner'

const EMPTY_SALES = {
  totalRevenue: 0,
  totalOrders: 0,
  productCount: 0,
  revenueLast7Days: 0,
  salesLast7Days: [],
  recentOrders: [],
}

function formatMoneyBr(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0,00'
  return n.toFixed(2).replace('.', ',')
}

function formatShortDate(isoDate) {
  if (!isoDate) return ''
  const raw = String(isoDate).split('T')[0]
  const [y, m, d] = raw.split('-')
  if (y && m && d) return `${d.padStart(2, '0')}/${m.padStart(2, '0')}`
  const parsed = new Date(isoDate)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function formatOrderWhen(isoDate) {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  if (sameDay) return 'hoje'
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  if (isYesterday) return 'ontem'
  return formatShortDate(isoDate)
}

function formatRecentOrderLine(order) {
  const label = order.statusLabel || order.status || 'Confirmado'
  return `Pedido #${order.id} · R$ ${formatMoneyBr(order.total)} · ${label}`
}

export default function SupplierDashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const [showWelcome, setShowWelcome] = useState(Boolean(location.state?.welcome))
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: 0, lowStockThreshold: 5, imageUrl: '' })
  const [supplierId, setSupplierId] = useState(null)
  const [supplierPending, setSupplierPending] = useState(false)
  const [sales, setSales] = useState(EMPTY_SALES)
  const [editingProduct, setEditingProduct] = useState(null)
  const [notice, setNotice] = useState(null)
  const [activity, setActivity] = useState([])
  const [saving, setSaving] = useState(false)

  const pushActivity = (msg) => {
    setActivity((prev) => [{ id: Date.now(), msg }, ...prev].slice(0, 8))
  }

  const loadStats = useCallback(async () => {
    try {
      const { data } = await api.get('/api/vendor/dashboard/stats')
      setSales({
        ...EMPTY_SALES,
        ...data,
        salesLast7Days: Array.isArray(data?.salesLast7Days) ? data.salesLast7Days : [],
        recentOrders: Array.isArray(data?.recentOrders) ? data.recentOrders : [],
      })
    } catch {
      setSales(EMPTY_SALES)
    }
  }, [])

  const loadProducts = async () => {
    try {
      const data = await productService.listMy(0, 50)
      setProducts(normalizeProductList(data))
    } catch (err) {
      setProducts([])
      const status = err?.response?.status
      if (status === 403) {
        setNotice({
          type: 'error',
          text: 'Sem permissão de apicultor para listar produtos. Entre com conta vendedor ou cadastre-se em Criar conta.',
        })
      }
    }
  }

  const handleStockUpdate = useCallback((update) => {
    setProducts((prev) =>
      prev
        .filter(Boolean)
        .map((p) => (Number(p.id) === Number(update.productId) ? { ...p, stock: update.stock } : p)),
    )
  }, [])
  useStockSync(handleStockUpdate)

  const handleVendorNotification = useCallback(
    (payload) => {
      pushActivity(payload.message)
      loadProducts()
      if (payload.type === 'ORDER_CONFIRMED') {
        loadStats()
      }
    },
    [loadStats],
  )

  useEffect(() => {
    const onNotify = (e) => handleVendorNotification(e.detail)
    window.addEventListener(VENDOR_NOTIFICATION_EVENT, onNotify)
    return () => window.removeEventListener(VENDOR_NOTIFICATION_EVENT, onNotify)
  }, [handleVendorNotification])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        const response = await api.get('/api/suppliers/me')
        setSupplierId(response.data.id)
        setSupplierPending(
          response.data.pendingApproval === true || response.data.active === false,
        )
        await Promise.all([loadProducts(), loadStats()])
      } catch (err) {
        const status = err?.response?.status
        const msg = err?.response?.data?.message
        if (status === 401) {
          setNotice({ type: 'error', text: 'Sessão expirada. Faça login novamente.' })
        } else if (status === 403) {
          setNotice({
            type: 'error',
            text: 'Sua sessão não tem permissão de apicultor. Clique em Sair, entre de novo ou cadastre-se em Criar conta → Vendedor (apicultor).',
          })
        } else if (status === 404) {
          setNotice({
            type: 'error',
            text: 'Loja não encontrada. Cadastre-se como apicultor em /register (aba Apicultor).',
          })
        } else if (!err?.response) {
          setNotice({
            type: 'error',
            text: 'Não foi possível conectar ao servidor. Confira se o backend está rodando (./run-presentation.sh).',
          })
        } else {
          setNotice({ type: 'error', text: msg || 'Erro ao carregar painel do fornecedor.' })
        }
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [loadStats])

  useEffect(() => {
    if (!notice) return undefined
    const t = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(t)
  }, [notice])

  useEffect(() => {
    if (location.state?.pendingApproval) {
      setSupplierPending(true)
      if (location.state?.message) {
        setNotice({ type: 'success', text: location.state.message })
      }
    }
    if (!location.state?.welcome) return
    setShowWelcome(true)
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.state?.welcome, location.state?.pendingApproval, location.state?.message, location.pathname, navigate])

  useEffect(() => {
    if (!showWelcome) return undefined
    const t = setTimeout(() => setShowWelcome(false), 12000)
    return () => clearTimeout(t)
  }, [showWelcome])

  const submit = async (e) => {
    e.preventDefault()
    if (supplierPending) {
      setNotice({
        type: 'error',
        text: 'Aguardando aprovação da equipe MelSell para cadastrar produtos.',
      })
      return
    }
    const price = parseMoneyBr(form.price)
    const productErr = validateProductForm(form)
    if (productErr) {
      setNotice({ type: 'error', text: productErr })
      return
    }
    if (!form.price || !Number.isFinite(price) || price <= 0) {
      setNotice({ type: 'error', text: 'Informe um preço válido (ex.: 120,20).' })
      return
    }
    const payload = {
      ...form,
      name: form.name.trim(),
      price,
      stock: Number(form.stock),
      lowStockThreshold: Number(form.lowStockThreshold),
      supplierId,
    }
    setSaving(true)
    try {
      await productService.create(payload)
      setNotice({ type: 'success', text: 'Produto adicionado ao estoque.' })
      cancelNewForm()
      await loadProducts()
      await loadStats()
    } catch (err) {
      setNotice({ type: 'error', text: formatApiError(err, 'Falha ao salvar produto.') })
    } finally {
      setSaving(false)
    }
  }

  const openEditModal = (product) => setEditingProduct(product)

  const closeEditModal = () => setEditingProduct(null)

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
    loadStats()
  }

  const onEditSaved = async () => {
    await loadProducts()
    await loadStats()
    setNotice({ type: 'success', text: 'Produto atualizado.' })
  }

  const del = (id) => {
    if (!confirm('Confirma exclusão?')) return
    productService
      .remove(id)
      .then(async () => {
        await loadProducts()
        await loadStats()
        setNotice({ type: 'success', text: 'Produto removido.' })
      })
      .catch(() => setNotice({ type: 'error', text: 'Falha ao excluir.' }))
  }

  const cancelNewForm = () => {
    setShowForm(false)
    setForm({ name: '', description: '', price: '', stock: 0, lowStockThreshold: 5, imageUrl: '' })
  }

  if (loading) return <PageLoadPlaceholder />

  const chartDays = sales.salesLast7Days ?? []
  const chartMax = Math.max(1, ...chartDays.map((d) => Number(d.revenue) || 0))
  const chartHasData = chartDays.some((d) => Number(d.revenue) > 0)
  const recentOrders = sales.recentOrders ?? []
  const weekRevenue = Number(sales.revenueLast7Days ?? 0)

  return (
    <>
      <ProductEditModal
        product={editingProduct}
        open={Boolean(editingProduct)}
        onClose={closeEditModal}
        onSaved={onEditSaved}
      />

      <MotionPage className="max-w-5xl">
      {supplierPending && <VendorPendingBanner />}

      {showWelcome && !supplierPending && (
        <div className="shop-vendor-welcome mb-6" role="status">
          <strong>Bem-vindo ao MelSell!</strong> Sua loja de apicultor está pronta. Cadastre seu primeiro mel em
          &quot;Novo produto&quot; ou em{' '}
          <Link to="/vendor/products" className="font-semibold underline">
            Estoque
          </Link>
          .
        </div>
      )}

      <PageHeader
        title="Painel do fornecedor"
        description="Vendas e estoque atualizam em tempo real quando clientes compram."
        action={
          !showForm &&
          !supplierPending && (
            <button type="button" onClick={() => setShowForm(true)} className="btn-primary">
              Novo produto
            </button>
          )
        }
      />

      <AnimatePresence>
        {notice && (
          <MotionAlert className={`alert mb-6 ${notice.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {notice.text}
          </MotionAlert>
        )}
      </AnimatePresence>

      {/* Visão geral - matching the reference luxury vendor dashboard */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight mb-4">Visão geral</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="surface-elevated p-5">
            <div className="text-xs text-[#a69b8c] tracking-widest">VENDAS</div>
            <div className="mt-2 text-3xl font-semibold tabular-nums text-[#e8d5a3]">
              R$ <AnimatedNumber value={Number(sales.totalRevenue || 0)} />
            </div>
            <div className="text-xs text-[#a69b8c] mt-1">
              {Number(sales.totalRevenue) > 0 ? 'confirmados' : 'sem vendas ainda'}
            </div>
          </div>
          <div className="surface-elevated p-5">
            <div className="text-xs text-[#a69b8c] tracking-widest">PEDIDOS</div>
            <div className="mt-2 text-3xl font-semibold tabular-nums">
              <AnimatedNumber value={sales.totalOrders ?? 0} />
            </div>
            <div className="text-xs text-[#a69b8c] mt-1">
              {sales.totalOrders > 0 ? 'confirmados' : 'nenhum pedido'}
            </div>
          </div>
          <div className="surface-elevated p-5">
            <div className="text-xs text-[#a69b8c] tracking-widest">PRODUTOS</div>
            <div className="mt-2 text-3xl font-semibold tabular-nums">
              <AnimatedNumber value={sales.productCount ?? products.length} />
            </div>
            <div className="text-xs text-[#a69b8c] mt-1">ativos</div>
          </div>
          <div className="surface-elevated p-5">
            <div className="text-xs text-[#a69b8c] tracking-widest">7 DIAS</div>
            <div className="mt-2 text-3xl font-semibold tabular-nums text-[#e8d5a3]">
              R$ <AnimatedNumber value={weekRevenue} />
            </div>
            <div className="text-xs text-[#a69b8c] mt-1">
              {chartHasData ? 'última semana' : 'sem movimento'}
            </div>
          </div>
        </div>
      </div>

      {/* Vendas chart + Pedidos recentes - reference style */}
      <div className="grid lg:grid-cols-5 gap-6 mb-8">
        {/* Chart */}
        <div className="lg:col-span-3 surface-elevated p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="font-semibold">Vendas nos últimos 7 dias</div>
              <div className="text-xs text-[#a69b8c]">Atualizado em tempo real</div>
            </div>
            <div className="text-xs text-[#c5a16e]">R$ {weekRevenue.toFixed(2).replace('.', ',')}</div>
          </div>

          {chartHasData ? (
            <>
              <div className="flex items-end justify-between h-40 gap-2 mt-6 px-2">
                {chartDays.map((day, i) => {
                  const val = Number(day.revenue) || 0
                  const height = Math.max(val > 0 ? 12 : 4, (val / chartMax) * 140)
                  return (
                    <motion.div
                      key={day.date || i}
                      initial={{ height: 0 }}
                      animate={{ height }}
                      transition={{ delay: i * 0.05, type: 'spring', stiffness: 120 }}
                      className={`flex-1 rounded-t ${val > 0 ? 'bg-gradient-to-t from-[#c5a16e] to-[#e8d5a3]' : 'bg-[#2a2724]'}`}
                      title={`${formatShortDate(day.date)}: R$ ${formatMoneyBr(val)}`}
                    />
                  )
                })}
              </div>
              <div className="flex justify-between text-[10px] text-[#a69b8c] mt-2 px-1">
                {chartDays.map((day, i) => (
                  <div key={day.date || i}>{formatShortDate(day.date)}</div>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-10 text-center text-sm text-[#a69b8c]">
              Nenhuma venda nos últimos 7 dias. Quando alguém comprar, o gráfico aparece aqui.
            </p>
          )}
        </div>

        {/* Pedidos recentes */}
        <div className="lg:col-span-2 surface-elevated p-6">
          <div className="flex justify-between mb-4">
            <div className="font-semibold">Pedidos recentes</div>
            <Link to="/vendor/products" className="text-xs text-[#c5a16e]">Ver todos →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-[#a69b8c]">
              Nenhum pedido ainda. Assim que um cliente finalizar a compra, ele aparece aqui.
            </p>
          ) : (
            <div className="space-y-3 text-sm">
              {recentOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex justify-between items-center py-2 border-b border-[#2a2724] last:border-0"
                >
                  <div className="text-[#f5f2eb]">{formatRecentOrderLine(order)}</div>
                  <div className="text-xs text-[#a69b8c] shrink-0 ml-2">{formatOrderWhen(order.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <section className="surface p-5">
          <h2 className="section-title text-base">Atividade recente</h2>
          {activity.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Reservas no carrinho e vendas aparecem aqui ao vivo.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {activity.map((a) => (
                <li key={a.id} className="rounded-lg border border-stone-200 px-3 py-2 text-sm text-muted dark:border-stone-700">
                  {a.msg}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface flex items-center gap-3 p-5">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </span>
          <p className="text-sm text-muted">
            Conectado em tempo real — estoque e vendas sincronizam automaticamente.
          </p>
        </section>
      </div>

      {showForm && !supplierPending && (
        <form onSubmit={submit} className="surface mb-8 space-y-4 p-6">
          <h2 className="section-title">Novo produto</h2>
          <input className="input-field" placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <ProductImageUpload
            imageUrl={form.imageUrl}
            onImageUrlChange={(imageUrl) => setForm({ ...form, imageUrl })}
            disabled={saving}
          />
          <p className="text-xs text-muted -mt-2">
            Foto, nome e descrição devem mostrar o mesmo produto (peso, tipo de mel, sua marca).
          </p>
          <textarea
            className="input-field resize-none"
            rows={3}
            placeholder="Ex: Mel silvestre, pote 500g, apiário próprio..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Preço (R$)</label>
              <input
                className="input-field"
                type="text"
                inputMode="decimal"
                placeholder="Preço"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^0-9.,]/g, '') })}
                required
              />
            </div>
            <QuantityInput label="Estoque" value={form.stock} onChange={(stock) => setForm({ ...form, stock })} min={0} disabled={saving} />
            <QuantityInput
              label="Alerta estoque baixo"
              value={form.lowStockThreshold}
              onChange={(lowStockThreshold) => setForm({ ...form, lowStockThreshold })}
              min={1}
              max={999}
              disabled={saving}
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : 'Criar'}
            </button>
            <button type="button" onClick={cancelNewForm} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <h2 className="section-title mb-2">Produtos ({products.length})</h2>
      {products.length > 0 && <StockStatusLegend className="mb-4" />}
      {products.length === 0 ? (
        <div className="surface px-6 py-12 text-center">
          <p className="font-medium">Catálogo vazio</p>
          <p className="mt-2 text-sm text-muted">Cadastre produtos para começar a vender.</p>
        </div>
      ) : (
        <StaggerContainer className="space-y-3" staggerChildren={0.04}>
          {products.filter(Boolean).map((p, index) => {
            const stockState = getStockStatus(p.stock, p.lowStockThreshold)
            const rowAccent =
              stockState === 'out' ? 'vendor-product-row--out' : stockState === 'low' ? 'vendor-product-row--low' : ''
            return (
            <StaggerItem key={p.id}>
            <div className={`surface flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between ${rowAccent}`}>
              <div className="flex gap-4">
                <StockStatusDot
                  stock={p.stock}
                  lowStockThreshold={p.lowStockThreshold}
                  showLabel
                  className="shrink-0 self-start pt-1"
                />
                <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg">
                  <ProductImage imageUrl={p.imageUrl} alt={p.name} className="product-media product-media--thumb h-full" />
                </div>
                <div>
                <h3 className="font-semibold">{p.name}</h3>
                {p.description && <p className="mt-1 text-sm text-muted">{p.description}</p>}
                <p className="mt-2 text-sm text-muted">
                  R$ {Number(p.price).toFixed(2)} · <span className="tabular-nums font-medium text-stone-800 dark:text-stone-200">{p.stock} un.</span> · {p.active ? 'Ativo' : 'Inativo'}
                </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <ProductRestockButton
                  product={p}
                  onRestocked={handleProductRestocked}
                  onError={(text) => setNotice({ type: 'error', text })}
                />
                <button type="button" onClick={() => openEditModal(p)} className="btn-secondary text-sm">
                  Editar no estoque
                </button>
                <button type="button" onClick={() => del(p.id)} className="btn-ghost text-sm text-red-600 dark:text-red-400">
                  Excluir
                </button>
              </div>
            </div>
            </StaggerItem>
            )
          })}
        </StaggerContainer>
      )}
      </MotionPage>
    </>
  )
}