import { useEffect, useState } from 'react'
import api from '../services/api'
import AnimatedInput from '../components/AnimatedInput'
import PageHeader from '../components/PageHeader'
import { formatApiError } from '../utils/apiValidationError'

function toApiDateTime(localValue) {
  if (!localValue) return null
  const normalized = localValue.length === 16 ? `${localValue}:00` : localValue
  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

export default function VendorCoupons() {
  const [coupons, setCoupons] = useState([])
  const [form, setForm] = useState({
    code: '',
    discountPercentage: '',
    maxUses: '',
    validFrom: '',
    validUntil: '',
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

    if (!form.code || !form.discountPercentage || !form.maxUses || !form.validFrom || !form.validUntil) {
      setError('Preencha todos os campos.')
      return
    }

    const discount = parseFloat(form.discountPercentage)
    const maxUses = parseInt(form.maxUses, 10)
    const validFrom = toApiDateTime(form.validFrom)
    const validUntil = toApiDateTime(form.validUntil)

    if (!Number.isFinite(discount) || discount <= 0 || discount > 100) {
      setError('Informe um desconto entre 0,01% e 100%.')
      return
    }
    if (!Number.isFinite(maxUses) || maxUses < 1) {
      setError('Máximo de usos deve ser pelo menos 1.')
      return
    }
    if (!validFrom || !validUntil) {
      setError('Datas de validade inválidas.')
      return
    }
    if (new Date(validUntil) <= new Date(validFrom)) {
      setError('A data final deve ser posterior à data inicial.')
      return
    }

    try {
      setLoading(true)
      await api.post('/api/vendor/coupons', {
        code: form.code.trim().toUpperCase(),
        discountPercentage: discount,
        maxUses,
        validFrom,
        validUntil,
      })
      setSuccess('Cupom criado com sucesso.')
      setForm({ code: '', discountPercentage: '', maxUses: '', validFrom: '', validUntil: '' })
      await loadCoupons()
    } catch (err) {
      setError(formatApiError(err, 'Erro ao criar cupom.'))
    } finally {
      setLoading(false)
    }
  }

  const deleteCoupon = async (id) => {
    if (!window.confirm('Excluir este cupom?')) return
    try {
      await api.delete(`/api/vendor/coupons/${id}`)
      setSuccess('Cupom excluído.')
      await loadCoupons()
    } catch (err) {
      setError(formatApiError(err, 'Erro ao excluir cupom.'))
    }
  }

  return (
    <div className="fade-in max-w-6xl">
      <PageHeader title="Cupons" description="Crie códigos de desconto para seus clientes." />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="surface p-6 sm:p-8">
          <h2 className="section-title mb-6">Novo cupom</h2>
          {success && <div className="alert alert-success mb-4">{success}</div>}
          {error && <div className="alert alert-error mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatedInput
              label="Código"
              value={form.code}
              onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
              required
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
              label="Máximo de usos"
              type="number"
              value={form.maxUses}
              onChange={(e) => handleChange('maxUses', e.target.value)}
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
            <button type="submit" disabled={loading} className="btn-primary mt-4 w-full py-2.5">
              {loading ? 'Salvando...' : 'Criar cupom'}
            </button>
          </form>
        </div>

        <div className="surface p-6 sm:p-8">
          <h2 className="section-title mb-6">Cupons ativos ({coupons.length})</h2>
          {coupons.length === 0 ? (
            <p className="text-sm text-muted">Nenhum cupom cadastrado.</p>
          ) : (
            <ul className="max-h-[28rem] space-y-3 overflow-y-auto">
              {coupons.map((coupon) => (
                <li key={coupon.id} className="rounded-lg border border-stone-200 p-4 dark:border-stone-700">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-brand-700 dark:text-brand-400">{coupon.code}</p>
                      <p className="mt-1 text-sm text-muted">
                        {coupon.discountPercentage}% · {coupon.usedCount}/{coupon.maxUses} usos
                      </p>
                      <span className={`badge mt-2 ${coupon.active ? 'badge-success' : 'badge-danger'}`}>
                        {coupon.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <button type="button" onClick={() => deleteCoupon(coupon.id)} className="btn-ghost text-red-600 dark:text-red-400">
                      Excluir
                    </button>
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