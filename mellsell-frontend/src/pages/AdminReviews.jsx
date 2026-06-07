import React, { useEffect, useState } from 'react'
import reviewService from '../services/reviewService'

export default function AdminReviews() {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(false)

  const load = () => {
    setLoading(true)
    reviewService.listPending(0, 50).then(r => setPending(r.content || r)).catch(() => setPending([])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const approve = (id) => reviewService.approveReview(id).then(() => load()).catch(() => alert('Falha'))
  const reject = (id) => reviewService.rejectReview(id).then(() => load()).catch(() => alert('Falha'))

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">Moderação de Avaliações (Admin)</h2>
      {loading && <div className="min-h-8" aria-busy="true" />}
      <ul className="space-y-3">
        {pending.map(r => (
          <li key={r.id} className="border p-3 rounded dark:border-slate-800 dark:bg-slate-900">
            <div className="font-semibold text-slate-900 dark:text-slate-100">{r.userName} - {r.rating}★</div>
            <div className="text-sm text-gray-700 dark:text-slate-300">{r.comment}</div>
            <div className="text-xs text-gray-500 dark:text-slate-500">Produto: {r.productName} — {r.createdAt}</div>
            <div className="mt-2 space-x-2">
              <button onClick={() => approve(r.id)} className="bg-green-600 text-white px-2 py-1 rounded">Aprovar</button>
              <button onClick={() => reject(r.id)} className="bg-red-600 text-white px-2 py-1 rounded">Rejeitar</button>
            </div>
          </li>
        ))}
      </ul>
      {pending.length === 0 && !loading && <div className="text-slate-700 dark:text-slate-400">Nenhuma avaliação pendente.</div>}
    </div>
  )
}
