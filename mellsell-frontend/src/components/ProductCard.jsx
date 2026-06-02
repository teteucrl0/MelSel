import { Link } from 'react-router-dom'

const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export default function ProductCard({ product, onAdd, loading = false }) {
  const stock = Number(product.stock ?? 0)
  const price = money.format(Number(product.price ?? 0))
  const outOfStock = stock <= 0

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border-2 border-amber-200 bg-white shadow-md transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4 border-b-2 border-amber-100 bg-amber-50 p-4">
        <div className="space-y-2">
          <span
            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${
              outOfStock
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {outOfStock ? 'Sem estoque' : 'Disponível'}
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-200 text-sm font-bold text-amber-800">
            {getInitials(product.name)}
          </div>
        </div>

        <div className="rounded-md bg-white px-3 py-2 text-right border border-amber-200">
          <div className="text-xs text-amber-600">Preço</div>
          <div className="text-xl font-bold text-amber-700">{price}</div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-amber-900">
            <Link to={`/product/${product.id}`}>{product.name}</Link>
          </h3>
          <p className="mt-2 min-h-10 text-sm text-amber-800/80">
            {product.description || 'Descrição indisponível no momento.'}
          </p>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t-2 border-amber-100 pt-3">
          <div className="text-sm text-amber-700">
            <span className="font-semibold text-amber-900">{stock}</span> em estoque
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to={`/product/${product.id}`}
              className="rounded-md border-2 border-amber-400 bg-white px-3 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-50"
            >
              Ver detalhes
            </Link>
            <button
              type="button"
              onClick={() => onAdd(product.id)}
              disabled={loading || outOfStock}
              className="rounded-md bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-200 disabled:text-amber-400"
            >
              {loading ? 'Adicionando...' : outOfStock ? 'Indisponível' : 'Adicionar'}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
