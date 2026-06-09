import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ProductImage from './ProductImage'
import ProductSupplierLabel from './ProductSupplierLabel'
import { AnimatedButton } from './motion/Motion'
import FlaticonIcon from './FlaticonIcon'

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function IconEye() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconCart() {
  return <FlaticonIcon name="cart" size="sm" className="product-card-cart-icon" />
}

function IconSpinner() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 animate-spin" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
      <path d="M12 3a9 9 0 019 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  )
}

export default function ProductCard({
  product,
  onAdd,
  loading = false,
  flash = false,
  ownSupplierId = null,
  isVendor = false,
  supplierLoading = false,
}) {
  const stock = Number(product.stock ?? 0)
  const price = money.format(Number(product.price ?? 0))
  const outOfStock = stock <= 0
  const isOwnProduct =
    ownSupplierId != null &&
    product.supplierId != null &&
    Number(product.supplierId) === Number(ownSupplierId)

  return (
    <motion.article
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      className={`surface surface-interactive group flex h-full flex-col overflow-hidden ${flash ? 'stock-flash' : ''}`}
    >
      <Link to={`/product/${product.id}`} className="block overflow-hidden relative">
        <motion.div 
          whileHover={{ scale: 1.035 }} 
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} 
          className="overflow-hidden"
        >
          <ProductImage imageUrl={product.imageUrl} alt={product.name} />
        </motion.div>
        
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>

      <div className="flex flex-1 flex-col p-4 pt-3.5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold tracking-[0.5px] rounded-full ${outOfStock ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'}`}>
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${outOfStock ? 'bg-red-500' : 'bg-emerald-500'}`} />
            {outOfStock ? 'ESGOTADO' : 'DISPONÍVEL'}
          </span>

          <motion.div 
            key={stock}
            initial={{ scale: 0.85, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-baseline gap-1 text-[10px] font-medium tabular-nums text-muted"
          >
            <span className="font-semibold text-base leading-none text-stone-800 dark:text-stone-200">{stock}</span>
            <span className="text-[10px]">un.</span>
          </motion.div>
        </div>

        <h3 className="text-[15px] font-semibold leading-tight tracking-[-0.2px] text-stone-900 dark:text-stone-50 line-clamp-2 group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors">
          <Link to={`/product/${product.id}`}>
            {product.name}
          </Link>
        </h3>

        <ProductSupplierLabel name={product.supplierName} />

        <p className="mt-1.5 mb-2 line-clamp-2 flex-1 text-[13px] leading-snug text-muted">
          {product.description || 'Mel artesanal puro, colhido com cuidado por famílias apicultoras.'}
        </p>

        <div className="mt-auto flex items-end justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
          <div>
            <div className="text-[10px] font-medium text-muted tracking-widest">PREÇO</div>
            <div className="product-card-price text-xl font-semibold tabular-nums tracking-tight text-stone-950 dark:text-white">
              {price}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              to={`/product/${product.id}`}
              className="icon-btn icon-btn-secondary h-9 w-9 rounded-xl"
              title="Ver detalhes e avaliações"
              aria-label={`Ver detalhes de ${product.name}`}
            >
              <IconEye />
            </Link>

            {isOwnProduct ? (
              <Link
                to="/vendor/products"
                className="icon-btn icon-btn-secondary h-9 w-9 rounded-xl"
                title="Gerenciar seu produto"
              >
                <IconEdit />
              </Link>
            ) : (
              <AnimatedButton
                as="button"
                type="button"
                onClick={() => onAdd(product.id)}
                disabled={loading || outOfStock || (isVendor && supplierLoading)}
                className="icon-btn icon-btn-primary h-9 w-9 rounded-xl"
                title={outOfStock ? 'Indisponível' : 'Adicionar ao carrinho'}
              >
                {loading ? <IconSpinner /> : <IconCart />}
              </AnimatedButton>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  )
}