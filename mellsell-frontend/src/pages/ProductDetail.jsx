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

  if (!product) return <div className="text-center py-8 text-slate-400">Carregando produto...</div>

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/" className="text-yellow-400 hover:text-yellow-300 mb-4 inline-block">← Voltar</Link>
      
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Informações do Produto */}
        <div className="bg-slate-800 p-6 rounded-lg">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">{product.name}</h1>
          <p className="text-slate-400 mb-4">{product.description}</p>
          
          <div className="space-y-4 mb-6">
            <div className="border-b border-slate-600 pb-4">
              <div className="text-sm text-slate-400">PREÇO</div>
              <div className="text-4xl font-bold text-yellow-400">R$ {product.price.toFixed(2)}</div>
            </div>
            
            <div>
              <div className="text-sm text-slate-400 mb-2">ESTOQUE</div>
              <div className={`font-semibold ${product.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {product.stock > 0 ? `✓ ${product.stock} unidades disponíveis` : 'Fora de estoque'}
              </div>
            </div>
          </div>

          {success && (
            <div className="bg-green-900 border border-green-600 text-green-100 p-3 rounded mb-4">
              ✓ {success}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Quantidade</label>
              <div className="flex gap-2 items-center">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded"
                  disabled={adding || product.stock === 0}
                >
                  −
                </button>
                <input 
                  type="number" 
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(product.stock, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-16 text-center bg-slate-700 text-white rounded px-2 py-2 border border-slate-600"
                  disabled={adding || product.stock === 0}
                />
                <button 
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded"
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
                className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-500 text-white font-bold px-6 py-3 rounded transition"
              >
                {adding ? 'Adicionando...' : `Adicionar ao Carrinho`}
              </button>
            ) : (
              <Link to="/login" className="block text-center w-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded transition">
                Faça login para comprar
              </Link>
            )}

            <Link to="/cart" className="block text-center bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold px-6 py-2 rounded transition">
              Ver carrinho
            </Link>
          </div>
        </div>

        {/* Avaliações */}
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold text-slate-100 mb-4">Avaliações ({reviews.length})</h2>
          
          {reviews.length === 0 ? (
            <div className="text-slate-400 text-center py-8">Nenhuma avaliação ainda</div>
          ) : (
            <div className="space-y-3 mb-6">
              {reviews.map(r => (
                <div key={r.id} className="bg-slate-700 p-3 rounded">
                  <div className="flex justify-between items-start">
                    <div className="font-semibold text-slate-100">{r.userName}</div>
                    <div className="text-yellow-400">{'⭐'.repeat(r.rating)}</div>
                  </div>
                  <p className="text-slate-300 text-sm mt-2">{r.comment}</p>
                  <div className="text-xs text-slate-500 mt-2">{new Date(r.createdAt).toLocaleDateString('pt-BR')}</div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-slate-600 pt-4">
            <h3 className="font-semibold text-slate-100 mb-3">Deixe sua avaliação</h3>
            {localStorage.getItem('token') ? (
              <div className="space-y-2">
                <select value={rating} onChange={e => setRating(e.target.value)} className="w-full border border-slate-600 bg-slate-700 text-slate-100 p-2 rounded">
                  {[5,4,3,2,1].map(n => <option key={n} value={n}>{'⭐'.repeat(n)} {n} estrelas</option>)}
                </select>
                <textarea 
                  value={comment} 
                  onChange={e => setComment(e.target.value)} 
                  placeholder="Seu comentário..." 
                  className="w-full border border-slate-600 bg-slate-700 text-slate-100 p-2 rounded"
                  rows="3"
                />
                <button onClick={addReview} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-3 py-2 rounded transition">
                  Enviar Avaliação
                </button>
              </div>
            ) : (
              <div className="text-slate-400 text-sm">Faça <Link to="/login" className="text-yellow-400 hover:underline">login</Link> para deixar uma avaliação.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
