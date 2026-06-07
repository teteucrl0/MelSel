import { useCallback, useEffect, useState } from 'react'
import adminUserService from '../services/adminUserService'
import PageHeader from '../components/PageHeader'
import { MotionPage, MotionAlert } from '../components/motion/Motion'
import { formatApiError } from '../utils/apiValidationError'
import { resolveProductImageUrl } from '../utils/productImageUrl'
import api from '../services/api'

const ROLE_OPTIONS = [
  { value: '', label: 'Todos os papéis' },
  { value: 'CLIENTE', label: 'Cliente' },
  { value: 'VENDEDOR', label: 'Apicultor' },
  { value: 'ADMIN', label: 'Administrador' },
]

const ROLE_LABELS = {
  CLIENTE: 'Cliente',
  VENDEDOR: 'Apicultor',
  ADMIN: 'Admin',
}

function roleBadges(roles) {
  const list = Array.from(roles || [])
  if (!list.length) return <span className="badge">—</span>
  return list.map((r) => (
    <span key={r} className={`badge mr-1 ${r === 'ADMIN' ? 'badge-warning' : ''}`}>
      {ROLE_LABELS[r] || r}
    </span>
  ))
}

function UserEditModal({ user, open, onClose, onSaved }) {
  const [name, setName] = useState('')
  const [storeName, setStoreName] = useState('')
  const [roleSet, setRoleSet] = useState(new Set())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isVendor = roleSet.has('VENDEDOR')

  useEffect(() => {
    if (!open || !user) return
    setName(user.name || '')
    setStoreName(user.storeName || '')
    setRoleSet(new Set(user.roles || []))
    setError('')
  }, [open, user])

  if (!open || !user) return null

  const toggleRole = (role) => {
    setRoleSet((prev) => {
      const next = new Set(prev)
      if (next.has(role)) next.delete(role)
      else next.add(role)
      return next
    })
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Informe o nome.')
      return
    }
    if (roleSet.size === 0) {
      setError('Selecione ao menos um papel.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await adminUserService.updateUser(user.id, {
        name: name.trim(),
        storeName: isVendor ? storeName.trim() : undefined,
      })
      await adminUserService.updateRoles(user.id, Array.from(roleSet))
      onSaved?.()
      onClose()
    } catch (err) {
      setError(formatApiError(err, 'Não foi possível salvar.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={() => !saving && onClose()}>
      <div className="modal-panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Editar conta</h2>
          <button type="button" className="btn-ghost text-sm" onClick={onClose} disabled={saving}>
            Fechar
          </button>
        </header>
        <form onSubmit={submit} className="modal-form space-y-4">
          <p className="text-sm text-muted">{user.email}</p>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div>
            <label className="label">Nome</label>
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          {isVendor && (
            <div>
              <label className="label">Nome da loja</label>
              <input className="input-field" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
            </div>
          )}
          <fieldset>
            <legend className="label mb-2">Papéis no sistema</legend>
            <div className="flex flex-wrap gap-3">
              {['CLIENTE', 'VENDEDOR', 'ADMIN'].map((role) => (
                <label key={role} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={roleSet.has(role)}
                    onChange={() => toggleRole(role)}
                  />
                  {ROLE_LABELS[role]}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [notice, setNotice] = useState(null)
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: 0, size: 100 }
      if (search) params.q = search
      if (roleFilter) params.role = roleFilter
      const data = await adminUserService.list(params)
      setUsers(data.content || [])
      setTotal(data.totalElements ?? (data.content || []).length)
    } catch (err) {
      setUsers([])
      setNotice({ type: 'error', text: formatApiError(err, 'Não foi possível carregar usuários.') })
    } finally {
      setLoading(false)
    }
  }, [search, roleFilter])

  useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!notice) return undefined
    const t = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(t)
  }, [notice])

  const toggleActive = async (user) => {
    const next = !user.active
    if (!confirm(next ? `Ativar conta de ${user.name}?` : `Desativar conta de ${user.name}?`)) return
    try {
      await adminUserService.setActive(user.id, next)
      setNotice({ type: 'success', text: next ? 'Conta ativada.' : 'Conta desativada.' })
      load()
    } catch (err) {
      setNotice({ type: 'error', text: formatApiError(err, 'Falha ao alterar status.') })
    }
  }

  const unlockAccount = async (user) => {
    try {
      await adminUserService.unlock(user.id)
      setNotice({ type: 'success', text: `Conta de ${user.name} desbloqueada.` })
      load()
    } catch (err) {
      setNotice({ type: 'error', text: formatApiError(err, 'Falha ao desbloquear.') })
    }
  }

  const downloadExport = async (role) => {
    try {
      const res = await api.get('/api/admin/users/export', {
        params: { role },
        responseType: 'blob',
      })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `usuarios_${role.toLowerCase()}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setNotice({ type: 'error', text: 'Falha ao exportar PDF.' })
    }
  }

  return (
    <MotionPage className="max-w-6xl">
      <PageHeader
        title="Contas de usuário"
        description="Visualize, edite papéis, ative ou desative contas. Alterações aqui são administrativas."
        action={
          <button type="button" className="btn-secondary" onClick={load}>
            Atualizar
          </button>
        }
      />

      {notice && (
        <MotionAlert className={`alert mb-6 ${notice.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {notice.text}
        </MotionAlert>
      )}

      <div className="surface mb-6 flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label className="label" htmlFor="user-search">
            Buscar
          </label>
          <input
            id="user-search"
            className="input-field"
            placeholder="Nome ou e-mail..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <label className="label" htmlFor="role-filter">
            Papel
          </label>
          <select
            id="role-filter"
            className="input-field"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-ghost text-sm" onClick={() => downloadExport('CLIENTE')}>
            PDF clientes
          </button>
          <button type="button" className="btn-ghost text-sm" onClick={() => downloadExport('VENDEDOR')}>
            PDF apicultores
          </button>
        </div>
      </div>

      <p className="mb-4 text-sm text-muted">
        {loading ? '—' : `${total} conta${total === 1 ? '' : 's'}`}
      </p>

      {loading ? (
        <div className="min-h-[10rem]" aria-busy="true" />
      ) : users.length === 0 ? (
        <div className="surface px-6 py-12 text-center text-sm text-muted">Nenhum usuário encontrado.</div>
      ) : (
        <div className="surface overflow-x-auto">
          <table className="admin-table w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3">Papéis</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const avatar = resolveProductImageUrl(u.avatarUrl)
                return (
                  <tr key={u.id} className="border-t border-stone-200 dark:border-stone-700">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {avatar ? (
                          <img src={avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-200 text-xs font-bold dark:bg-stone-700">
                            {(u.name || '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                        <div>
                          <p className="font-medium text-stone-900 dark:text-stone-50">{u.name}</p>
                          <p className="text-xs text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{roleBadges(u.roles)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={u.active ? 'badge badge-success' : 'badge badge-danger'}>
                          {u.active ? 'Ativo' : 'Inativo'}
                        </span>
                        {u.locked && <span className="badge badge-warning">Bloqueado</span>}
                        {u.failedLoginAttempts > 0 && !u.locked && (
                          <span className="text-xs text-muted">{u.failedLoginAttempts} tentativa(s) falha</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button type="button" className="btn-secondary text-xs" onClick={() => setEditing(u)}>
                          Editar
                        </button>
                        {u.locked && (
                          <button type="button" className="btn-ghost text-xs" onClick={() => unlockAccount(u)}>
                            Desbloquear
                          </button>
                        )}
                        <button
                          type="button"
                          className={`text-xs ${u.active ? 'btn-ghost text-red-600 dark:text-red-400' : 'btn-primary'}`}
                          onClick={() => toggleActive(u)}
                        >
                          {u.active ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <UserEditModal
        user={editing}
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setNotice({ type: 'success', text: 'Conta atualizada.' })
          load()
        }}
      />
    </MotionPage>
  )
}