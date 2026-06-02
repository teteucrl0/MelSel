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
    <div className="overflow-hidden rounded-lg border-2 border-amber-200 bg-white p-4 shadow-md">
      <div className="animate-pulse">
        <div className="flex items-start justify-between gap-4 border-b-2 border-amber-100 pb-4">
          <div className="space-y-2">
            <div className="h-5 w-20 rounded bg-amber-100" />
            <div className="h-10 w-10 rounded bg-amber-100" />
          </div>
          <div className="h-14 w-24 rounded bg-amber-100" />
        </div>
        <div className="mt-4 h-5 w-3/4 rounded bg-amber-100" />
        <div className="mt-2 h-4 rounded bg-amber-100" />
        <div className="mt-4 flex items-center justify-between gap-3 border-t-2 border-amber-100 pt-3">
          <div className="h-4 w-20 rounded bg-amber-100" />
          <div className="flex gap-2">
            <div className="h-9 w-24 rounded bg-amber-100" />
            <div className="h-9 w-24 rounded bg-amber-100" />
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ query, onClear }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-amber-200 text-xl">
        🍯
      </div>
      <h3 className="mt-4 font-serif text-xl font-bold text-amber-900">
        {query ? 'Nenhum produto encontrado' : 'Catálogo vazio'}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-amber-700">
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
      <section className="overflow-hidden rounded-lg border-2 border-amber-200 bg-white shadow-md">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-md border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              🍯 MelSell - Mel da Fazenda
            </span>
            <h1 className="mt-3 font-serif text-2xl font-bold text-amber-900 sm:text-3xl">
              Nosso Mel Artesanal
            </h1>
            <p className="mt-3 text-sm text-amber-800">
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
                className="min-w-0 flex-1 rounded-md border-2 border-amber-300 bg-white px-4 py-2 text-sm text-amber-900 outline-none placeholder:text-amber-400 focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setQuery('')}
                className="rounded-md border-2 border-amber-400 bg-white px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50"
              >
                Limpar
              </button>
            </form>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-md border-2 border-amber-200 bg-amber-50 p-4">
              <div className="text-xs font-medium text-amber-600">Itens</div>
              <div className="mt-1 text-2xl font-bold text-amber-900">{loading ? '—' : totalProducts}</div>
              <p className="mt-1 text-xs text-amber-700">Produtos disponíveis</p>
            </div>
            <div className="rounded-md border-2 border-amber-200 bg-amber-50 p-4">
              <div className="text-xs font-medium text-amber-600">Preço médio</div>
              <div className="mt-1 text-xl font-bold text-amber-700">
                {loading ? '—' : averagePrice || '—'}
              </div>
            </div>
            <div className="rounded-md border-2 border-green-200 bg-green-50 p-4">
              <div className="text-xs font-medium text-green-600">Status</div>
              <div className="mt-1 text-lg font-bold text-green-700">Online</div>
            </div>
          </div>
        </div>
      </section>

      {notice && (
        <div
          className={`rounded-md border-2 px-4 py-3 text-sm ${
            notice.type === 'success'
              ? 'border-green-300 bg-green-50 text-green-800'
              : 'border-red-300 bg-red-50 text-red-800'
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
            <h2 className="font-serif text-xl font-bold text-amber-900">Catálogo</h2>
            <p className="mt-1 text-sm text-amber-700">
              {loading
                ? 'Carregando...'
                : error
                  ? 'Falha ao carregar'
                  : `${totalProducts} produto${totalProducts === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-md border-2 border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
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
