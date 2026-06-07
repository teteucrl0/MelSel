/** Extrai mensagem legível de erros Axios/API. */
export function getApiErrorMessage(err, fallback = 'Não foi possível concluir a operação.') {
  const data = err?.response?.data
  if (typeof data === 'string' && data.trim()) return data.trim()
  if (data?.message && String(data.message).trim()) return String(data.message).trim()
  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors.map((e) => e?.message || e?.defaultMessage || String(e)).join(' ')
  }
  if (err?.message && !/^Request failed/i.test(err.message)) return err.message
  return fallback
}