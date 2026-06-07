import { Link } from 'react-router-dom'
import ShopPageHeader from '../components/shop/ShopPageHeader'

export default function About() {
  return (
    <div className="mx-auto max-w-2xl">
      <ShopPageHeader title="Sobre o MelSell" />
      <p className="mt-4 leading-relaxed shop-text-muted">
        Somos um marketplace feito para quem compra mel artesanal com confiança. Cada produto mostra quem produziu,
        quanto há em estoque e como acompanhar a entrega depois do pedido.
      </p>
      <p className="mt-3 leading-relaxed shop-text-muted">
        Para apicultores, existe uma área separada de gestão — aqui na loja o foco é só na sua experiência de compra.
      </p>
      <Link to="/" className="shop-btn-primary mt-8 inline-flex max-w-xs">
        Voltar à loja
      </Link>
    </div>
  )
}