import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

import Home from './pages/Home';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import Login from './pages/Login';
import ProductDetails from './pages/ProductDetails';
import Dashboard from './pages/Dashboard';
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

      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-dark-text transition-colors duration-300 font-sans">
        
        <Navbar />

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/cart" element={<Cart />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Login />} />

            <Route path="/product/:id" element={<ProductDetails />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<Dashboard />} />
            </Route>

            <Route element={<ProtectedRoute sellerOnly />}>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/add-product" element={<Dashboard />} />
              <Route path="/admin/manage-products" element={<Dashboard />} />
              <Route path="/admin/edit-product/:id" element={<Dashboard />} />
              <Route path="/admin/orders" element={<Dashboard />} />
            </Route>

            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>

        <Footer />

        <Toaster 
          position="bottom-right" 
          toastOptions={{
            duration: 3000,
            style: {
              background: '#111827',
              color: '#fff',
              borderRadius: '12px',
              padding: '16px',
            }
          }} 
        />

      </div>
    </Router>
  );
};

export default App;
