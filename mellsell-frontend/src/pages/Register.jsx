import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import authService from '../services/authService'
import AnimatedInput from '../components/AnimatedInput'

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

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

  const validateInputs = () => {
    if (!name || !email || !birthDate || !password) {
      setError('Todos os campos são obrigatórios')
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
    
    const age = calculateAge(birthDate)
    
    try {
      if (role === 'CLIENTE') {
        await authService.register(name, email, password, age)
      } else {
        await authService.registerVendor(name, email, password, age, storeName)
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

  const handleBirthDateChange = (e) => {
    setBirthDate(e.target.value)
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-slate-900">Registrar-se</h2>
      
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700">Nome</label>
          <input 
            className="w-full border border-slate-300 p-2 rounded text-slate-900 bg-white placeholder-slate-400" 
            placeholder="Seu nome completo" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700">Email</label>
          <input 
            className="w-full border border-slate-300 p-2 rounded text-slate-900 bg-white placeholder-slate-400" 
            placeholder="seu@email.com" 
            type="email"
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700">Data de Nascimento</label>
          <input 
            className="w-full border border-slate-300 p-2 rounded text-slate-900 bg-white placeholder-slate-400" 
            placeholder="Selecione sua data de nascimento" 
            type="date"
            value={birthDate}
            onChange={handleBirthDateChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700">Tipo de Conta</label>
          <select 
            className="w-full border border-slate-300 p-2 rounded text-slate-900 bg-white"
            value={role}
            onChange={e => setRole(e.target.value)}
          >
            <option value="CLIENTE">Cliente</option>
            <option value="VENDEDOR">Fornecedor/Apicultor</option>
          </select>
        </div>

        {role === 'VENDEDOR' && (
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Nome da Loja/Empresa (Opcional)</label>
            <input 
              className="w-full border border-slate-300 p-2 rounded text-slate-900 bg-white placeholder-slate-400" 
              placeholder="Ex: Mel do Campo, Apicultora Silva, etc" 
              value={storeName}
              onChange={e => setStoreName(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700">Senha</label>
          <input 
            className={`w-full border p-2 rounded text-slate-900 bg-white placeholder-slate-400 ${
              password && !isPasswordValid(password) ? 'border-red-400' : 'border-slate-300'
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
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Força: <span className="font-semibold">{getPasswordStrengthText()}</span></span>
                <span className={`text-xs font-bold ${passwordStrength < 5 ? 'text-orange-600' : 'text-green-600'}`}>
                  {passwordStrength}/5
                </span>
              </div>
              
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-2 transition-all ${getPasswordStrengthColor()}`}
                  style={{width: `${(passwordStrength / 5) * 100}%`}}
                ></div>
              </div>

              <div className="space-y-1 bg-slate-50 p-2 rounded border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className={`text-lg ${getPasswordRequirements(password).length ? '✅' : '❌'}`}></span>
                  <span className="text-xs text-slate-700">Mínimo 8 caracteres</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg ${getPasswordRequirements(password).lower ? '✅' : '❌'}`}></span>
                  <span className="text-xs text-slate-700">Letra minúscula (a-z)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg ${getPasswordRequirements(password).upper ? '✅' : '❌'}`}></span>
                  <span className="text-xs text-slate-700">Letra maiúscula (A-Z)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg ${getPasswordRequirements(password).digit ? '✅' : '❌'}`}></span>
                  <span className="text-xs text-slate-700">Número (0-9)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg ${getPasswordRequirements(password).special ? '✅' : '❌'}`}></span>
                  <span className="text-xs text-slate-700">Caractere especial (@$!%*?&)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <button 
          type="submit"
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-4 py-2 rounded"
        >
          Registrar
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-700">
        Já tem conta? <a href="/login" className="text-yellow-500 hover:underline">Faça login</a>
      </p>
    </div>
  )
}
