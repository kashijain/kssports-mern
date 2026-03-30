import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCartStore, useAuthStore, useThemeStore } from '../../store/useStore';
import { useWishlistStore } from '../../store/useWishlistStore';
import { ShoppingBag, Heart, User, Menu, X, Moon, Sun, Search, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cartItems } = useCartStore();
  const { wishlistItems } = useWishlistStore();
  const { userInfo, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();

  const cartItemsCount = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const wishlistCount = wishlistItems.length;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'Collections', path: '/shop' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'glass-effect shadow-md py-3' 
          : 'bg-white/90 dark:bg-dark-bg/90 backdrop-blur-sm py-5'
      }`}
    >
      <div className="container-bound flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-xl group-hover:scale-105 transition-transform shadow-lg shadow-primary-600/40">
            KS
          </div>
          <span className="font-bold text-2xl tracking-tight dark:text-white">
            K.S. <span className="text-primary-600">Sports</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.path}
              className={`font-medium text-sm lg:text-base relative group transition-colors ${
                location.pathname === link.path ? 'text-primary-600' : 'text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400'
              }`}
            >
              {link.name}
              <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 transition-all duration-300 group-hover:w-full ${location.pathname === link.path ? 'w-full' : ''}`}></span>
            </Link>
          ))}
        </nav>

        {/* Action Icons Desktop */}
        <div className="hidden md:flex items-center gap-5">
          <button onClick={toggleTheme} className="text-slate-600 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400 transition-colors">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <button className="text-slate-600 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400 transition-colors">
            <Search size={20} />
          </button>
          
          <Link to="/wishlist" className="relative text-slate-600 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400 transition-colors">
            <Heart size={20} />
            {wishlistCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link to="/cart" className="relative text-slate-600 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400 transition-colors">
            <ShoppingBag size={20} />
            {cartItemsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartItemsCount}
              </span>
            )}
          </Link>

          {userInfo ? (
            <div className="relative group cursor-pointer flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <User size={20} />
              <div className="absolute top-8 right-0 w-48 bg-white dark:bg-dark-card rounded-xl shadow-premium border border-slate-100 dark:border-dark-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden flex flex-col pt-2 pb-2">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-dark-border mb-2">
                  <p className="font-semibold text-sm truncate">{userInfo.name}</p>
                </div>
                <Link to={userInfo.role === 'seller' ? "/admin" : "/profile"} className="px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-dark-border transition-colors">{userInfo.role === 'seller' ? 'Seller Dashboard' : 'Dashboard'}</Link>
                <button onClick={handleLogout} className="px-4 py-2 text-sm text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2">
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="btn-primary py-2 px-5 text-sm">
              Login
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center gap-4">
          <Link to="/cart" className="relative text-slate-600 dark:text-slate-300">
            <ShoppingBag size={22} />
            {cartItemsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartItemsCount}
              </span>
            )}
          </Link>
          <button 
            className="text-slate-900 dark:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-white dark:bg-dark-card border-b border-slate-100 dark:border-dark-border shadow-lg p-5 flex flex-col gap-4 md:hidden"
          >
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-medium text-slate-800 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 border-b border-slate-100 dark:border-dark-border pb-2"
              >
                {link.name}
              </Link>
            ))}
            
            <div className="flex items-center justify-between pt-4">
              <button onClick={toggleTheme} className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                {theme === 'dark' ? <><Sun size={20} /> Light Mode</> : <><Moon size={20} /> Dark Mode</>}
              </button>
              
              <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                <Heart size={20} /> Wishlist {wishlistCount > 0 ? `(${wishlistCount})` : ''}
              </Link>
            </div>

            {userInfo ? (
              <div className="pt-4 flex flex-col gap-3">
                <Link to={userInfo.role === 'seller' ? "/admin" : "/profile"} onClick={() => setIsMobileMenuOpen(false)} className="btn-secondary w-full justify-center">
                  {userInfo.role === 'seller' ? 'Seller Dashboard' : 'Dashboard'}
                </Link>
                <button onClick={handleLogout} className="btn-primary bg-red-500 hover:bg-red-600 shadow-red-500/30 w-full justify-center">
                  Logout
                </button>
              </div>
            ) : (
              <div className="pt-4">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="btn-primary w-full justify-center">
                  Login / Register
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
