import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import { CartProvider } from './context/CartContext';
import { ProductsProvider } from './context/ProductsContext';

// Lazy-loaded storefront pages
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderVerify = lazy(() => import('./pages/OrderVerify'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const Support = lazy(() => import('./pages/Support'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Lazy-loaded admin (heavy — never needed by shoppers)
const AdminLogin = lazy(() => import('./admin/AdminLogin'));
const AdminGuard = lazy(() => import('./admin/AdminGuard'));
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const Dashboard = lazy(() => import('./admin/Dashboard'));
const OrdersPage = lazy(() => import('./admin/OrdersPage'));
const OrderDetail = lazy(() => import('./admin/OrderDetail'));
const ProductsPage = lazy(() => import('./admin/ProductsPage'));
const ProductForm = lazy(() => import('./admin/ProductForm'));
const TeamPage = lazy(() => import('./admin/TeamPage'));
const ShippingZonesPage = lazy(() => import('./admin/ShippingZonesPage'));

// Lazy-loaded staff portals
const StaffLogin = lazy(() => import('./staff/StaffLogin'));
const StaffGuard = lazy(() => import('./staff/StaffGuard'));
const PrinterDashboard = lazy(() => import('./staff/PrinterDashboard'));
const RiderDashboard = lazy(() => import('./staff/RiderDashboard'));

const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-bone">
        <p className="font-mono text-[13.5px] text-ink/30 uppercase tracking-widest animate-pulse">Loading...</p>
    </div>
);

function App() {
  return (
    <ProductsProvider>
      <CartProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Storefront */}
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order/verify" element={<OrderVerify />} />
              <Route path="/track" element={<TrackOrder />} />
              <Route path="/support" element={<Support />} />

              {/* Admin */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <AdminGuard>
                    <AdminLayout />
                  </AdminGuard>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="orders/:id" element={<OrderDetail />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="products/new" element={<ProductForm />} />
                <Route path="products/:id/edit" element={<ProductForm />} />
                <Route path="shipping" element={<ShippingZonesPage />} />
                <Route path="team" element={<TeamPage />} />
              </Route>

              {/* Staff Portal */}
              <Route path="/staff/login" element={<StaffLogin />} />
              <Route
                path="/staff/printer"
                element={
                  <StaffGuard allowedRoles={['admin', 'printer']}>
                    <PrinterDashboard />
                  </StaffGuard>
                }
              />
              <Route
                path="/staff/rider"
                element={
                  <StaffGuard allowedRoles={['admin', 'rider']}>
                    <RiderDashboard />
                  </StaffGuard>
                }
              />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </CartProvider>
    </ProductsProvider>
  );
}

export default App;
