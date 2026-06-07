import { useEffect, useState, useCallback } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { hasRole, getDisplayName, parseJwt, setRoles } from '../services/authUtil'
import authService from '../services/authService'
import userService from '../services/userService'
import cartService, { cartItemCount } from '../services/cartService'
import { CART_UPDATED_EVENT } from '../utils/cartEvents'
import { resolveProductImageUrl } from '../utils/productImageUrl'
import CartDrawer from './CartDrawer'
import Logo from './Logo'
import { MotionDrawer } from './motion/Motion'

export default function Header() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [displayName, setDisplayName] = useState(() => (localStorage.getItem('token') ? getDisplayName() : null))
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem('avatarUrl') || null)
  const [, setRolesTick] = useState(0)
  const [headerSearch, setHeaderSearch] = useState(() => searchParams.get('q') || '')

  const [cartCount, setCartCount] = useState(0)
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const isVendor = hasRole('VENDEDOR')
  const isAdmin = hasRole('ADMIN')

  const refreshUserChip = () => {
    const t = localStorage.getItem('token')
    setToken(t)
    if (!t) {
      setDisplayName(null)
      setAvatarUrl(null)
      return
    }
    let name = getDisplayName()
    if (!name) {
      const claims = parseJwt(t)
      const fromToken = claims?.displayName || claims?.name
      if (fromToken && !fromToken.includes('@')) {
        localStorage.setItem('displayName', fromToken)
        name = fromToken
      }
    }
    setDisplayName(name)
    setAvatarUrl(localStorage.getItem('avatarUrl') || null)
  }

  useEffect(() => {
    refreshUserChip()
    const onProfile = () => refreshUserChip()
    window.addEventListener('mellsell-profile-updated', onProfile)
    return () => window.removeEventListener('mellsell-profile-updated', onProfile)
  }, [pathname])

  useEffect(() => {
    if (!token) return undefined
    userService
      .getProfile()
      .then((profile) => {
        if (profile?.roles?.length) setRoles(profile.roles)
      })
      .catch(() => {})
    const onRoles = () => setRolesTick((n) => n + 1)
    window.addEventListener('mellsell-roles-updated', onRoles)
    return () => window.removeEventListener('mellsell-roles-updated', onRoles)
  }, [token])

  useEffect(() => {
    if (pathname === '/') setHeaderSearch(searchParams.get('q') || '')
  }, [pathname, searchParams])

  const logout = () => {
    authService.logout()
    navigate('/')
    window.location.reload()
  }

  const loadCartCount = useCallback(async () => {
    if (!localStorage.getItem('token')) {
      setCartCount(0)
      return
    }
    try {
      const items = await cartService.listCart()
      setCartCount(cartItemCount(items))
    } catch {
      setCartCount(0)
    }
  }, [])

  useEffect(() => {
    loadCartCount()
    const onCart = () => loadCartCount()
    const onStorage = (e) => { if (e.key === 'token') loadCartCount() }
    const onFocus = () => loadCartCount()

    window.addEventListener(CART_UPDATED_EVENT, onCart)
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, onCart)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', onFocus)
    }
  }, [loadCartCount, token])

  useEffect(() => {
    setCartDrawerOpen(false)
    setMobileNavOpen(false)
  }, [pathname])

  const openCart = () => {
    if (!token) {
      navigate('/login', { state: { from: { pathname: '/cart' } } })
      return
    }
    setCartDrawerOpen(true)
    loadCartCount()
  }

  const goToCartPage = () => {
    if (!token) {
      navigate('/login', { state: { from: { pathname: '/cart' } } })
      return
    }
    navigate('/cart')
  }

  const submitHeaderSearch = () => {
    const q = headerSearch.trim()
    if (pathname === '/') {
      const next = new URLSearchParams(searchParams)
      if (q) next.set('q', q)
      else next.delete('q')
      navigate({ pathname: '/', search: next.toString() ? `?${next}` : '' })
    } else {
      navigate(q ? `/?q=${encodeURIComponent(q)}` : '/')
    }
  }

  const navClass = (path) =>
    pathname === path || (path === '/' && pathname === '/')
      ? 'text-[#f5f2eb] font-medium'
      : 'hover:text-[#f5f2eb] transition-colors'

  return (
    <header className="site-header sticky top-0 z-50 border-b border-[#2a2724] bg-[#0a0908]/95 backdrop-blur-xl">
      <div className="container-app flex h-14 items-center justify-between gap-3">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <Logo className="h-7 w-7" />
          <span className="text-lg font-semibold tracking-[-0.4px] text-[#f5f2eb]">MelSell</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-[#a69b8c]">
          <Link to="/" className={navClass('/')}>Catálogo</Link>
          {token ? (
            <>
              <button type="button" onClick={goToCartPage} className={navClass('/cart')}>
                Carrinho{cartCount > 0 ? ` (${cartCount})` : ''}
              </button>
              <Link to="/orders" className={navClass('/orders')}>Pedidos</Link>
              {isVendor && <Link to="/vendor/dashboard" className={navClass('/vendor/dashboard')}>Vender</Link>}
              {isAdmin && <Link to="/admin/dashboard" className={navClass('/admin/dashboard')}>Admin</Link>}
            </>
          ) : (
            <>
              <Link to="/fornecedores" className={navClass('/fornecedores')}>Produtores</Link>
              <Link to="/login" className={navClass('/login')}>Entrar</Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block relative w-48 lg:w-64">
            <input
              type="search"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitHeaderSearch()}
              placeholder="Buscar mel..."
              className="w-full bg-[#161514] border border-[#2a2724] rounded-full pl-9 pr-3 py-1.5 text-sm text-[#f5f2eb] placeholder:text-[#a69b8c] focus:outline-none focus:border-[#c5a16e]"
            />
            <button
              type="button"
              onClick={submitHeaderSearch}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a69b8c] hover:text-[#c5a16e]"
              aria-label="Buscar"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </button>
          </div>

          <button
            type="button"
            onClick={openCart}
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-[#161514] text-[#f5f2eb] transition"
            aria-label="Abrir carrinho rápido"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
            </svg>
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute -top-0.5 -right-0.5 bg-[#c5a16e] text-[#0a0908] text-[9px] font-bold min-w-[15px] h-[15px] rounded-full flex items-center justify-center px-1"
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {token ? (
            <Link to="/profile" className="flex shrink-0 items-center" title="Meu perfil">
              <div className="h-8 w-8 rounded-full overflow-hidden border border-[#2a2724]">
                {resolveProductImageUrl(avatarUrl) ? (
                  <img src={resolveProductImageUrl(avatarUrl)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-[#c5a16e] text-[#0a0908] flex items-center justify-center text-xs font-bold">
                    {displayName ? displayName[0] : 'U'}
                  </div>
                )}
              </div>
            </Link>
          ) : (
            <Link to="/register" className="hidden sm:inline-flex btn-gold rounded-full px-3 py-1 text-xs font-semibold">
              Cadastrar
            </Link>
          )}

          <button type="button" onClick={() => setMobileNavOpen(true)} className="md:hidden shrink-0 text-[#f5f2eb] px-1" aria-label="Menu">
            ☰
          </button>
        </div>
      </div>

      <MotionDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} side="right" width="280px">
        <div className="p-6 text-sm space-y-3 text-[#a69b8c]">
          <Link to="/" onClick={() => setMobileNavOpen(false)} className="block hover:text-[#f5f2eb]">Catálogo</Link>
          {token ? (
            <>
              <Link to="/cart" onClick={() => setMobileNavOpen(false)} className="block hover:text-[#f5f2eb]">Carrinho ({cartCount})</Link>
              <Link to="/orders" onClick={() => setMobileNavOpen(false)} className="block hover:text-[#f5f2eb]">Meus pedidos</Link>
              <Link to="/profile" onClick={() => setMobileNavOpen(false)} className="block hover:text-[#f5f2eb]">Perfil</Link>
              {isVendor && (
                <>
                  <Link to="/vendor/dashboard" onClick={() => setMobileNavOpen(false)} className="block hover:text-[#f5f2eb]">Painel vendedor</Link>
                  <Link to="/vendor/products" onClick={() => setMobileNavOpen(false)} className="block hover:text-[#f5f2eb]">Estoque</Link>
                </>
              )}
              {isAdmin && (
                <Link to="/admin/dashboard" onClick={() => setMobileNavOpen(false)} className="block hover:text-[#f5f2eb]">Admin</Link>
              )}
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileNavOpen(false)} className="block hover:text-[#f5f2eb]">Entrar</Link>
              <Link to="/register" onClick={() => setMobileNavOpen(false)} className="block hover:text-[#f5f2eb]">Cadastrar</Link>
            </>
          )}
          <div className="border-t border-[#2a2724] pt-3 space-y-2">
            <Link to="/fornecedores" onClick={() => setMobileNavOpen(false)} className="block hover:text-[#f5f2eb]">Produtores</Link>
            <Link to="/sobre" onClick={() => setMobileNavOpen(false)} className="block hover:text-[#f5f2eb]">Sobre</Link>
            <Link to="/faq" onClick={() => setMobileNavOpen(false)} className="block hover:text-[#f5f2eb]">FAQ</Link>
          </div>
          {token && (
            <div className="pt-3 border-t border-[#2a2724]">
              <button type="button" onClick={() => { logout(); setMobileNavOpen(false) }} className="text-red-400">
                Sair
              </button>
            </div>
          )}
        </div>
      </MotionDrawer>

      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    </header>
  )
}