import { useEffect, useMemo, useState } from 'react'
import productService from '../services/productService'
import cartService from '../services/cartService'
import ProductCard from '../components/ProductCard'

const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function ProductSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/20">
      <div className="animate-pulse">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="h-6 w-24 rounded-full bg-white/10" />
            <div className="h-12 w-12 rounded-2xl bg-white/10" />
          </div>
          <div className="h-16 w-28 rounded-2xl bg-white/10" />
        </div>
        <div className="h-6 w-3/4 rounded bg-white/10" />
        <div className="mt-3 h-4 rounded bg-white/10" />
        <div className="mt-2 h-4 w-5/6 rounded bg-white/10" />
        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="h-4 w-24 rounded bg-white/10" />
          <div className="flex gap-2">
            <div className="h-10 w-28 rounded-full bg-white/10" />
            <div className="h-10 w-28 rounded-full bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ query, onClear }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/15 bg-slate-900/60 p-10 text-center shadow-lg shadow-slate-950/20">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/15 text-2xl">
        🔎
      </div>
      <h3 className="mt-5 text-xl font-semibold text-white">
        {query ? 'Nenhum produto encontrado' : 'Catálogo vazio'}
      </h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300">
        {query
          ? 'Tente outro termo de busca para encontrar itens com mais facilidade.'
          : 'Quando os produtos estiverem cadastrados no backend, eles aparecerão aqui com cards, preços e ações rápidas.'}
      </p>
      {query && (
        <button
          type="button"
          onClick={onClear}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
        >
          Limpar busca
        </button>
      )}
    </div>
  )
}

export default function ProductsList() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [addingId, setAddingId] = useState(null)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await productService.list(searchTerm || null, null, 0, 24)
        if (!active) return
        setProducts(response?.content || response || [])
      } catch (err) {
        if (!active) return
        setProducts([])
        setError('Não foi possível carregar o catálogo agora. Tente novamente em instantes.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [searchTerm])

  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(null), 3500)
    return () => clearTimeout(timer)
  }, [notice])

  const totalProducts = products.length
  const averagePrice = useMemo(() => {
    if (!products.length) return null
    const sum = products.reduce((acc, product) => acc + Number(product.price ?? 0), 0)
    return money.format(sum / products.length)
  }, [products])

  const add = async (productId) => {
    setAddingId(productId)
    try {
      await cartService.addItem(productId, 1)
      setNotice({ type: 'success', text: 'Produto adicionado ao carrinho.' })
    } catch {
      setNotice({ type: 'error', text: 'Falha ao adicionar ao carrinho.' })
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 shadow-2xl shadow-slate-950/30">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">
              Marketplace MEL-SELL
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
              Catálogo com aparência de produto pronto para venda.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Explore produtos, filtre pelo que você procura e adicione ao carrinho com uma
              experiência mais clara, consistente e responsiva.
            </p>

            <form
              onSubmit={(event) => event.preventDefault()}
              className="mt-6 flex flex-col gap-3 sm:flex-row"
            >
              <label htmlFor="catalog-search" className="sr-only">
                Buscar produtos
              </label>
              <input
                id="catalog-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nome, descrição ou termo do catálogo"
                className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-amber-400/40 focus:bg-white/10"
              />
              <button
                type="button"
                onClick={() => setQuery('')}
                className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
              >
                Limpar
              </button>
            </form>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Itens</div>
              <div className="mt-2 text-3xl font-black text-white">{loading ? '—' : totalProducts}</div>
              <p className="mt-2 text-sm text-slate-300">Produtos retornados pelo backend.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Preço médio</div>
              <div className="mt-2 text-2xl font-black text-amber-300">
                {loading ? '—' : averagePrice || '—'}
              </div>
              <p className="mt-2 text-sm text-slate-300">Resumo rápido do catálogo visível.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Integração</div>
              <div className="mt-2 text-2xl font-black text-emerald-300">Online</div>
              <p className="mt-2 text-sm text-slate-300">Listagem e carrinho continuam conectados à API.</p>
            </div>
          </div>
        </div>
      </section>

      {notice && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            notice.type === 'success'
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100'
              : 'border-rose-500/20 bg-rose-500/10 text-rose-100'
          }`}
          role="status"
          aria-live="polite"
        >
          {notice.text}
        </div>
      )}

      <section aria-busy={loading} className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Catálogo</h2>
            <p className="mt-1 text-sm text-slate-400">
              {loading
                ? 'Carregando produtos...'
                : error
                  ? 'Falha ao carregar'
                  : `${totalProducts} produto${totalProducts === 1 ? '' : 's'} encontrado${totalProducts === 1 ? '' : 's'}`}
            </p>
          </div>

          {!loading && query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
            >
              Ver tudo
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                loading={addingId === product.id}
                onAdd={add}
              />
            ))}
          </div>
        ) : (
          <EmptyState query={searchTerm} onClear={() => setQuery('')} />
        )}
      </section>
    </div>
  )
}
