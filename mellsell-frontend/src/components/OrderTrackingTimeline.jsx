import { motion } from 'framer-motion'
import { clampProgress } from '../utils/trackingProgress'

const STEP_ICONS = {
  POSTED: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </svg>
  ),
  IN_TRANSIT: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  REGIONAL_HUB: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
    </svg>
  ),
  OUT_FOR_DELIVERY: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
      <path d="M8 18h8M2 18h2M20 18h2M2 12h20l-2-6H4l-2 6z" />
    </svg>
  ),
  DELIVERED: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4" aria-hidden>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
}

function lastCompletedIndex(events) {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    if (events[i]?.completed) return i
  }
  return -1
}

export default function OrderTrackingTimeline({ tracking, compact = false, live = false, premium = false }) {
  if (!tracking?.events?.length) {
    return (
      <p className="tracking-empty-msg">
        Rastreamento disponível após a confirmação do pagamento.
      </p>
    )
  }

  const rootClass = [
    'tracking-timeline',
    compact ? 'tracking-timeline--compact' : '',
    premium ? 'tracking-timeline--premium' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClass}>
      {!premium && (
        <div className="tracking-progress" aria-hidden>
          <div className="tracking-progress-track">
            <motion.div
              className="tracking-progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${clampProgress(tracking.progressPercent)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <p className="tracking-progress-label">
            {tracking.currentStatusLabel}
            {tracking.delivered ? ' · Entrega concluída' : ''}
          </p>
        </div>
      )}

      <ol className="tracking-steps">
        {tracking.events.map((event, index) => {
          const isLatest =
            live &&
            event.completed &&
            index === lastCompletedIndex(tracking.events)
          const done = event.completed
          return (
            <motion.li
              key={`${event.status}-${index}`}
              className={`tracking-step ${done ? 'tracking-step--done' : 'tracking-step--pending'} ${isLatest ? 'tracking-step--live' : ''}`}
              initial={premium ? { opacity: 0, x: -8 } : false}
              animate={premium ? { opacity: 1, x: 0 } : false}
              transition={{ delay: index * 0.06, duration: 0.35 }}
            >
              <span className="tracking-step-marker" aria-hidden>
                {STEP_ICONS[event.status] || <span>•</span>}
              </span>
              <div className="tracking-step-body">
                <p className="tracking-step-title">{event.title}</p>
                <p className="tracking-step-desc">{event.description}</p>
                {event.location && <p className="tracking-step-location">{event.location}</p>}
                {event.occurredAt && (
                  <time className="tracking-step-time" dateTime={event.occurredAt}>
                    {new Date(event.occurredAt).toLocaleString('pt-BR')}
                  </time>
                )}
              </div>
            </motion.li>
          )
        })}
      </ol>

      {tracking.estimatedDelivery && !tracking.delivered && !premium && (
        <p className="tracking-eta text-sm text-muted">
          Previsão de entrega:{' '}
          <strong>{new Date(tracking.estimatedDelivery).toLocaleDateString('pt-BR')}</strong>
        </p>
      )}
    </div>
  )
}