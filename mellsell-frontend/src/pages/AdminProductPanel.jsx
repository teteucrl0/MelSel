import React, { useEffect, useState } from 'react'
import api from '../services/api'

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
    } catch (err) {
      alert('Erro ao carregar produtos')
      setProducts([])
    }
  }

  const loadSuppliers = async () => {
    try {
      const response = await api.get('/api/suppliers', { params: { page: 0, size: 100 } })
      setSuppliers(response.data.content || response.data)
    } catch (err) {
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

  const handleSearch = () => {
    loadProducts(searchQuery, filterSupplier)
  }

  const handleReset = () => {
    setSearchQuery('')
    setFilterSupplier('')
    loadProducts()
  }

  const submit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        lowStockThreshold: Number(form.lowStockThreshold),
        supplierId: Number(form.supplierId)
      }

      if (editingId) {
        delete payload.supplierId
        await api.put(`/api/admin/products/${editingId}`, payload)
        alert('Produto atualizado')
        setEditingId(null)
      } else {
        await api.post('/api/admin/products', payload)
        alert('Produto criado')
      }

      setForm({ name: '', description: '', price: '', stock: 0, lowStockThreshold: 1, supplierId: '' })
      setShowForm(false)
      await loadProducts(searchQuery, filterSupplier)
    } catch (err) {
      alert('Falha ao salvar produto: ' + (err.response?.data?.message || err.message))
    }
  }

  const edit = (product) => {
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold,
      supplierId: product.supplier?.id || ''
    })
    setEditingId(product.id)
    setShowForm(true)
  }

  const del = (id) => {
    if (!confirm('Confirma exclusão?')) return
    api.delete(`/api/admin/products/${id}`).then(() => {
      alert('Deletado')
      loadProducts(searchQuery, filterSupplier)
    }).catch(() => alert('Falha ao deletar'))
  }

  const toggleActive = async (id, currentActive) => {
    try {
      const product = products.find(p => p.id === id)
      await api.put(`/api/admin/products/${id}`, {
        ...product,
        active: !currentActive
      })
      alert(currentActive ? 'Produto desativado' : 'Produto ativado')
      loadProducts(searchQuery, filterSupplier)
    } catch (err) {
      alert('Falha ao alternar status')
    }
  }

  const cancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ name: '', description: '', price: '', stock: 0, lowStockThreshold: 1, supplierId: '' })
  }

  if (loading) return <div className="max-w-6xl mx-auto p-4"><p>Carregando...</p></div>

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Painel de Gerenciamento de Produtos</h1>

      {/* Filter Bar */}
      <div className="bg-gray-100 p-4 rounded mb-6 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <input
            className="border p-2 rounded"
            placeholder="Buscar por nome ou descrição"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <select
            className="border p-2 rounded"
            value={filterSupplier}
            onChange={e => setFilterSupplier(e.target.value)}
          >
            <option value="">Todos os Fornecedores</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={handleSearch} className="bg-blue-600 text-white px-4 py-2 rounded flex-1">
              Buscar
            </button>
            <button onClick={handleReset} className="bg-gray-400 text-white px-4 py-2 rounded flex-1">
              Limpar
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="mb-6">
        {!showForm ? (
          <button onClick={() => setShowForm(true)} className="bg-green-600 text-white px-4 py-2 rounded font-bold">
            + Criar Novo Produto
          </button>
        ) : (
          <form onSubmit={submit} className="border p-4 rounded space-y-3 bg-yellow-50">
            <h3 className="font-bold text-lg">{editingId ? 'Editar' : 'Criar'} Produto</h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                className="border p-2 rounded"
                placeholder="Nome do Produto"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
              <select
                className="border p-2 rounded"
                value={form.supplierId}
                onChange={e => setForm({ ...form, supplierId: e.target.value })}
                required
                disabled={!!editingId}
              >
                <option value="">Selecione o Fornecedor</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <textarea
              className="w-full border p-2 rounded"
              placeholder="Descrição"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows="3"
            />
            <div className="grid grid-cols-4 gap-3">
              <input
                className="border p-2 rounded"
                placeholder="Preço"
                type="number"
                step="0.01"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                required
              />
              <input
                className="border p-2 rounded"
                placeholder="Estoque"
                type="number"
                value={form.stock}
                onChange={e => setForm({ ...form, stock: e.target.value })}
                required
              />
              <input
                className="border p-2 rounded"
                placeholder="Limite Baixo"
                type="number"
                value={form.lowStockThreshold}
                onChange={e => setForm({ ...form, lowStockThreshold: e.target.value })}
                required
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded font-bold flex-1">
                {editingId ? 'Atualizar' : 'Criar'}
              </button>
              <button type="button" onClick={cancel} className="bg-gray-400 text-white px-4 py-2 rounded flex-1">
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Products Table */}
      <div>
        <h2 className="text-2xl font-bold mb-3">Produtos ({products.length})</h2>
        {products.length === 0 ? (
          <p className="text-gray-500">Nenhum produto encontrado</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2 text-left">Nome</th>
                  <th className="border p-2 text-left">Fornecedor</th>
                  <th className="border p-2 text-right">Preço</th>
                  <th className="border p-2 text-right">Estoque</th>
                  <th className="border p-2">Status</th>
                  <th className="border p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="border p-2">
                      <div className="font-semibold">{p.name}</div>
                      {p.description && <div className="text-sm text-gray-600">{p.description.substring(0, 50)}...</div>}
                    </td>
                    <td className="border p-2">{p.supplier?.name || 'N/A'}</td>
                    <td className="border p-2 text-right">R$ {parseFloat(p.price).toFixed(2)}</td>
                    <td className="border p-2 text-right">
                      <span className={p.stock < p.lowStockThreshold ? 'text-red-600 font-bold' : ''}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="border p-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${p.active ? 'bg-green-200' : 'bg-red-200'}`}>
                        {p.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="border p-2">
                      <div className="flex gap-1 flex-wrap">
                        <button onClick={() => edit(p)} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">
                          Editar
                        </button>
                        <button 
                          onClick={() => toggleActive(p.id, p.active)} 
                          className={`text-white px-2 py-1 rounded text-xs ${p.active ? 'bg-orange-500' : 'bg-green-600'}`}
                        >
                          {p.active ? 'Desativar' : 'Ativar'}
                        </button>
                        <button onClick={() => del(p.id)} className="bg-red-600 text-white px-2 py-1 rounded text-xs">
                          Deletar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
