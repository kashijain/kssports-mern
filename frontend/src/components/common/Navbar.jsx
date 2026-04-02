import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, LogOut, Menu, Moon, Search, ShoppingBag, Sun, User, X } from 'lucide-react';
import { useCartStore, useAuthStore, useThemeStore } from '../../store/useStore';
import { useWishlistStore } from '../../store/useWishlistStore';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { cartItems } = useCartStore();
  const { wishlistItems } = useWishlistStore();
  const { userInfo, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsProfileMenuOpen(false);
  }, [location.pathname]);

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
    setIsProfileMenuOpen(false);
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'glass-effect border-b border-white/50 py-3 shadow-[0_26px_55px_-34px_rgba(15,23,42,0.72)]'
          : 'border-b border-transparent bg-white/78 py-4 backdrop-blur-xl dark:bg-dark-bg/80'
      }`}
    >
      <div className="container-bound flex items-center justify-between gap-4">
        <Link to="/" className="group flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 text-white shadow-[0_18px_38px_-16px_rgba(220,38,38,0.75)] transition-transform group-hover:scale-105">
            KS
          </div>
          <div className="leading-none">
            <span className="block text-xl font-black tracking-[0.16em] text-slate-900 dark:text-white">K.S. SPORTS</span>
            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-500 dark:text-slate-400">Premium Athletic Goods</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-white/60 bg-white/70 px-3 py-2 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.65)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                isActive(link.path)
                  ? 'bg-slate-950 text-white shadow-[0_16px_30px_-20px_rgba(15,23,42,0.85)] dark:bg-white dark:text-slate-900'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button onClick={toggleTheme} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/60 bg-white/70 text-slate-600 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.6)] transition-all hover:-translate-y-0.5 hover:text-primary-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-primary-400">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/60 bg-white/70 text-slate-600 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.6)] transition-all hover:-translate-y-0.5 hover:text-primary-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-primary-400">
            <Search size={20} />
          </button>
          <Link to="/wishlist" className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/60 bg-white/70 text-slate-600 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.6)] transition-all hover:-translate-y-0.5 hover:text-primary-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-primary-400">
            <Heart size={20} />
            {wishlistCount > 0 && <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-bold text-white shadow-lg shadow-primary-600/30">{wishlistCount}</span>}
          </Link>
          <Link to="/cart" className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/60 bg-white/70 text-slate-600 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.6)] transition-all hover:-translate-y-0.5 hover:text-primary-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-primary-400">
            <ShoppingBag size={20} />
            {cartItemsCount > 0 && <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-bold text-white shadow-lg shadow-primary-600/30">{cartItemsCount}</span>}
          </Link>

          {userInfo ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className={`flex items-center gap-3 rounded-full border px-3 py-2 shadow-[0_18px_35px_-26px_rgba(15,23,42,0.75)] backdrop-blur-xl transition-all ${
                  isProfileMenuOpen
                    ? 'border-primary-500/30 bg-[#11161f]/95'
                    : 'border-white/60 bg-white/75 dark:border-white/10 dark:bg-white/5'
                }`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-900">
                  <User size={18} />
                </div>
                <div className="max-w-[130px]">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{userInfo.name}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-slate-500 dark:text-slate-400">{userInfo.role === 'seller' ? 'Seller' : 'Account'}</p>
                </div>
              </button>
              <AnimatePresence>
                {isProfileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-16 z-40 flex w-64 flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#11161f]/98 p-2 shadow-[0_30px_70px_-36px_rgba(0,0,0,0.9)] backdrop-blur-xl"
                  >
                    <div className="mb-2 rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-3">
                      <p className="truncate text-sm font-semibold text-white">{userInfo.name}</p>
                      <p className="mt-1 truncate text-[11px] text-slate-400">{userInfo.email}</p>
                    </div>
                    <Link
                      to={userInfo.role === 'seller' ? '/admin' : '/profile'}
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="rounded-[1.1rem] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.06]"
                    >
                      {userInfo.role === 'seller' ? 'Seller Dashboard' : 'Dashboard'}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="mt-1 flex items-center gap-2 rounded-[1.1rem] px-4 py-3 text-left text-sm font-medium text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200"
                    >
                      <LogOut size={14} /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link to="/login" className="btn-primary px-5 py-2.5 text-sm">
              Login
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <Link to="/cart" className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/60 bg-white/70 text-slate-600 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.6)] dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <ShoppingBag size={22} />
            {cartItemsCount > 0 && <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-bold text-white shadow-lg shadow-primary-600/30">{cartItemsCount}</span>}
          </Link>
          <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/60 bg-white/70 text-slate-900 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.6)] dark:border-white/10 dark:bg-white/5 dark:text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute left-4 right-4 top-full mt-3 rounded-[28px] border border-white/60 bg-white/95 p-5 shadow-[0_30px_70px_-36px_rgba(15,23,42,0.72)] backdrop-blur-xl dark:border-white/10 dark:bg-dark-card/96 md:hidden"
          >
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`rounded-2xl px-4 py-3 text-base font-semibold transition-colors ${
                    isActive(link.path)
                      ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-900'
                      : 'text-slate-800 hover:bg-slate-50 hover:text-primary-600 dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-primary-400'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-100/80 px-4 py-3 dark:bg-dark-bg/80">
              <button onClick={toggleTheme} className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                {theme === 'dark' ? <><Sun size={20} /> Light Mode</> : <><Moon size={20} /> Dark Mode</>}
              </button>
              <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                <Heart size={20} /> Wishlist {wishlistCount > 0 ? `(${wishlistCount})` : ''}
              </Link>
            </div>

            {userInfo ? (
              <div className="pt-4 flex flex-col gap-3">
                <Link to={userInfo.role === 'seller' ? '/admin' : '/profile'} onClick={() => setIsMobileMenuOpen(false)} className="btn-secondary w-full justify-center">
                  {userInfo.role === 'seller' ? 'Seller Dashboard' : 'Dashboard'}
                </Link>
                <button onClick={handleLogout} className="btn-primary w-full justify-center bg-gradient-to-b from-red-500 via-red-600 to-red-700 border-red-500/70 shadow-[0_18px_40px_-18px_rgba(239,68,68,0.7)]">
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
