export default function AnimatedInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error = '',
  disabled = false,
  className = '',
  id,
  ...props
}) {
  const inputId = id || `field-${String(label || 'input').replace(/\s+/g, '-').toLowerCase()}`

  return (
    <div className={className}>
      <label htmlFor={inputId} className="label">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`input-field ${error ? '!border-red-400' : ''}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}