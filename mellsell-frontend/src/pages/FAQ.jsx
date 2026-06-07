import { useState } from 'react'
import { Link } from 'react-router-dom'
import ShopPageHeader from '../components/shop/ShopPageHeader'

const ITEMS = [
  {
    q: 'Como compro?',
    a: 'Escolha um produto, adicione ao carrinho, faça login se necessário e finalize com seu endereço no checkout.',
  },
  {
    q: 'Posso comprar de vários produtores?',
    a: 'Sim. O carrinho aceita itens de apicultores diferentes; cada um gera uma entrega com rastreio próprio.',
  },
  {
    q: 'Como acompanho o pedido?',
    a: 'Em Meus pedidos você vê o status e pode abrir o rastreamento detalhado de cada entrega.',
  },
  {
    q: 'Preciso criar conta?',
    a: 'Sim, para reservar estoque, pagar e receber o mel em casa com segurança.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState(0)

  return (
    <div className="mx-auto max-w-xl">
      <ShopPageHeader
        title="Ajuda para compradores"
        description="Dúvidas frequentes sobre compra e entrega."
      />

      <div className="mt-6 space-y-2">
        {ITEMS.map((item, i) => {
          const isOpen = open === i
          return (
            <div key={item.q} className="shop-pdp-panel shop-faq-item">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : i)}
              >
                {item.q}
                <span aria-hidden>{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && <p className="shop-faq-answer">{item.a}</p>}
            </div>
          )
        })}
      </div>

      <p className="mt-8 text-sm shop-text-muted">
        Pronto para comprar?{' '}
        <Link to="/" className="font-semibold" style={{ color: 'var(--shop-accent-bright)' }}>
          Ver o catálogo
        </Link>
      </p>
    </div>
  )
}