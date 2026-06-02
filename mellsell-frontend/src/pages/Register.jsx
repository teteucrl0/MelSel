import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import authService from '../services/authService'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('CLIENTE')
  const [storeName, setStoreName] = useState('')
  const [error, setError] = useState('')
  const [passwordStrength, setPasswordStrength] = useState(0)
  const navigate = useNavigate()

  const getPasswordRequirements = (pwd) => {
    return {
      length: pwd.length >= 8,
      lower: /[a-z]/.test(pwd),
      upper: /[A-Z]/.test(pwd),
      digit: /\d/.test(pwd),
      special: /[@$!%*?&]/.test(pwd)
    }
  }

  const checkPasswordStrength = (pwd) => {
    if (!pwd) {
      setPasswordStrength(0)
      return
    }
    const reqs = getPasswordRequirements(pwd)
    const strength = Object.values(reqs).filter(Boolean).length
    setPasswordStrength(strength)
  }

  const isPasswordValid = (pwd) => {
    const reqs = getPasswordRequirements(pwd)
    return Object.values(reqs).every(Boolean)
  }

  const calculateAge = (date) => {
    const today = new Date()
    const birthDay = new Date(date)
    let age = today.getFullYear() - birthDay.getFullYear()
    const monthDiff = today.getMonth() - birthDay.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDay.getDate())) {
      age--
    }
    return age
  }

  const validateInputs = () => {
    if (!name || !email || !birthDate || !password) {
      setError('Todos os campos são obrigatórios')
      return false
    }
    
    const age = calculateAge(birthDate)
    if (age < 18) {
      setError('Você deve ter no mínimo 18 anos para se registrar')
      return false
    }
    
    if (!isPasswordValid(password)) {
      setError('Senha inválida. Verifique os requisitos abaixo')
      return false
    }
    
    return true
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!validateInputs()) return
    
    try {
      if (role === 'CLIENTE') {
        await authService.register(name, email, password, birthDate)
      } else {
        await authService.registerVendor(name, email, password, birthDate, storeName)
      }
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erro ao registrar')
    }
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500'
    if (passwordStrength <= 2) return 'bg-yellow-500'
    if (passwordStrength === 3) return 'bg-blue-500'
    if (passwordStrength === 4) return 'bg-green-500'
    return 'bg-green-600'
  }

  const getPasswordStrengthText = () => {
    const texts = ['', 'Muito fraca', 'Fraca', 'Média', 'Forte', 'Muito forte']
    return texts[passwordStrength] || ''
  }

  return (
    <div className="mx-auto max-w-md rounded-lg border-2 border-amber-200 bg-white p-6 shadow-md dark:border-slate-800 dark:bg-slate-900">
      <h2 className="font-serif text-2xl font-bold text-amber-900 dark:text-slate-100">Registrar-se</h2>
      <p className="mt-1 text-sm text-amber-700 dark:text-slate-400">Junte-se à nossa família!</p>
      
      {error && <div className="mt-4 rounded-md border-2 border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">{error}</div>}
      
      <form onSubmit={submit} className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-amber-800 dark:text-slate-300">Nome</label>
          <input 
            className="mt-1 w-full rounded-md border-2 border-amber-300 bg-white p-2 text-amber-900 placeholder-amber-400 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-amber-500" 
            placeholder="Seu nome completo" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-amber-800 dark:text-slate-300">Email</label>
          <input 
            className="mt-1 w-full rounded-md border-2 border-amber-300 bg-white p-2 text-amber-900 placeholder-amber-400 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-amber-500" 
            placeholder="seu@email.com" 
            type="email"
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-amber-800 dark:text-slate-300">Data de Nascimento</label>
          <input 
            className="mt-1 w-full rounded-md border-2 border-amber-300 bg-white p-2 text-amber-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-amber-500" 
            type="date"
            value={birthDate}
            onChange={e => setBirthDate(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">É necessário ter no mínimo 18 anos</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-amber-800 dark:text-slate-300">Tipo de Conta</label>
          <select 
            className="mt-1 w-full rounded-md border-2 border-amber-300 bg-white p-2 text-amber-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-amber-500"
            value={role}
            onChange={e => setRole(e.target.value)}
          >
            <option value="CLIENTE">Cliente</option>
            <option value="VENDEDOR">Fornecedor/Apicultor</option>
          </select>
        </div>

        {role === 'VENDEDOR' && (
          <div>
            <label className="block text-sm font-medium text-amber-800 dark:text-slate-300">Nome da Loja/Empresa (Opcional)</label>
            <input 
              className="mt-1 w-full rounded-md border-2 border-amber-300 bg-white p-2 text-amber-900 placeholder-amber-400 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-amber-500" 
              placeholder="Ex: Mel do Campo, Apicultora Silva" 
              value={storeName}
              onChange={e => setStoreName(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-amber-800 dark:text-slate-300">Senha</label>
          <input 
            className={`mt-1 w-full rounded-md border-2 p-2 text-amber-900 placeholder-amber-400 focus:outline-none dark:text-slate-100 dark:placeholder-slate-500 ${
              password && !isPasswordValid(password) ? 'border-red-400' : 'border-amber-300 dark:border-slate-700 dark:bg-slate-800'
            } ${password && isPasswordValid(password) ? 'border-green-400' : ''}`}
            placeholder="Mínimo 8 caracteres" 
            type="password" 
            value={password} 
            onChange={e => {
              setPassword(e.target.value)
              checkPasswordStrength(e.target.value)
            }} 
            required
          />
          
          {password && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-amber-700 dark:text-slate-400">
                <span>Força: <span className="font-semibold">{getPasswordStrengthText()}</span></span>
                <span className="font-bold">{passwordStrength}/5</span>
              </div>
              
              <div className="h-2 w-full overflow-hidden rounded-full bg-amber-100 dark:bg-slate-800">
                <div 
                  className={`h-2 transition-all ${getPasswordStrengthColor()}`}
                  style={{width: `${(passwordStrength / 5) * 100}%`}}
                ></div>
              </div>

              <div className="rounded-md border border-amber-200 bg-amber-50 p-2 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-slate-400">
                  <span>{getPasswordRequirements(password).length ? '✅' : '❌'}</span>
                  <span>Mínimo 8 caracteres</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-slate-400">
                  <span>{getPasswordRequirements(password).lower ? '✅' : '❌'}</span>
                  <span>Letra minúscula (a-z)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-slate-400">
                  <span>{getPasswordRequirements(password).upper ? '✅' : '❌'}</span>
                  <span>Letra maiúscula (A-Z)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-slate-400">
                  <span>{getPasswordRequirements(password).digit ? '✅' : '❌'}</span>
                  <span>Número (0-9)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-slate-400">
                  <span>{getPasswordRequirements(password).special ? '✅' : '❌'}</span>
                  <span>Caractere especial (@$!%*?&)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <button 
          type="submit"
          className="w-full rounded-md bg-amber-500 px-4 py-2 font-semibold text-white transition hover:bg-amber-600"
        >
          Registrar
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-amber-700 dark:text-slate-400">
        Já tem conta? <a href="/login" className="font-semibold text-amber-600 hover:underline dark:text-amber-400">Faça login</a>
      </p>
    </div>
  )
}
