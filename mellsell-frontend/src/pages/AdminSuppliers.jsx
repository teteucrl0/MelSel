import { useCallback, useEffect, useMemo, useState } from 'react'
import adminSupplierService from '../services/adminSupplierService'
import PageHeader from '../components/PageHeader'
import { MotionPage, MotionAlert } from '../components/motion/Motion'
import { formatApiError } from '../utils/apiValidationError'

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function locationLabel(s) {
  const parts = [s.city, s.state].filter(Boolean)
  return parts.length ? parts.join(' / ') : '—'
}

export default function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [tab, setTab] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState(null)
  const [notice, setNotice] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminSupplierService.list()
      setSuppliers(Array.isArray(data) ? data : [])
    } catch (err) {
      setSuppliers([])
      setNotice({ type: 'error', text: formatApiError(err, 'Não foi possível carregar fornecedores.') })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!notice) return undefined
    const t = setTimeout(() => setNotice(null), 5000)
    return () => clearTimeout(t)
  }, [notice])

  const pending = useMemo(() => suppliers.filter((s) => !s.active), [suppliers])
  const active = useMemo(() => suppliers.filter((s) => s.active), [suppliers])
  const rows = tab === 'pending' ? pending : active

  const handleApprove = async (id) => {
    setActingId(id)
    try {
      await adminSupplierService.approve(id)
      setNotice({ type: 'success', text: 'Fornecedor aprovado.' })
      await load()
    } catch (err) {
      setNotice({ type: 'error', text: formatApiError(err, 'Falha ao aprovar.') })
    } finally {
      setActingId(null)
    }
  }

  const handleReject = async (id) => {
    if (!confirm('Rejeitar ou desativar este fornecedor? Produtos deixarão de aparecer na loja.')) return
    setActingId(id)
    try {
      await adminSupplierService.reject(id)
      setNotice({ type: 'success', text: 'Fornecedor desativado.' })
      await load()
    } catch (err) {
      setNotice({ type: 'error', text: formatApiError(err, 'Falha ao rejeitar.') })
    } finally {
      setActingId(null)
    }
  }

  return (
    <MotionPage className="max-w-6xl mx-auto p-4">
      <PageHeader
        title="Fornecedores"
        description="Aprove novos apicultores antes de exibir produtos no catálogo."
        action={
          <button type="button" className="btn-secondary text-sm" onClick={load} disabled={loading}>
            Atualizar
          </button>
        }
      />

      {notice && (
        <MotionAlert className={`alert mb-6 ${notice.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {notice.text}
        </MotionAlert>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          className={`btn-secondary text-sm ${tab === 'pending' ? 'ring-2 ring-amber-500' : ''}`}
          onClick={() => setTab('pending')}
        >
          Pendentes ({pending.length})
        </button>
        <button
          type="button"
          className={`btn-secondary text-sm ${tab === 'active' ? 'ring-2 ring-emerald-500' : ''}`}
          onClick={() => setTab('active')}
        >
          Ativos ({active.length})
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Loja</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Dono</th>
              <th className="px-4 py-3">Local</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Cadastro</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                  Carregando…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  {tab === 'pending' ? 'Nenhum fornecedor pendente.' : 'Nenhum fornecedor ativo.'}
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <td className="px-4 py-3 tabular-nums">{s.id}</td>
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.email}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.ownerEmail || '—'}</td>
                  <td className="px-4 py-3">{locationLabel(s)}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-slate-600 dark:text-slate-400" title={s.descriptionSnippet || ''}>
                    {s.descriptionSnippet || '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                    {formatDate(s.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${s.active ? 'badge-success' : 'badge-warning'}`}>
                      {s.active ? 'Ativo' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {!s.active && (
                        <button
                          type="button"
                          className="btn-primary text-xs"
                          disabled={actingId === s.id}
                          onClick={() => handleApprove(s.id)}
                        >
                          Aprovar
                        </button>
                      )}
                      {s.active ? (
                        <button
                          type="button"
                          className="btn-ghost text-xs text-red-600 dark:text-red-400"
                          disabled={actingId === s.id}
                          onClick={() => handleReject(s.id)}
                        >
                          Desativar
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-ghost text-xs text-red-600 dark:text-red-400"
                          disabled={actingId === s.id}
                          onClick={() => handleReject(s.id)}
                        >
                          Rejeitar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </MotionPage>
  )
}