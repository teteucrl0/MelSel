import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/shop.css'
import './styles/components/FormInput.css'
import './styles/components/Button.css'
import App from './app/App.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { resetBodyScrollLock } from './utils/bodyScrollLock'

const rootEl = document.getElementById('root')

function showBootError(message) {
  if (!rootEl) return
  const safe = String(message)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  rootEl.innerHTML = `
    <div style="font-family:system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0a;color:#f5f2eb;padding:2rem;">
      <div style="max-width:28rem;width:100%;background:#141210;border:1px solid #2a2724;border-radius:0.75rem;padding:1.5rem;">
        <h1 style="font-size:1.125rem;margin:0 0 0.75rem;color:#f5f2eb;">MelSell não iniciou</h1>
        <p style="font-size:0.875rem;margin:0 0 1rem;color:#a8a29e;">Recarregue com <strong>Ctrl+Shift+R</strong>. Use <strong>http://localhost:5173</strong> (npm run dev).</p>
        <pre style="font-size:0.75rem;background:#1c1917;color:#d6d3d1;padding:0.75rem;border-radius:0.5rem;overflow:auto;white-space:pre-wrap;border:1px solid #2a2724;">${safe}</pre>
      </div>
    </div>`
}

function mount() {
  if (!rootEl) {
    showBootError('Elemento #root não encontrado no HTML.')
    return
  }
  createRoot(rootEl).render(
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>,
  )
}

window.addEventListener('error', (event) => {
  console.error('[MelSell]', event.error || event.message)
})

window.addEventListener('unhandledrejection', (event) => {
  const msg = event?.reason?.message || String(event?.reason || '')
  if (/sockjs|global|websocket|stomp/i.test(msg)) {
    console.warn('[MelSell] Tempo real indisponível:', msg)
    event.preventDefault()
  }
})

/** Recarrega quando o Vite invalida chunks lazy após HMR (evita tela branca). */
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  console.warn('[MelSell] Chunk desatualizado após HMR — recarregando…')
  window.location.reload()
})

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    resetBodyScrollLock()
  })
}

try {
  mount()
} catch (err) {
  console.error(err)
  showBootError(err?.message || String(err))
}