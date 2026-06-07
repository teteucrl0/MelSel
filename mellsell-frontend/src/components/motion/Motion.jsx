import React, { useEffect, useState, useRef } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { lockBodyScroll, unlockBodyScroll } from '../../utils/bodyScrollLock'

/** Bloqueia scroll do documento enquanto `open`; libera no cleanup (fecha ou desmonta). */
function useBodyScrollLock(open) {
  useEffect(() => {
    if (!open) return undefined
    lockBodyScroll()
    return () => {
      unlockBodyScroll()
    }
  }, [open])
}
import { pageVariants } from './motionVariants'

export function MotionPage({ children, className = '' }) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  )
}

export function MotionListItem({ children, index = 0, className = '' }) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: Math.min(index * 0.06, 0.36),
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  )
}

export function MotionAlert({ children, className = '' }) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

/** Container for staggered children lists/grids */
export function StaggerContainer({ children, className = '', delayChildren = 0.03, staggerChildren = 0.06 }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren: reduceMotion ? 0 : delayChildren,
            staggerChildren: reduceMotion ? 0 : staggerChildren,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className = '' }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className={className}
      variants={{
        hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

/** Animated number counter (great for stats, revenue, etc) */
export function AnimatedNumber({ value, duration = 0.9, className = '' }) {
  const reduceMotion = useReducedMotion()
  const [display, setDisplay] = useState(0)
  const prevRef = useRef(0)

  useEffect(() => {
    const target = Number(value) || 0
    if (reduceMotion) {
      setDisplay(target)
      prevRef.current = target
      return
    }
    const start = prevRef.current
    const diff = target - start
    const startTime = performance.now()

    let raf
    const step = (now) => {
      const t = Math.min((now - startTime) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setDisplay(Math.round(start + diff * eased))
      if (t < 1) {
        raf = requestAnimationFrame(step)
      } else {
        setDisplay(target)
        prevRef.current = target
      }
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, duration, reduceMotion])

  return <span className={className}>{display}</span>
}

/** Nice modal with framer (backdrop + panel spring). Use inside any page. */
export function MotionModal({ open, onClose, children, className = '', maxWidth = '32rem' }) {
  const reduceMotion = useReducedMotion()
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  useBodyScrollLock(open)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const panelScroll = className.includes('overflow-hidden') ? '' : 'overflow-y-auto '

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[100] overflow-hidden p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex min-h-full items-end justify-center sm:items-center">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.1 : 0.18 }}
            onClick={() => onClose?.()}
          />

          {/* Panel */}
          <motion.div
            className={`relative z-[1] w-full max-h-[min(92vh,720px)] overscroll-contain surface-elevated ${panelScroll}${className}`}
            style={{ maxWidth }}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.8 }}
          >
            {children}
          </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

/** Slide-in drawer (ideal for cart, mobile nav, side panels) */
export function MotionDrawer({ open, onClose, side = 'right', children, className = '', width = '380px' }) {
  const reduceMotion = useReducedMotion()
  const fromX = side === 'right' ? '100%' : '-100%'
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  useBodyScrollLock(open)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => onClose?.()}
          />
          <motion.div
            className={`fixed top-0 bottom-0 ${side === 'right' ? 'right-0' : 'left-0'} z-[120] flex h-dvh max-h-dvh flex-col overflow-hidden surface shadow-2xl ${className}`}
            style={{ width: 'min(92vw, ' + width + ')' }}
            initial={{ x: fromX }}
            animate={{ x: 0 }}
            exit={{ x: fromX }}
            transition={{ type: 'spring', stiffness: 320, damping: 34, mass: 0.9 }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* =========================================
   MORE DELIGHTFUL FRAMER MOTION UTILITIES
   For impeccable, buttery UI
========================================= */

export const variants = {
  // Gentle page enter
  pageEnter: {
    hidden: { opacity: 0, y: 16 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } 
    },
    exit: { 
      opacity: 0, 
      y: -12, 
      transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } 
    },
  },

  // Pop / scale in (great for cards, modals, success)
  popIn: {
    hidden: { opacity: 0, scale: 0.92, y: 8 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 420, damping: 28, mass: 0.7 }
    },
    exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15 } }
  },

  // Subtle slide up for lists
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: { 
        delay: i * 0.035, 
        duration: 0.32, 
        ease: [0.22, 1, 0.36, 1] 
      }
    }),
  },

  // For buttons and tappable elements
  button: {
    tap: { scale: 0.975 },
    hover: { scale: 1.015 },
  },

  // Stock / number change pop
  numberPop: {
    initial: { scale: 1.15, color: 'var(--color-brand-500)' },
    animate: { scale: 1, color: 'inherit' },
    transition: { type: 'spring', stiffness: 500, damping: 18 }
  },

  // Add to cart success burst
  addSuccess: {
    initial: { scale: 0.6, opacity: 0 },
    animate: { scale: [0.6, 1.15, 1], opacity: 1 },
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
  }
}

/** Premium button with built-in spring interactions */
export function AnimatedButton({ 
  children, 
  className = '', 
  as: Component = 'button', 
  ...props 
}) {
  const reduceMotion = useReducedMotion()
  const MotionComp = motion[Component] || motion.button

  if (reduceMotion) {
    return (
      <Component className={className} {...props}>
        {children}
      </Component>
    )
  }

  return (
    <MotionComp
      className={className}
      whileHover={variants.button.hover}
      whileTap={variants.button.tap}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      {...props}
    >
      {children}
    </MotionComp>
  )
}

/** Enhanced MotionPage with exit support for route transitions */
export function MotionPageWithExit({ children, className = '' }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className={className}
      variants={variants.pageEnter}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {children}
    </motion.div>
  )
}

/** List that handles add/remove with AnimatePresence + stagger */
export function AnimatedList({ children, className = '' }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div className={className} initial="hidden" animate="visible">
      <AnimatePresence>
        {React.Children.map(children, (child, index) => (
          <motion.div
            key={child?.key || index}
            variants={variants.slideUp}
            custom={index}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: 10, transition: { duration: 0.2 } }}
            layout
          >
            {child}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}

/** Small success indicator (use after add to cart etc) */
export function SuccessPop({ children, className = '' }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.span
      className={className}
      initial={reduceMotion ? false : variants.addSuccess.initial}
      animate={reduceMotion ? false : variants.addSuccess.animate}
      transition={variants.addSuccess.transition}
    >
      {children}
    </motion.span>
  )
}

// Note: React is already imported at top for AnimatedList
