import { useEffect, useState, useCallback } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { hasRole, getDisplayName, parseJwt, setRoles } from '../../services/authUtil'
import authService from '../../services/authService'
import userService from '../../services/userService'
import cartService, { cartItemCount } from '../../services/cartService'
import { CART_UPDATED_EVENT } from '../../utils/cartEvents'
import CartDrawer from '../CartDrawer'
import ThemeToggle from '../ThemeToggle'
import ShopSearch from './ShopSearch'
import { normalizeQuery } from '../../utils/catalogSearch'
import { MotionDrawer } from '../motion/Motion'
import FlaticonIcon from '../FlaticonIcon'
import { BeeTrailIcon } from './ThematicIllustrations'

export default function ShopHeader() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [displayName, setDisplayName] = useState(() => (localStorage.getItem('token') ? getDisplayName() : null))
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem('avatarUrl') || null)
  const [headerSearch, setHeaderSearch] = useState(() => searchParams.get('q') || '')
  const [cartCount, setCartCount] = useState(0)
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isDesktopSearch, setIsDesktopSearch] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
  )

  const isVendor = hasRole('VENDEDOR')
  const isAdmin = hasRole('ADMIN')

  const refreshUser = () => {
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
    refreshUser()
    window.addEventListener('mellsell-profile-updated', refreshUser)
    return () => window.removeEventListener('mellsell-profile-updated', refreshUser)
  }, [pathname])

  useEffect(() => {
    if (!token) return undefined
    userService.getProfile().then((p) => p?.roles?.length && setRoles(p.roles)).catch(() => {})
    const onRoles = () => refreshUser()
    window.addEventListener('mellsell-roles-updated', onRoles)
    return () => window.removeEventListener('mellsell-roles-updated', onRoles)
  }, [token])

  useEffect(() => {
    setHeaderSearch(searchParams.get('q') || '')
  }, [pathname, searchParams])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const onChange = () => setIsDesktopSearch(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const loadCartCount = useCallback(async () => {
    if (!token) {
      setCartCount(0)
      return
    }
    try {
      const items = await cartService.listCart()
      setCartCount(cartItemCount(items))
    } catch {
      setCartCount(0)
    }
  }, [token])

  useEffect(() => {
    loadCartCount()
    const onCart = () => loadCartCount()
    window.addEventListener(CART_UPDATED_EVENT, onCart)
    window.addEventListener('focus', onCart)
    return () => window.removeEventListener(CART_UPDATED_EVENT, onCart)
  }, [loadCartCount])

  useEffect(() => {
    setCartDrawerOpen(false)
    setMobileOpen(false)
    setUserMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!userMenuOpen) return undefined
    const close = () => setUserMenuOpen(false)
    const onPointer = (e) => {
      const el = e.target
      if (el instanceof Element && el.closest('[data-shop-user-menu]')) return
      close()
    }
    const onKey = (e) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [userMenuOpen])

  const applySearch = (q) => {
    const trimmed = normalizeQuery(q)
    if (pathname === '/') {
      const next = new URLSearchParams(searchParams)
      if (trimmed) next.set('q', trimmed)
      else next.delete('q')
      next.delete('supplierId')
      setSearchParams(next, { replace: true })
      document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      navigate(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : '/')
    }
  }

  const goCart = () => {
    if (!token) {
      navigate('/login', { state: { from: { pathname: '/cart' } } })
      return
    }
    navigate('/cart')
  }

  const logout = () => {
    authService.logout()
    navigate('/')
    window.location.reload()
  }

  const navLink = (path, label) => (
    <Link to={path} className={pathname === path ? 'is-active' : undefined}>
      {label}
    </Link>
  )

  const searchCommon = {
    value: headerSearch,
    onChange: setHeaderSearch,
    placeholder: 'Buscar mel ou produtor…',
  }

  return (
    <header className="shop-header">
      <div className="shop-header-inner">
        <Link to="/" className="shop-logo">
          <span className="shop-logo-mark" aria-hidden>
            <FlaticonIcon name="honey" size="sm" />
          </span>
          <span className="shop-logo-text">
            MelSell
            <small>apiário de família</small>
          </span>
        </Link>

        <nav className="shop-nav" aria-label="Compras">
          {navLink('/', 'Loja')}
          {token ? navLink('/orders', 'Meus pedidos') : navLink('/login', 'Entrar')}
        </nav>

        {isDesktopSearch && (
          <ShopSearch {...searchCommon} onSubmit={applySearch} />
        )}

        <div className="shop-header-actions">
          {token ? (
            <div className="shop-user-menu-wrap hidden sm:block" data-shop-user-menu>
              <button
                type="button"
                className="shop-btn-ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  setUserMenuOpen((v) => !v)
                }}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
              >
                {displayName?.split(' ')[0] || 'Conta'} ▾
              </button>
              {userMenuOpen && (
                <div className="shop-user-menu" role="menu">
                  <Link to="/profile" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                    Meu perfil
                  </Link>
                  {(isVendor || isAdmin) && (
                    <Link
                      to={isAdmin ? '/admin/dashboard' : '/vendor/dashboard'}
                      className="is-muted"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Área {isAdmin ? 'admin' : 'do produtor'}
                    </Link>
                  )}
                  <button type="button" className="is-danger" onClick={logout} role="menuitem">
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="shop-btn-ghost hidden sm:inline-flex">
              Entrar
            </Link>
          )}

          <ThemeToggle className="shop-theme-toggle" />

          <button type="button" className="shop-btn-cart" onClick={goCart}>
            <BeeTrailIcon className="shop-btn-cart-icon" />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
            <span className="hidden xs:inline">Carrinho</span>
            {cartCount > 0 && <span className="shop-cart-badge">{cartCount}</span>}
          </button>

          <button type="button" className="shop-btn-ghost md:hidden" onClick={() => setMobileOpen(true)} aria-label="Menu">
            ☰
          </button>
        </div>
      </div>

      <MotionDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} side="right" width="280px" className="shop-mobile-drawer">
        <div className="shop-mobile-drawer-inner">
          {!isDesktopSearch && (
            <div className="shop-mobile-drawer-search">
              <ShopSearch
                {...searchCommon}
                onSubmit={(q) => {
                  applySearch(q)
                  setMobileOpen(false)
                }}
              />
            </div>
          )}
          <Link to="/" onClick={() => setMobileOpen(false)} className="shop-mobile-drawer-title">Loja</Link>
          {token ? (
            <>
              <Link to="/cart" onClick={() => setMobileOpen(false)} className="block">Carrinho ({cartCount})</Link>
              <Link to="/orders" onClick={() => setMobileOpen(false)} className="block">Meus pedidos</Link>
              <Link to="/profile" onClick={() => setMobileOpen(false)} className="block">Perfil</Link>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block">Entrar</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="block">Criar conta (comprar)</Link>
              <Link to="/register?tipo=apicultor" onClick={() => setMobileOpen(false)} className="block">
                Cadastrar como apicultor
              </Link>
            </>
          )}
          <div className="shop-mobile-drawer-divider">
            <Link to="/faq" onClick={() => setMobileOpen(false)} className="block">Ajuda</Link>
            {(isVendor || isAdmin) && (
              <Link
                to={isAdmin ? '/admin/dashboard' : '/vendor/dashboard'}
                onClick={() => setMobileOpen(false)}
                className="block"
              >
                Área do produtor
              </Link>
            )}
          </div>
          {token && (
            <button type="button" className="shop-mobile-drawer-logout" onClick={() => { logout(); setMobileOpen(false) }}>
              Sair
            </button>
          )}
        </div>
      </MotionDrawer>

      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    </header>
  )
}