import { lazy } from 'react'

const CHUNK_ERROR_RE =
  /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk|Loading CSS chunk/i

function isChunkLoadError(err) {
  return CHUNK_ERROR_RE.test(err?.message || String(err || ''))
}

async function loadPageModule(importFn, label, retriesLeft = 1) {
  try {
    const mod = await importFn()
    if (mod?.default) return mod
    throw new Error(
      `Módulo "${label}" não exportou componente. Recarregue com Ctrl+Shift+R ou reinicie o Vite (npm run dev).`,
    )
  } catch (err) {
    if (isChunkLoadError(err) && retriesLeft > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, 400))
      return loadPageModule(importFn, label, retriesLeft - 1)
    }
    if (isChunkLoadError(err) && typeof window !== 'undefined') {
      const key = `mellsell:chunk-reload:${label}`
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1')
        window.location.reload()
        return new Promise(() => {})
      }
      sessionStorage.removeItem(key)
    }
    throw err
  }
}

/** Evita tela de erro quando o chunk lazy vem undefined (cache/HMR do Vite). */
export function lazyPage(importFn, label = 'página') {
  return lazy(() => loadPageModule(importFn, label))
}

export { isChunkLoadError }