import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';
import { ArrowRight, Trophy, Zap, ShieldCheck, TrendingUp, Star, Quote, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProductStore } from '../store/useStore';

const categories = [
  { name: 'Bats', image: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?auto=format&fit=crop&q=80', desc: 'Premium English Willow' },
  { name: 'Balls', image: 'https://images.unsplash.com/photo-1540747913346-19e32fc3e64b?auto=format&fit=crop&q=80', desc: 'Match Ready Turf Balls' },
  { name: 'Footwear', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80', desc: 'Ultra Grip Performance' },
  { name: 'Kits', image: 'https://images.unsplash.com/photo-1518605368461-1e94441586a1?auto=format&fit=crop&q=80', desc: 'Complete Pro Sets' },
];

const features = [
  { icon: <Trophy size={32} className="text-primary-600" />, title: 'Premium Quality', desc: 'Top-tier materials forged for champions.' },
  { icon: <Zap size={32} className="text-primary-600" />, title: 'Fast Delivery', desc: 'Express global shipping on all premium gear.' },
  { icon: <ShieldCheck size={32} className="text-primary-600" />, title: 'Secure Checkout', desc: '100% secure payment processing.' },
];

const reviews = [
  { name: 'Rahul S.', role: 'Professional Cricketer', content: 'The quality of the English Willow bat I bought here is unmatched. It has incredible balance and ping.', rating: 5 },
  { name: 'David M.', role: 'Academy Coach', content: 'We source all our academy training gear from K.S. Sports. The durability and premium feel are exceptional.', rating: 5 },
  { name: 'Arjun K.', role: 'Amateur Player', content: 'Got a complete kit last month. The bag is spacious, pads are super light, and delivery was blazing fast.', rating: 4 },
];

const brands = [
  "Nike", "Adidas", "Puma", "Kookaburra", "SS", "SG", "MRF", "New Balance"
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const Home = () => {
  const { products, loading, fetchProducts } = useProductStore();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg">
      
      {/* Premium Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-full h-full bg-slate-950 z-0"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-900/40 blur-[120px] mix-blend-screen z-0"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary-600/20 blur-[120px] mix-blend-screen z-0 animate-pulse"></div>
        
        {/* Hero Image Masked */}
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay">
          <img 
            src="https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80" 
            alt="Stadium Background" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-0"></div>

        <div className="container-bound relative z-10 grid lg:grid-cols-2 gap-12 items-center py-12">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white mb-6 text-sm font-medium">
              <TrendingUp size={16} className="text-primary-500" /> 
              <span>New 2026 Collection Available</span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-sans font-extrabold text-white leading-[1.05] mb-6 tracking-tight">
              Play Like <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-primary-600">A Champion</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
              Equip yourself with premium quality sports gear used by professionals. Designed for peak performance, built for victory.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
               <Link to="/shop" className="btn-primary px-8 py-4 text-lg">
                  Shop Collection <ArrowRight className="group-hover:translate-x-1 transition-transform" />
               </Link>
               <a href="#categories" className="px-8 py-4 text-lg rounded-xl font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all duration-300 flex items-center justify-center gap-2">
                  Explore Categories
               </a>
            </div>
          </motion.div>
          
          {/* Decorative Hero Elements */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 0.2, type: "spring" }}
            className="hidden lg:block relative"
          >
             <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl shadow-primary-900/50 border border-white/10 group">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10"></div>
                <img src="https://images.unsplash.com/photo-1540747913346-19e32fc3e64b?auto=format&fit=crop&q=80" alt="Premium Gear" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"/>
                
                {/* Floating Badge */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1, duration: 0.8 }}
                  className="absolute bottom-8 left-8 right-8 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 shadow-xl z-20"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white text-sm font-medium mb-1">Professional Grade</p>
                      <div className="flex gap-1 text-yellow-400"><Star size={16} className="fill-yellow-400"/> <Star size={16} className="fill-yellow-400"/> <Star size={16} className="fill-yellow-400"/> <Star size={16} className="fill-yellow-400"/> <Star size={16} className="fill-yellow-400"/></div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-2xl">10K+</p>
                      <p className="text-slate-300 text-xs text-right">Athletes Trust Us</p>
                    </div>
                  </div>
                </motion.div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* Features Banner */}
      <section className="py-12 bg-white dark:bg-dark-card border-b border-slate-100 dark:border-dark-border relative z-10 shadow-sm">
        <div className="container-bound">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feat, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                key={idx} 
                className="flex items-start gap-5 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors"
              >
                <div className="p-3 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-xl shrink-0">
                  {feat.icon}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1.5 text-lg">{feat.title}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="section-padding bg-slate-50 dark:bg-dark-bg">
        <div className="container-bound">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <span className="text-primary-600 font-bold tracking-wider uppercase text-sm mb-2 block">Collections</span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">Shop by Category</h2>
            </div>
            <Link to="/shop" className="btn-secondary group shrink-0">
              View All <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {categories.map((cat, idx) => (
              <motion.div variants={itemVariants} key={idx}>
                <Link to={`/shop?category=${cat.name}`} className="group relative block rounded-2xl overflow-hidden aspect-[4/5] shadow-premium dark:shadow-dark-premium">
                  <div className="absolute inset-0 bg-slate-200 dark:bg-gray-800 animate-pulse -z-10"></div>
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]" loading="lazy" />
                  
                  {/* Premium Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent flex flex-col justify-end p-8">
                    <span className="text-primary-400 font-medium text-sm mb-1 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">Explore Gear</span>
                    <h3 className="text-3xl font-bold text-white mb-2">{cat.name}</h3>
                    <p className="text-slate-300 text-sm">{cat.desc}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Products Component */}
      <section className="section-padding bg-white dark:bg-dark-card border-y border-slate-100 dark:border-dark-border">
        <div className="container-bound">
          <div className="text-center mb-16">
            <span className="text-primary-600 font-bold tracking-wider uppercase text-sm mb-3 block">Top Picks</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">Trending Gear</h2>
            <div className="w-24 h-1.5 bg-primary-600 rounded-full mx-auto"></div>
          </div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
          >
            {loading ? (
              [...Array(4)].map((_, idx) => (
                 <div key={idx} className="h-[400px] bg-slate-100 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
              ))
            ) : products?.slice(0, 4).map((product) => (
              <motion.div variants={itemVariants} key={product._id} className="h-full">
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-16 text-center">
            <Link to="/shop" className="btn-primary inline-flex px-10 items-center justify-center">
              View Entire Collection
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us & Reviews */}
      <section className="section-padding bg-slate-50 dark:bg-dark-bg">
        <div className="container-bound">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            
            {/* Visual Side */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="w-full lg:w-1/2"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary-600 rounded-3xl transform translate-x-4 translate-y-4"></div>
                <img 
                  src="https://images.unsplash.com/photo-1540747913346-19e32fc3ce0e?auto=format&fit=crop&q=80" 
                  alt="Quality Gear" 
                  className="relative z-10 rounded-3xl shadow-xl w-full aspect-[4/3] object-cover"
                />
                
                <div className="absolute -bottom-8 -left-8 bg-white dark:bg-dark-card p-6 rounded-2xl shadow-xl border border-slate-100 dark:border-dark-border z-20 flex items-center gap-4 hidden sm:flex">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">100% Authentic</h4>
                    <p className="text-sm text-slate-500">Verified by brands</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Content Side - Reviews */}
            <div className="w-full lg:w-1/2">
              <span className="text-primary-600 font-bold tracking-wider uppercase text-sm mb-3 block">Testimonials</span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-10 tracking-tight">What Champions Say</h2>
              
              <div className="flex flex-col gap-6">
                {reviews.map((review, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    key={idx} 
                    className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-dark-border"
                  >
                    <div className="flex gap-1 text-yellow-400 mb-3 block">
                      {[...Array(review.rating)].map((_, i) => <Star key={i} size={16} className="fill-yellow-400" />)}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 italic mb-4 relative z-10">"{review.content}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-200 dark:bg-gray-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-lg">
                        {review.name.charAt(0)}
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900 dark:text-white text-sm">{review.name}</h5>
                        <p className="text-xs text-slate-500">{review.role}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Featured Brands */}
      <section className="py-12 bg-white dark:bg-dark-card border-t border-slate-100 dark:border-dark-border">
        <div className="container-bound">
          <p className="text-center text-sm font-semibold text-slate-500 mb-8 uppercase tracking-widest">Trusted Partners & Top Brands</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {brands.map((brand, idx) => (
              <span key={idx} className="text-xl md:text-3xl font-black text-slate-400 dark:text-slate-600 uppercase tracking-tighter hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 opacity-20">
           <img src="https://images.unsplash.com/photo-1540747913346-19e32fc3e64b?auto=format&fit=crop&q=80" className="w-full h-full object-cover" alt="texture"/>
        </div>
        <div className="absolute inset-0 bg-primary-900/40 mix-blend-multiply"></div>
        <div className="container-bound relative z-10 text-center max-w-3xl">
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-600/50">
            <Mail size={28} className="text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Join the K.S. Sports Insider</h2>
          <p className="text-primary-100 mb-10 text-lg leading-relaxed">Subscribe to get special VIP offers, free giveaways, and once-in-a-lifetime deals delivered straight to your inbox.</p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto" onSubmit={(e) => e.preventDefault()}>
             <input type="email" placeholder="Enter your email address" className="input-premium bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-slate-300 focus:bg-white/20 focus:border-white h-14" required/>
             <button type="submit" className="btn-primary bg-primary-600 hover:bg-primary-700 h-14 px-8 shrink-0 text-white font-bold tracking-wide">Subscribe Now</button>
          </form>
        </div>
      </section>

    </div>
  );
};

export default Home;
