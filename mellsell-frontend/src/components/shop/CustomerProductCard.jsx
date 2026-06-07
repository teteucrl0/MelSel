import { Link } from 'react-router-dom'
import ProductImage from '../ProductImage'

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export default function CustomerProductCard({ product, onQuickAdd, adding }) {
  const inStock = (product.stock ?? 0) > 0

  return (
    <article className="shop-card group">
      <Link to={`/product/${product.id}`} className="shop-card-image block">
        <ProductImage imageUrl={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        <span className={`shop-card-stock ${inStock ? 'in' : 'out'}`} aria-label={inStock ? 'Em estoque' : 'Esgotado'}>
          {inStock ? 'Em estoque' : 'Esgotado'}
        </span>
      </Link>
      <div className="shop-card-body">
        <p className="shop-card-producer">{product.supplierName || 'Produtor certificado'}</p>
        <Link to={`/product/${product.id}`}>
          <h3 className="shop-card-name">{product.name}</h3>
        </Link>
        <p className="shop-card-price">{money.format(Number(product.price))}</p>
        <button
          type="button"
          className="shop-card-cta"
          disabled={!inStock || adding}
          onClick={() => onQuickAdd?.(product)}
        >
          {adding ? 'Adicionando…' : inStock ? 'Adicionar ao carrinho' : 'Indisponível'}
        </button>
      </div>
    </article>
  )
}