import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useStore';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  LayoutDashboard,
  Trophy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('customer');
  const [sellerSecret, setSellerSecret] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, loading, error } = useAuthStore();

  const isRegister = location.pathname === '/register';

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      let authResponse;
      if (isRegister) {
        authResponse = await register(name, email, password, role, sellerSecret);
        toast.success('Registration successful. Welcome to K.S. Sports!');
      } else {
        authResponse = await login(email, password);
        toast.success('Sign in successful. Welcome back!');
      }
      navigate(location.state?.from || (authResponse?.role === 'seller' ? '/admin' : '/'), {
        replace: true,
      });
    } catch (err) {
      toast.error(err.message || error || 'Authentication failed. Please check your credentials.');
    }
  };

  const trustPoints = [
    {
      icon: ShieldCheck,
      title: 'Verified Sports Gear',
      text: 'Access premium K.S. Sports products and trusted seller operations.',
    },
    {
      icon: LayoutDashboard,
      title: 'Seller Dashboard Access',
      text: 'Monitor inventory, offline sales, reports, and business insights in one place.',
    },
    {
      icon: Trophy,
      title: 'Trusted by Players',
      text: 'Built for athletes, teams, and customers who care about quality and performance.',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06080d] px-4 py-10 pt-24 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_26%)]"></div>
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:72px_72px]"></div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto flex min-h-[720px] w-full max-w-7xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#101317]/95 shadow-[0_35px_120px_-50px_rgba(0,0,0,0.98)] backdrop-blur-xl"
      >
        <div className="hidden w-[48%] border-r border-white/10 lg:flex lg:flex-col lg:justify-between">
          <div className="relative flex h-full flex-col justify-between overflow-hidden p-10 xl:p-14">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.18),transparent_34%),linear-gradient(160deg,rgba(255,255,255,0.03),transparent_55%)]"></div>
            <div className="relative">
              <Link to="/" className="inline-flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_18px_42px_-18px_rgba(220,38,38,0.8)]">
                  KS
                </div>
                <div>
                  <p className="text-xl font-black uppercase tracking-tight text-white">K.S. Sports</p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-300">Premium Athletic Goods</p>
                </div>
              </Link>

              <div className="mt-20 max-w-xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-primary-300">
                  Elite Performance Access
                </p>
                <h1 className="mt-6 text-6xl font-black uppercase leading-[0.9] tracking-tight text-white">
                  {isRegister ? 'Join The K.S. Sports Network.' : 'Built For Serious Players.'}
                </h1>
                <p className="mt-8 max-w-2xl text-lg leading-9 text-slate-300">
                  {isRegister
                    ? 'Create your K.S. Sports account to unlock premium gear access, seller controls, and a cleaner performance-driven workflow.'
                    : 'Sign in to access your customer account or seller dashboard with the same premium K.S. Sports experience across storefront and admin.'}
                </p>
              </div>
            </div>

            <div className="relative mt-12 space-y-5">
              {trustPoints.map((point) => {
                const Icon = point.icon;
                return (
                  <div
                    key={point.title}
                    className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-primary-300">
                        <Icon size={20} />
                      </div>
                      <div>
                        <p className="text-base font-black text-white">{point.title}</p>
                        <p className="mt-2 text-sm leading-7 text-slate-400">{point.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="relative flex w-full flex-1 items-center justify-center px-5 py-8 sm:px-8 lg:px-10 xl:px-14">
          <div className="absolute right-8 top-8 hidden rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5 text-left shadow-[0_24px_60px_-36px_rgba(0,0,0,0.95)] backdrop-blur-xl xl:block">
            <div className="mb-4 flex items-center justify-between gap-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary-300">Status</p>
              <span className="h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.8)]"></span>
            </div>
            <p className="text-2xl font-black uppercase tracking-tight text-white">Secure Access</p>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">Trusted login environment active</p>
            <div className="mt-5 grid grid-cols-2 gap-6 border-t border-white/10 pt-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Support</p>
                <p className="mt-2 text-lg font-black text-white">24/7</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Session</p>
                <p className="mt-2 text-lg font-black text-cyan-300">Protected</p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-xl">
            <div className="mb-8 lg:hidden">
              <Link to="/" className="inline-flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-600 text-sm font-black uppercase tracking-[0.18em] text-white">
                  KS
                </div>
                <div>
                  <p className="text-xl font-black uppercase tracking-tight text-white">K.S. Sports</p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-primary-300">Premium Athletic Goods</p>
                </div>
              </Link>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#131820]/95 p-6 shadow-[0_28px_80px_-44px_rgba(0,0,0,0.98)] backdrop-blur-xl sm:p-8 md:p-10">
              <div className="mb-8 flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] p-1 text-sm font-bold uppercase tracking-[0.18em]">
                <Link
                  to="/login"
                  className={`flex-1 rounded-full px-4 py-3 text-center transition-all ${
                    !isRegister
                      ? 'bg-primary-600 text-white shadow-[0_16px_36px_-18px_rgba(220,38,38,0.8)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className={`flex-1 rounded-full px-4 py-3 text-center transition-all ${
                    isRegister
                      ? 'bg-primary-600 text-white shadow-[0_16px_36px_-18px_rgba(220,38,38,0.8)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Join K.S. Sports
                </Link>
              </div>

              <motion.div
                key={isRegister ? 'register' : 'login'}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35 }}
              >
                <div className="mb-8">
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-300">
                    {isRegister ? 'Create Account' : 'Welcome Back'}
                  </p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                    {isRegister ? 'Join K.S. Sports' : 'Sign In To Continue'}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-400">
                    {isRegister
                      ? 'Use your existing K.S. Sports registration flow to create a customer or approved seller account.'
                      : 'Use your existing K.S. Sports credentials to access orders, dashboard tools, and premium workflows.'}
                  </p>
                </div>

                <form onSubmit={submitHandler} className="space-y-6">
                  <AnimatePresence mode="wait">
                    {isRegister && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="space-y-6"
                      >
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Full Name</label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              required
                              placeholder="Enter your full name"
                              className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-12 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Account Role</label>
                          <div className="grid grid-cols-2 gap-3">
                            <label className={`cursor-pointer rounded-2xl border px-4 py-3 text-center text-sm font-bold transition-all ${role === 'customer' ? 'border-primary-500/40 bg-primary-600 text-white shadow-[0_16px_36px_-18px_rgba(220,38,38,0.75)]' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:text-white'}`}>
                              <input type="radio" value="customer" checked={role === 'customer'} onChange={() => setRole('customer')} className="hidden" />
                              Customer
                            </label>
                            <label className={`cursor-pointer rounded-2xl border px-4 py-3 text-center text-sm font-bold transition-all ${role === 'seller' ? 'border-primary-500/40 bg-primary-600 text-white shadow-[0_16px_36px_-18px_rgba(220,38,38,0.75)]' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:text-white'}`}>
                              <input type="radio" value="seller" checked={role === 'seller'} onChange={() => setRole('seller')} className="hidden" />
                              Seller
                            </label>
                          </div>
                          <p className="text-xs leading-6 text-slate-500">
                            Seller registration is restricted to approved K.S. Sports accounts for Roni and Kashish only.
                          </p>
                        </div>

                        <AnimatePresence>
                          {role === 'seller' && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="space-y-2"
                            >
                              <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Seller Secret Key</label>
                              <div className="relative">
                                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                  type="password"
                                  value={sellerSecret}
                                  onChange={(e) => setSellerSecret(e.target.value)}
                                  required={role === 'seller'}
                                  placeholder="Enter seller secret"
                                  className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-12 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40"
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="athlete@example.com"
                        className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-12 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Password</label>
                      {!isRegister && (
                        <Link to="#" className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-300 transition-colors hover:text-white">
                          Forgot Password?
                        </Link>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Enter your password"
                        className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-12 pr-12 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-white"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {!isRegister && (
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-primary-500/30 bg-primary-500/10 text-primary-300">
                        <CheckCircle2 size={12} />
                      </span>
                      Stay logged in on this device
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_22px_44px_-20px_rgba(220,38,38,0.7)] transition-all hover:-translate-y-0.5 hover:bg-primary-700 disabled:opacity-60"
                  >
                    {loading ? (
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                    ) : (
                      <>
                        {isRegister ? 'Create Account' : 'Sign In'}
                        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-400">
                  {isRegister ? 'Already have a K.S. Sports account?' : 'New to K.S. Sports?'}{' '}
                  <Link
                    to={isRegister ? '/login' : '/register'}
                    className="font-bold text-primary-300 transition-colors hover:text-white"
                  >
                    {isRegister ? 'Sign In' : 'Create Account'}
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
