import { useCallback, useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import cartService, { cartSubtotal as cartSubtotalFromService } from '../services/cartService'
import { getApiErrorMessage } from '../utils/apiErrorMessage'
import { CART_UPDATED_EVENT, notifyCartUpdated } from '../utils/cartEvents'
import ShopPageHeader from '../components/shop/ShopPageHeader'
import AddressByCepForm from '../components/AddressByCepForm'
import CreditCardForm from '../components/CreditCardForm'
import ShopSelect from '../components/shop/ShopSelect'
import PageLoadPlaceholder from '../components/PageLoadPlaceholder'
import { buildShippingAddress } from '../utils/addressCep'
import { getAddressFieldsValidationError, getSafeShippingAddressError } from '../utils/inputSanitizer'
import { buildCreditCardPayload, validateCreditCardFields } from '../utils/creditCard'
import FlaticonIcon from '../components/FlaticonIcon'

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const emptyAddress = {
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
}

const emptyCard = {
  holderName: '',
  number: '',
  expiry: '',
  cvv: '',
  installments: 1,
}

export default function Checkout() {
  const [addressFields, setAddressFields] = useState(emptyAddress)
  const [payment, setPayment] = useState('CREDIT_CARD')
  const [card, setCard] = useState(emptyCard)
  const [couponCode, setCouponCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [cartLoading, setCartLoading] = useState(true)
  const [error, setError] = useState('')
  const [checkoutResult, setCheckoutResult] = useState(null)
  const [cartItems, setCartItems] = useState([])
  const [cartSubtotal, setCartSubtotal] = useState(0)
  const navigate = useNavigate()

  const loadCart = useCallback(async () => {
    if (!localStorage.getItem('token')) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } })
      return
    }
    try {
      setCartLoading(true)
      const list = await cartService.listCart()
      setCartItems(list)
      setCartSubtotal(cartSubtotalFromService(list))
      setError('')
    } catch (err) {
      setCartItems([])
      setCartSubtotal(0)
      setError(getApiErrorMessage(err, 'Não foi possível carregar o carrinho.'))
    } finally {
      setCartLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadCart()
    const onCartUpdate = () => loadCart()
    window.addEventListener(CART_UPDATED_EVENT, onCartUpdate)
    return () => window.removeEventListener(CART_UPDATED_EVENT, onCartUpdate)
  }, [loadCart])

  const cartEmpty = !cartLoading && cartItems.length === 0

  const submit = async (e) => {
    e.preventDefault()
    if (cartEmpty) {
      setError('Seu carrinho está vazio. Adicione produtos antes de finalizar.')
      return
    }
    const addressErr = getAddressFieldsValidationError(addressFields)
    if (addressErr) {
      setError(addressErr)
      return
    }

    let creditCardPayload
    if (payment === 'CREDIT_CARD') {
      const cardErr = validateCreditCardFields(card)
      if (cardErr) {
        setError(cardErr)
        return
      }
      creditCardPayload = buildCreditCardPayload(card)
    }

    const shippingAddress = buildShippingAddress(addressFields)
    const shippingErr = getSafeShippingAddressError(shippingAddress)
    if (shippingErr) {
      setError(shippingErr)
      return
    }
    setError('')
    setLoading(true)
    try {
      const freshItems = await cartService.listCart()
      if (!freshItems.length) {
        setCartItems([])
        setCartSubtotal(0)
        setError('Seu carrinho está vazio. Adicione produtos antes de finalizar.')
        return
      }
      setCartItems(freshItems)
      setCartSubtotal(cartSubtotalFromService(freshItems))

      const result = await cartService.checkout(
        shippingAddress,
        payment,
        couponCode,
        creditCardPayload,
      )
      setCheckoutResult(result)
      setCartItems([])
      setCartSubtotal(0)
      notifyCartUpdated({ action: 'checkout' })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível concluir o pedido. Tente novamente.'))
      await loadCart()
    } finally {
      setLoading(false)
    }
  }

  if (checkoutResult?.orders?.length) {
    const { orders, orderCount, totalPaid } = checkoutResult
    const multiple = orderCount > 1

    return (
      <div className="shop-account">
        <div className="shop-panel">
          <div className="shop-alert shop-alert--success">
            {multiple
              ? `${orderCount} pedidos confirmados — uma entrega por produtor.`
              : `Pedido #${orders[0].id} confirmado!`}
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--shop-text)' }}>Compra finalizada</h1>
          {totalPaid != null && (
            <p className="mt-2 font-semibold tabular-nums" style={{ color: 'var(--shop-honey)' }}>
              Total: {money.format(Number(totalPaid))}
            </p>
          )}
          <ul className="mt-6 space-y-3">
            {orders.map((order) => (
              <li key={order.id} className="shop-panel">
                <p className="text-xs font-semibold uppercase" style={{ color: 'var(--shop-honey)' }}>
                  {order.supplierName || 'Produtor'}
                </p>
                <p className="mt-1 text-sm" style={{ color: 'var(--shop-muted)' }}>
                  Pedido #{order.id} · {money.format(Number(order.total))}
                </p>
                <button
                  type="button"
                  className="shop-btn-primary mt-3 w-full text-sm"
                  onClick={() => navigate(`/orders/${order.id}/tracking`)}
                >
                  Rastrear entrega
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col gap-2">
            <button type="button" className="shop-btn-primary" onClick={() => navigate('/orders?placed=1')}>
              Ver meus pedidos
            </button>
            <Link to="/" className="shop-btn-secondary text-center">
              Continuar na loja
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (cartLoading) {
    return (
      <div className="shop-account">
        <ShopPageHeader title="Finalizar compra" description="Carregando seu carrinho…" />
        <PageLoadPlaceholder className="min-h-[18rem]" />
      </div>
    )
  }

  if (cartEmpty) {
    return (
      <div className="shop-account">
        <ShopPageHeader
          title="Finalizar compra"
          description="Você precisa de itens no carrinho para concluir a compra."
        />
        <div className="shop-empty">
          <span className="shop-empty-icon" aria-hidden>
            <FlaticonIcon name="cart" size="hero" />
          </span>
          <h2>Seu carrinho está vazio</h2>
          <p>Adicione mel artesanal na loja e volte aqui para pagar com segurança.</p>
          <Link to="/" className="shop-btn-primary mt-4" style={{ maxWidth: '14rem' }}>
            Ver produtos
          </Link>
          <Link to="/cart" className="mt-3 text-sm font-medium" style={{ color: 'var(--shop-honey)' }}>
            Ir ao carrinho
          </Link>
        </div>
      </div>
    )
  }

  const itemCount = cartItems.reduce((n, it) => n + Number(it.quantity || 0), 0)

  return (
    <div className="shop-account">
      <ShopPageHeader
        title="Finalizar compra"
        description="Informe o endereço de entrega. Vários produtores geram entregas separadas."
      />

      <aside className="shop-checkout-summary shop-panel" aria-label="Resumo do pedido">
        <h2 className="shop-checkout-summary-title">Resumo</h2>
        <dl className="shop-checkout-summary-dl">
          <div>
            <dt>Itens</dt>
            <dd>{itemCount}</dd>
          </div>
          <div>
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{money.format(cartSubtotal)}</dd>
          </div>
        </dl>
        <p className="shop-checkout-summary-hint">
          Frete e descontos de cupom são calculados ao confirmar.
        </p>
      </aside>

      <form onSubmit={submit} className="shop-panel space-y-5">
        {error && (
          <div
            className="shop-alert shop-alert--err"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--shop-text)' }}>Endereço</h2>
          <p className="mt-1 mb-3 text-xs" style={{ color: 'var(--shop-muted)' }}>
            Digite o CEP e o número. Os demais campos são preenchidos automaticamente.
          </p>
          <AddressByCepForm value={addressFields} onChange={setAddressFields} disabled={loading} />
        </div>

        <div className="shop-payment-section">
          <label className="label" htmlFor="payment">
            Pagamento
          </label>
          <ShopSelect
            id="payment"
            className="shop-payment-select"
            value={payment}
            disabled={loading}
            onChange={(e) => {
              setPayment(e.target.value)
              setError('')
            }}
          >
            <option value="CREDIT_CARD">Cartão de crédito</option>
            <option value="FAKE">Pagamento simulado (teste)</option>
          </ShopSelect>

          {payment === 'CREDIT_CARD' && (
            <CreditCardForm
              value={card}
              onChange={setCard}
              disabled={loading}
              estimatedTotal={cartSubtotal}
            />
          )}

          {payment === 'FAKE' && (
            <p className="shop-cc-hint mt-2">
              Modo teste: confirma o pedido sem cobrança real.
            </p>
          )}
        </div>

        <div>
          <label className="label" htmlFor="coupon">Cupom (opcional)</label>
          <input
            id="coupon"
            className="input-field"
            placeholder="Código"
            value={couponCode}
            disabled={loading}
            onChange={(e) => setCouponCode(e.target.value)}
          />
        </div>

        <button type="submit" disabled={loading || cartEmpty} className="shop-btn-primary">
          {loading
            ? payment === 'CREDIT_CARD'
              ? 'Processando pagamento…'
              : 'Processando…'
            : payment === 'CREDIT_CARD'
              ? 'Pagar e confirmar pedido'
              : 'Confirmar pedido'}
        </button>

        <Link to="/cart" className="block text-center text-sm font-medium" style={{ color: 'var(--shop-honey)' }}>
          Voltar ao carrinho
        </Link>
      </form>
    </div>
  )
}