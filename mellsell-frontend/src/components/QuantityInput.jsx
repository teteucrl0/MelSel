export default function QuantityInput({
  value,
  onChange,
  min = 0,
  max = 99999,
  label = 'Quantidade',
  id,
  disabled = false,
}) {
  const num = Number(value) || 0

  const set = (next) => {
    const clamped = Math.min(max, Math.max(min, next))
    onChange(clamped)
  }

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="qty-stepper" id={id} role="group" aria-label={label || 'Quantidade'}>
        <button
          type="button"
          className="qty-stepper-btn"
          onClick={() => set(num - 1)}
          disabled={disabled || num <= min}
          aria-label="Diminuir quantidade"
        >
          −
        </button>
        <span className="qty-stepper-value tabular-nums" aria-live="polite">
          {num}
        </span>
        <button
          type="button"
          className="qty-stepper-btn qty-stepper-btn--plus"
          onClick={() => set(num + 1)}
          disabled={disabled || num >= max}
          aria-label="Aumentar quantidade"
        >
          +
        </button>
      </div>
    </div>
  )
}