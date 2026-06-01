import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import cartService from '../services/cartService'

export default function Checkout() {
  const [address, setAddress] = useState('')
  const [payment, setPayment] = useState('FAKE')
  const navigate = useNavigate()

  const submit = (e) => {
    e.preventDefault()
    cartService.checkout(address, payment).then(() => {
      alert('Pedido confirmado')
      navigate('/'
    )}).catch(() => alert('Falha no checkout'))
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Checkout</h2>
      <form onSubmit={submit} className="space-y-3">
        <textarea className="w-full border p-2" placeholder="Endereço de entrega" value={address} onChange={e => setAddress(e.target.value)} />
        <select value={payment} onChange={e => setPayment(e.target.value)} className="w-full border p-2">
          <option value="FAKE">Pagamento Simulado</option>
        </select>
        <button className="bg-yellow-500 text-white px-4 py-2 rounded">Pagar</button>
      </form>
    </div>
  )
}
