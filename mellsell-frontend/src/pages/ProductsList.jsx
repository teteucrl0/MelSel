import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import productService from '../services/productService'
import { normalizeQuery, parseSupplierId, SEARCH_DEBOUNCE_MS } from '../utils/catalogSearch'
import cartService from '../services/cartService'
import { getApiErrorMessage } from '../utils/apiErrorMessage'
import { notifyCartUpdated } from '../utils/cartEvents'
import useStockSync from '../hooks/useStockSync'
import useMySupplierId from '../hooks/useMySupplierId'
import CustomerProductCard from '../components/shop/CustomerProductCard'
import ProducerStoryCard from '../components/shop/ProducerStoryCard'
import {
  HoneycombStamp,
  WildflowerStamp,
  FieldLinesStamp,
  BeeTrailIcon,
} from '../components/shop/ThematicIllustrations'
import FlaticonIcon from '../components/FlaticonIcon'

const PAGE_SIZE = 24

// Categorias locais (regex no nome); backend não expõe ?category em GET /api/products.
const FILTERS = [
  { id: 'Todos', label: 'Todos' },
  { id: 'Mel', label: 'Mel puro' },
  { id: 'Kits', label: 'Kits' },
  { id: 'Própolis', label: 'Própolis' },
  { id: 'Pólen', label: 'Pólen' },
]

const FILTER_RULES = {
  Todos: () => true,
  Mel: (p) => /mel/i.test(p.name || ''),
  Kits: (p) => /kit/i.test(p.name || ''),
  Própolis: (p) => /pr[oó]polis|extrato/i.test(p.name || ''),
  Pólen: (p) => /p[oó]len|gr[aã]o/i.test(p.name || ''),
}

const PRODUCER_STORIES = [
  {
    name: 'Família Nogueira',
    region: 'Serra da Mantiqueira • MG',
    specialty: 'Mel silvestre de flor de campo',
    story: 'Três gerações cuidando das colmeias ao redor do pomar, com colheita manual e descanso natural dos favos.',
  },
  {
    name: 'Sítio Boa Aurora',
    region: 'Vale do Ribeira • SP',
    specialty: 'Própolis verde sazonal',
    story: 'Apiário familiar em área de mata nativa. A produção respeita o ciclo das abelhas e a saúde da flora local.',
  },
  {
    name: 'Apiário Santa Luzia',
    region: 'Chapada Diamantina • BA',
    specialty: 'Mel multifloral artesanal',
    story: 'Colheitas pequenas com rastreio por lote, contando a história de cada safra direto do campo para a sua mesa.',
  },
]

export default function ProductsList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQuery = normalizeQuery(searchParams.get('q')) || ''
  const supplierIdParam = searchParams.get('supplierId')
  const activeSupplierId = parseSupplierId(supplierIdParam)

  const [products, setProducts] = useState([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState(urlQuery)
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [addingId, setAddingId] = useState(null)
  const [toast, setToast] = useState(null)
  const { supplierId: mySupplierId, loading: supplierLoading, isVendor } = useMySupplierId()

  useEffect(() => {
    setSearchTerm(urlQuery)
  }, [urlQuery])

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const patchStock = useCallback((productId, stock) => {
    setProducts((prev) =>
      prev.map((p) => (Number(p.id) === Number(productId) ? { ...p, stock } : p))
    )
  }, [])

  useStockSync(useCallback((u) => patchStock(u.productId, u.stock), [patchStock]))

  const loadPage = useCallback(
    async (pageNum, append) => {
      if (append) setLoadingMore(true)
      else setLoading(true)
      setError('')
      try {
        const res = await productService.list(
          normalizeQuery(searchTerm),
          activeSupplierId,
          pageNum,
          PAGE_SIZE,
        )
        const batch = res?.content || res || []
        setProducts((prev) => (append ? [...prev, ...batch] : batch))
        setPage(pageNum)
        setHasMore(res?.totalPages != null ? pageNum + 1 < res.totalPages : batch.length >= PAGE_SIZE)
      } catch {
        if (!append) setProducts([])
        setError('Não foi possível carregar os produtos. Tente recarregar a página.')
        setHasMore(false)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [searchTerm, activeSupplierId]
  )

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      if (!cancelled) loadPage(0, false)
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [loadPage])

  const applyFilter = (id) => {
    setActiveFilter(id)
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const rule = FILTER_RULES[activeFilter] || FILTER_RULES.Todos
  // q e supplierId vêm filtrados da API; só categoria (chip) é filtrada no cliente.
  const visible = products.filter((p) => rule(p))

  const quickAdd = async (product) => {
    if (!localStorage.getItem('token')) {
      navigate('/login', { state: { from: { pathname: '/' } } })
      return
    }
    if (
      isVendor &&
      !supplierLoading &&
      mySupplierId != null &&
      product.supplierId != null &&
      Number(product.supplierId) === Number(mySupplierId)
    ) {
      setToast({ type: 'err', text: 'Este é o seu produto — gerencie no painel do produtor.' })
      return
    }

    const prevStock = product.stock
    setAddingId(product.id)
    if (prevStock != null) patchStock(product.id, Math.max(0, prevStock - 1))

    try {
      const data = await cartService.addItem(product.id, 1)
      if (data?.stockRemaining != null) patchStock(product.id, data.stockRemaining)
      setToast({ type: 'ok', text: `${product.name} — adicionado ao carrinho` })
      notifyCartUpdated({ action: 'add', productId: product.id, quantity: 1 })
    } catch (err) {
      if (prevStock != null) patchStock(product.id, prevStock)
      setToast({ type: 'err', text: getApiErrorMessage(err, 'Não foi possível adicionar.') })
    } finally {
      setAddingId(null)
    }
  }

  return (
    <>
      {toast && (
        <div className={`shop-toast shop-toast--${toast.type === 'ok' ? 'ok' : 'err'}`} role="status">
          {toast.text}
        </div>
      )}

      <section className="shop-hero">
        <span className="shop-hero-badge">
          <BeeTrailIcon className="shop-hero-badge-icon" />
          Fazenda • Apiário • Família
        </span>
        <h1>
          Mel de verdade,<br /><em>feito por mãos de família</em>
        </h1>
        <p className="shop-hero-lead">
          Uma seleção acolhedora de pequenos apiários brasileiros, com sabor de campo, simplicidade e cuidado em cada colheita.
        </p>
        <div className="shop-hero-motifs" aria-hidden>
          <HoneycombStamp className="shop-hero-motif" />
          <WildflowerStamp className="shop-hero-motif" />
          <FieldLinesStamp className="shop-hero-motif" />
        </div>
        <div className="shop-trust-row">
          <span><HoneycombStamp className="shop-trust-icon" />Lotes de origem rastreada</span>
          <span><WildflowerStamp className="shop-trust-icon" />Produtores familiares verificados</span>
          <span><FieldLinesStamp className="shop-trust-icon" />Entrega com cuidado do campo à cidade</span>
        </div>
      </section>

      {supplierIdParam && activeSupplierId == null && (
        <div className="shop-search-active-banner mb-4 shop-search-active-banner--warn">
          <span>Fornecedor inválido na URL — mostrando catálogo completo</span>
          <button
            type="button"
            className="shop-search-active-clear"
            onClick={() => {
              const next = new URLSearchParams(searchParams)
              next.delete('supplierId')
              setSearchParams(next, { replace: true })
            }}
          >
            Remover
          </button>
        </div>
      )}

      {(urlQuery || activeSupplierId != null) && (
        <div className="shop-search-active-banner mb-4">
          <span>
            {urlQuery && activeSupplierId != null && (
              <>
                <strong>&quot;{urlQuery}&quot;</strong> neste fornecedor
              </>
            )}
            {urlQuery && activeSupplierId == null && (
              <>
                Resultados para <strong>&quot;{urlQuery}&quot;</strong> — use a busca no topo para sugestões ao digitar
              </>
            )}
            {!urlQuery && activeSupplierId != null && <>Produtos deste fornecedor</>}
          </span>
          <div className="shop-search-active-banner-actions">
            {urlQuery && (
              <button
                type="button"
                className="shop-search-active-clear"
                onClick={() => {
                  const next = new URLSearchParams(searchParams)
                  next.delete('q')
                  setSearchParams(next, { replace: true })
                }}
              >
                Limpar busca
              </button>
            )}
            {activeSupplierId != null && (
              <button
                type="button"
                className="shop-search-active-clear"
                onClick={() => {
                  const next = new URLSearchParams(searchParams)
                  next.delete('supplierId')
                  setSearchParams(next, { replace: true })
                }}
              >
                Ver tudo
              </button>
            )}
          </div>
        </div>
      )}

      <div id="catalogo" className="shop-categories" role="tablist" aria-label="Categorias">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={activeFilter === f.id}
            className={`shop-chip ${activeFilter === f.id ? 'is-active' : ''}`}
            onClick={() => applyFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="shop-section-head">
        <div>
          <h2>Seleção da temporada</h2>
          <p>{loading ? 'Carregando…' : `${visible.length} ${visible.length === 1 ? 'item' : 'itens'}`}</p>
        </div>
      </div>

      {error && (
        <p className="shop-alert shop-alert--err mb-4" role="alert">{error}</p>
      )}

      {loading ? (
        <div className={`shop-product-grid ${urlQuery ? 'shop-product-grid--searching' : ''}`}>
          {urlQuery && (
            <div className="shop-catalog-search-loader col-span-full" aria-live="polite">
              <div className="shop-catalog-search-loader-orbit" aria-hidden>
                <FlaticonIcon name="bee" size="md" animated />
              </div>
              <p>Buscando &quot;{urlQuery}&quot;…</p>
              <div className="shop-catalog-search-loader-bar">
                <span />
              </div>
            </div>
          )}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="shop-card animate-pulse">
              <div className="shop-card-image shop-skeleton" />
              <div className="shop-card-body space-y-2">
                <div className="shop-skeleton h-3 w-2/3" />
                <div className="shop-skeleton h-4 w-full" />
                <div className="shop-skeleton h-5 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="shop-empty">
          <span className="shop-empty-icon" aria-hidden>
            <FlaticonIcon name="honey" size="hero" />
          </span>
          <h2>Nenhum produto encontrado</h2>
          <p>Tente outra busca ou categoria.</p>
          <button
            type="button"
            className="shop-btn-primary mt-2 max-w-xs"
            onClick={() => {
              setSearchTerm('')
              setActiveFilter('Todos')
              setSearchParams({}, { replace: true })
            }}
          >
            Ver catálogo completo
          </button>
        </div>
      ) : (
        <div className="shop-product-grid">
          {visible.map((product) => (
            <CustomerProductCard
              key={product.id}
              product={product}
              adding={addingId === product.id}
              onQuickAdd={quickAdd}
            />
          ))}
        </div>
      )}

      {hasMore && !loading && visible.length > 0 && (
        <div className="mt-8 text-center">
          <button type="button" className="shop-btn-secondary" disabled={loadingMore} onClick={() => loadPage(page + 1, true)}>
            {loadingMore ? 'Carregando…' : 'Carregar mais produtos'}
          </button>
        </div>
      )}

      <section className="shop-steps" aria-labelledby="como-comprar">
        <h3 id="como-comprar">Como comprar em 3 passos</h3>
        <div className="shop-steps-grid">
          <div className="shop-step">
            <div className="shop-step-num">1</div>
            <strong>Escolha o mel</strong>
            <p>Veja fotos, preço e quem produziu cada item.</p>
          </div>
          <div className="shop-step">
            <div className="shop-step-num">2</div>
            <strong>Adicione ao carrinho</strong>
            <p>Revise quantidades antes de pagar.</p>
          </div>
          <div className="shop-step">
            <div className="shop-step-num">3</div>
            <strong>Receba em casa</strong>
            <p>Finalize com seu CEP e acompanhe a entrega.</p>
          </div>
        </div>
      </section>

      <section className="shop-producer-stories" aria-labelledby="historias-dos-produtores">
        <div className="shop-section-head">
          <div>
            <h2 id="historias-dos-produtores">Quem produz o seu mel</h2>
            <p>Faces reais, histórias simples e produção artesanal.</p>
          </div>
        </div>
        <div className="shop-producer-grid">
          {PRODUCER_STORIES.map((producer, idx) => (
            <ProducerStoryCard
              key={producer.name}
              {...producer}
              icon={
                idx === 0
                  ? <HoneycombStamp className="shop-producer-icon-svg" />
                  : idx === 1
                    ? <WildflowerStamp className="shop-producer-icon-svg" />
                    : <FieldLinesStamp className="shop-producer-icon-svg" />
              }
            />
          ))}
        </div>
      </section>
    </>
  )
}