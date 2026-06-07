/** Normaliza percentual de progresso (0–100) para exibição em barras e pills. */
export function clampProgress(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.min(100, Math.max(0, Math.round(n)))
}

/** Indica timeline simulada (API offline ou modo demonstração). */
export function isSimulatedTrackingSource(source) {
  const s = String(source || '').toLowerCase()
  return s === 'simulated' || s === 'fallback' || s === 'none'
}

/** Indica atualização em tempo real via WebSocket. */
export function isLiveTrackingSource(source) {
  return String(source || '').toLowerCase() === 'live'
}