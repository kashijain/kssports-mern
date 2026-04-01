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
    <div className="min-h-screen bg-transparent">
      
      {/* Premium Hero Section */}
      <section className="relative flex min-h-[94vh] items-center overflow-hidden bg-slate-950">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80"
            alt="Stadium background"
            className="h-full w-full object-cover opacity-20"
          />
        </div>
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.14),transparent_24%)]"></div>
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-950 via-slate-950/92 to-slate-900/90"></div>
        <div className="absolute left-[8%] top-[12%] z-0 h-40 w-40 rounded-full border border-white/10 bg-white/5 blur-3xl"></div>
        <div className="absolute bottom-[10%] right-[8%] z-0 h-64 w-64 rounded-full bg-primary-600/12 blur-[120px]"></div>

        <div className="container-bound relative z-10 grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center lg:text-left"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-xl">
              <TrendingUp size={16} className="text-primary-500" />
              <span>Premium Athletic Goods</span>
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight text-white md:text-7xl xl:text-[5.6rem]">
              Built For
              <span className="block text-transparent bg-gradient-to-r from-white via-primary-100 to-primary-500 bg-clip-text">
                Serious Players
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300 lg:mx-0 lg:text-xl">
              Discover premium cricket and training gear curated for athletes who want sharper balance, stronger performance, and a brand they can trust match after match.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
              <Link to="/shop" className="btn-primary px-8 py-4 text-lg">
                Shop Now
                <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#categories"
                className="btn-secondary border-white/10 bg-white/5 px-8 py-4 text-lg text-white backdrop-blur-md hover:bg-white/10 hover:text-white"
              >
                Explore Collection
              </a>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ['10K+', 'Players served'],
                ['48 Hr', 'Fast dispatch'],
                ['Pro Grade', 'Performance gear'],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-white/6 px-5 py-4 text-left backdrop-blur-xl"
                >
                  <p className="text-2xl font-black text-white">{value}</p>
                  <p className="mt-1 text-sm text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15, ease: 'easeOut' }}
            className="relative mx-auto w-full max-w-2xl"
          >
            <div className="absolute -left-6 top-16 hidden h-36 w-36 rounded-[2rem] border border-white/10 bg-white/6 backdrop-blur-xl lg:block"></div>
            <div className="absolute -right-8 bottom-10 hidden h-44 w-44 rounded-full bg-primary-600/15 blur-3xl lg:block"></div>

            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur-xl">
              <div className="relative overflow-hidden rounded-[1.7rem]">
                <img
                  src="https://images.unsplash.com/photo-1540747913346-19e32fc3e64b?auto=format&fit=crop&q=80"
                  alt="Premium sports gear"
                  className="h-[520px] w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent"></div>

                <div className="absolute left-5 top-5 rounded-2xl border border-white/15 bg-slate-950/60 px-4 py-3 backdrop-blur-md">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Featured Drop</p>
                  <p className="mt-1 text-lg font-bold text-white">Elite Match Collection</p>
                </div>

                <div className="absolute bottom-5 left-5 right-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/62 p-5 backdrop-blur-xl">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary-300">Signature Pick</p>
                        <h3 className="mt-2 text-2xl font-black text-white">English Willow Power Bat</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          Crafted for balance, clean stroke play, and match-day confidence.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-3 text-primary-300">
                        <Trophy size={22} />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                      <div className="flex gap-1 text-yellow-400">
                        <Star size={15} className="fill-yellow-400" />
                        <Star size={15} className="fill-yellow-400" />
                        <Star size={15} className="fill-yellow-400" />
                        <Star size={15} className="fill-yellow-400" />
                        <Star size={15} className="fill-yellow-400" />
                      </div>
                      <p className="text-sm font-semibold text-white">Trusted by academies</p>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-5 backdrop-blur-xl">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Why K.S. Sports</p>
                    <div className="mt-4 space-y-4">
                      {[
                        ['Premium Finish', 'Sharp product quality'],
                        ['Reliable Delivery', 'Fast all-India shipping'],
                        ['Store Trusted', 'Trusted by 10K+ athletes'],
                      ].map(([title, desc]) => (
                        <div key={title} className="flex items-start gap-3">
                          <div className="mt-1 rounded-full bg-primary-500/15 p-2 text-primary-300">
                            <ShieldCheck size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{title}</p>
                            <p className="text-xs leading-5 text-slate-400">{desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Banner */}
      <section className="relative z-10 border-y border-white/40 bg-white/70 py-12 backdrop-blur-xl dark:border-white/5 dark:bg-dark-card/60">
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
      <section id="categories" className="section-padding">
        <div className="container-bound">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <span className="section-kicker">Collections</span>
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
      <section className="section-padding border-y border-white/40 bg-white/70 backdrop-blur-xl dark:border-white/5 dark:bg-dark-card/60">
        <div className="container-bound">
          <div className="text-center mb-16">
            <span className="section-kicker justify-center">Top Picks</span>
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
      <section className="section-padding">
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
              <span className="section-kicker">Testimonials</span>
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
      <section className="border-t border-white/40 bg-white/70 py-12 backdrop-blur-xl dark:border-white/5 dark:bg-dark-card/60">
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
