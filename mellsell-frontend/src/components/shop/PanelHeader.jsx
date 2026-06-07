import { Link, useLocation } from 'react-router-dom'
import { hasRole } from '../../services/authUtil'
import ThemeToggle from '../ThemeToggle'

export default function PanelHeader() {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')
  const isVendor = hasRole('VENDEDOR')

  return (
    <header className="border-b border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-400">
          ← Voltar à loja
        </Link>
        <span className="text-sm font-semibold text-stone-800 dark:text-stone-100">
          {isAdmin ? 'Administração' : 'Área do produtor'}
        </span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        <nav className="flex gap-3 text-xs text-muted">
          {isVendor && !isAdmin && (
            <>
              <Link to="/vendor/dashboard" className="hover:text-brand-700 dark:hover:text-brand-400">Painel</Link>
              <Link to="/vendor/products" className="hover:text-brand-700 dark:hover:text-brand-400">Estoque</Link>
              <Link to="/vendor/coupons" className="hover:text-brand-700 dark:hover:text-brand-400">Cupons</Link>
              <Link to="/vendor/promotions" className="hover:text-brand-700 dark:hover:text-brand-400">Promoções</Link>
            </>
          )}
          {isAdmin && <Link to="/admin/dashboard" className="hover:text-brand-700">Painel</Link>}
        </nav>
        </div>
      </div>
    </header>
  )
}