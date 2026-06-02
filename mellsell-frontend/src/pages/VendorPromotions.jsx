import React, { useEffect, useState } from 'react'
import api from '../services/api'
import AnimatedInput from '../components/AnimatedInput'

export default function VendorPromotions() {
  const [promotions, setPromotions] = useState([])
  const [form, setForm] = useState({
    name: '',
    productId: '',
    discountPercentage: '',
    startDate: '',
    endDate: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { loadPromotions() }, [])

  const loadPromotions = async () => {
    try {
      const res = await api.get('/api/vendor/promotions')
      setPromotions(res.data || [])
    } catch (err) {
      console.error('Erro ao carregar promoções:', err)
    }
  }

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!form.name || !form.productId || !form.discountPercentage || !form.startDate || !form.endDate) {
      setError('Preencha todos os campos')
      return
    }
    try {
      setLoading(true)
      await api.post('/api/vendor/promotions', {
        name: form.name,
        productId: parseInt(form.productId),
        discountPercentage: parseFloat(form.discountPercentage),
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString()
      })
      setSuccess('✓ Promoção criada com sucesso!')
      setForm({ name: '', productId: '', discountPercentage: '', startDate: '', endDate: '' })
      await loadPromotions()
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar promoção')
    } finally {
      setLoading(false)
    }
  }

  const deletePromotion = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar esta promoção?')) return
    try {
      await api.delete(`/api/vendor/promotions/${id}`)
      setSuccess('✓ Promoção deletada')
      await loadPromotions()
    } catch (err) {
      setError('Erro ao deletar promoção')
    }
  }

  const togglePromotion = async (id) => {
    try {
      await api.put(`/api/vendor/promotions/${id}`)
      await loadPromotions()
    } catch (err) {
      setError('Erro ao atualizar promoção')
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold text-slate-100 mb-8">🏷️ Gerenciar Promoções</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-lg shadow-lg border border-slate-700 hover:border-yellow-500/50 transition-all duration-300">
          <h2 className="text-2xl font-bold text-slate-100 mb-6">Criar Nova Promoção</h2>

          {success && <div className="bg-green-900/30 border border-green-500 text-green-400 p-4 rounded mb-4 text-sm">{success}</div>}
          {error && <div className="bg-red-900/30 border border-red-500 text-red-400 p-4 rounded mb-4 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatedInput
              label="Nome da Promoção"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Black Friday 10%"
              required
            />
            <AnimatedInput
              label="ID do Produto"
              type="number"
              value={form.productId}
              onChange={(e) => handleChange('productId', e.target.value)}
              placeholder="1"
              required
              min="1"
            />
            <AnimatedInput
              label="Desconto (%)"
              type="number"
              value={form.discountPercentage}
              onChange={(e) => handleChange('discountPercentage', e.target.value)}
              placeholder="10"
              required
              min="0"
              max="100"
            />
            <AnimatedInput
              label="Data de início"
              type="datetime-local"
              value={form.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              required
            />
            <AnimatedInput
              label="Data de fim"
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              {loading ? '⏳ Criando...' : '✓ Criar Promoção'}
            </button>
          </form>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-lg shadow-lg border border-slate-700">
          <h2 className="text-2xl font-bold text-slate-100 mb-6">Minhas Promoções ({promotions.length})</h2>

          {promotions.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <div className="text-4xl mb-2">🏷️</div>
              <p>Nenhuma promoção criada ainda</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {promotions.map(promo => (
                <div
                  key={promo.id}
                  className="bg-slate-700/50 border border-slate-600 hover:border-yellow-400 p-4 rounded-lg transition-all duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-bold text-yellow-400 text-lg">{promo.name}</div>
                      <div className="text-sm text-slate-400 mt-1">
                        <div>📦 Produto: {promo.productName}</div>
                        <div>💰 Desconto: {promo.discountPercentage}%</div>
                        <div className={`text-xs mt-1 ${promo.active ? 'text-green-400' : 'text-red-400'}`}>
                          {promo.active ? '✓ Ativa' : '✗ Inativa'}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => togglePromotion(promo.id)}
                        className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20 px-2 py-1 rounded transition-all text-sm"
                        title={promo.active ? 'Desativar' : 'Ativar'}
                      >
                        {promo.active ? '⏸️' : '▶️'}
                      </button>
                      <button
                        onClick={() => deletePromotion(promo.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 px-2 py-1 rounded transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
