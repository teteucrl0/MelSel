import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import productService from '../services/productService'
import cartService from '../services/cartService'
import reviewService from '../services/reviewService'
import { hasRole, getUsername } from '../services/authUtil'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [success, setSuccess] = useState('')

  const loadReviews = () => reviewService.listByProduct(id).then(r => setReviews(r.content || r)).catch(() => setReviews([]))

  useEffect(() => {
    productService.getById(id).then(setProduct).catch(() => {})
    loadReviews()
  }, [id])

  const addToCart = async () => {
    try {
      setAdding(true)
      await cartService.addItem(product.id, quantity)
      setSuccess(`${quantity}x ${product.name} adicionado ao carrinho!`)
      setTimeout(() => {
        setSuccess('')
        setQuantity(1)
      }, 2000)
    } catch (err) {
      alert('Erro ao adicionar: ' + (err?.response?.data?.message || err.message))
    } finally {
      setAdding(false)
    }
  }

  const addReview = () => {
    reviewService.addReview({ productId: Number(id), rating: Number(rating), comment }).then(() => {
      alert('Avaliação enviada (aguardando moderação)')
      setRating(5)
      setComment('')
      loadReviews()
    }).catch(err => {
      alert(err?.response?.data || 'Falha ao enviar avaliação')
    })
  }

  if (!product) return <div className="text-center py-8 text-amber-700 dark:text-slate-400">Carregando produto...</div>

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/" className="text-amber-600 hover:text-amber-700 dark:text-yellow-400 dark:hover:text-yellow-300 mb-4 inline-block font-medium transition-colors">← Voltar para produtos</Link>
      
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Informações do Produto */}
        <div className="bg-white dark:bg-slate-950 p-6 rounded-lg border-2 border-amber-200 dark:border-slate-800 shadow-lg transition-colors">
          <h1 className="text-3xl font-bold text-amber-900 dark:text-slate-100 mb-2">{product.name}</h1>
          <p className="text-amber-800/80 dark:text-slate-400 mb-4">{product.description}</p>
          
          <div className="space-y-4 mb-6">
            <div className="border-b-2 border-amber-100 dark:border-slate-800 pb-4">
              <div className="text-xs text-amber-700 dark:text-slate-400 font-semibold uppercase tracking-wider">PREÇO</div>
              <div className="text-4xl font-bold text-amber-600 dark:text-yellow-400">R$ {product.price.toFixed(2)}</div>
            </div>
            
            <div>
              <div className="text-xs text-amber-700 dark:text-slate-400 font-semibold uppercase tracking-wider mb-2">ESTOQUE</div>
              <div className={`font-semibold ${product.stock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {product.stock > 0 ? `✓ ${product.stock} unidades disponíveis` : 'Fora de estoque'}
              </div>
            </div>
          </div>

          {success && (
            <div className="bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-600 text-green-700 dark:text-green-100 p-3 rounded mb-4">
              ✓ {success}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-amber-900 dark:text-slate-300 mb-2">Quantidade</label>
              <div className="flex gap-2 items-center">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white px-3 py-2 rounded transition-colors"
                  disabled={adding || product.stock === 0}
                >
                  −
                </button>
                <input 
                  type="number" 
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(product.stock, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-16 text-center bg-white dark:bg-slate-700 text-amber-900 dark:text-white rounded px-2 py-2 border-2 border-amber-200 dark:border-slate-600 outline-none focus:border-amber-500 transition-colors"
                  disabled={adding || product.stock === 0}
                />
                <button 
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white px-3 py-2 rounded transition-colors"
                  disabled={adding || product.stock === 0}
                >
                  +
                </button>
              </div>
            </div>

            {localStorage.getItem('token') ? (
              <button 
                onClick={addToCart}
                disabled={adding || product.stock === 0}
                className="w-full bg-amber-500 hover:bg-amber-600 dark:bg-yellow-500 dark:hover:bg-yellow-600 disabled:bg-amber-200 dark:disabled:bg-slate-800 text-white font-bold px-6 py-3 rounded transition shadow-md hover:shadow-lg transform active:scale-95"
              >
                {adding ? 'Adicionando...' : `Adicionar ao Carrinho`}
              </button>
            ) : (
              <Link to="/login" className="block text-center w-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded transition shadow-md hover:shadow-lg">
                Faça login para comprar
              </Link>
            )}

            <Link to="/cart" className="block text-center bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 font-semibold px-6 py-2 rounded transition border border-amber-200 dark:border-slate-700">
              Ver carrinho
            </Link>
          </div>
        </div>

        {/* Avaliações */}
        <div className="bg-white dark:bg-slate-950 p-6 rounded-lg border-2 border-amber-200 dark:border-slate-800 shadow-lg transition-colors">
          <h2 className="text-2xl font-bold text-amber-900 dark:text-slate-100 mb-4">Avaliações ({reviews.length})</h2>
          
          {reviews.length === 0 ? (
            <div className="text-amber-700 dark:text-slate-400 text-center py-8">Nenhuma avaliação ainda</div>
          ) : (
            <div className="space-y-3 mb-6">
              {reviews.map(r => (
                <div key={r.id} className="bg-amber-50 dark:bg-slate-800 p-4 rounded-lg border border-amber-100 dark:border-slate-700">
                  <div className="flex justify-between items-start">
                    <div className="font-semibold text-amber-900 dark:text-slate-100">{r.userName}</div>
                    <div className="text-amber-500 dark:text-yellow-400">{'⭐'.repeat(r.rating)}</div>
                  </div>
                  <p className="text-amber-800 dark:text-slate-300 text-sm mt-2">{r.comment}</p>
                  <div className="text-xs text-amber-600 dark:text-slate-500 mt-2">{new Date(r.createdAt).toLocaleDateString('pt-BR')}</div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t-2 border-amber-100 dark:border-slate-800 pt-4">
            <h3 className="font-semibold text-amber-900 dark:text-slate-100 mb-3">Deixe sua avaliação</h3>
            {localStorage.getItem('token') ? (
              <div className="space-y-3">
                <select 
                  value={rating} 
                  onChange={e => setRating(e.target.value)} 
                  className="w-full border-2 border-amber-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-amber-900 dark:text-slate-100 p-2 rounded focus:border-amber-500 outline-none transition-colors"
                >
                  {[5,4,3,2,1].map(n => <option key={n} value={n}>{'⭐'.repeat(n)} {n} estrelas</option>)}
                </select>
                <textarea 
                  value={comment} 
                  onChange={e => setComment(e.target.value)} 
                  placeholder="O que achou deste produto?" 
                  className="w-full border-2 border-amber-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-amber-900 dark:text-slate-100 p-2 rounded focus:border-amber-500 outline-none transition-colors"
                  rows="3"
                />
                <button onClick={addReview} className="w-full bg-amber-500 hover:bg-amber-600 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white font-bold px-3 py-2 rounded transition shadow-md">
                  Enviar Avaliação
                </button>
              </div>
            ) : (
              <div className="text-amber-700 dark:text-slate-400 text-sm">Faça <Link to="/login" className="text-amber-600 dark:text-yellow-400 hover:underline">login</Link> para deixar uma avaliação.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
