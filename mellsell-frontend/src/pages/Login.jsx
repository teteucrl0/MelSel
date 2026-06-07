import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import authService from '../services/authService'
import { hasValidLocalSession } from '../utils/authSession'
import { formatApiError } from '../utils/apiValidationError'
import { resolvePostLoginPath } from '../services/authUtil'
import { MotionPage, StaggerContainer, StaggerItem, AnimatedButton, variants } from '../components/motion/Motion'
import Logo from '../components/Logo'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'
  const sessionExpired = Boolean(location.state?.sessionExpired)
  const registerMessage = location.state?.message

  useEffect(() => {
    if (sessionExpired) {
      setError('Sessão expirada. Entre novamente com seu e-mail e senha.')
    } else if (registerMessage) {
      setError('')
    }
  }, [sessionExpired, registerMessage])

  useEffect(() => {
    if (!hasValidLocalSession()) return
    navigate(resolvePostLoginPath(null, from), { replace: true })
  }, [from, navigate])

  const submit = async (e) => {
    e.preventDefault()
    try {
      const session = await authService.login(email, password)
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
        {error && <div className="alert alert-error mt-6">{error}</div>}

        <form onSubmit={submit}>
          <StaggerContainer className="mt-6 space-y-4">
            <StaggerItem>
              <div>
                <label className="label" htmlFor="email">E-mail</label>
                <input
                  id="email"
                  className="input-field"
                  type="email"
                  placeholder="voce@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </StaggerItem>
            <StaggerItem>
              <div>
                <label className="label" htmlFor="password">Senha</label>
                <input
                  id="password"
                  className="input-field"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
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