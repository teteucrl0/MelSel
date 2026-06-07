import { useMemo } from 'react'
import { getBirthDateValidationError, maskBirthDateBr } from '../utils/birthDateBr'

export default function BirthDateInput({
  value,
  onChange,
  id = 'birthDate',
  required = true,
  error: externalError = '',
}) {
  const validationError = useMemo(
    () => getBirthDateValidationError(value, { required }),
    [value, required],
  )

  const showError = Boolean(externalError || validationError)
  const errorMessage = externalError || validationError

  return (
    <div>
      <label htmlFor={id} className="label">
        Data de nascimento
      </label>
      <input
        id={id}
        className={`input-field ${showError ? '!border-red-500 focus:!border-red-500 dark:!border-red-400' : ''}`}
        inputMode="numeric"
        autoComplete="bday"
        placeholder="dd/mm/aaaa"
        value={value}
        onChange={(e) => onChange(maskBirthDateBr(e.target.value))}
        required={required}
        maxLength={10}
        aria-invalid={showError}
        aria-describedby={showError ? `${id}-error` : undefined}
      />
      {showError ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600 dark:text-red-400">
          {errorMessage}
        </p>
      ) : (
        <p className="mt-1 text-xs text-muted">Formato: dd/mm/aaaa — mês de 01 a 12</p>
      )}
    </div>
  )
}