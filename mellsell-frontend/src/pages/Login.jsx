import React, { useState } from 'react'
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
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-slate-900">Entrar</h2>
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      <form onSubmit={submit} className="space-y-4">
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
          <label className="block text-sm font-medium mb-1 text-slate-700">Senha</label>
          <input 
            className="w-full border border-slate-300 p-2 rounded text-slate-900 bg-white placeholder-slate-400" 
            placeholder="Sua senha" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required
          />
        </div>
        <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-4 py-2 rounded">Entrar</button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-700">
        Não tem conta? <a href="/register" className="text-yellow-500 hover:underline">Registre-se</a>
      </p>
    </div>
  )
}
