import { useState } from 'react'
import reportService from '../services/reportService'
import PageHeader from '../components/PageHeader'

export default function AdminReports() {
  const [items, setItems] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadJson = async () => {
    setLoading(true)
    try {
      setItems(await reportService.salesReport())
    } catch {
      alert('Falha ao carregar relatório.')
    } finally {
      setLoading(false)
    }
  }

  const downloadPdf = async () => {
    setLoading(true)
    try {
      const arrayBuffer = await reportService.salesReport(null, null, 'pdf')
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'sales-report.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Falha ao baixar PDF.')
    } finally {
      setLoading(false)
    }
  }

  const exportUsersByRole = async (role) => {
    setLoading(true)
    try {
      const arrayBuffer = await import('../services/userService').then((m) => m.default.exportByRole(role))
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users_${role}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Falha ao exportar usuários.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in max-w-4xl">
      <PageHeader title="Relatórios" description="Exportação de vendas e usuários." />

      <div className="surface flex flex-wrap gap-2 p-4">
        <button type="button" onClick={loadJson} disabled={loading} className="btn-primary">
          Carregar dados
        </button>
        <button type="button" onClick={downloadPdf} disabled={loading} className="btn-secondary">
          Baixar PDF de vendas
        </button>
      </div>

      <div className="surface mt-4 p-4">
        <p className="text-sm font-medium text-stone-900 dark:text-stone-50">Exportar usuários por papel</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {['CLIENTE', 'VENDEDOR', 'ADMIN'].map((role) => (
            <button key={role} type="button" onClick={() => exportUsersByRole(role)} disabled={loading} className="btn-secondary text-sm">
              {role}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="mt-4 text-sm text-muted">Processando...</p>}

      {items && (
        <div className="surface mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-muted dark:border-stone-700">
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium">Quantidade</th>
                <th className="px-4 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.productId} className="border-b border-stone-100 dark:border-stone-800">
                  <td className="px-4 py-3">{it.productName}</td>
                  <td className="px-4 py-3">{it.quantity}</td>
                  <td className="px-4 py-3 font-medium">R$ {it.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}