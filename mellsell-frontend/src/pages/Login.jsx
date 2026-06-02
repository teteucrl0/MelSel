import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import authService from '../services/authService'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    try {
      await authService.login(email, password)
      navigate('/')
      window.location.reload()
    } catch (err) {
      console.error(err)
      setError('Falha no login')
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-lg border-2 border-amber-200 bg-white p-6 shadow-md">
      <h2 className="font-serif text-2xl font-bold text-amber-900">Entrar</h2>
      <p className="mt-1 text-sm text-amber-700">Bem-vindo de volta à fazenda!</p>
      
      {error && <div className="mt-4 rounded-md border-2 border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      
      <form onSubmit={submit} className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-amber-800">Email</label>
          <input 
            className="mt-1 w-full rounded-md border-2 border-amber-300 bg-white p-2 text-amber-900 placeholder-amber-400 focus:border-amber-500 focus:outline-none" 
            placeholder="seu@email.com" 
            type="email"
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-amber-800">Senha</label>
          <input 
            className="mt-1 w-full rounded-md border-2 border-amber-300 bg-white p-2 text-amber-900 placeholder-amber-400 focus:border-amber-500 focus:outline-none" 
            placeholder="Sua senha" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required
          />
        </div>
        <button type="submit" className="w-full rounded-md bg-amber-500 px-4 py-2 font-semibold text-white transition hover:bg-amber-600">
          Entrar
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-amber-700">
        Não tem conta? <a href="/register" className="font-semibold text-amber-600 hover:underline">Registre-se</a>
      </p>
    </div>
  )
}
