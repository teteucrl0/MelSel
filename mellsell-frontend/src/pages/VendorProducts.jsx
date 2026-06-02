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
      <h2 className="text-2xl font-bold text-amber-900 dark:text-slate-100 mb-4">Gerenciar Produtos (Vendedor)</h2>
      {loadingSupplier && <p className="mb-3 text-sm text-amber-700 dark:text-slate-400">Carregando fornecedor...</p>}
      <form onSubmit={submit} className="space-y-3 mb-6 border-2 border-amber-200 dark:border-slate-800 p-4 rounded-lg bg-white dark:bg-slate-950 shadow-sm">
        <input 
          className="w-full border-2 border-amber-100 dark:border-slate-700 p-2 rounded bg-amber-50/30 dark:bg-slate-800 text-amber-900 dark:text-slate-100 focus:border-amber-500 dark:focus:border-amber-500 outline-none transition-colors" 
          placeholder="Nome" 
          value={form.name} 
          onChange={e => setForm({ ...form, name: e.target.value })} 
        />
        <textarea 
          className="w-full border-2 border-amber-100 dark:border-slate-700 p-2 rounded bg-amber-50/30 dark:bg-slate-800 text-amber-900 dark:text-slate-100 focus:border-amber-500 dark:focus:border-amber-500 outline-none transition-colors" 
          placeholder="Descrição" 
          value={form.description} 
          onChange={e => setForm({ ...form, description: e.target.value })} 
        />
        <div className="grid grid-cols-2 gap-3">
          <input 
            className="border-2 border-amber-100 dark:border-slate-700 p-2 rounded bg-amber-50/30 dark:bg-slate-800 text-amber-900 dark:text-slate-100 focus:border-amber-500 dark:focus:border-amber-500 outline-none transition-colors" 
            placeholder="Preço" 
            value={form.price} 
            onChange={e => setForm({ ...form, price: e.target.value })} 
          />
          <input 
            className="border-2 border-amber-100 dark:border-slate-700 p-2 rounded bg-amber-50/30 dark:bg-slate-800 text-amber-900 dark:text-slate-100 focus:border-amber-500 dark:focus:border-amber-500 outline-none transition-colors" 
            placeholder="Estoque" 
            type="number" 
            value={form.stock} 
            onChange={e => setForm({ ...form, stock: e.target.value })} 
          />
        </div>
        <button 
          className="w-full bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-50" 
          disabled={!supplierId}
        >
          Criar Produto
        </button>
      </form>

      <ul className="space-y-3">
        {products.map(p => (
          <li key={p.id} className="border-2 border-amber-100 dark:border-slate-800 p-4 rounded-lg flex justify-between items-center bg-white dark:bg-slate-950 hover:border-amber-200 dark:hover:border-slate-700 transition-all shadow-sm">
            <div>
              <div className="font-semibold text-amber-900 dark:text-slate-100">{p.name} - R$ {p.price}</div>
              <div className="text-sm text-amber-700 dark:text-slate-400">Estoque: {p.stock}</div>
            </div>
            <div className="space-x-2">
              <button 
                onClick={() => del(p.id)} 
                className="text-red-600 dark:text-red-400 hover:underline font-medium"
              >
                Deletar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
