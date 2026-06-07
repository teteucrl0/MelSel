import { useEffect, useState } from 'react'
import api from '../services/api'
import PageHeader from '../components/PageHeader'
import PageLoadPlaceholder from '../components/PageLoadPlaceholder'
import { parseMoneyBr } from '../utils/parseMoneyBr'
import { formatApiError } from '../utils/apiValidationError'

export default function AdminProductPanel() {
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSupplier, setFilterSupplier] = useState('')
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: 0, lowStockThreshold: 1, supplierId: '' })
  const [editingId, setEditingId] = useState(null)

  const loadProducts = async (q = '', supplierId = '') => {
    try {
      const params = { page: 0, size: 50 }
      if (q) params.q = q
      if (supplierId) params.supplierId = supplierId
      const response = await api.get('/api/admin/products', { params })
      setProducts(response.data.content || response.data)
    } catch {
      setProducts([])
    }
  }

  const loadSuppliers = async () => {
    try {
      const response = await api.get('/api/suppliers', { params: { page: 0, size: 100 } })
      setSuppliers(response.data.content || response.data)
    } catch {
      setSuppliers([])
    }
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await loadSuppliers()
      await loadProducts()
      setLoading(false)
    }
    init()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    const price = parseMoneyBr(form.price)
    if (!form.price || !Number.isFinite(price) || price <= 0) {
      alert('Informe um preço válido (ex.: 120,20).')
      return
    }
    try {
      const payload = {
        ...form,
        price,
        stock: Number(form.stock),
        lowStockThreshold: Number(form.lowStockThreshold),
        supplierId: Number(form.supplierId),
      }
      if (editingId) {
        delete payload.supplierId
        await api.put(`/api/admin/products/${editingId}`, payload)
        setEditingId(null)
      } else {
        await api.post('/api/admin/products', payload)
      }
      cancel()
      await loadProducts(searchQuery, filterSupplier)
    } catch (err) {
      alert('Falha ao salvar: ' + formatApiError(err, err.message))
    }
  }

  const edit = (product) => {
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold,
      supplierId: product.supplier?.id || '',
    })
    setEditingId(product.id)
    setShowForm(true)
  }

  const del = (id) => {
    if (!confirm('Confirma exclusão?')) return
    api.delete(`/api/admin/products/${id}`).then(() => loadProducts(searchQuery, filterSupplier))
  }

  const toggleActive = async (id, currentActive) => {
    try {
      const product = products.find((p) => p.id === id)
      await api.put(`/api/admin/products/${id}`, { ...product, active: !currentActive })
      loadProducts(searchQuery, filterSupplier)
    } catch {
      alert('Falha ao alternar status.')
    }
  }

  const cancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ name: '', description: '', price: '', stock: 0, lowStockThreshold: 1, supplierId: '' })
  }

  if (loading) return <PageLoadPlaceholder />

  return (
    <div className="fade-in max-w-6xl">
      <PageHeader
        title="Produtos"
        description="Administração do catálogo global."
        action={
          !showForm && (
            <button type="button" onClick={() => setShowForm(true)} className="btn-primary">
              Novo produto
            </button>
          )
        }
      />

      <div className="surface mb-6 grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto]">
        <input
          className="input-field"
          placeholder="Buscar por nome ou descrição"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select className="input-field" value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)}>
          <option value="">Todos os fornecedores</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button type="button" onClick={() => loadProducts(searchQuery, filterSupplier)} className="btn-primary">
            Buscar
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setFilterSupplier('')
              loadProducts()
            }}
            className="btn-secondary"
          >
            Limpar
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={submit} className="surface mb-6 space-y-4 p-6">
          <h2 className="section-title">{editingId ? 'Editar produto' : 'Novo produto'}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <input className="input-field" placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <select
              className="input-field"
              value={form.supplierId}
              onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
              required
              disabled={!!editingId}
            >
              <option value="">Fornecedor</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <textarea
            className="input-field resize-none"
            rows={3}
            placeholder="Descrição"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <input className="input-field" type="text" inputMode="decimal" placeholder="Preço" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^0-9.,]/g, '') })} required />
            <input className="input-field" type="text" inputMode="numeric" placeholder="Estoque" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value.replace(/\D/g, '') })} required />
            <input className="input-field" type="text" inputMode="numeric" placeholder="Alerta estoque" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value.replace(/\D/g, '') })} required />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">{editingId ? 'Salvar' : 'Criar'}</button>
            <button type="button" onClick={cancel} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      )}

      <div className="surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-muted dark:border-stone-700">
              <th className="px-4 py-3 font-medium">Produto</th>
              <th className="px-4 py-3 font-medium">Fornecedor</th>
              <th className="px-4 py-3 font-medium text-right">Preço</th>
              <th className="px-4 py-3 font-medium text-right">Estoque</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">Nenhum produto encontrado.</td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b border-stone-100 dark:border-stone-800">
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.name}</p>
                    {p.description && <p className="text-xs text-muted line-clamp-1">{p.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted">{p.supplier?.name || '—'}</td>
                  <td className="px-4 py-3 text-right">R$ {parseFloat(p.price).toFixed(2)}</td>
                  <td className={`px-4 py-3 text-right ${p.stock < p.lowStockThreshold ? 'font-bold text-red-600' : ''}`}>
                    {p.stock}
                  </td>
                  <td className="px-4 py-3">
                    <span className={p.active ? 'badge badge-success' : 'badge badge-danger'}>
                      {p.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <button type="button" onClick={() => edit(p)} className="btn-secondary px-2 py-1 text-xs">Editar</button>
                      <button type="button" onClick={() => toggleActive(p.id, p.active)} className="btn-secondary px-2 py-1 text-xs">
                        {p.active ? 'Desativar' : 'Ativar'}
                      </button>
                      <button type="button" onClick={() => del(p.id)} className="btn-ghost px-2 py-1 text-xs text-red-600">Excluir</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}