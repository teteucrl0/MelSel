import api from './api'
import { formatCepDisplay } from '../utils/addressCep'

function normalizeCep(value) {
  return String(value || '').replace(/\D/g, '')
}

function mapViaCepBody(data, digits) {
  if (!data || data.erro) {
    throw new Error('CEP não encontrado.')
  }
  return {
    cep: data.cep || formatCepDisplay(digits),
    street: (data.logradouro || '').trim(),
    complement: (data.complemento || '').trim(),
    neighborhood: (data.bairro || '').trim(),
    city: (data.localidade || '').trim(),
    state: (data.uf || '').trim(),
    ibge: data.ibge || '',
    source: 'viacep',
  }
}

async function lookupViaCepPublic(cep) {
  const digits = normalizeCep(cep)
  const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error('Serviço de CEP indisponível. Tente novamente.')
  }
  const data = await res.json()
  return mapViaCepBody(data, digits)
}

async function lookupViaBackend(cep) {
  const digits = normalizeCep(cep)
  const { data } = await api.get(`/api/address/cep/${digits}`)
  return data
}

/**
 * Consulta CEP: tenta o backend MelSell e, se falhar, usa ViaCEP direto (compatível Correios).
 */
async function lookupCep(cep) {
  try {
    return await lookupViaBackend(cep)
  } catch (backendErr) {
    const status = backendErr?.response?.status
    if (status === 400 || status === 404) {
      const msg = backendErr?.response?.data?.message
      if (msg) throw new Error(msg)
    }
    try {
      return await lookupViaCepPublic(cep)
    } catch (publicErr) {
      if (publicErr?.message) throw publicErr
      throw new Error(
        backendErr?.response?.status === 403
          ? 'Não foi possível consultar o CEP. Reinicie o backend (./run-presentation.sh) ou verifique sua sessão.'
          : 'Não foi possível consultar o CEP. Verifique sua conexão.',
      )
    }
  }
}

export default { lookupCep }