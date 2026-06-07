const FIELD_LABELS = {
  name: 'Nome',
  description: 'Descrição',
  price: 'Preço',
  stock: 'Estoque',
  lowStockThreshold: 'Alerta de estoque baixo',
  supplierId: 'Fornecedor',
  imageUrl: 'Imagem',
  code: 'Código',
  discountPercentage: 'Desconto',
  maxUses: 'Máximo de usos',
  validFrom: 'Válido de',
  validUntil: 'Válido até',
  email: 'E-mail',
  password: 'Senha',
  birthDate: 'Data de nascimento',
  storeName: 'Nome da loja',
}

function labelFor(field) {
  if (!field) return 'Campo'
  return FIELD_LABELS[field] || field
}

/**
 * Mensagem amigável a partir da resposta do GlobalExceptionHandler (Spring).
 */
export function formatApiError(err, fallback = 'Não foi possível concluir a operação.') {
  const status = err?.response?.status
  if (status === 401) return 'Sessão expirada. Faça login novamente.'
  if (status === 403) return 'Você não tem permissão para esta ação.'
  if (status === 404) return 'Recurso não encontrado.'
  if (status === 409) {
    const conflict = err?.response?.data?.message
    if (conflict) return conflict
  }

  const data = err?.response?.data
  if (!data) {
    if (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network')) {
      return 'Servidor indisponível. Verifique se o backend está rodando.'
    }
    return fallback
  }

  const errors = data.errors
  if (Array.isArray(errors) && errors.length > 0) {
    if (typeof errors[0] === 'string') {
      return errors.join(' · ')
    }
    return errors
      .map((e) => `${labelFor(e.field)}: ${e.message}`)
      .join(' · ')
  }

  const msg = data.message
  if (msg && msg !== 'Validation failed') return msg

  if (msg === 'Validation failed') {
    return 'Verifique os campos do formulário e tente novamente.'
  }

  return fallback
}