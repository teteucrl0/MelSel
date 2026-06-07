/** Busca unificada da loja — autocomplete de produtores e produtos */
import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import productService from '../../services/productService'
import { SEARCH_DEBOUNCE_MS } from '../../utils/catalogSearch'
import { buildSuggestions } from '../../utils/shopSearchUtils'
import FlaticonIcon from '../FlaticonIcon'

const MIN_CHARS = 2

export default function ShopSearch({
  value,
  onChange,
  onSubmit,
  placeholder = 'Buscar mel ou produtor…',
  className = '',
  inputClassName = '',
}) {
  const navigate = useNavigate()
  const listId = useId()
  const wrapRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState({ suppliers: [], products: [] })

  useEffect(() => {
    const q = value.trim()
    if (q.length < MIN_CHARS) {
      setSuggestions({ suppliers: [], products: [] })
      setLoading(false)
      return undefined
    }

    let cancelled = false
    const timer = setTimeout(() => {
      setLoading(true)
      productService
        .list(q, null, 0, 40)
        .then((res) => {
          if (cancelled) return
          const batch = res?.content || res || []
          setSuggestions(buildSuggestions(batch, q))
          setOpen(true)
        })
        .catch(() => {
          if (!cancelled) setSuggestions({ suppliers: [], products: [] })
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [value])

  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const goCatalog = (q) => {
    const trimmed = q.trim()
    onSubmit?.(trimmed)
    setOpen(false)
  }

  const pickSupplier = (supplier) => {
    const sid = supplier?.id
    navigate(sid != null ? `/?supplierId=${encodeURIComponent(String(sid))}` : '/')
    onChange('')
    setOpen(false)
  }

  const pickProduct = (product) => {
    navigate(`/product/${product.id}`)
    onChange('')
    setOpen(false)
  }

  const hasResults =
    value.trim().length >= MIN_CHARS &&
    (suggestions.suppliers.length > 0 || suggestions.products.length > 0)

  const showPanel = open && value.trim().length >= MIN_CHARS

  return (
    <div ref={wrapRef} className={`shop-search-wrap shop-search-autocomplete ${className}`.trim()}>
      <span className="shop-search-icon" aria-hidden>
        <FlaticonIcon name="search" size="xs" />
      </span>
      <input
        type="search"
        className={`shop-search ${loading ? 'shop-search--loading' : ''} ${inputClassName}`.trim()}
        placeholder={placeholder}
        title="Buscar produtos e fornecedores"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          if (e.target.value.trim().length >= MIN_CHARS) setOpen(true)
        }}
        onFocus={() => {
          if (value.trim().length >= MIN_CHARS) setOpen(true)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            goCatalog(value)
          }
          if (e.key === 'Escape') setOpen(false)
        }}
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
      />

      <AnimatePresence mode="wait">
        {showPanel && (
        <motion.div
          key="search-panel"
          id={listId}
          className={`shop-search-panel ${loading ? 'shop-search-panel--loading' : ''}`}
          role="listbox"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          {loading && (
            <div className="shop-search-loading" aria-live="polite" aria-busy="true">
              <div className="shop-search-loading-orbit" aria-hidden>
                <span className="shop-search-loading-bee">
                  <FlaticonIcon name="bee" size="md" animated />
                </span>
              </div>
              <p className="shop-search-loading-text">Procurando mel e produtores…</p>
              <div className="shop-search-loading-bar">
                <span className="shop-search-loading-bar-fill" />
              </div>
            </div>
          )}

          {!loading && !hasResults && (
            <p className="shop-search-panel-hint">Nenhum produtor ou produto para &quot;{value.trim()}&quot;</p>
          )}

          {!loading && suggestions.suppliers.length > 0 && (
            <motion.div
              className="shop-search-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 }}
            >
              <p className="shop-search-section-title">Fornecedores</p>
              <ul>
                {suggestions.suppliers.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className="shop-search-item"
                      role="option"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickSupplier(s)}
                    >
                      <span className="shop-search-item-icon" aria-hidden>
                        <FlaticonIcon name="vendor" size="sm" className="flaticon-icon--vendor-stall" />
                      </span>
                      <span className="shop-search-item-text">
                        <strong>{s.name}</strong>
                        <span className="shop-search-item-meta">
                          {s.productCount} produto{s.productCount !== 1 ? 's' : ''} na loja
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {!loading && suggestions.products.length > 0 && (
            <motion.div
              className="shop-search-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <p className="shop-search-section-title">Produtos</p>
              <ul>
                {suggestions.products.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="shop-search-item"
                      role="option"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickProduct(p)}
                    >
                      <span className="shop-search-item-icon" aria-hidden>
                        <FlaticonIcon name="honey" size="sm" />
                      </span>
                      <span className="shop-search-item-text">
                        <strong>{p.name}</strong>
                        {p.supplierName && (
                          <span className="shop-search-item-meta">{p.supplierName}</span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {!loading && hasResults && (
            <motion.button
              type="button"
              className="shop-search-see-all"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => goCatalog(value)}
            >
              Ver todos os resultados para &quot;{value.trim()}&quot;
            </motion.button>
          )}
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}