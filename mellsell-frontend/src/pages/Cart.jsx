import { useEffect, useState } from 'react'
import cartService from '../services/cartService'
import { Link, useNavigate } from 'react-router-dom'

const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

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
      await cartService.updateQuantity(id, quantity)
      await loadCart()
    } catch (err) {
      alert('Erro ao atualizar quantidade')
    }
  }

  const totalPrice = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)

  if (loading) return <div className="py-8 text-center text-amber-700">Carregando carrinho...</div>

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-serif text-2xl font-bold text-amber-900">Carrinho de Compras</h1>
      
      {items.length === 0 ? (
        <div className="mt-6 rounded-lg border-2 border-amber-200 bg-amber-50 p-8 text-center">
          <div className="text-3xl">🍯</div>
          <div className="mt-2 font-serif text-xl font-semibold text-amber-900">Carrinho vazio</div>
          <p className="mt-2 text-sm text-amber-700">Você ainda não adicionou nenhum produto</p>
          <Link to="/" className="mt-4 inline-block rounded-md bg-amber-500 px-6 py-2 font-semibold text-white hover:bg-amber-600">
            Continuar comprando
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="space-y-3 md:col-span-2">
            {items.map(item => (
              <div key={item.id} className="flex gap-4 rounded-lg border-2 border-amber-200 bg-white p-4">
                <div className="flex-1">
                  <h3 className="font-serif text-lg font-bold text-amber-900">{item.productName}</h3>
                  <div className="mt-2 text-sm text-amber-700">
                    <div>Preço unitário: <span className="font-semibold text-amber-600">{money.format(item.unitPrice)}</span></div>
                    <div className="mt-2 flex items-center gap-2">
                      <span>Quantidade:</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="rounded-md border-2 border-amber-300 bg-white px-2 py-1 font-bold text-amber-700 hover:bg-amber-50"
                      >
                        −
                      </button>
                      <span className="rounded-md border-2 border-amber-200 bg-amber-50 px-3 py-1 font-semibold text-amber-900">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="rounded-md border-2 border-amber-300 bg-white px-2 py-1 font-bold text-amber-700 hover:bg-amber-50"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-amber-600">
                    {money.format(item.unitPrice * item.quantity)}
                  </div>
                  <button 
                    onClick={() => remove(item.id)}
                    className="mt-2 text-sm font-semibold text-red-600 hover:text-red-700"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border-2 border-amber-200 bg-white p-6">
            <h2 className="font-serif text-lg font-bold text-amber-900">Resumo</h2>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-amber-700">
                <span>Subtotal:</span>
                <span>{money.format(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-amber-700">
                <span>Frete:</span>
                <span className="text-green-600">Grátis</span>
              </div>
              <div className="border-t-2 border-amber-100 pt-2 text-lg font-bold text-amber-900">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span>{money.format(totalPrice)}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => navigate('/checkout')}
              className="mt-4 w-full rounded-md bg-amber-500 px-4 py-3 font-semibold text-white transition hover:bg-amber-600"
            >
              Finalizar Compra
            </button>
            <Link 
              to="/"
              className="mt-3 block text-center font-semibold text-amber-600 hover:text-amber-700"
            >
              Continuar comprando
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
