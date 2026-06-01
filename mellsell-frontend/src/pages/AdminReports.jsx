import React, { useState } from 'react'
import reportService from '../services/reportService'

export default function AdminReports() {
  const [items, setItems] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadJson = async () => {
    setLoading(true)
    try {
      const data = await reportService.salesReport()
      setItems(data)
    } catch (e) {
      alert('Falha ao carregar relatório')
    } finally { setLoading(false) }
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
    } catch (e) {
      alert('Falha ao baixar PDF')
    } finally { setLoading(false) }
  }

  const exportUsersByRole = async (role) => {
    setLoading(true)
    try {
      const arrayBuffer = await import('../services/userService').then(m => m.default.exportByRole(role))
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users_${role}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      alert('Falha ao exportar usuários')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Relatórios - Admin</h2>
      <div className="space-x-2 mb-4">
        <button onClick={loadJson} className="bg-yellow-500 text-white px-3 py-1 rounded">Carregar JSON</button>
        <button onClick={downloadPdf} className="bg-gray-800 text-white px-3 py-1 rounded">Baixar PDF</button>
        <div className="inline-block ml-2">
          <label className="mr-2">Exportar usuários por papel:</label>
          <button onClick={() => exportUsersByRole('CLIENTE')} className="bg-blue-600 text-white px-2 py-1 rounded mr-1">Cliente</button>
          <button onClick={() => exportUsersByRole('VENDEDOR')} className="bg-blue-600 text-white px-2 py-1 rounded mr-1">Vendedor</button>
          <button onClick={() => exportUsersByRole('ADMIN')} className="bg-blue-600 text-white px-2 py-1 rounded">Admin</button>
        </div>
      </div>
      {loading && <div>Carregando...</div>}
      {items && (
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left">
              <th>Produto</th><th>Quantidade</th><th>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => (
              <tr key={it.productId} className="border-t">
                <td>{it.productName}</td>
                <td>{it.quantity}</td>
                <td>R$ {it.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
