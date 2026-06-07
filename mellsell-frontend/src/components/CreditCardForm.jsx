import { useMemo } from 'react'
import {
  cardBrand,
  clampInstallments,
  digitsOnly,
  formatCardNumber,
  formatExpiry,
  installmentAmount,
} from '../utils/creditCard'
import ShopSelect from './shop/ShopSelect'

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const BRAND_LABEL = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  elo: 'Elo',
  generic: 'Cartão',
}

export default function CreditCardForm({
  value,
  onChange,
  disabled = false,
  idPrefix = 'cc',
  estimatedTotal = 0,
}) {
  const brand = useMemo(() => cardBrand(value.number), [value.number])
  const brandLabel = BRAND_LABEL[brand] || BRAND_LABEL.generic
  const cvvMax = brand === 'amex' ? 4 : 3
  const installments = clampInstallments(value.installments)
  const parcelValue = installmentAmount(estimatedTotal, installments)

  const set = (patch) => onChange({ ...value, ...patch })

  return (
    <div className="shop-cc-form" aria-labelledby={`${idPrefix}-legend`}>
      <p id={`${idPrefix}-legend`} className="shop-cc-form-legend">
        Dados do cartão
        <span className="shop-cc-form-brand">{brandLabel}</span>
      </p>

      <div className="shop-cc-card-preview" aria-hidden>
        <div className="shop-cc-card-chip" />
        <p className="shop-cc-card-number">
          {formatCardNumber(value.number) || '•••• •••• •••• ••••'}
        </p>
        <div className="shop-cc-card-footer">
          <span className="shop-cc-card-name">
            {(value.holderName || 'NOME NO CARTÃO').toUpperCase().slice(0, 26)}
          </span>
          <span className="shop-cc-card-exp">{value.expiry || 'MM/AA'}</span>
        </div>
      </div>

      <div className="shop-cc-fields">
        <div className="shop-cc-field shop-cc-field--full">
          <label className="label" htmlFor={`${idPrefix}-number`}>
            Número do cartão
          </label>
          <input
            id={`${idPrefix}-number`}
            className="input-field shop-cc-input"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="0000 0000 0000 0000"
            value={formatCardNumber(value.number)}
            disabled={disabled}
            onChange={(e) => set({ number: digitsOnly(e.target.value).slice(0, 19) })}
          />
        </div>

        <div className="shop-cc-field shop-cc-field--full">
          <label className="label" htmlFor={`${idPrefix}-name`}>
            Nome no cartão
          </label>
          <input
            id={`${idPrefix}-name`}
            className="input-field shop-cc-input"
            autoComplete="cc-name"
            placeholder="Como está no cartão"
            value={value.holderName}
            disabled={disabled}
            onChange={(e) => set({ holderName: e.target.value })}
          />
        </div>

        <div className="shop-cc-field shop-cc-field--full">
          <label className="label" htmlFor={`${idPrefix}-installments`}>
            Parcelamento
          </label>
          <ShopSelect
            id={`${idPrefix}-installments`}
            value={String(installments)}
            disabled={disabled}
            onChange={(e) => set({ installments: clampInstallments(e.target.value) })}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n === 1 ? 'À vista (1x)' : `${n}x sem juros`}
              </option>
            ))}
          </ShopSelect>
          {estimatedTotal > 0 && (
            <p className="shop-cc-installment-preview">
              {installments === 1 ? (
                <>
                  Total no cartão: <strong>{money.format(estimatedTotal)}</strong>
                </>
              ) : (
                <>
                  {installments}x de <strong>{money.format(parcelValue)}</strong>
                  <span className="shop-cc-installment-total">
                    {' '}
                    (estimado · itens do carrinho)
                  </span>
                </>
              )}
            </p>
          )}
        </div>

        <div className="shop-cc-field-row">
          <div className="shop-cc-field">
            <label className="label" htmlFor={`${idPrefix}-exp`}>
              Validade
            </label>
            <input
              id={`${idPrefix}-exp`}
              className="input-field shop-cc-input"
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/AA"
              value={value.expiry}
              disabled={disabled}
              onChange={(e) => set({ expiry: formatExpiry(e.target.value) })}
            />
          </div>
          <div className="shop-cc-field">
            <label className="label" htmlFor={`${idPrefix}-cvv`}>
              CVV
            </label>
            <input
              id={`${idPrefix}-cvv`}
              className="input-field shop-cc-input"
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder={cvvMax === 4 ? '0000' : '000'}
              value={value.cvv}
              disabled={disabled}
              maxLength={cvvMax}
              onChange={(e) => set({ cvv: digitsOnly(e.target.value).slice(0, cvvMax) })}
            />
          </div>
        </div>
      </div>

      <p className="shop-cc-hint">
        Pagamento simulado com validação segura. Não armazenamos o número completo. Teste recusa:{' '}
        <code>4000 0000 0000 0002</code>
      </p>
    </div>
  )
}