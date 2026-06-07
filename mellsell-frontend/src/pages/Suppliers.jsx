import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import productService from '../services/productService'
import PageLoadPlaceholder from '../components/PageLoadPlaceholder'
import ShopPageHeader from '../components/shop/ShopPageHeader'
import FlaticonIcon from '../components/FlaticonIcon'

export default function Suppliers() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    productService
      .list(null, null, 0, 100)
      .then((r) => setProducts(r?.content || r || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  const suppliers = useMemo(() => {
    const map = new Map()
    for (const p of products) {
      const key = p.supplierId ?? p.supplierName ?? 'local'
      if (!map.has(key)) {
        map.set(key, { id: p.supplierId, name: p.supplierName || 'Produtor parceiro', count: 0 })
      }
      map.get(key).count += 1
    }
    return [...map.values()].sort((a, b) => b.count - a.count)
  }, [products])

  if (loading) return <PageLoadPlaceholder />

  return (
    <div className="mx-auto max-w-3xl">
      <ShopPageHeader
        title="Quem produz o mel"
        description="Conheça os apicultores e pequenos produtores disponíveis na loja. Ao comprar, você vê o nome de quem vende em cada produto."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {suppliers.map((s) => (
          <div key={s.id ?? s.name} className="shop-card p-5">
            <div className="flex items-center">
              <FlaticonIcon name="vendor" size="lg" className="flaticon-icon--vendor-stall" />
            </div>
            <h2 className="mt-2 font-semibold" style={{ color: 'var(--shop-text)' }}>
              {s.name}
            </h2>
            <p className="text-sm shop-text-muted">
              {s.count} produto{s.count !== 1 ? 's' : ''} na loja
            </p>
            <Link
              to={s.id != null ? `/?supplierId=${s.id}` : '/'}
              className="shop-btn-secondary mt-4 inline-flex text-sm"
            >
              Ver produtos
            </Link>
          </div>
        ))}
      </div>

      {suppliers.length === 0 && (
        <div className="shop-empty mt-8">
          <span className="shop-empty-icon" aria-hidden>
            <FlaticonIcon name="bee" size="hero" />
          </span>
          <h2>Nenhum produtor no catálogo</h2>
          <p>Volte em breve — novos apicultores entram na loja com frequência.</p>
          <Link to="/" className="shop-btn-primary mt-2 max-w-xs">
            Ver catálogo
          </Link>
        </div>
      )}
    </div>
  )
}