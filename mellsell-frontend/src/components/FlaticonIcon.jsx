import { useEffect, useState } from 'react'

/**
 * Ícones estáticos (Flaticon PNG) e animados Lottie onde o arquivo combina com o significado.
 * Ver public/icons/flaticon/ATTRIBUTION.md e public/icons/lottie/ATTRIBUTION.md
 */
const ICONS = {
  honey: '/icons/flaticon/honey.png',
  bee: '/icons/flaticon/bee.png',
  /** Barraca / loja do fornecedor (ícone enviado pelo usuário) */
  vendor: '/icons/flaticon/vendor.png',
  cart: '/icons/flaticon/cart.png',
  package: '/icons/flaticon/package.png',
  search: '/icons/flaticon/search.png',
  store: '/icons/flaticon/store.png',
  user: '/icons/flaticon/user.png',
  coupon: '/icons/flaticon/coupon.png',
  promotion: '/icons/flaticon/promotion.png',
}

/** Só entradas com animação que faz sentido (evita “duas pessoas” em fornecedor, etc.). */
const LOTTIE = {
  bee: '/icons/lottie/bee.json',
  search: '/icons/lottie/search.json',
  package: '/icons/lottie/package.json',
}

const SIZES = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
  '2xl': 48,
  hero: 64,
}

const lottieCache = new Map()
let lottieModulePromise = null

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function loadLottieModule() {
  if (!lottieModulePromise) {
    lottieModulePromise = import('lottie-react').then((m) => m.default)
  }
  return lottieModulePromise
}

async function loadLottieData(url) {
  if (lottieCache.has(url)) return lottieCache.get(url)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Lottie ${url}`)
  const data = await res.json()
  lottieCache.set(url, data)
  return data
}

/**
 * @param {keyof typeof ICONS} name
 * @param {'xs'|'sm'|'md'|'lg'|'xl'|'2xl'|'hero'|number} [size='md']
 * @param {boolean} [animated=false]
 * @param {string} [className]
 * @param {string} [alt='']
 */
export default function FlaticonIcon({
  name,
  size = 'md',
  animated = false,
  className = '',
  alt = '',
}) {
  const px = typeof size === 'number' ? size : SIZES[size] ?? SIZES.md
  const staticSrc = ICONS[name]
  const lottieSrc = LOTTIE[name]
  const [animationData, setAnimationData] = useState(null)
  const [LottiePlayer, setLottiePlayer] = useState(null)
  const useMotion = animated && lottieSrc && !prefersReducedMotion()

  useEffect(() => {
    if (!useMotion) {
      setAnimationData(null)
      setLottiePlayer(null)
      return undefined
    }
    let cancelled = false
    Promise.all([loadLottieModule(), loadLottieData(lottieSrc)])
      .then(([Lottie, data]) => {
        if (!cancelled) {
          setLottiePlayer(() => Lottie)
          setAnimationData(data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAnimationData(null)
          setLottiePlayer(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [useMotion, lottieSrc])

  const wrapClass = `flaticon-icon-wrap ${className}`.trim()

  if (useMotion && animationData && LottiePlayer) {
    return (
      <span
        className={wrapClass}
        style={{ width: px, height: px, display: 'inline-flex' }}
        aria-hidden={!alt}
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
      >
        <LottiePlayer
          animationData={animationData}
          loop
          autoplay
          className="flaticon-lottie"
          style={{ width: px, height: px }}
        />
      </span>
    )
  }

  if (!staticSrc) return null

  return (
    <img
      src={staticSrc}
      alt={alt}
      width={px}
      height={px}
      className={`flaticon-icon ${className}`.trim()}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  )
}

export { ICONS, LOTTIE }