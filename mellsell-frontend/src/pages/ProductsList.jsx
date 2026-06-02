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
    <div className="overflow-hidden rounded-lg border-2 border-amber-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-md">
      <div className="animate-pulse">
        <div className="flex items-start justify-between gap-4 border-b-2 border-amber-100 dark:border-slate-800 pb-4">
          <div className="space-y-2">
            <div className="h-5 w-20 rounded bg-amber-100 dark:bg-slate-800" />
            <div className="h-10 w-10 rounded bg-amber-100 dark:bg-slate-800" />
          </div>
          <div className="h-14 w-24 rounded bg-amber-100 dark:bg-slate-800" />
        </div>
        <div className="mt-4 h-5 w-3/4 rounded bg-amber-100 dark:bg-slate-800" />
        <div className="mt-2 h-4 rounded bg-amber-100 dark:bg-slate-800" />
        <div className="mt-4 flex items-center justify-between gap-3 border-t-2 border-amber-100 dark:border-slate-800 pt-3">
          <div className="h-4 w-20 rounded bg-amber-100 dark:bg-slate-800" />
          <div className="flex gap-2">
            <div className="h-9 w-24 rounded bg-amber-100 dark:bg-slate-800" />
            <div className="h-9 w-24 rounded bg-amber-100 dark:bg-slate-800" />
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ query, onClear }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-amber-300 dark:border-slate-700 bg-amber-50 dark:bg-slate-900 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-amber-200 dark:bg-slate-800 text-xl">
        🍯
      </div>
      <h3 className="mt-4 font-serif text-xl font-bold text-amber-900 dark:text-white">
        {query ? 'Nenhum produto encontrado' : 'Catálogo vazio'}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-amber-700 dark:text-slate-400">
        {query
          ? 'Tente outro termo de busca.'
          : 'Os produtos aparecerão aqui quando cadastrados.'}
      </p>
      {query && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
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
        setError('Não foi possível carregar o catálogo.')
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
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border-2 border-amber-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-md border border-amber-300 dark:border-slate-700 bg-amber-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-slate-200">
              🍯 MelSell - Mel da Fazenda
            </span>
            <h1 className="mt-3 font-serif text-2xl font-bold text-amber-900 dark:text-white sm:text-3xl">
              Nosso Mel Artesanal
            </h1>
            <p className="mt-3 text-sm text-amber-800 dark:text-slate-400">
              Mel puro, direto da fazenda para sua família. Produtos naturais com carinho e qualidade.
            </p>

            <form
              onSubmit={(event) => event.preventDefault()}
              className="mt-4 flex flex-col gap-2 sm:flex-row"
            >
              <label htmlFor="catalog-search" className="sr-only">
                Buscar produtos
              </label>
              <input
                id="catalog-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar produtos..."
                className="min-w-0 flex-1 rounded-md border-2 border-amber-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm text-amber-900 dark:text-slate-100 outline-none placeholder:text-amber-400 dark:placeholder:text-slate-500 focus:border-amber-500 dark:focus:border-slate-500"
              />
              <button
                type="button"
                onClick={() => setQuery('')}
                className="rounded-md border-2 border-amber-400 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-amber-800 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-700"
              >
                Limpar
              </button>
            </form>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-md border-2 border-amber-200 dark:border-slate-800 bg-amber-50 dark:bg-slate-800/50 p-4">
              <div className="text-xs font-medium text-amber-600 dark:text-slate-400">Itens</div>
              <div className="mt-1 text-2xl font-bold text-amber-900 dark:text-white">{loading ? '—' : totalProducts}</div>
              <p className="mt-1 text-xs text-amber-700 dark:text-slate-400">Produtos disponíveis</p>
            </div>
            <div className="rounded-md border-2 border-amber-200 dark:border-slate-800 bg-amber-50 dark:bg-slate-800/50 p-4">
              <div className="text-xs font-medium text-amber-600 dark:text-slate-400">Preço médio</div>
              <div className="mt-1 text-xl font-bold text-amber-700 dark:text-slate-200">
                {loading ? '—' : averagePrice || '—'}
              </div>
            </div>
            <div className="rounded-md border-2 border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20 p-4">
              <div className="text-xs font-medium text-green-600 dark:text-green-400">Status</div>
              <div className="mt-1 text-lg font-bold text-green-700 dark:text-green-400">Online</div>
            </div>
          </div>
        </div>
      </section>

      {notice && (
        <div
          className={`rounded-md border-2 px-4 py-3 text-sm ${
            notice.type === 'success'
              ? 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
              : 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
          }`}
          role="status"
          aria-live="polite"
        >
          {notice.text}
        </div>
      )}

      <section aria-busy={loading} className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-bold text-amber-900 dark:text-white">Catálogo</h2>
            <p className="mt-1 text-sm text-amber-700 dark:text-slate-400">
              {loading
                ? 'Carregando...'
                : error
                  ? 'Falha ao carregar'
                  : `${totalProducts} produto${totalProducts === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-md border-2 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
