import FlaticonIcon from './FlaticonIcon'
import FormInput from './FormInput'

/** Campos e benefícios do cadastro como fornecedor. */
export default function VendorRegisterPanel({
  storeName,
  onStoreNameChange,
  storeError,
  description,
  onDescriptionChange,
  descriptionError,
  city,
  onCityChange,
  cityError,
  state,
  onStateChange,
  stateError,
  disabled,
}) {
  return (
    <div className="shop-vendor-register-panel">
      <p className="shop-vendor-register-title shop-vendor-register-title--with-icon">
        <FlaticonIcon name="vendor" size="md" className="flaticon-icon--vendor-stall" />
        Sua loja no MelSell
      </p>
      <ul className="shop-vendor-register-features">
        <li>Painel com vendas e pedidos em tempo real</li>
        <li>Cadastro de produtos, fotos e estoque</li>
        <li>Cupons e promoções para clientes</li>
        <li>Aparece na busca da loja pelo nome da sua marca</li>
      </ul>
      <div className="shop-vendor-register-fields">
        <div>
          <FormInput
            id="register-store"
            label="Nome da loja ou apiário"
            placeholder="Ex.: Apiário Silva, Mel da Serra"
            value={storeName}
            onChange={(e) => onStoreNameChange(e.target.value)}
            disabled={disabled}
            maxLength={120}
            required
            error={storeError}
            hint="É assim que os clientes vão encontrar você na loja."
          />
        </div>

        <div>
          <label className="label" htmlFor="register-vendor-description">
            Descrição da loja <span className="shop-required">*</span>
          </label>
          <textarea
            id="register-vendor-description"
            className={`input-field shop-vendor-description ${descriptionError ? 'shop-input-invalid' : ''}`}
            placeholder="Conte sobre seus produtos, região, tipos de mel e diferenciais…"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            disabled={disabled}
            maxLength={2000}
            rows={4}
            required
            aria-invalid={Boolean(descriptionError)}
          />
          {descriptionError ? (
            <p className="shop-field-error">{descriptionError}</p>
          ) : (
            <p className="shop-field-hint">Mínimo 20 caracteres. Aparece no perfil do fornecedor.</p>
          )}
        </div>

        <div className="shop-vendor-location-grid">
          <div>
            <FormInput
              id="register-vendor-city"
              label="Cidade"
              placeholder="Ex.: Ouro Preto"
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              disabled={disabled}
              maxLength={80}
              required
              error={cityError}
            />
          </div>
          <div>
            <FormInput
              id="register-vendor-state"
              label="UF"
              placeholder="MG"
              value={state}
              onChange={(e) => onStateChange(e.target.value)}
              disabled={disabled}
              maxLength={2}
              required
              autoComplete="address-level1"
              error={stateError}
              hint="2 letras"
            />
          </div>
        </div>
      </div>
    </div>
  )
}