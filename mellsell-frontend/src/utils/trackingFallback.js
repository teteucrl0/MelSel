/** Timeline de rastreio local quando a API /tracking não estiver disponível */
export function buildSimulatedTracking(order) {
  if (!order?.id) return null
  const status = String(order.status || '').toUpperCase()
  if (status !== 'CONFIRMED' && status !== 'COMPLETED') {
    return {
      orderId: order.id,
      trackingCode: order.trackingCode,
      carrier: order.carrier || 'Correios',
      currentStatus: 'UNAVAILABLE',
      currentStatusLabel: 'Rastreamento indisponível',
      progressPercent: 0,
      delivered: false,
      source: 'fallback',
      events: [],
    }
  }

  const code = order.trackingCode || `ME${String(order.id).padStart(9, '0')}BR`
  const postedAt = order.createdAt ? new Date(order.createdAt) : new Date()
  const hours = Math.max(0, (Date.now() - postedAt.getTime()) / (1000 * 60 * 60))

  const steps = [
    { status: 'POSTED', title: 'Postado', description: 'Objeto postado após o pagamento', location: 'Agência dos Correios', afterHours: 0 },
    { status: 'IN_TRANSIT', title: 'Em trânsito', description: 'Objeto encaminhado para unidade de tratamento', location: 'Unidade logística — SP', afterHours: 2 },
    { status: 'REGIONAL_HUB', title: 'Centro regional', description: 'Objeto chegou ao centro de distribuição', location: 'Centro de distribuição — destino', afterHours: 8 },
    { status: 'OUT_FOR_DELIVERY', title: 'Saiu para entrega', description: 'Objeto saiu para entrega ao destinatário', location: 'Unidade de entrega', afterHours: 24 },
    { status: 'DELIVERED', title: 'Entregue', description: 'Objeto entregue ao destinatário', location: 'Endereço de entrega', afterHours: 48 },
  ]

  const events = steps.map((step) => {
    const done = hours >= step.afterHours
    const occurredAt = done
      ? new Date(postedAt.getTime() + step.afterHours * 60 * 60 * 1000).toISOString()
      : null
    return {
      status: step.status,
      title: step.title,
      description: step.description,
      location: step.location,
      occurredAt,
      completed: done,
    }
  })

  const completed = events.filter((e) => e.completed).length
  const progress = events.length
    ? Math.min(100, Math.round((completed * 100) / events.length))
    : 0
  const current = events.filter((e) => e.completed).pop() || events[0]
  const delivered = events.some((e) => e.status === 'DELIVERED' && e.completed)

  const estimated = new Date(postedAt)
  estimated.setDate(estimated.getDate() + 3)

  return {
    orderId: order.id,
    trackingCode: code,
    carrier: order.carrier || 'Correios',
    currentStatus: current.status,
    currentStatusLabel: current.title,
    progressPercent: progress,
    delivered,
    source: 'simulated',
    correiosUrl: `https://rastreamento.correios.com.br/app/index.php?objetos=${code}`,
    estimatedDelivery: estimated.toISOString(),
    events,
  }
}