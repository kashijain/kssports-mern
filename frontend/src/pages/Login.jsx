import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useStore';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, ShieldCheck, Star } from 'lucide-react';
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
      navigate(
        location.state?.from || (authResponse?.role === 'seller' ? '/admin' : '/'),
        { replace: true }
      );
    } catch (err) {
      toast.error(err.message || error || 'Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden pt-24">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/10 dark:bg-primary-900/20 rounded-full blur-[100px] pointer-events-none mix-blend-multiply dark:mix-blend-screen"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-500/10 dark:bg-red-900/20 rounded-full blur-[100px] pointer-events-none mix-blend-multiply dark:mix-blend-screen"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-5xl bg-white dark:bg-dark-card rounded-3xl shadow-premium dark:shadow-dark-premium overflow-hidden flex flex-col md:flex-row border border-slate-100 dark:border-dark-border min-h-[650px] relative z-10"
      >
         
         {/* Left Side: Form */}
         <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-14 flex flex-col justify-center relative">
            <Link to="/" className="text-2xl font-black tracking-tight flex items-center gap-2 text-slate-900 dark:text-white group w-fit mb-12">
               <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-xl group-hover:scale-105 transition-transform shadow-lg shadow-primary-600/40">
                  KS
               </div>
               <span>K.S. <span className="text-primary-600">Sports</span></span>
            </Link>

            <motion.div 
              key={isRegister ? 'register' : 'login'}
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.4 }}
            >
               <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                  {isRegister ? 'Join the Elite' : 'Welcome Back'}
               </h1>
               <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg leading-relaxed font-medium">
                  {isRegister ? 'Create an account to unlock exclusive gear, fast checkout, and professional insights.' : 'Sign in to access your dashboard, orders, and premium wishlist.'}
               </p>

               <form onSubmit={submitHandler} className="space-y-6">
                  <AnimatePresence mode="wait">
                     {isRegister && (
                       <motion.div 
                          initial={{ opacity: 0, height: 0, marginBottom: 0 }} 
                          animate={{ opacity: 1, height: 'auto', marginBottom: 24 }} 
                          exit={{ opacity: 0, height: 0, marginBottom: 0 }} 
                          className="relative"
                       >
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Full Name</label>
                          <div className="relative flex items-center">
                             <User className="absolute left-4 text-slate-400" size={18} />
                             <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="John Doe" className="input-premium pl-12 h-14 bg-slate-50 dark:bg-dark-bg" />
                          </div>
                       </motion.div>
                     )}
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                     {isRegister && (
                       <motion.div 
                          initial={{ opacity: 0, height: 0, marginBottom: 0 }} 
                          animate={{ opacity: 1, height: 'auto', marginBottom: 24 }} 
                          exit={{ opacity: 0, height: 0, marginBottom: 0 }} 
                       >
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Account Role</label>
                          <div className="flex gap-4">
                             <label className={`flex-1 flex items-center justify-center p-3 rounded-xl border cursor-pointer font-bold transition-all duration-300 ${role === 'customer' ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg text-slate-500 hover:bg-slate-100'}`}>
                               <input type="radio" value="customer" checked={role === 'customer'} onChange={() => setRole('customer')} className="hidden" />
                               Customer
                             </label>
                           <label className={`flex-1 flex items-center justify-center p-3 rounded-xl border cursor-pointer font-bold transition-all duration-300 ${role === 'seller' ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg text-slate-500 hover:bg-slate-100'}`}>
                               <input type="radio" value="seller" checked={role === 'seller'} onChange={() => setRole('seller')} className="hidden" />
                               Seller
                             </label>
                          </div>
                          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Seller registration is restricted to approved K.S. Sports accounts for Roni and Kashish only.
                          </p>
                          
                          <AnimatePresence>
                             {role === 'seller' && (
                                <motion.div
                                   initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                   animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                                   exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                   className="relative overflow-hidden"
                                >
                                   <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Seller Secret Key</label>
                                   <div className="relative flex items-center">
                                      <ShieldCheck className="absolute left-4 text-slate-400" size={18} />
                                      <input type="password" value={sellerSecret} onChange={(e) => setSellerSecret(e.target.value)} required={role === 'seller'} placeholder="Enter SELLER_SECRET" className="input-premium pl-12 h-14 bg-slate-50 dark:bg-dark-bg" />
                                   </div>
                                </motion.div>
                             )}
                          </AnimatePresence>
                       </motion.div>
                     )}
                  </AnimatePresence>

                  <div className="relative">
                     <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Email Address</label>
                     <div className="relative flex items-center">
                        <Mail className="absolute left-4 text-slate-400" size={18} />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="athlete@example.com" className="input-premium pl-12 h-14 bg-slate-50 dark:bg-dark-bg" />
                     </div>
                  </div>

                  <div className="relative">
                     <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Password</label>
                        {!isRegister && <Link to="#" className="text-primary-600 hover:text-red-500 font-bold text-xs uppercase tracking-wider transition-colors">Forgot Password?</Link>}
                     </div>
                     <div className="relative flex items-center">
                        <Lock className="absolute left-4 text-slate-400" size={18} />
                        <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="input-premium pl-12 pr-12 h-14 bg-slate-50 dark:bg-dark-bg" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 text-slate-400 hover:text-primary-600 transition-colors p-1">
                           {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                     </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full btn-primary h-16 text-lg mt-8 shadow-xl shadow-primary-600/20 flex gap-2 justify-center items-center group disabled:bg-slate-300 disabled:shadow-none font-bold tracking-wide"
                  >
                     {loading ? (
                       <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                     ) : (
                       <>{isRegister ? 'Create Account' : 'Sign In'} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
                     )}
                  </button>
               </form>

               <div className="mt-10 text-center">
                  <p className="text-slate-500 dark:text-slate-400 text-[15px] font-medium">
                     {isRegister ? 'Already an athlete member?' : "Don't have an elite account yet?"}{' '}
                     <Link to={isRegister ? '/login' : '/register'} className="text-primary-600 dark:text-primary-400 font-bold hover:text-red-500 hover:underline underline-offset-4 decoration-2 transition-colors">
                        {isRegister ? 'Sign In Now' : 'Create One Here'}
                     </Link>
                  </p>
               </div>
            </motion.div>
         </div>

         {/* Right Side: Image/Branding */}
         <div className="w-full md:w-1/2 relative hidden md:block bg-slate-950 overflow-hidden">
            <motion.img 
               initial={{ scale: 1.1 }}
               animate={{ scale: 1 }}
               transition={{ duration: 1.5, ease: "easeOut" }}
               src="https://images.unsplash.com/photo-1540747913346-19e32fc3ce0e?auto=format&fit=crop&q=80" 
               className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity"
               alt="Professional Athlete"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent flex flex-col justify-end p-12 lg:p-16">
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.3, duration: 0.6 }}
                 className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl max-w-sm relative z-10"
               >
                  <div className="flex gap-1 text-primary-400 mb-4">
                    <Star size={18} className="fill-primary-400" />
                    <Star size={18} className="fill-primary-400" />
                    <Star size={18} className="fill-primary-400" />
                    <Star size={18} className="fill-primary-400" />
                    <Star size={18} className="fill-primary-400" />
                  </div>
                  <p className="text-white font-medium text-lg leading-relaxed mb-6">
                     "K.S. Sports entirely transformed my game. Their premium grade equipment is unmatched in the market today. Simply the best."
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-white font-bold border border-white/10">SM</div>
                    <div>
                      <p className="text-white font-bold leading-tight">Sarah M.</p>
                      <p className="text-primary-400 text-xs font-bold uppercase tracking-widest mt-0.5">Professional Athlete</p>
                    </div>
                  </div>
               </motion.div>
               
               <div className="mt-8 flex items-center justify-start gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest pl-2">
                  <ShieldCheck size={16} className="text-primary-500" /> Secure SSL 256-bit Encryption
               </div>
            </div>
         </div>

      </motion.div>
    </div>
  );
};

export default Login;
