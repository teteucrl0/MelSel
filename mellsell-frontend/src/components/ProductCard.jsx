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
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-lg shadow-slate-950/20 transition duration-300 hover:-translate-y-1 hover:border-amber-400/30 hover:shadow-2xl hover:shadow-amber-950/20">
      <div className="flex items-start justify-between gap-4 border-b border-white/5 bg-gradient-to-br from-amber-400/15 via-white/5 to-transparent p-5">
        <div className="space-y-3">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
              outOfStock
                ? 'bg-rose-500/15 text-rose-200 ring-1 ring-inset ring-rose-500/25'
                : 'bg-emerald-500/15 text-emerald-200 ring-1 ring-inset ring-emerald-500/25'
            }`}
          >
            {outOfStock ? 'Sem estoque' : 'Disponível'}
          </span>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-lg font-black text-white ring-1 ring-inset ring-white/10">
            {getInitials(product.name)}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-950/60 px-4 py-3 text-right ring-1 ring-inset ring-white/10">
          <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Preço</div>
          <div className="mt-1 text-2xl font-black text-amber-300">{price}</div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="text-lg font-semibold leading-snug text-white transition group-hover:text-amber-200">
            <Link to={`/product/${product.id}`}>{product.name}</Link>
          </h3>
          <p className="mt-2 min-h-12 text-sm leading-6 text-slate-300/90">
            {product.description || 'Descrição indisponível no momento.'}
          </p>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
          <div className="text-sm text-slate-400">
            <span className="font-semibold text-slate-100">{stock}</span> em estoque
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to={`/product/${product.id}`}
              className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
            >
              Ver detalhes
            </Link>
            <button
              type="button"
              onClick={() => onAdd(product.id)}
              disabled={loading || outOfStock}
              className="inline-flex items-center justify-center rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {loading ? 'Adicionando...' : outOfStock ? 'Indisponível' : 'Adicionar'}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
