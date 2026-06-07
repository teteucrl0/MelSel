import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import useStompTopic from '../hooks/useStompTopic'
import { useCallback, useEffect, useState } from 'react'

const MAX_EVENTS = 5

export default function LiveApiaryFeed() {
  const [events, setEvents] = useState([])
  const [ready, setReady] = useState(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (reduceMotion) {
      setReady(true)
      return undefined
    }
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [reduceMotion])

  const onApiaryEvent = useCallback((event) => {
    setEvents((prev) => {
      const next = [{ ...event, id: `${event.stepId}-${Date.now()}` }, ...prev]
      return next.slice(0, MAX_EVENTS)
    })
  }, [])

  useStompTopic('/topic/apiary', onApiaryEvent)

  const latest = events[0]
  const progress = latest?.progress ?? 0

  return (
    <section className="apiary-live" aria-live="polite">
      <div className="apiary-live-header">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-700 dark:text-brand-400">
            Ao vivo na plataforma
          </p>
          <h2 className="mt-1 text-sm font-semibold text-stone-900 dark:text-stone-50">
            Novos apiários
          </h2>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live
        </span>
      </div>

      <AnimatePresence mode="wait">
        {latest ? (
          <motion.div
            key={latest.id}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={ready || reduceMotion ? { opacity: 1 } : { opacity: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="apiary-live-track">
              <motion.div
                className="apiary-live-fill"
                initial={reduceMotion ? false : { width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              />
            </div>
            <p className="apiary-live-step-title">{latest.title}</p>
            <p className="apiary-live-step-msg">{latest.message}</p>
            {latest.storeName && (
              <p className="mt-2 text-xs font-medium text-brand-700 dark:text-brand-400">{latest.storeName}</p>
            )}
          </motion.div>
        ) : (
          <motion.p
            key="empty"
            className="apiary-live-step-msg mt-3"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={ready || reduceMotion ? { opacity: 1 } : { opacity: 0 }}
          >
            Quando um apicultor se cadastrar, o progresso aparecerá aqui.
          </motion.p>
        )}
      </AnimatePresence>

      {events.length > 1 && (
        <ul className="mt-4 space-y-1.5 border-t border-stone-200 pt-3 dark:border-stone-700">
          {events.slice(1, 4).map((ev) => (
            <li key={ev.id} className="text-xs text-muted">
              {ev.title} · {ev.storeName || ev.vendorName}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}