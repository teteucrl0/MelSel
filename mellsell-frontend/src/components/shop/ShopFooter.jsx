import { Link } from 'react-router-dom'
import FlaticonIcon from '../FlaticonIcon'

export default function ShopFooter() {
  return (
    <footer className="shop-footer">
      <div className="shop-footer-inner">
        <div>
          <div className="shop-logo" style={{ marginBottom: '0.5rem' }}>
            <span className="shop-logo-mark" aria-hidden>
              <FlaticonIcon name="honey" size="sm" />
            </span>
            MelSell
          </div>
          <p className="shop-footer-about">
            Marketplace de mel artesanal. Você compra direto de quem produz, com entrega rastreada.
          </p>
        </div>
        <div>
          <h4>Comprar</h4>
          <ul>
            <li><Link to="/">Catálogo</Link></li>
            <li><Link to="/cart">Carrinho</Link></li>
            <li><Link to="/orders">Meus pedidos</Link></li>
          </ul>
        </div>
        <div>
          <h4>Produtores</h4>
          <ul>
            <li><Link to="/register?tipo=apicultor">Vender no MelSell</Link></li>
            <li><Link to="/login">Entrar como apicultor</Link></li>
            <li><Link to="/fornecedores">Nossos produtores</Link></li>
          </ul>
        </div>
        <div>
          <h4>Ajuda</h4>
          <ul>
            <li><Link to="/faq">Perguntas frequentes</Link></li>
            <li><Link to="/sobre">Sobre o MelSell</Link></li>
          </ul>
        </div>
        <p className="shop-footer-copy">© {new Date().getFullYear()} MelSell</p>
        <p className="shop-footer-attribution">
          Ícones estáticos por{' '}
          <a href="https://www.flaticon.com/authors/freepik" target="_blank" rel="noopener noreferrer">
            Freepik
          </a>{' '}
          (<a href="https://www.flaticon.com/" target="_blank" rel="noopener noreferrer">Flaticon</a>
          ) · Animações por{' '}
          <a href="https://lordicon.com/" target="_blank" rel="noopener noreferrer">
            Lordicon
          </a>
        </p>
      </div>
    </footer>
  )
}