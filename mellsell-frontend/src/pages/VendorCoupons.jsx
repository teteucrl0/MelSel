import React, { useEffect, useState } from 'react'
import api from '../services/api'
import AnimatedInput from '../components/AnimatedInput'

export default function VendorCoupons() {
  const [coupons, setCoupons] = useState([])
  const [form, setForm] = useState({
    code: '',
    discountPercentage: '',
    maxUses: '',
    validFrom: '',
    validUntil: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadCoupons()
  }, [])

  const loadCoupons = async () => {
    try {
      const response = await api.get('/api/vendor/coupons')
      setCoupons(response.data || [])
    } catch (err) {
      console.error('Erro ao carregar cupons:', err)
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

    if (!form.code || !form.discountPercentage || !form.maxUses || !form.validFrom || !form.validUntil) {
      setError('Preencha todos os campos')
      return
    }

    try {
      setLoading(true)
      await api.post('/api/vendor/coupons', {
        code: form.code.toUpperCase(),
        discountPercentage: parseFloat(form.discountPercentage),
        maxUses: parseInt(form.maxUses),
        validFrom: new Date(form.validFrom).toISOString(),
        validUntil: new Date(form.validUntil).toISOString()
      })
      setSuccess('✓ Cupom criado com sucesso!')
      setForm({
        code: '',
        discountPercentage: '',
        maxUses: '',
        validFrom: '',
        validUntil: ''
      })
      await loadCoupons()
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar cupom')
    } finally {
      setLoading(false)
    }
  }

  const deleteCoupon = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar este cupom?')) return
    try {
      await api.delete(`/api/vendor/coupons/${id}`)
      setSuccess('✓ Cupom deletado')
      await loadCoupons()
    } catch (err) {
      setError('Erro ao deletar cupom')
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold text-slate-100 mb-8">💰 Gerenciar Cupons</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Formulário */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-lg shadow-lg border border-slate-700 hover:border-yellow-500/50 transition-all duration-300">
          <h2 className="text-2xl font-bold text-slate-100 mb-6">Criar Novo Cupom</h2>

          {success && <div className="bg-green-900/30 border border-green-500 text-green-400 p-4 rounded mb-4 text-sm">{success}</div>}
          {error && <div className="bg-red-900/30 border border-red-500 text-red-400 p-4 rounded mb-4 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatedInput
              label="Código do Cupom"
              value={form.code}
              onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
              placeholder="EX: BLACKFRIDAY"
              required
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
              label="Máximo de Usos"
              type="number"
              value={form.maxUses}
              onChange={(e) => handleChange('maxUses', e.target.value)}
              placeholder="100"
              required
              min="1"
            />

            <AnimatedInput
              label="Válido de"
              type="datetime-local"
              value={form.validFrom}
              onChange={(e) => handleChange('validFrom', e.target.value)}
              required
            />

            <AnimatedInput
              label="Válido até"
              type="datetime-local"
              value={form.validUntil}
              onChange={(e) => handleChange('validUntil', e.target.value)}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              {loading ? '⏳ Criando...' : '✓ Criar Cupom'}
            </button>
          </form>
        </div>

        {/* Lista de Cupons */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-lg shadow-lg border border-slate-700">
          <h2 className="text-2xl font-bold text-slate-100 mb-6">Meus Cupons ({coupons.length})</h2>

          {coupons.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <div className="text-4xl mb-2">🎫</div>
              <p>Nenhum cupom criado ainda</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {coupons.map(coupon => (
                <div
                  key={coupon.id}
                  className="bg-slate-700/50 border border-slate-600 hover:border-yellow-400 p-4 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-bold text-yellow-400 text-lg">{coupon.code}</div>
                      <div className="text-sm text-slate-400 mt-1">
                        <div>💰 Desconto: {coupon.discountPercentage}%</div>
                        <div>🔢 Usos: {coupon.usedCount}/{coupon.maxUses}</div>
                        <div className={`text-xs mt-1 ${coupon.active ? 'text-green-400' : 'text-red-400'}`}>
                          {coupon.active ? '✓ Ativo' : '✗ Inativo'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteCoupon(coupon.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20 px-2 py-1 rounded transition-all"
                    >
                      🗑️
                    </button>
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
