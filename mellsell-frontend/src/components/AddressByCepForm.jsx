import { useCallback, useEffect, useRef, useState } from 'react'
import cepService from '../services/cepService'
import { formatCepDisplay, isValidCep, normalizeCep } from '../utils/addressCep'
import { stripMarkupChars } from '../utils/inputSanitizer'

export default function AddressByCepForm({ value, onChange, disabled = false }) {
  const [cep, setCep] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [loadingCep, setLoadingCep] = useState(false)
  const [cepError, setCepError] = useState('')
  const lastLookup = useRef('')

  const emit = useCallback(
    (patch) => {
      onChange?.({
        cep,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        ...patch,
      })
    },
    [onChange, cep, street, number, complement, neighborhood, city, state],
  )

  useEffect(() => {
    if (!value) return
    setCep(value.cep || '')
    setStreet(value.street || '')
    setNumber(value.number || '')
    setComplement(value.complement || '')
    setNeighborhood(value.neighborhood || '')
    setCity(value.city || '')
    setState(value.state || '')
  }, [])

  const lookup = useCallback(
    async (rawCep) => {
      const digits = normalizeCep(rawCep)
      if (!isValidCep(digits)) {
        setCepError('Informe um CEP com 8 dígitos.')
        return
      }
      if (digits === lastLookup.current) return

      setLoadingCep(true)
      setCepError('')
      try {
        const data = await cepService.lookupCep(digits)
        lastLookup.current = digits
        const next = {
          cep: data.cep || formatCepDisplay(digits),
          street: data.street || '',
          neighborhood: data.neighborhood || '',
          city: data.city || '',
          state: data.state || '',
        }
        setCep(next.cep)
        setStreet(next.street)
        setNeighborhood(next.neighborhood)
        setCity(next.city)
        setState(next.state)
        if (data.complement && !complement) {
          setComplement(data.complement)
          next.complement = data.complement
        }
        emit({ ...next, number, complement: next.complement ?? complement })
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message
        setCepError(msg || 'CEP não encontrado. Verifique e tente novamente.')
        lastLookup.current = ''
      } finally {
        setLoadingCep(false)
      }
    },
    [complement, emit, number],
  )

  useEffect(() => {
    const digits = normalizeCep(cep)
    if (digits.length === 8 && digits !== lastLookup.current) {
      const t = setTimeout(() => lookup(digits), 400)
      return () => clearTimeout(t)
    }
    return undefined
  }, [cep, lookup])

  const update = (field, val) => {
    const safeVal =
      field === 'cep' ? val.replace(/\D/g, '').slice(0, 8) : stripMarkupChars(val)
    const patch = { [field]: safeVal }
    switch (field) {
      case 'cep':
        setCep(formatCepDisplay(safeVal))
        patch.cep = formatCepDisplay(safeVal)
        break
      case 'street':
        setStreet(val)
        break
      case 'number':
        setNumber(safeVal)
        patch.number = safeVal
        break
      case 'complement':
        setComplement(safeVal)
        patch.complement = safeVal
        break
      case 'neighborhood':
        setNeighborhood(val)
        break
      case 'city':
        setCity(val)
        break
      case 'state':
        setState(val)
        break
      default:
        break
    }
    emit(patch)
  }

  return (
    <div className="address-cep-form space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <label className="label" htmlFor="cep">
            CEP
          </label>
          <input
            id="cep"
            className="input-field"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            value={cep}
            disabled={disabled || loadingCep}
            onChange={(e) => update('cep', e.target.value)}
            onBlur={() => lookup(cep)}
            required
          />
          {loadingCep && (
            <p className="mt-1 text-xs text-brand-700 dark:text-brand-400">Consultando Correios (ViaCEP)...</p>
          )}
          {cepError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{cepError}</p>}
        </div>
        <button
          type="button"
          className="btn-secondary py-2.5 sm:mb-0"
          disabled={disabled || loadingCep || !isValidCep(cep)}
          onClick={() => lookup(cep)}
        >
          Buscar endereço
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="street">
            Logradouro
          </label>
          <input
            id="street"
            className="input-field bg-stone-50 dark:bg-stone-800/80"
            value={street}
            readOnly
            placeholder="Preenchido automaticamente pelo CEP"
          />
        </div>
        <div>
          <label className="label" htmlFor="number">
            Número
          </label>
          <input
            id="number"
            className="input-field"
            value={number}
            disabled={disabled}
            onChange={(e) => update('number', e.target.value)}
            placeholder="Ex.: 123"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="complement">
            Complemento (opcional)
          </label>
          <input
            id="complement"
            className="input-field"
            value={complement}
            disabled={disabled}
            onChange={(e) => update('complement', e.target.value)}
            placeholder="Apto, bloco, referência"
          />
        </div>
        <div>
          <label className="label" htmlFor="neighborhood">
            Bairro
          </label>
          <input
            id="neighborhood"
            className="input-field bg-stone-50 dark:bg-stone-800/80"
            value={neighborhood}
            readOnly
          />
        </div>
        <div className="grid grid-cols-[1fr_4rem] gap-3">
          <div>
            <label className="label" htmlFor="city">
              Cidade
            </label>
            <input id="city" className="input-field bg-stone-50 dark:bg-stone-800/80" value={city} readOnly />
          </div>
          <div>
            <label className="label" htmlFor="state">
              UF
            </label>
            <input id="state" className="input-field bg-stone-50 dark:bg-stone-800/80" value={state} readOnly />
          </div>
        </div>
      </div>
    </div>
  )
}