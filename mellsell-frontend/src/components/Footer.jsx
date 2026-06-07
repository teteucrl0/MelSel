import { Link } from 'react-router-dom'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
      <div className="container-app py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <Logo className="h-8 w-8" />
              <span className="text-lg font-bold text-stone-900 dark:text-stone-50">MelSell</span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
              Marketplace de mel artesanal. Conectamos famílias apicultoras a consumidores com transparência e preço justo.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Loja</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li><Link to="/" className="hover:text-brand-700 dark:hover:text-brand-400">Catálogo</Link></li>
              <li><Link to="/fornecedores" className="hover:text-brand-700 dark:hover:text-brand-400">Fornecedores</Link></li>
              <li><Link to="/cart" className="hover:text-brand-700 dark:hover:text-brand-400">Carrinho</Link></li>
              <li><Link to="/orders" className="hover:text-brand-700 dark:hover:text-brand-400">Pedidos</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Ajuda</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li><Link to="/sobre" className="hover:text-brand-700 dark:hover:text-brand-400">Sobre nós</Link></li>
              <li><Link to="/faq" className="hover:text-brand-700 dark:hover:text-brand-400">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Conta</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li><Link to="/login" className="hover:text-brand-700 dark:hover:text-brand-400">Entrar</Link></li>
              <li><Link to="/register" className="hover:text-brand-700 dark:hover:text-brand-400">Cadastrar</Link></li>
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-stone-200 pt-6 text-xs text-muted dark:border-stone-800">
          © {new Date().getFullYear()} MelSell. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}