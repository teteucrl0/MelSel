import { AnimatePresence, motion } from 'framer-motion'
import useStompTopic from '../hooks/useStompTopic'
import { useCallback, useState } from 'react'

export default function ApiarySetupLive({ active }) {
  const [step, setStep] = useState(null)

  const onEvent = useCallback((event) => {
    setStep(event)
  }, [])

  useStompTopic('/topic/apiary', onEvent, active)

  if (!active) return null

  const progress = step?.progress ?? 5

  return (
    <div className="apiary-live" aria-live="polite">
      <div className="apiary-live-header">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-700 dark:text-brand-400">
            Configuração ao vivo
          </p>
          <h3 className="mt-1 text-sm font-semibold text-stone-900 dark:text-stone-50">
            Montando seu apiário digital
          </h3>
        </div>
        <span className="badge badge-success shrink-0">{progress}%</span>
      </div>

      <p className="mt-2 text-xs text-muted">
        Clientes na loja acompanham este progresso em tempo real.
      </p>

      <div className="apiary-live-track">
        <motion.div
          className="apiary-live-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step?.stepId || 'wait'}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="min-h-[4rem]"
        >
          {step ? (
            <>
              <p className="apiary-live-step-title">{step.title}</p>
              <p className="apiary-live-step-msg">{step.message}</p>
              {step.completed && (
                <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  Pronto. Redirecionando para o login…
                </p>
              )}
            </>
          ) : (
            <p className="apiary-live-step-msg">Preparando ambiente…</p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}