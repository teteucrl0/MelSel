import { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import productService from '../services/productService'
import cartService from '../services/cartService'
import { getApiErrorMessage } from '../utils/apiErrorMessage'
import { notifyCartUpdated } from '../utils/cartEvents'
import reviewService from '../services/reviewService'
import { getSafeReviewCommentError, stripMarkupChars } from '../utils/inputSanitizer'
import useStockSync from '../hooks/useStockSync'
import ProductImage from '../components/ProductImage'
import PageLoadPlaceholder from '../components/PageLoadPlaceholder'
import QuantityInput from '../components/QuantityInput'
import useMySupplierId from '../hooks/useMySupplierId'
import { hasRole } from '../services/authUtil'

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [reviews, setReviews] = useState([])
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [toast, setToast] = useState(null)
  const { supplierId: mySupplierId } = useMySupplierId()

  const loadReviews = () =>
    reviewService.listByProduct(id).then((r) => setReviews(r.content || r)).catch(() => setReviews([]))

  useStockSync(
    useCallback((update) => {
      setProduct((prev) =>
        prev && Number(prev.id) === Number(update.productId) ? { ...prev, stock: update.stock } : prev
      )
    }, [])
  )



  useEffect(() => {
    let active = true
    setLoading(true)
    setNotFound(false)
    productService
      .getById(id)
      .then((data) => {
        if (!active) return
        setProduct(data)
        setQuantity(1)
      })
      .catch(() => {
        if (!active) return
        setNotFound(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    loadReviews()
    return () => { active = false }
  }, [id])

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const addToCart = async () => {
    if (!localStorage.getItem('token')) {
      navigate('/login', { state: { from: { pathname: `/product/${id}` } } })
      return
    }
    if (
      mySupplierId != null &&
      product?.supplierId != null &&
      Number(product.supplierId) === Number(mySupplierId)
    ) {
      setToast({ type: 'err', text: 'Este é o seu produto.' })
      return
    }
    const prevStock = product.stock
    try {
      setAdding(true)
      setProduct((p) => ({ ...p, stock: Math.max(0, p.stock - quantity) }))
      const data = await cartService.addItem(product.id, quantity)
      if (data?.stockRemaining != null) setProduct((p) => ({ ...p, stock: data.stockRemaining }))
      setToast({ type: 'ok', text: 'Adicionado ao carrinho!' })
      notifyCartUpdated({ action: 'add', productId: product.id, quantity })
    } catch (err) {
      setProduct((p) => ({ ...p, stock: prevStock }))
      setToast({ type: 'err', text: getApiErrorMessage(err, 'Erro ao adicionar.') })
    } finally {
      setAdding(false)
    }
  }

  if (loading) return <PageLoadPlaceholder />

  if (notFound || !product) {
    return (
      <div className="shop-pdp text-center py-16">
        <p className="text-lg font-semibold">Produto não encontrado</p>
        <Link to="/" className="shop-btn-primary mt-6 inline-flex max-w-xs">
          Voltar à loja
        </Link>
      </div>
    )
  }

  const inStock = product.stock > 0
  const isOwn =
    mySupplierId != null && product.supplierId != null && Number(product.supplierId) === Number(mySupplierId)
  const loggedIn = !!localStorage.getItem('token')

  return (
    <div className="shop-pdp">
      {toast && (
        <div className={`shop-toast shop-toast--${toast.type === 'ok' ? 'ok' : 'err'}`}>{toast.text}</div>
      )}

      <nav className="mb-4 text-sm shop-breadcrumb">
        <Link to="/">Loja</Link>
        <span className="mx-2">/</span>
        <span>{product.name}</span>
      </nav>

      <div className="shop-pdp-grid">
        <div className="shop-pdp-image">
          <ProductImage imageUrl={product.imageUrl} alt={product.name} variant="detail" className="w-full" />
        </div>

        <div className="shop-pdp-buybox">
          <p className="shop-pdp-supplier">{product.supplierName || 'Produtor parceiro'}</p>
          <h1 className="shop-pdp-title">{product.name}</h1>

          <p className="shop-pdp-price mt-4">{money.format(Number(product.price))}</p>
          <p className={`shop-pdp-stock ${inStock ? 'shop-pdp-stock--in' : 'shop-pdp-stock--out'}`}>
            <span aria-hidden>{inStock ? '●' : '○'}</span>
            {inStock ? `${product.stock} unidades disponíveis` : 'Esgotado — sem unidades no momento'}
          </p>

          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--shop-muted)' }}>
            {product.description || 'Mel artesanal selecionado, produzido com cuidado e transparência de origem.'}
          </p>

          {!isOwn && inStock && (
            <div className="shop-pdp-actions">
              <QuantityInput
                label="Quantidade"
                value={quantity}
                onChange={setQuantity}
                min={1}
                max={Math.max(1, product.stock)}
                disabled={adding}
              />
              {loggedIn ? (
                <button type="button" className="shop-btn-primary" onClick={addToCart} disabled={adding}>
                  {adding ? 'Adicionando…' : 'Adicionar ao carrinho'}
                </button>
              ) : (
                <Link
                  to="/login"
                  state={{ from: { pathname: `/product/${id}` } }}
                  className="shop-btn-primary text-center"
                >
                  Entrar para comprar
                </Link>
              )}
              <Link to="/cart" className="shop-btn-secondary text-center">
                Ir ao carrinho
              </Link>
            </div>
          )}

          {isOwn && (
            <Link to="/vendor/products" className="shop-btn-secondary mt-4 block text-center">
              Gerenciar no painel
            </Link>
          )}

          <div className="shop-pdp-trust">
            <span>✓ Compra segura na plataforma</span>
            <span>✓ Rastreamento após o pedido</span>
            <span>✓ Suporte via FAQ e perfil</span>
          </div>
        </div>
      </div>

      <section className="shop-pdp-panel mt-10">
        <h2 className="shop-pdp-panel-title">Avaliações ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p className="shop-pdp-panel-muted">Ainda sem avaliações publicadas.</p>
        ) : (
          <ul className="shop-pdp-reviews-list">
            {reviews.map((r) => (
              <li key={r.id} className="shop-pdp-review-item">
                <div className="shop-pdp-review-head">
                  <span className="shop-pdp-review-user">{r.userName}</span>
                  <span className="shop-pdp-review-stars" aria-label={`${r.rating} estrelas`}>
                    {'★'.repeat(r.rating)}
                  </span>
                </div>
                <p className="shop-pdp-review-comment">{r.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!isOwn && loggedIn && !hasRole('VENDEDOR') && (
        <section className="shop-pdp-panel mt-4">
          <h3 className="shop-pdp-panel-title text-base">Sua avaliação</h3>
          <p className="shop-pdp-panel-muted text-xs">Após comprar este produto.</p>
          <div className="shop-pdp-review-form">
            <select value={rating} onChange={(e) => setRating(e.target.value)} className="input-field shop-pdp-input">
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n} estrelas</option>
              ))}
            </select>
            <textarea
              value={comment}
              onChange={(e) => setComment(stripMarkupChars(e.target.value))}
              className="input-field shop-pdp-input resize-none"
              rows={3}
              maxLength={1000}
              placeholder="Conte sua experiência"
            />
            <button
              type="button"
              className="shop-btn-secondary w-fit"
              onClick={() => {
                const commentErr = getSafeReviewCommentError(comment)
                if (commentErr) {
                  setToast({ type: 'err', text: commentErr })
                  return
                }
                reviewService
                  .addReview({
                    productId: Number(id),
                    rating: Number(rating),
                    comment: comment.trim() || undefined,
                  })
                  .then(() => {
                    setToast({ type: 'ok', text: 'Avaliação enviada!' })
                    setComment('')
                    loadReviews()
                  })
                  .catch((err) =>
                    setToast({ type: 'err', text: err?.response?.data?.message || 'Não foi possível enviar.' })
                  )
              }}
            >
              Enviar
            </button>
          </div>
        </section>
      )}

      {!isOwn && inStock && (
        <div className="shop-mobile-bar" aria-label="Comprar">
          <span className="shop-mobile-bar-price">{money.format(Number(product.price))}</span>
          <button
            type="button"
            className="shop-btn-primary"
            onClick={() => {
              if (!loggedIn) {
                navigate('/login', { state: { from: { pathname: `/product/${id}` } } })
                return
              }
              addToCart()
            }}
            disabled={adding}
          >
            {adding ? '…' : loggedIn ? 'Adicionar ao carrinho' : 'Entrar para comprar'}
          </button>
        </div>
      )}
    </div>
  )
}