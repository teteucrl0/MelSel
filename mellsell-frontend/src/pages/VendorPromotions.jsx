import { useEffect, useState } from 'react'
import api from '../services/api'
import AnimatedInput from '../components/AnimatedInput'
import PageHeader from '../components/PageHeader'

export default function VendorPromotions() {
  const [promotions, setPromotions] = useState([])
  const [form, setForm] = useState({
    name: '',
    productId: '',
    discountPercentage: '',
    startDate: '',
    endDate: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadPromotions()
  }, [])

  const loadPromotions = async () => {
    try {
      const res = await api.get('/api/vendor/promotions')
      setPromotions(res.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!form.name || !form.productId || !form.discountPercentage || !form.startDate || !form.endDate) {
      setError('Preencha todos os campos.')
      return
    }
    try {
      setLoading(true)
      await api.post('/api/vendor/promotions', {
        name: form.name,
        productId: parseInt(form.productId, 10),
        discountPercentage: parseFloat(form.discountPercentage),
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      })
      setSuccess('Promoção criada com sucesso.')
      setForm({ name: '', productId: '', discountPercentage: '', startDate: '', endDate: '' })
      await loadPromotions()
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar promoção.')
    } finally {
      setLoading(false)
    }
  }

  const deletePromotion = async (id) => {
    if (!window.confirm('Excluir esta promoção?')) return
    try {
      await api.delete(`/api/vendor/promotions/${id}`)
      setSuccess('Promoção excluída.')
      await loadPromotions()
    } catch {
      setError('Erro ao excluir promoção.')
    }
  }

  const togglePromotion = async (id) => {
    try {
      await api.put(`/api/vendor/promotions/${id}`)
      await loadPromotions()
    } catch {
      setError('Erro ao atualizar promoção.')
    }
  }

  return (
    <div className="fade-in max-w-6xl">
      <PageHeader title="Promoções" description="Descontos temporários vinculados a produtos." />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="surface p-6 sm:p-8">
          <h2 className="section-title mb-6">Nova promoção</h2>
          {success && <div className="alert alert-success mb-4">{success}</div>}
          {error && <div className="alert alert-error mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatedInput label="Nome" value={form.name} onChange={(e) => handleChange('name', e.target.value)} required />
            <AnimatedInput
              label="ID do produto"
              type="number"
              value={form.productId}
              onChange={(e) => handleChange('productId', e.target.value)}
              required
              min="1"
            />
            <AnimatedInput
              label="Desconto (%)"
              type="number"
              value={form.discountPercentage}
              onChange={(e) => handleChange('discountPercentage', e.target.value)}
              required
              min="0"
              max="100"
            />
            <AnimatedInput
              label="Início"
              type="datetime-local"
              value={form.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              required
            />
            <AnimatedInput
              label="Fim"
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              required
            />
            <button type="submit" disabled={loading} className="btn-primary mt-4 w-full py-2.5">
              {loading ? 'Salvando...' : 'Criar promoção'}
            </button>
          </form>
        </div>

        <div className="surface p-6 sm:p-8">
          <h2 className="section-title mb-6">Promoções ({promotions.length})</h2>
          {promotions.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma promoção cadastrada.</p>
          ) : (
            <ul className="max-h-[28rem] space-y-3 overflow-y-auto">
              {promotions.map((promo) => (
                <li key={promo.id} className="rounded-lg border border-stone-200 p-4 dark:border-stone-700">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{promo.name}</p>
                      <p className="mt-1 text-sm text-muted">
                        Produto: {promo.productName} · {promo.discountPercentage}% off
                      </p>
                      <span className={`badge mt-2 ${promo.active ? 'badge-success' : 'badge-danger'}`}>
                        {promo.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button type="button" onClick={() => togglePromotion(promo.id)} className="btn-secondary text-xs">
                        {promo.active ? 'Pausar' : 'Ativar'}
                      </button>
                      <button type="button" onClick={() => deletePromotion(promo.id)} className="btn-ghost text-xs text-red-600 dark:text-red-400">
                        Excluir
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}