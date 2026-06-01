import { Link, useLocation, useNavigate } from 'react-router-dom'
import { hasRole, getUsername } from '../services/authUtil'

const navItemClass = ({ isActive }) =>
  [
    'inline-flex items-center rounded-full px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/25'
      : 'text-slate-300 hover:bg-white/5 hover:text-white',
  ].join(' ')

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('token')
  const username = token ? getUsername() : null

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/')
    window.location.reload()
  }

  const isHome = location.pathname === '/'

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="group inline-flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-base font-black text-slate-950 shadow-lg shadow-amber-500/20 transition-transform group-hover:scale-105">
              M
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-base font-black tracking-[0.18em] text-white">MEL-SELL</span>
              <span className="text-xs uppercase tracking-[0.28em] text-slate-400">Marketplace</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {!token ? (
              <>
                <Link
                  to="/login"
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
                >
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
                >
                  Criar conta
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                <span className="hidden text-sm text-slate-400 sm:inline">Olá,</span>
                <span className="text-sm font-semibold text-white">{username || 'Usuário'}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-200 transition hover:bg-rose-500/20 hover:text-rose-100"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>

        <nav aria-label="Navegação principal" className="flex flex-wrap items-center gap-2">
          <Link
            to="/"
            aria-current={isHome ? 'page' : undefined}
            className={navItemClass({ isActive: isHome })}
          >
            Produtos
          </Link>
          <Link
            to="/cart"
            aria-current={location.pathname === '/cart' ? 'page' : undefined}
            className={navItemClass({ isActive: location.pathname === '/cart' })}
          >
            Carrinho
          </Link>
          {hasRole('VENDEDOR') && (
            <Link
              to="/vendor/products"
              aria-current={location.pathname === '/vendor/products' ? 'page' : undefined}
              className={navItemClass({ isActive: location.pathname === '/vendor/products' })}
            >
              Meus Produtos
            </Link>
          )}
          {hasRole('CLIENTE') && (
            <Link
              to="/orders"
              aria-current={location.pathname === '/orders' ? 'page' : undefined}
              className={navItemClass({ isActive: location.pathname === '/orders' })}
            >
              Meus Pedidos
            </Link>
          )}
          {hasRole('ADMIN') && (
            <Link
              to="/admin/reports"
              aria-current={location.pathname === '/admin/reports' ? 'page' : undefined}
              className={navItemClass({ isActive: location.pathname === '/admin/reports' })}
            >
              Relatórios
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
