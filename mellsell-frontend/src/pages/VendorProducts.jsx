import React, { useEffect, useState } from 'react'
import productService from '../services/productService'
import supplierService from '../services/supplierService'

export default function VendorProducts() {
  const [products, setProducts] = useState([])
  const [supplierId, setSupplierId] = useState(null)
  const [loadingSupplier, setLoadingSupplier] = useState(true)
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: 0, lowStockThreshold: 1, active: true })

  const load = (currentSupplierId) => productService.list(null, currentSupplierId, 0, 50).then(r => setProducts(r.content || r)).catch(() => setProducts([]))

  useEffect(() => {
    supplierService.getMySupplier()
      .then((supplier) => {
        setSupplierId(supplier.id)
        return load(supplier.id)
      })
      .catch(() => setProducts([]))
      .finally(() => setLoadingSupplier(false))
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
      await productService.create(payload)
      alert('Produto criado')
      setForm({ name: '', description: '', price: '', stock: 0, lowStockThreshold: 1, active: true })
      load(supplierId)
    } catch (err) { alert('Falha ao criar produto') }
  }

  const del = (id) => {
    if (!confirm('Confirma exclusão?')) return
    productService.remove(id).then(() => { alert('Deletado'); load() }).catch(() => alert('Falha'))
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Gerenciar Produtos (Vendedor)</h2>
      {loadingSupplier && <p className="mb-3 text-sm text-gray-500">Carregando fornecedor...</p>}
      <form onSubmit={submit} className="space-y-2 mb-4 border p-3 rounded">
        <input className="w-full border p-2" placeholder="Nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <textarea className="w-full border p-2" placeholder="Descrição" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        <input className="w-full border p-2" placeholder="Preço" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
        <input className="w-full border p-2" placeholder="Estoque" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
        <button className="bg-yellow-500 text-white px-3 py-1 rounded" disabled={!supplierId}>Criar</button>
      </form>

      <ul className="space-y-2">
        {products.map(p => (
          <li key={p.id} className="border p-3 rounded flex justify-between items-center">
            <div>
              <div className="font-semibold">{p.name} - R$ {p.price}</div>
              <div className="text-sm text-gray-500">Estoque: {p.stock}</div>
            </div>
            <div className="space-x-2">
              <button onClick={() => del(p.id)} className="text-red-600">Deletar</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
