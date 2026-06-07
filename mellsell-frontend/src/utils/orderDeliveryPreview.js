import { buildSimulatedTracking } from './trackingFallback'
import { clampProgress } from './trackingProgress'

const DELIVERABLE = new Set(['CONFIRMED', 'COMPLETED'])

export function isDeliverableOrder(order) {
  return DELIVERABLE.has(String(order?.status || '').toUpperCase())
}

/** Dados unificados para o bloco de entrega no card de pedido. */
export function resolveOrderDeliveryPreview(order) {
  if (!isDeliverableOrder(order)) return null

  const simulated = buildSimulatedTracking(order)
  const hasApiProgress = typeof order.deliveryProgress === 'number'

  return {
    carrier: order.carrier || simulated?.carrier || 'Correios',
    trackingCode:
      order.trackingCode ||
      simulated?.trackingCode ||
      `ME${String(order.id).padStart(9, '0')}BR`,
    status:
      order.deliveryStatus ||
      simulated?.currentStatusLabel ||
      'Aguardando envio',
    progress: clampProgress(
      hasApiProgress ? order.deliveryProgress : simulated?.progressPercent
    ),
    delivered: Boolean(simulated?.delivered),
  }
}