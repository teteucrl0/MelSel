import React, { useEffect, useState } from 'react'
import cartService from '../services/cartService'
import { Link, useNavigate } from 'react-router-dom'

export default function Cart() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const loadCart = async () => {
    try {
      setLoading(true)
      const data = await cartService.listCart()
      setItems(data || [])
    } catch (err) {
      console.error('Erro ao carregar carrinho:', err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCart()
  }, [])

  const remove = async (id) => {
    try {
      await cartService.removeItem(id)
      await loadCart()
    } catch (err) {
      alert('Erro ao remover item')
    }
  }

  const updateQuantity = async (id, quantity) => {
    if (quantity < 1) {
      remove(id)
      return
    }
    try {
      // Update quantity via cartService if available
      await loadCart()
    } catch (err) {
      alert('Erro ao atualizar quantidade')
    }
  }

  const totalPrice = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)

  if (loading) return <div className="text-center py-8">Carregando carrinho...</div>

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-slate-100">Carrinho de Compras</h1>
      
      {items.length === 0 ? (
        <div className="text-center py-12 bg-slate-800 rounded-lg">
          <div className="text-2xl font-semibold text-slate-300 mb-4">🛒 Carrinho vazio</div>
          <p className="text-slate-400 mb-6">Você ainda não adicionou nenhum produto</p>
          <Link to="/" className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded font-bold">
            Continuar comprando
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-3">
            {items.map(item => (
              <div key={item.id} className="bg-slate-800 p-4 rounded-lg flex gap-4 items-start">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-100">{item.productName}</h3>
                  <div className="text-sm text-slate-400 mt-2">
                    <div>Preço unitário: <span className="text-yellow-400">R$ {item.unitPrice.toFixed(2)}</span></div>
                    <div>Quantidade: 
                      <div className="flex gap-2 mt-1">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded"
                        >
                          −
                        </button>
                        <span className="text-white px-3 py-1 bg-slate-700 rounded">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-yellow-400">
                    R$ {(item.unitPrice * item.quantity).toFixed(2)}
                  </div>
                  <button 
                    onClick={() => remove(item.id)}
                    className="text-red-400 hover:text-red-300 text-sm mt-2 font-semibold"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-800 p-6 rounded-lg h-fit">
            <h2 className="text-xl font-bold text-slate-100 mb-4">Resumo</h2>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal:</span>
                <span>R$ {totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Frete:</span>
                <span className="text-green-400">Grátis</span>
              </div>
              <div className="border-t border-slate-600 pt-2 flex justify-between text-lg font-bold text-yellow-400">
                <span>Total:</span>
                <span>R$ {totalPrice.toFixed(2)}</span>
              </div>
            </div>
            <button 
              onClick={() => navigate('/checkout')}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-4 py-3 rounded transition"
            >
              Finalizar Compra
            </button>
            <Link 
              to="/"
              className="block text-center mt-3 text-yellow-400 hover:text-yellow-300 font-semibold"
            >
              Continuar comprando
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
