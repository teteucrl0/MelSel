import { describe, it, expect } from 'vitest'
import { buildSuggestions } from './shopSearchUtils'

const sampleProducts = [
  {
    id: 1,
    name: 'Mel Silvestre',
    description: 'Orgânico do cerrado',
    supplierId: 10,
    supplierName: 'Apiário Norte',
  },
  {
    id: 2,
    name: 'Própolis Verde',
    description: 'Extrato concentrado',
    supplierId: 10,
    supplierName: 'Apiário Norte',
  },
  {
    id: 3,
    name: 'Favo Artesanal',
    description: 'Mel de eucalipto',
    supplierId: 20,
    supplierName: 'Colmeia Sul',
  },
  {
    id: 4,
    name: 'Creme de Mel',
    description: 'Apiário Norte especial',
    supplierId: null,
    supplierName: 'Apiário Norte',
  },
]

describe('buildSuggestions', () => {
  it('retorna vazio para query em branco', () => {
    expect(buildSuggestions(sampleProducts, '')).toEqual({
      suppliers: [],
      products: [],
    })
    expect(buildSuggestions(sampleProducts, '   ')).toEqual({
      suppliers: [],
      products: [],
    })
  })

  it('encontra produtos por nome (case-insensitive)', () => {
    const { products } = buildSuggestions(sampleProducts, 'SILVESTRE')
    expect(products.map((p) => p.id)).toEqual([1])
  })

  it('encontra produtos por descrição', () => {
    const { products } = buildSuggestions(sampleProducts, 'eucalipto')
    expect(products.map((p) => p.id)).toEqual([3])
  })

  it('inclui produtos quando o nome do fornecedor bate na query', () => {
    const { products } = buildSuggestions(sampleProducts, 'colmeia')
    expect(products.map((p) => p.id)).toEqual([3])
  })

  it('agrupa fornecedores e conta produtos da busca', () => {
    const { suppliers } = buildSuggestions(sampleProducts, 'apiário')
    expect(suppliers).toHaveLength(1)
    expect(suppliers[0]).toMatchObject({
      id: 10,
      name: 'Apiário Norte',
      productCount: 2,
    })
  })

  it('ignora fornecedor sem supplierId', () => {
    const { suppliers } = buildSuggestions(
      [{ id: 99, name: 'X', supplierName: 'Solo', supplierId: null }],
      'solo',
    )
    expect(suppliers).toEqual([])
  })

  it('não duplica fornecedor no mapa de sugestões', () => {
    const { suppliers } = buildSuggestions(sampleProducts, 'apiário')
    const ids = suppliers.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('retorna vazio para lista de produtos vazia', () => {
    expect(buildSuggestions([], 'mel')).toEqual({ suppliers: [], products: [] })
  })

  it('limita a 5 fornecedores e 6 produtos', () => {
    const many = []
    for (let i = 0; i < 8; i += 1) {
      many.push({
        id: 100 + i,
        name: `Mel ${i}`,
        description: 'busca',
        supplierId: 1000 + i,
        supplierName: `Fornecedor busca ${i}`,
      })
    }
    const result = buildSuggestions(many, 'busca')
    expect(result.suppliers).toHaveLength(5)
    expect(result.products).toHaveLength(6)
  })
})