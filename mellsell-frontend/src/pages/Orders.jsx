import React, { useEffect, useState } from 'react'
import orderService from '../services/orderService'
import { Link } from 'react-router-dom'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const data = await orderService.listOrders().catch(() => [])
      setOrders(data || [])
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center py-8 text-slate-300">Carregando pedidos...</div>

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-slate-100">Meus Pedidos</h1>
      
      {orders.length === 0 ? (
        <div className="text-center py-12 bg-slate-800 rounded-lg">
          <div className="text-2xl font-semibold text-slate-300 mb-4">📦 Nenhum pedido</div>
          <p className="text-slate-400 mb-6">Você ainda não fez nenhuma compra</p>
          <Link to="/" className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded font-bold">
            Começar compras
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-slate-800 p-6 rounded-lg">
              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-sm text-slate-400">Pedido #</div>
                  <div className="font-bold text-lg text-slate-100">{order.id}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Data</div>
                  <div className="font-semibold text-slate-100">
                    {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Total</div>
                  <div className="font-bold text-yellow-400">R$ {parseFloat(order.total).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Status</div>
                  <div className={`font-semibold px-3 py-1 rounded text-white inline-block text-sm ${
                    order.status === 'completed' || order.status === 'COMPLETED' ? 'bg-green-600' :
                    order.status === 'pending' || order.status === 'PENDING' ? 'bg-yellow-600' :
                    'bg-blue-600'
                  }`}>
                    {order.status === 'completed' || order.status === 'COMPLETED' ? '✓ Entregue' : 
                     order.status === 'pending' || order.status === 'PENDING' ? '⏳ Pendente' : 
                     '📦 Em andamento'}
                  </div>
                </div>
              </div>
              
              {order.items && order.items.length > 0 && (
                <div className="border-t border-slate-700 pt-4">
                  <div className="text-sm font-semibold text-slate-300 mb-2">Itens:</div>
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm text-slate-300">
                        <span>{item.productName} x {item.quantity}</span>
                        <span className="text-yellow-400">R$ {parseFloat(item.subtotal).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
