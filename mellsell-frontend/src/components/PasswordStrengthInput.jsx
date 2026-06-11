import FormInput from './FormInput'
import { PASSWORD_REQUIREMENT_LABELS, getPasswordRequirements, getPasswordStrengthScore } from '../utils/validators'

export default function PasswordStrengthInput({
  id = 'password',
  label = 'Senha',
  value,
  onChange,
  onBlur,
  error = '',
  required = true,
  disabled = false,
  autoComplete = 'new-password',
}) {
  const requirements = getPasswordRequirements(value)
  const strength = getPasswordStrengthScore(value)

  return (
    <div className="password-strength-input">
      <FormInput
        id={id}
        type="password"
        label={label}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        disabled={disabled}
        error={error}
        autoComplete={autoComplete}
      />

      {value ? (
        <div className="password-strength" aria-live="polite">
          <p className="password-strength__label">Força: {strength}/5</p>
          <div className="password-strength__bar" role="progressbar" aria-valuemin={0} aria-valuemax={5} aria-valuenow={strength} aria-label="Força da senha">
            <span className="password-strength__fill" style={{ width: `${(strength / 5) * 100}%` }} />
          </div>
          <ul className="password-strength__list">
            {Object.entries(PASSWORD_REQUIREMENT_LABELS).map(([key, requirementLabel]) => (
              <li key={key} className={requirements[key] ? 'is-done' : ''}>
                {requirements[key] ? '✓' : '•'} {requirementLabel}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
