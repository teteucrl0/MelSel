import { useId } from 'react'

function joinIds(...ids) {
  return ids.filter(Boolean).join(' ') || undefined
}

function resolveInputId({ id, name, label, autoId }) {
  if (id) return id
  if (name) return name
  const normalizedLabel = String(label || 'input')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'input'
  return `field-${normalizedLabel}-${autoId}`
}

export default function FormInput({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error = '',
  hint = '',
  success = false,
  required = false,
  disabled = false,
  className = '',
  inputClassName = '',
  readOnly = false,
  ...props
}) {
  const autoId = useId().replace(/:/g, '')
  const inputId = resolveInputId({ id, name, label, autoId })
  const hintId = hint ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined
  const successId = success && !error ? `${inputId}-success` : undefined

  return (
    <div className={`form-input ${className}`.trim()}>
      {label ? (
        <label className="label form-input__label" htmlFor={inputId}>
          {label}
          {required ? <span className="form-input__required"> *</span> : null}
        </label>
      ) : null}

      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={Boolean(error)}
        aria-describedby={joinIds(errorId, hintId, successId, props['aria-describedby'])}
        className={`input-field form-input__control ${error ? 'form-input__control--error' : ''} ${success && !error ? 'form-input__control--success' : ''} ${inputClassName}`.trim()}
        {...props}
      />

      {error ? <p id={errorId} className="form-input__message form-input__message--error">{error}</p> : null}
      {!error && success ? <p id={successId} className="form-input__message form-input__message--success">✓ Campo válido</p> : null}
      {!error && hint ? <p id={hintId} className="form-input__message form-input__message--hint">{hint}</p> : null}
    </div>
  )
}
