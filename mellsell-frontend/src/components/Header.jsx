import { Link, useLocation, useNavigate } from 'react-router-dom'
import { hasRole, getUsername } from '../services/authUtil'
import authService from '../services/authService'

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('token')
  const username = token ? getUsername() : null

  const logout = () => {
    authService.logout()
    navigate('/')
    window.location.reload()
  }

  const isActive = (path) => location.pathname === path

  return (
    <header className="border-b-2 border-amber-200 bg-amber-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400 text-lg font-bold text-amber-950">
              🍯
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-serif text-lg font-bold text-amber-900">MelSell</span>
              <span className="text-xs text-amber-700">Mel da Fazenda</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {!token ? (
              <>
                <Link
                  to="/login"
                  className="rounded-md border-2 border-amber-400 bg-white px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-50"
                >
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                >
                  Criar conta
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2 rounded-md border-2 border-amber-200 bg-white px-3 py-2">
                <span className="text-sm text-amber-700">Olá,</span>
                <span className="text-sm font-semibold text-amber-900">{username || 'Usuário'}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-md bg-red-100 px-3 py-1 text-sm font-medium text-red-700 transition hover:bg-red-200"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          <Link
            to="/"
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              isActive('/') ? 'bg-amber-200 text-amber-900' : 'text-amber-700 hover:bg-amber-100'
            }`}
          >
            Produtos
          </Link>
          <Link
            to="/cart"
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              isActive('/cart') ? 'bg-amber-200 text-amber-900' : 'text-amber-700 hover:bg-amber-100'
            }`}
          >
            Carrinho
          </Link>
          {hasRole('VENDEDOR') && (
            <Link
              to="/vendor/products"
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive('/vendor/products') ? 'bg-amber-200 text-amber-900' : 'text-amber-700 hover:bg-amber-100'
              }`}
            >
              Meus Produtos
            </Link>
          )}
          {hasRole('CLIENTE') && (
            <Link
              to="/orders"
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive('/orders') ? 'bg-amber-200 text-amber-900' : 'text-amber-700 hover:bg-amber-100'
              }`}
            >
              Meus Pedidos
            </Link>
          )}
          {hasRole('ADMIN') && (
            <Link
              to="/admin/reports"
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive('/admin/reports') ? 'bg-amber-200 text-amber-900' : 'text-amber-700 hover:bg-amber-100'
              }`}
            >
              Relatórios
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
