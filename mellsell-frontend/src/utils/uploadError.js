export function formatUploadError(err) {
  if (!err?.response) {
    const code = err?.code
    if (code === 'ECONNABORTED') return 'Envio demorou demais. Tente uma imagem menor.'
    if (code === 'ERR_NETWORK') {
      return 'Sem conexão com o servidor. Confira se o backend está rodando e recarregue a página (F5).'
    }
    return err?.message || 'Não foi possível conectar ao servidor.'
  }
  const { status, data } = err.response
  const msg = data?.message
  if (status === 401) return 'Sessão expirada. Faça login novamente.'
  if (status === 403) return 'Sem permissão. Entre com conta de apicultor (vendedor).'
  if (status === 413) return 'Imagem muito grande. Máximo 5 MB.'
  if (msg) return msg
  return `Erro ao enviar imagem (${status}).`
}