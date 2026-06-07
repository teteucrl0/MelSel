import { Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { UNAUTHORIZED_EVENT } from '../utils/authSession'
import { resetBodyScrollLock } from '../utils/bodyScrollLock'
import ShopHeader from '../components/shop/ShopHeader'
import ShopFooter from '../components/shop/ShopFooter'
import PanelHeader from '../components/shop/PanelHeader'
import VendorAlerts from '../components/VendorAlerts'
import ProductsList from '../pages/ProductsList'
import ProductDetail from '../pages/ProductDetail'
import About from '../pages/About'
import FAQ from '../pages/FAQ'
import Suppliers from '../pages/Suppliers'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Profile from '../pages/Profile'
import PrivateRoute from '../components/PrivateRoute'
import { lazyPage } from '../utils/lazyPage'
import PageLoadPlaceholder from '../components/PageLoadPlaceholder'

const SupplierDashboard = lazyPage(() => import('../pages/SupplierDashboard'), 'Painel')
const VendorProducts = lazyPage(() => import('../pages/VendorProducts'), 'Estoque')
const Cart = lazyPage(() => import('../pages/Cart'), 'Carrinho')
const Checkout = lazyPage(() => import('../pages/Checkout'), 'Checkout')
const Orders = lazyPage(() => import('../pages/Orders'), 'Pedidos')
const OrderTracking = lazyPage(() => import('../pages/OrderTracking'), 'Rastreamento')
const VendorCoupons = lazyPage(() => import('../pages/VendorCoupons'), 'Cupons')
const VendorPromotions = lazyPage(() => import('../pages/VendorPromotions'), 'Promoções')
const AdminDashboard = lazyPage(() => import('../pages/AdminDashboard'), 'Admin')
const AdminProductPanel = lazyPage(() => import('../pages/AdminProductPanel'), 'Produtos admin')
const AdminReviews = lazyPage(() => import('../pages/AdminReviews'), 'Avaliações')
const AdminReports = lazyPage(() => import('../pages/AdminReports'), 'Relatórios')
const AdminUsers = lazyPage(() => import('../pages/AdminUsers'), 'Usuários')
const AdminSuppliers = lazyPage(() => import('../pages/AdminSuppliers'), 'Fornecedores')
const AdminSettings = lazyPage(() => import('../pages/AdminSettings'), 'Configurações')

function PageFallback() {
  return <PageLoadPlaceholder />
}

function isShopRoute(pathname) {
  return (
    !pathname.startsWith('/vendor') &&
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/vendedor')
  )
}

function SessionExpiredRedirect() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const onUnauthorized = (event) => {
      if (location.pathname === '/login' || location.pathname === '/register') return

      const fromPath = event.detail?.from || location.pathname + location.search
      const from = typeof fromPath === 'string' ? fromPath.split('?')[0] : location.pathname

      navigate('/login', {
        replace: true,
        state: {
          from: { pathname: from || '/' },
          sessionExpired: Boolean(event.detail?.sessionExpired),
        },
      })
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [navigate, location.pathname, location.search])

  return null
}

function AppLayout({ children }) {
  const { pathname } = useLocation()
  const shop = isShopRoute(pathname)
  const pdp = pathname.startsWith('/product/')

  useEffect(() => {
    resetBodyScrollLock()
  }, [pathname])

  return (
    <div className={shop ? `shop-shell${pdp ? ' shop-shell--pdp' : ''}` : 'panel-shell'}>
      {shop ? <ShopHeader /> : <PanelHeader />}
      <main className={shop ? 'shop-main' : 'panel-main'}>{children}</main>
      {shop ? <ShopFooter /> : null}
      <VendorAlerts />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionExpiredRedirect />
      <AppLayout>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<ProductsList />} />
            <Route path="/sobre" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/fornecedores" element={<Suppliers />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
            <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
            <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/orders/:id/tracking" element={<PrivateRoute><OrderTracking /></PrivateRoute>} />
            <Route path="/vendedor/dashboard" element={<Navigate to="/vendor/dashboard" replace />} />
            <Route path="/vendedor/products" element={<Navigate to="/vendor/products" replace />} />
            <Route path="/vendedor/produtos" element={<Navigate to="/vendor/products" replace />} />
            <Route path="/vendedor/coupons" element={<Navigate to="/vendor/coupons" replace />} />
            <Route path="/vendedor/promotions" element={<Navigate to="/vendor/promotions" replace />} />
            <Route path="/vendor/products" element={<PrivateRoute allowedRoles={['VENDEDOR']}><VendorProducts /></PrivateRoute>} />
            <Route path="/vendor/dashboard" element={<PrivateRoute allowedRoles={['VENDEDOR']}><SupplierDashboard /></PrivateRoute>} />
            <Route path="/vendor/coupons" element={<PrivateRoute allowedRoles={['VENDEDOR']}><VendorCoupons /></PrivateRoute>} />
            <Route path="/vendor/promotions" element={<PrivateRoute allowedRoles={['VENDEDOR']}><VendorPromotions /></PrivateRoute>} />
            <Route path="/admin/dashboard" element={<PrivateRoute allowedRoles={['ADMIN']}><AdminDashboard /></PrivateRoute>} />
            <Route path="/admin/products" element={<PrivateRoute allowedRoles={['ADMIN']}><AdminProductPanel /></PrivateRoute>} />
            <Route path="/admin/reviews" element={<PrivateRoute allowedRoles={['ADMIN']}><AdminReviews /></PrivateRoute>} />
            <Route path="/admin/reports" element={<PrivateRoute allowedRoles={['ADMIN']}><AdminReports /></PrivateRoute>} />
            <Route path="/admin/users" element={<PrivateRoute allowedRoles={['ADMIN']}><AdminUsers /></PrivateRoute>} />
            <Route path="/admin/suppliers" element={<PrivateRoute allowedRoles={['ADMIN']}><AdminSuppliers /></PrivateRoute>} />
            <Route path="/admin/settings" element={<PrivateRoute allowedRoles={['ADMIN']}><AdminSettings /></PrivateRoute>} />
          </Routes>
        </Suspense>
      </AppLayout>
    </BrowserRouter>
  )
}