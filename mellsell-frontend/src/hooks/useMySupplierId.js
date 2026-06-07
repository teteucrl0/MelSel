import { useEffect, useState } from 'react'
import { hasRole } from '../services/authUtil'
import supplierService from '../services/supplierService'

/** ID do fornecedor do apicultor logado (null se não for vendedor ou sem loja). */
export default function useMySupplierId() {
  const [supplierId, setSupplierId] = useState(null)
  const [loading, setLoading] = useState(hasRole('VENDEDOR'))

  useEffect(() => {
    if (!hasRole('VENDEDOR')) {
      setSupplierId(null)
      setLoading(false)
      return
    }
    let cancelled = false
    supplierService
      .getMySupplier()
      .then((s) => {
        if (!cancelled) setSupplierId(s?.id ?? null)
      })
      .catch(() => {
        if (!cancelled) setSupplierId(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { supplierId, loading, isVendor: hasRole('VENDEDOR') }
}