import FlaticonIcon from './FlaticonIcon'

/** Escolha comprador vs apicultor/fornecedor no cadastro. */
export default function AccountTypePicker({ value, onChange, disabled = false }) {
  const isVendor = value === 'VENDEDOR'

  return (
    <div className="shop-account-type" role="radiogroup" aria-label="Tipo de conta">
      <button
        type="button"
        role="radio"
        aria-checked={!isVendor}
        disabled={disabled}
        className={`shop-account-type-card ${!isVendor ? 'is-active' : ''}`}
        onClick={() => onChange('CLIENTE')}
      >
        <span className="shop-account-type-icon" aria-hidden>
          <FlaticonIcon name="cart" size="lg" />
        </span>
        <span className="shop-account-type-title">Quero comprar</span>
        <span className="shop-account-type-desc">Cliente — explore mel e acompanhe pedidos</span>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={isVendor}
        disabled={disabled}
        className={`shop-account-type-card shop-account-type-card--vendor ${isVendor ? 'is-active' : ''}`}
        onClick={() => onChange('VENDEDOR')}
      >
        <span className="shop-account-type-icon shop-account-type-icon--vendor" aria-hidden>
          <FlaticonIcon name="vendor" size="lg" className="flaticon-icon--vendor-stall" />
        </span>
        <span className="shop-account-type-title">Sou apicultor / fornecedor</span>
        <span className="shop-account-type-desc">Venda na loja, estoque, pedidos e cupons</span>
      </button>
    </div>
  )
}