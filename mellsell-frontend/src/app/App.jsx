import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from '../components/Header'
import ProductsList from '../pages/ProductsList'
import ProductDetail from '../pages/ProductDetail'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Cart from '../pages/Cart'
import Checkout from '../pages/Checkout'
import AdminReports from '../pages/AdminReports'
import AdminReviews from '../pages/AdminReviews'
import Orders from '../pages/Orders'
import VendorProducts from '../pages/VendorProducts'
import SupplierDashboard from '../pages/SupplierDashboard'
import AdminProductPanel from '../pages/AdminProductPanel'
import AdminDashboard from '../pages/AdminDashboard'
import AdminUsers from '../pages/AdminUsers'
import AdminSuppliers from '../pages/AdminSuppliers'
import AdminSettings from '../pages/AdminSettings'
import VendorCoupons from '../pages/VendorCoupons'
import VendorPromotions from '../pages/VendorPromotions'
import PrivateRoute from '../components/PrivateRoute'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        <Header />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Routes>
            <Route path="/" element={<ProductsList />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<PrivateRoute allowedRoles={["CLIENTE"]}><Cart /></PrivateRoute>} />
            <Route path="/checkout" element={<PrivateRoute allowedRoles={["CLIENTE"]}><Checkout /></PrivateRoute>} />
            <Route path="/orders" element={<PrivateRoute allowedRoles={["CLIENTE"]}><Orders /></PrivateRoute>} />
            <Route path="/vendor/products" element={<PrivateRoute allowedRoles={["VENDEDOR"]}><VendorProducts /></PrivateRoute>} />
            <Route path="/vendor/dashboard" element={<PrivateRoute allowedRoles={["VENDEDOR"]}><SupplierDashboard /></PrivateRoute>} />
            <Route path="/vendor/coupons" element={<PrivateRoute allowedRoles={["VENDEDOR"]}><VendorCoupons /></PrivateRoute>} />
            <Route path="/vendor/promotions" element={<PrivateRoute allowedRoles={["VENDEDOR"]}><VendorPromotions /></PrivateRoute>} />
            <Route path="/admin/dashboard" element={<PrivateRoute allowedRoles={["ADMIN"]}><AdminDashboard /></PrivateRoute>} />
            <Route path="/admin/products" element={<PrivateRoute allowedRoles={["ADMIN"]}><AdminProductPanel /></PrivateRoute>} />
            <Route path="/admin/reviews" element={<PrivateRoute allowedRoles={["ADMIN"]}><AdminReviews /></PrivateRoute>} />
            <Route path="/admin/reports" element={<PrivateRoute allowedRoles={["ADMIN"]}><AdminReports /></PrivateRoute>} />
            <Route path="/admin/users" element={<PrivateRoute allowedRoles={["ADMIN"]}><AdminUsers /></PrivateRoute>} />
            <Route path="/admin/suppliers" element={<PrivateRoute allowedRoles={["ADMIN"]}><AdminSuppliers /></PrivateRoute>} />
            <Route path="/admin/settings" element={<PrivateRoute allowedRoles={["ADMIN"]}><AdminSettings /></PrivateRoute>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
