import React, { useEffect, useState } from 'react'
import api from '../services/api'
import productService from '../services/productService'

export default function SupplierDashboard() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: 0, lowStockThreshold: 1 })
  const [supplierId, setSupplierId] = useState(null)
  const [sales, setSales] = useState({ totalRevenue: 0, totalOrders: 0 })
  const [editingId, setEditingId] = useState(null)

  const loadSupplier = async () => {
    try {
      const response = await api.get('/api/suppliers/me')
      setSupplierId(response.data.id)
      return response.data.id
    } catch (err) {
      alert('Erro ao carregar fornecedor')
      return null
    }
  }

  const loadProducts = async (id) => {
    try {
      const response = await api.get('/api/admin/products/my', { params: { page: 0, size: 50 } })
      setProducts(response.data.content || response.data)
    } catch (err) {
      alert('Erro ao carregar produtos')
      setProducts([])
    }
  }

  const loadSalesStats = async () => {
    try {
      // Endpoint temporário - em produção seria implementado um endpoint específico
      setSales({ totalRevenue: 0, totalOrders: 0 })
    } catch (err) {
      setSales({ totalRevenue: 0, totalOrders: 0 })
    }
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const id = await loadSupplier()
      if (id) {
        await loadProducts(id)
        await loadSalesStats()
      }
      setLoading(false)
    }
    init()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        lowStockThreshold: Number(form.lowStockThreshold),
        supplierId
      }
      
      if (editingId) {
        await api.put(`/api/admin/products/${editingId}`, payload)
        alert('Produto atualizado')
        setEditingId(null)
      } else {
        await productService.create(payload)
        alert('Produto criado')
      }
      
      setForm({ name: '', description: '', price: '', stock: 0, lowStockThreshold: 1 })
      setShowForm(false)
      await loadProducts(supplierId)
    } catch (err) {
      alert('Falha ao salvar produto')
    }
  }

  const edit = (product) => {
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold
    })
    setEditingId(product.id)
    setShowForm(true)
  }

  const del = (id) => {
    if (!confirm('Confirma exclusão?')) return
    productService.remove(id).then(() => {
      alert('Deletado')
      loadProducts(supplierId)
    }).catch(() => alert('Falha ao deletar'))
  }

  const cancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ name: '', description: '', price: '', stock: 0, lowStockThreshold: 1 })
  }

  if (loading) return <div className="max-w-5xl mx-auto p-4"><p>Carregando...</p></div>

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard do Fornecedor</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded border border-blue-200">
          <div className="text-sm text-gray-600">Receita Total</div>
          <div className="text-2xl font-bold">R$ {parseFloat(sales.totalRevenue).toFixed(2)}</div>
        </div>
        <div className="bg-green-50 p-4 rounded border border-green-200">
          <div className="text-sm text-gray-600">Pedidos</div>
          <div className="text-2xl font-bold">{sales.totalOrders}</div>
        </div>
      </div>

      {/* Form */}
      <div className="mb-6">
        {!showForm ? (
          <button onClick={() => setShowForm(true)} className="bg-yellow-500 text-white px-4 py-2 rounded">
            + Novo Produto
          </button>
        ) : (
          <form onSubmit={submit} className="border p-4 rounded space-y-3">
            <input
              className="w-full border p-2 rounded"
              placeholder="Nome do Produto"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
            <textarea
              className="w-full border p-2 rounded"
              placeholder="Descrição"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows="3"
            />
            <input
              className="w-full border p-2 rounded"
              placeholder="Preço"
              type="number"
              step="0.01"
              value={form.price}
              onChange={e => setForm({ ...form, price: e.target.value })}
              required
            />
            <input
              className="w-full border p-2 rounded"
              placeholder="Estoque"
              type="number"
              value={form.stock}
              onChange={e => setForm({ ...form, stock: e.target.value })}
              required
            />
            <input
              className="w-full border p-2 rounded"
              placeholder="Limite de Estoque Baixo"
              type="number"
              value={form.lowStockThreshold}
              onChange={e => setForm({ ...form, lowStockThreshold: e.target.value })}
              required
            />
            <div className="flex gap-2">
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
                {editingId ? 'Atualizar' : 'Criar'}
              </button>
              <button type="button" onClick={cancel} className="bg-gray-400 text-white px-4 py-2 rounded">
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Products List */}
      <div>
        <h2 className="text-2xl font-bold mb-3">Meus Produtos ({products.length})</h2>
        {products.length === 0 ? (
          <p className="text-gray-500">Nenhum produto cadastrado</p>
        ) : (
          <div className="space-y-3">
            {products.map(p => (
              <div key={p.id} className="border p-4 rounded flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{p.name}</h3>
                  {p.description && <p className="text-sm text-gray-600 mb-2">{p.description}</p>}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><span className="font-semibold">Preço:</span> R$ {parseFloat(p.price).toFixed(2)}</div>
                    <div><span className="font-semibold">Estoque:</span> {p.stock}</div>
                    <div><span className="font-semibold">Status:</span> {p.active ? '✓ Ativo' : '✗ Inativo'}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => edit(p)} className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
                    Editar
                  </button>
                  <button onClick={() => del(p.id)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">
                    Deletar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
