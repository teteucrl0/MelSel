/** Evita que vários modais/drawers deixem o body com overflow bloqueado ao fechar. */
let lockCount = 0
let savedBodyOverflow = ''
let savedHtmlOverflow = ''
let savedBodyPosition = ''
let savedBodyTop = ''
let savedBodyLeft = ''
let savedBodyRight = ''
let savedBodyWidth = ''
let savedScrollY = 0

function applyLock() {
  savedScrollY = window.scrollY
  savedBodyOverflow = document.body.style.overflow
  savedHtmlOverflow = document.documentElement.style.overflow
  savedBodyPosition = document.body.style.position
  savedBodyTop = document.body.style.top
  savedBodyLeft = document.body.style.left
  savedBodyRight = document.body.style.right
  savedBodyWidth = document.body.style.width
  document.documentElement.style.overflow = 'hidden'
  document.body.style.overflow = 'hidden'
  document.body.style.position = 'fixed'
  document.body.style.top = `-${savedScrollY}px`
  document.body.style.left = '0'
  document.body.style.right = '0'
  document.body.style.width = '100%'
}

function applyUnlock() {
  const scrollY = savedScrollY
  document.documentElement.style.overflow = savedHtmlOverflow
  document.body.style.overflow = savedBodyOverflow
  document.body.style.position = savedBodyPosition
  document.body.style.top = savedBodyTop
  document.body.style.left = savedBodyLeft
  document.body.style.right = savedBodyRight
  document.body.style.width = savedBodyWidth
  savedBodyOverflow = ''
  savedHtmlOverflow = ''
  savedBodyPosition = ''
  savedBodyTop = ''
  savedBodyLeft = ''
  savedBodyRight = ''
  savedBodyWidth = ''
  savedScrollY = 0
  window.scrollTo(0, scrollY)
}

export function lockBodyScroll() {
  if (lockCount === 0) {
    applyLock()
  }
  lockCount += 1
}

export function unlockBodyScroll() {
  if (lockCount <= 0) {
    lockCount = 0
    return
  }
  lockCount -= 1
  if (lockCount === 0) {
    applyUnlock()
  }
}

/** Recuperação se refcount ficar inconsistente (ex.: HMR, navegação, modal desmontado cedo). */
export function resetBodyScrollLock() {
  if (lockCount === 0) return
  lockCount = 0
  applyUnlock()
}

export function isBodyScrollLocked() {
  return lockCount > 0
}