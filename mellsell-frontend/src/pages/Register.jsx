import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import authService from '../services/authService'
import ApiarySetupLive from '../components/ApiarySetupLive'
import BirthDateInput from '../components/BirthDateInput'
import AccountTypePicker from '../components/AccountTypePicker'
import VendorRegisterPanel from '../components/VendorRegisterPanel'
import { motion } from 'framer-motion'
import { MotionPage } from '../components/motion/Motion'
import Logo from '../components/Logo'
import { brDateToIso, getBirthDateValidationError, isValidBrBirthDate } from '../utils/birthDateBr'
import { getFullNameError, isValidFullName, normalizeFullName } from '../utils/fullName'
import {
  getVendorCityError,
  getVendorDescriptionError,
  getVendorStateError,
  getVendorStoreNameError,
  stripMarkupChars,
} from '../utils/inputSanitizer'
import { resolvePostLoginPath } from '../services/authUtil'

const FIELD_LABELS = {
  name: 'Nome',
  email: 'E-mail',
  password: 'Senha',
  birthDate: 'Data de nascimento',
  storeName: 'Nome da loja',
  supplierDescription: 'Descrição da loja',
  supplierCity: 'Cidade',
  supplierState: 'UF',
}

function parseRegisterError(err) {
  const data = err?.response?.data
  if (!data) return 'Não foi possível conectar ao servidor. Tente novamente.'

  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors
      .map((e) => {
        const label = FIELD_LABELS[e.field] || e.field
        return `${label}: ${e.message}`
      })
      .join(' · ')
  }

  if (data.message && data.message !== 'Validation failed') {
    return data.message
  }

  if (data.message === 'Validation failed') {
    return 'Verifique os campos destacados e tente novamente.'
  }

  return 'Erro ao registrar. Verifique os dados e tente novamente.'
}

function initialRoleFromSearch(searchParams) {
  const tipo = (searchParams.get('tipo') || searchParams.get('role') || '').toLowerCase()
  if (tipo === 'apicultor' || tipo === 'vendedor' || tipo === 'fornecedor' || tipo === 'vendor') {
    return 'VENDEDOR'
  }
  return 'CLIENTE'
}

export default function Register() {
  const [searchParams] = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(() => initialRoleFromSearch(searchParams))
  const [storeName, setStoreName] = useState('')
  const [storeError, setStoreError] = useState('')
  const [supplierDescription, setSupplierDescription] = useState('')
  const [descriptionError, setDescriptionError] = useState('')
  const [supplierCity, setSupplierCity] = useState('')
  const [cityError, setCityError] = useState('')
  const [supplierState, setSupplierState] = useState('')
  const [stateError, setStateError] = useState('')
  const [error, setError] = useState('')
  const [nameError, setNameError] = useState('')
  const [birthDateError, setBirthDateError] = useState('')
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [apiaryLive, setApiaryLive] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setRole(initialRoleFromSearch(searchParams))
  }, [searchParams])

  const getPasswordRequirements = (pwd) => ({
    length: pwd.length >= 8,
    lower: /[a-z]/.test(pwd),
    upper: /[A-Z]/.test(pwd),
    digit: /\d/.test(pwd),
    special: /[^A-Za-z0-9]/.test(pwd),
  })

  const checkPasswordStrength = (pwd) => {
    if (!pwd) {
      setPasswordStrength(0)
      return
    }
    setPasswordStrength(Object.values(getPasswordRequirements(pwd)).filter(Boolean).length)
  }

  const isPasswordValid = (pwd) => Object.values(getPasswordRequirements(pwd)).every(Boolean)

  const calculateAge = (isoDate) => {
    const today = new Date()
    const birthDay = new Date(isoDate)
    let age = today.getFullYear() - birthDay.getFullYear()
    const monthDiff = today.getMonth() - birthDay.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDay.getDate())) age--
    return age
  }

  const validateInputs = () => {
    setBirthDateError('')
    setNameError('')
    setStoreError('')
    setDescriptionError('')
    setCityError('')
    setStateError('')
    if (!name || !email || !birthDate || !password) {
      setError('Todos os campos são obrigatórios.')
      return false
    }
    const nameErr = getFullNameError(name)
    if (nameErr || !isValidFullName(name)) {
      setNameError(nameErr || 'Informe nome e sobrenome.')
      setError(nameErr || 'Informe nome e sobrenome.')
      return false
    }
    const dateErr = getBirthDateValidationError(birthDate)
    if (dateErr || !isValidBrBirthDate(birthDate)) {
      const msg = dateErr || 'Data de nascimento inválida. Use o formato dd/mm/aaaa.'
      setBirthDateError(msg)
      setError(msg)
      return false
    }
    if (role === 'VENDEDOR') {
      const storeErr = getVendorStoreNameError(storeName)
      if (storeErr) {
        setStoreError(storeErr)
        setError(storeErr)
        return false
      }
      const descErr = getVendorDescriptionError(supplierDescription)
      if (descErr) {
        setDescriptionError(descErr)
        setError(descErr)
        return false
      }
      const cityErr = getVendorCityError(supplierCity)
      if (cityErr) {
        setCityError(cityErr)
        setError(cityErr)
        return false
      }
      const uf = supplierState.trim().toUpperCase()
      const stateErr = getVendorStateError(uf)
      if (stateErr) {
        setStateError(stateErr)
        setError(stateErr)
        return false
      }
    }
    const birthIso = brDateToIso(birthDate)
    if (calculateAge(birthIso) < 18) {
      setError('É necessário ter no mínimo 18 anos.')
      return false
    }
    if (!isPasswordValid(password)) {
      setError('A senha não atende aos requisitos de segurança.')
      return false
    }
    return true
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!validateInputs()) return
    setSubmitting(true)
    const birthIso = brDateToIso(birthDate)
    if (!birthIso) {
      setBirthDateError('Data de nascimento inválida.')
      setError('Data de nascimento inválida.')
      setSubmitting(false)
      return
    }
    try {
      const fullName = normalizeFullName(name)
      if (role === 'CLIENTE') {
        await authService.register(fullName, email, password, birthIso)
        navigate('/login', {
          state: { message: 'Conta criada! Entre com seu e-mail e senha para comprar.' },
        })
      } else {
        setApiaryLive(true)
        const session = await authService.registerVendor(fullName, email, password, birthIso, storeName, {
          supplierDescription: supplierDescription.trim(),
          supplierCity: supplierCity.trim(),
          supplierState: supplierState.trim().toUpperCase(),
        })
        setTimeout(() => {
          setApiaryLive(false)
          if (session?.token) {
            const pending = session.pendingApproval === true
            navigate('/vendor/dashboard', {
              replace: true,
              state: {
                welcome: !pending,
                pendingApproval: pending,
                message: pending
                  ? 'Conta criada! Sua loja aguarda aprovação da equipe MelSell. Você já pode acessar o painel.'
                  : undefined,
              },
            })
          } else {
            navigate('/login')
          }
        }, 5200)
      }
    } catch (err) {
      setApiaryLive(false)
      setError(parseRegisterError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const reqs = getPasswordRequirements(password)
  const isVendor = role === 'VENDEDOR'

  return (
    <MotionPage className="mx-auto max-w-lg shop-register-page">
      <div className="mb-5 flex justify-center">
        <div className="flex items-center gap-3">
          <Logo className="h-9 w-9" />
          <div className="text-xl font-semibold tracking-tight" style={{ color: 'var(--shop-text)' }}>
            Bem-vindo ao MelSell
          </div>
        </div>
      </div>

      <div className="shop-register-card surface-elevated p-6 sm:p-8">
        <h1 className="page-title text-2xl">Criar sua conta</h1>
        <p className="mt-2 text-sm text-muted">
          Escolha se você quer <strong>comprar mel</strong> ou <strong>vender como apicultor</strong>.
        </p>

        {error && <div className="alert alert-error mt-6">{error}</div>}

        <form onSubmit={submit} className="mt-6 space-y-5">
          <div>
            <p className="label mb-2">Como você vai usar o MelSell?</p>
            <AccountTypePicker
              value={role}
              disabled={submitting || apiaryLive}
              onChange={(next) => {
                setRole(next)
                setError('')
                setStoreError('')
                setDescriptionError('')
                setCityError('')
                setStateError('')
              }}
            />
          </div>

          {isVendor && (
            <VendorRegisterPanel
              storeName={storeName}
              storeError={storeError}
              description={supplierDescription}
              descriptionError={descriptionError}
              city={supplierCity}
              cityError={cityError}
              state={supplierState}
              stateError={stateError}
              disabled={submitting || apiaryLive}
              onStoreNameChange={(v) => {
                const clean = stripMarkupChars(v)
                setStoreName(clean)
                if (storeError) setStoreError(getVendorStoreNameError(clean) || '')
              }}
              onDescriptionChange={(v) => {
                const clean = stripMarkupChars(v)
                setSupplierDescription(clean)
                if (descriptionError) setDescriptionError(getVendorDescriptionError(clean) || '')
              }}
              onCityChange={(v) => {
                const clean = stripMarkupChars(v)
                setSupplierCity(clean)
                if (cityError) setCityError(getVendorCityError(clean) || '')
              }}
              onStateChange={(v) => {
                const clean = stripMarkupChars(v).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2)
                setSupplierState(clean)
                if (stateError) setStateError(getVendorStateError(clean) || '')
              }}
            />
          )}

          <div>
            <label className="label" htmlFor="register-name">
              Nome completo
            </label>
            <input
              id="register-name"
              className={`input-field ${nameError ? 'shop-input-invalid' : ''}`}
              value={name}
              placeholder="Ex.: Maria Silva Santos"
              onChange={(e) => {
                const v = stripMarkupChars(e.target.value)
                setName(v)
                if (nameError) setNameError(getFullNameError(v) || '')
              }}
              onBlur={() => setNameError(getFullNameError(name) || '')}
              maxLength={120}
              required
              aria-invalid={Boolean(nameError)}
            />
            {nameError ? (
              <p className="shop-field-error">{nameError}</p>
            ) : (
              <p className="shop-field-hint">Nome e sobrenome, separados por espaço.</p>
            )}
          </div>
          <div>
            <label className="label">E-mail</label>
            <input
              className="input-field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <BirthDateInput
            value={birthDate}
            onChange={(v) => {
              setBirthDate(v)
              if (birthDateError) setBirthDateError(getBirthDateValidationError(v) || '')
            }}
            error={birthDateError}
          />
          <div>
            <label className="label">Senha</label>
            <input
              className="input-field"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                checkPasswordStrength(e.target.value)
              }}
              required
            />
            {password && (
              <div className="mt-3 space-y-1.5 rounded-lg border border-stone-200 bg-stone-50 p-3 text-xs dark:border-stone-700 dark:bg-stone-800/50">
                <p className="font-medium text-muted">Força: {passwordStrength}/5</p>
                {[
                  ['length', 'Mínimo 8 caracteres'],
                  ['lower', 'Letra minúscula'],
                  ['upper', 'Letra maiúscula'],
                  ['digit', 'Número'],
                  ['special', 'Caractere especial (ex.: ! @ # _)'],
                ].map(([key, label]) => (
                  <p key={key} className={reqs[key] ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted'}>
                    {reqs[key] ? '✓' : '·'} {label}
                  </p>
                ))}
              </div>
            )}
          </div>
          <ApiarySetupLive active={apiaryLive} />

          <motion.button
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.985 }}
            type="submit"
            disabled={submitting || apiaryLive}
            className="btn-primary w-full py-2.5"
          >
            {submitting
              ? 'Criando conta…'
              : apiaryLive
                ? 'Configurando apiário…'
                : isVendor
                  ? 'Criar loja de apicultor'
                  : 'Criar conta de comprador'}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Já tem conta?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline dark:text-brand-400">
            Entrar
          </Link>
        </p>
      </div>
    </MotionPage>
  )
}