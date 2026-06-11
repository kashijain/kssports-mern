import React, { useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Routes, Route, useLocation } from 'react-router-dom';

import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import FloatingSocial from './components/common/FloatingSocial';

import Home from './pages/Home';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import Login from './pages/Login';
import ProductDetails from './pages/ProductDetails';
import Dashboard from './pages/Dashboard';
import Wishlist from './pages/Wishlist';
import About from './pages/About';
import Contact from './pages/Contact';
import ProtectedRoute from './components/common/ProtectedRoute';

import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/useStore';

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App = () => {
  const { userInfo, hydrateAuth } = useAuthStore();

  useEffect(() => {
    if (userInfo?.token) {
      hydrateAuth();
      return;
    }

    useAuthStore.getState().markHydrated();
  }, [userInfo?.token, hydrateAuth]);

  return (
    <Router>
      <ScrollToTop />

      <div className="min-h-screen flex flex-col bg-transparent text-slate-900 dark:text-dark-text transition-colors duration-300 font-sans">
        
        <Navbar />

        <main className="flex-grow pt-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Login />} />

            <Route path="/product/:id" element={<ProductDetails />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<Dashboard />} />
            </Route>

            <Route element={<ProtectedRoute sellerOnly />}>
              <Route path="/admin" element={<Navigate to="/admin/offline-sales" replace />} />
              <Route path="/admin/business-summary" element={<Dashboard />} />
              <Route path="/admin/add-product" element={<Dashboard />} />
              <Route path="/admin/manage-products" element={<Dashboard />} />
              <Route path="/admin/edit-product/:id" element={<Dashboard />} />
              <Route path="/admin/orders" element={<Dashboard />} />
              <Route path="/admin/upload-stock-sheet" element={<Dashboard />} />
              <Route path="/admin/stock-inward" element={<Dashboard />} />
              <Route path="/admin/offline-sales" element={<Dashboard />} />
              <Route path="/admin/bat-repair" element={<Dashboard />} />
              <Route path="/admin/expenses" element={<Dashboard />} />
              <Route path="/admin/sales-report" element={<Dashboard />} />
              <Route path="/admin/ai-inquiries" element={<Dashboard />} />
            </Route>

            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>

        <Footer />
        <FloatingSocial />

        <Toaster 
          position="bottom-right" 
          toastOptions={{
            duration: 3000,
            style: {
              background: '#10141d',
              color: '#fff',
              borderRadius: '18px',
              padding: '16px 18px',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 24px 60px -24px rgba(0,0,0,0.75)',
            }
          }} 
        />

      </div>
    </Router>
  );
};

export default App;
