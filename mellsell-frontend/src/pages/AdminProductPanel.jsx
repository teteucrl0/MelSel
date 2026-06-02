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

  if (loading) return <div className="max-w-6xl mx-auto p-4"><p className="text-slate-900 dark:text-slate-300">Carregando...</p></div>

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-slate-900 dark:text-slate-100">Painel de Gerenciamento de Produtos</h1>

      {/* Filter Bar */}
      <div className="bg-gray-100 p-4 rounded mb-6 space-y-3 dark:bg-slate-900">
        <div className="grid grid-cols-3 gap-3">
          <input
            className="border p-2 rounded dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
            placeholder="Buscar por nome ou descrição"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <select
            className="border p-2 rounded dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
            <button onClick={handleReset} className="bg-gray-400 text-white px-4 py-2 rounded flex-1 dark:bg-slate-600">
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
          <form onSubmit={submit} className="border p-4 rounded space-y-3 bg-yellow-50 dark:bg-slate-900 dark:border-slate-800">
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{editingId ? 'Editar' : 'Criar'} Produto</h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                className="border p-2 rounded dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                placeholder="Nome do Produto"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
              <select
                className="border p-2 rounded dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
              className="w-full border p-2 rounded dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="Descrição"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows="3"
            />
            <div className="grid grid-cols-4 gap-3">
              <input
                className="border p-2 rounded dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                placeholder="Preço"
                type="number"
                step="0.01"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                required
              />
              <input
                className="border p-2 rounded dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                placeholder="Estoque"
                type="number"
                value={form.stock}
                onChange={e => setForm({ ...form, stock: e.target.value })}
                required
              />
              <input
                className="border p-2 rounded dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
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
              <button type="button" onClick={cancel} className="bg-gray-400 text-white px-4 py-2 rounded flex-1 dark:bg-slate-600">
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Products Table */}
      <div>
        <h2 className="text-2xl font-bold mb-3 text-slate-900 dark:text-slate-100">Produtos ({products.length})</h2>
        {products.length === 0 ? (
          <p className="text-gray-500 dark:text-slate-500">Nenhum produto encontrado</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  <th className="border p-2 text-left dark:border-slate-700">Nome</th>
                  <th className="border p-2 text-left dark:border-slate-700">Fornecedor</th>
                  <th className="border p-2 text-right dark:border-slate-700">Preço</th>
                  <th className="border p-2 text-right dark:border-slate-700">Estoque</th>
                  <th className="border p-2 dark:border-slate-700">Status</th>
                  <th className="border p-2 dark:border-slate-700">Ações</th>
                </tr>
              </thead>
              <tbody className="text-slate-800 dark:text-slate-300">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                    <td className="border p-2 dark:border-slate-700">
                      <div className="font-semibold">{p.name}</div>
                      {p.description && <div className="text-sm text-gray-600 dark:text-slate-400">{p.description.substring(0, 50)}...</div>}
                    </td>
                    <td className="border p-2 dark:border-slate-700">{p.supplier?.name || 'N/A'}</td>
                    <td className="border p-2 text-right dark:border-slate-700">R$ {parseFloat(p.price).toFixed(2)}</td>
                    <td className="border p-2 text-right dark:border-slate-700">
                      <span className={p.stock < p.lowStockThreshold ? 'text-red-600 font-bold dark:text-red-400' : ''}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="border p-2 text-center dark:border-slate-700">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${p.active ? 'bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                        {p.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="border p-2 dark:border-slate-700">
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
