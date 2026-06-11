import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import authService from '../services/authService'
import { hasValidLocalSession } from '../utils/authSession'
import { formatApiError } from '../utils/apiValidationError'
import { resolvePostLoginPath } from '../services/authUtil'
import { MotionPage, StaggerContainer, StaggerItem, AnimatedButton } from '../components/motion/Motion'
import Logo from '../components/Logo'
import FormInput from '../components/FormInput'
import useFormValidation from '../hooks/useFormValidation'
import { validateEmail, validateRequired } from '../utils/validators'

function resolveDisplayError(error, sessionExpired, registerMessage) {
  if (registerMessage && !sessionExpired) return error
  if (error) return error
  if (sessionExpired) return 'Sessão expirada. Entre novamente com seu e-mail e senha.'
  return ''
}

export default function Login() {
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'
  const sessionExpired = Boolean(location.state?.sessionExpired)
  const registerMessage = location.state?.message
  const form = useFormValidation({
    initialValues: { email: '', password: '' },
    validators: {
      email: validateEmail,
      password: (value) => validateRequired(value, 'Senha é obrigatória.'),
    },
  })

  useEffect(() => {
    if (!hasValidLocalSession()) return
    navigate(resolvePostLoginPath(null, from), { replace: true })
  }, [from, navigate])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.validateForm()) return
    try {
      const session = await authService.login(form.values.email, form.values.password)
      navigate(resolvePostLoginPath(session, from), { replace: true })
    } catch (err) {
      const status = err?.response?.status
      if (status === 401 || status === 400) {
        setError('E-mail ou senha incorretos.')
      } else {
        setError(formatApiError(err, 'Não foi possível entrar. Tente novamente.'))
      }
    }
  }
  const displayError = resolveDisplayError(error, sessionExpired, registerMessage)

  return (
    <MotionPage className="mx-auto max-w-md">
      <div className="mb-6 flex justify-center">
        <motion.div whileHover={{ rotate: 2, scale: 1.02 }} className="flex items-center gap-3">
          <Logo className="h-10 w-10" />
          <div>
            <div className="text-xl font-semibold tracking-tight">MelSell</div>
            <div className="text-[10px] -mt-1 text-muted">direto do produtor</div>
          </div>
        </motion.div>
      </div>

      <div className="surface-elevated p-8">
        <h1 className="page-title text-2xl">Entrar na sua conta</h1>
        <p className="mt-2 text-sm text-muted">Compre mel artesanal ou gerencie sua produção.</p>

        {registerMessage && (
          <div className="alert mt-6" style={{ borderColor: 'rgba(52, 211, 153, 0.35)', background: 'rgba(52, 211, 153, 0.1)', color: 'var(--shop-success, #34d399)' }}>
            {registerMessage}
          </div>
        )}
        {displayError && <div className="alert alert-error mt-6">{displayError}</div>}

        <form onSubmit={submit} noValidate>
          <StaggerContainer className="mt-6 space-y-4">
            <StaggerItem>
              <FormInput
                id="email"
                type="email"
                label="E-mail"
                placeholder="voce@email.com"
                value={form.values.email}
                onChange={form.handleChange('email')}
                onBlur={form.handleBlur('email')}
                error={form.touched.email ? form.errors.email : ''}
                required
                autoComplete="email"
              />
            </StaggerItem>
            <StaggerItem>
              <FormInput
                id="password"
                type="password"
                label="Senha"
                value={form.values.password}
                onChange={form.handleChange('password')}
                onBlur={form.handleBlur('password')}
                error={form.touched.password ? form.errors.password : ''}
                required
                autoComplete="current-password"
              />
            </StaggerItem>
            <StaggerItem>
              <AnimatedButton
                type="submit"
                className="btn-primary w-full py-2.5"
              >
                Entrar
              </AnimatedButton>
            </StaggerItem>
          </StaggerContainer>
        </form>

        <div className="mt-6 space-y-3 text-center text-sm text-muted">
          <p>Não tem conta?</p>
          <div className="shop-login-register-links">
            <Link to="/register" className="shop-login-register-chip">
              Quero comprar
            </Link>
            <Link to="/register?tipo=apicultor" className="shop-login-register-chip shop-login-register-chip--vendor">
              Sou apicultor / fornecedor
            </Link>
          </div>
        </div>
      </div>

      {import.meta.env.DEV && (
        <p className="mt-4 text-center text-[11px] text-muted">
          Conta de teste (dev): admin@example.com / admin123
        </p>
      )}
    </MotionPage>
  )
}