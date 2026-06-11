import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';
import { ArrowRight, ChevronRight, Mail, Quote, ShieldCheck, Star, Trophy, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProductStore } from '../store/useStore';
import { Helmet } from 'react-helmet-async';

const collectionHighlights = [
  {
    name: 'Cricket Bats',
    image: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?auto=format&fit=crop&q=80',
    href: '/shop?category=Bats',
    desc: 'Hand-finished willow built for timing, pickup, and explosive middle.',
  },
  {
    name: 'Protective Gear',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80',
    href: '/shop?category=Kits',
    desc: 'Pads, gloves, and guards designed for confident all-match protection.',
  },
  {
    name: 'Footwear',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80',
    href: '/shop?category=Footwear',
    desc: 'Performance-first grip and comfort for training blocks and match days.',
  },
  {
    name: 'Training Essentials',
    image: 'https://images.unsplash.com/photo-1518605368461-1e94441586a1?auto=format&fit=crop&q=80',
    href: '/shop?category=Accessories',
    desc: 'Practice tools and utility gear that sharpen every session.',
  },
];

const trustHighlights = [
  { icon: <Trophy size={32} className="text-primary-600" />, title: 'Premium Quality', desc: 'Elite-level materials and finish across every gear category.' },
  { icon: <Zap size={32} className="text-primary-600" />, title: 'Fast Delivery', desc: 'Quick dispatch and dependable shipping for athletes on schedule.' },
  { icon: <ShieldCheck size={32} className="text-primary-600" />, title: 'Reliable Service', desc: 'A trusted store experience before and after purchase.' },
];

const reviews = [
  { name: 'Rahul S.', role: 'Top Order Cricketer', content: 'The bat pickup feels beautifully balanced and the finish looks genuinely premium. K.S. Sports delivered exactly what match prep needed.', rating: 5 },
  { name: 'Arjun M.', role: 'Academy Mentor', content: 'We keep coming back for gloves, pads, and training gear because the quality is consistent and the service stays dependable.', rating: 5 },
  { name: 'Sarah L.', role: 'Club Player', content: 'The footwear and kit bag both felt elevated the moment they arrived. Clean packaging, strong materials, and a premium overall experience.', rating: 5 },
];

const trustStats = [
  { value: '98%', label: 'positive buyer sentiment' },
  { value: '5K+', label: 'orders served with care' },
  { value: 'Elite', label: 'gear built for serious play' },
  { value: 'Zero', label: 'compromise on finish' },
];

const featuredCallouts = [
  'Match-ready willow selection',
  'Fast-moving essentials for the season',
  'Trusted by players, clubs, and academies',
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
    <div className="min-h-screen bg-slate-950">
      <Helmet>
        <title>K.S. Sports - Premium Athletic & Sports Goods</title>
        <meta name="description" content="Shop premium hand-finished cricket bats, gloves, protective gear, sleeves, and training essentials at K.S. Sports. Built for elite athletic performance." />
        <link rel="canonical" href="https://kssports-mern-96j7.vercel.app/" />
        <meta property="og:title" content="K.S. Sports - Premium Athletic & Sports Goods" />
        <meta property="og:description" content="Shop premium hand-finished cricket bats, gloves, protective gear, sleeves, and training essentials at K.S. Sports. Built for elite athletic performance." />
        <meta property="og:image" content="https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80" />
        <meta property="og:url" content="https://kssports-mern-96j7.vercel.app/" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      
      {/* Premium Hero Section */}
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80"
            alt="K.S. Sports stadium atmosphere"
            className="h-full w-full object-cover opacity-30"
          />
        </div>
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.34),transparent_24%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_24%),linear-gradient(180deg,rgba(2,6,23,0.18),rgba(2,6,23,0.82))]"></div>
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-950 via-slate-950/88 to-slate-950/30"></div>
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-950/10 via-transparent to-slate-950"></div>
        <div className="absolute left-[8%] top-[11%] z-0 h-44 w-44 rounded-full border border-white/10 bg-white/5 blur-3xl"></div>
        <div className="absolute bottom-[6%] right-[7%] z-0 h-80 w-80 rounded-full bg-primary-600/16 blur-[140px]"></div>

        <div className="container-bound relative z-10 grid min-h-[92vh] items-center gap-14 py-16 lg:grid-cols-[1fr_1.06fr] lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="max-w-2xl text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-xl">
              <TrendingUp size={16} className="text-primary-500" />
              <span>Premium Athletic Goods</span>
            </div>

            <h1 className="mt-7 max-w-3xl text-5xl font-black uppercase leading-[0.88] tracking-tight text-white md:text-7xl xl:text-[5.8rem]">
              Built For
              <span className="mt-1 block">
                <span className="text-primary-500">Serious</span> Players
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-xl text-lg leading-8 text-slate-300 lg:mx-0 lg:text-xl">
              K.S. Sports brings premium cricket and athletic gear together in one sharp destination for players who expect quality, trust, and performance from every purchase.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
              <Link to="/shop" className="btn-primary group px-8 py-4 text-lg shadow-[0_26px_54px_-22px_rgba(220,38,38,0.72)]">
                Shop Now
                <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#collections"
                className="btn-secondary border-white/15 bg-white/[0.04] px-8 py-4 text-lg text-white shadow-[0_20px_45px_-28px_rgba(15,23,42,0.9)] backdrop-blur-md hover:bg-white/10 hover:text-white"
              >
                Explore Collection
              </a>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:max-w-2xl">
              {[
                ['Premium Quality', Trophy],
                ['Fast Delivery', Zap],
                ['Trusted by Players', ShieldCheck],
              ].map(([label, Icon]) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-left backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10"
                >
                  <div className="rounded-xl bg-primary-500/12 p-2 text-primary-300">
                    <Icon size={16} />
                  </div>
                  <p className="text-sm font-semibold text-slate-200">{label}</p>
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
            <div className="absolute -left-4 top-16 hidden h-40 w-40 rounded-[2rem] border border-white/10 bg-white/[0.07] backdrop-blur-xl lg:block"></div>
            <div className="absolute -right-8 bottom-8 hidden h-48 w-48 rounded-full bg-primary-600/16 blur-3xl lg:block"></div>

            <div className="relative overflow-hidden rounded-[2.1rem] border border-white/12 bg-white/[0.07] p-4 shadow-[0_34px_100px_-42px_rgba(0,0,0,0.96)] backdrop-blur-xl">
              <div className="relative overflow-hidden rounded-[1.8rem]">
                <img
                  src="https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80"
                  alt="Featured K.S. Sports gear"
                  className="h-[560px] w-full object-cover object-center transition-transform duration-700 hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/20 via-transparent to-transparent"></div>

                <div className="absolute left-5 top-5 rounded-2xl border border-white/15 bg-slate-950/68 px-4 py-3 shadow-[0_18px_35px_-20px_rgba(0,0,0,0.8)] backdrop-blur-md">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Featured Gear</p>
                  <p className="mt-1 text-lg font-black text-white">Match Day Essentials</p>
                </div>


                {/* Right floating badge (Store Rating) */}
                <div className="absolute -right-4 top-28 hidden w-44 rounded-[1.45rem] border border-white/10 bg-slate-950/72 p-4 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.82)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20 lg:block z-20">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-300">Store Rating</p>
                  <div className="mt-3 flex items-center gap-2 text-yellow-400">
                    <Star size={14} className="fill-yellow-400" />
                    <Star size={14} className="fill-yellow-400" />
                    <Star size={14} className="fill-yellow-400" />
                    <Star size={14} className="fill-yellow-400" />
                    <Star size={14} className="fill-yellow-400" />
                  </div>
                  <p className="mt-3 text-2xl font-black text-white">4.9/5</p>
                  <p className="mt-1 text-xs text-slate-400">Trusted by serious players</p>
                </div>

                <div className="absolute inset-x-5 bottom-5 z-10">
                  <div className="rounded-[1.7rem] border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_48px_-28px_rgba(0,0,0,0.88)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_34px_70px_-32px_rgba(220,38,38,0.35)]">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="max-w-md">
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary-300">Featured Product</p>
                        <h3 className="mt-2 text-2xl font-black text-white">English Willow Match Bat</h3>
                        <p className="mt-3 text-sm leading-6 text-slate-300">
                          Crafted for premium pickup, balanced stroke play, and dependable confidence when the pressure rises.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/10 px-4 py-3 text-right shadow-inner shadow-white/5">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Starting At</p>
                        <p className="mt-1 text-2xl font-black text-white">₹3,000</p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-[1fr_auto] sm:items-center">
                      <div className="flex items-center gap-3">
                        {[
                          'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?auto=format&fit=crop&q=80',
                          'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80',
                          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80',
                        ].map((preview, index) => (
                          <div key={preview} className={`h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-white/10 ${index === 1 ? 'ring-2 ring-primary-500/70' : ''}`}>
                            <img src={preview} alt="Preview product" className="h-full w-full object-cover" />
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 sm:justify-end">
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
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Equip Your Ambition */}
      <section id="collections" className="relative overflow-hidden border-y border-white/10 bg-[#0b0f16] py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.1),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0),rgba(15,23,42,0.72))]"></div>
        <div className="container-bound relative z-10">
          <div className="relative z-10 mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <span className="section-kicker border-white/10 bg-white/[0.04] text-primary-300">Equip Your Ambition</span>
              <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                Premium collections designed for every serious phase of the game.
              </h2>
            </div>
            <Link to="/shop" className="btn-secondary group w-fit border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]">
              View All Gear
              <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {collectionHighlights.map((category, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.55 }}
                key={category.name}
              >
                <Link
                  to={category.href}
                  className="group relative block overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-[0_24px_60px_-34px_rgba(0,0,0,0.9)] transition-all duration-500 hover:-translate-y-2 hover:border-white/20 hover:shadow-[0_32px_72px_-34px_rgba(220,38,38,0.28)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent z-10"></div>
                  <img
                    src={category.image}
                    alt={category.name}
                    className="h-[340px] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 z-20 p-7">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary-300">Featured Category</p>
                    <h3 className="mt-3 text-2xl font-black text-white">{category.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{category.desc}</p>
                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white">
                      Explore
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="relative overflow-hidden border-y border-white/10 bg-[#0b0f16] py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(220,38,38,0.12),transparent_26%)]"></div>
        <div className="container-bound relative z-10 grid gap-10 lg:grid-cols-[0.88fr_1.12fr]">
          <div>
            <span className="section-kicker border-white/10 bg-white/[0.04] text-primary-300">Trusted by Players</span>
            <h2 className="mt-4 text-4xl font-extrabold uppercase tracking-tight text-white md:text-5xl">
              Performance-first service for every serious purchase.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-400">
              From willow to footwear, K.S. Sports combines premium product selection, dependable service, and a customer experience that feels confident from browse to delivery.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {trustStats.map((item) => (
              <div
                key={item.label}
                className="rounded-[1.8rem] border border-white/10 bg-white/[0.05] p-6 shadow-[0_20px_45px_-30px_rgba(0,0,0,0.85)] backdrop-blur-xl"
              >
                <p className="text-3xl font-black uppercase text-white">{item.value}</p>
                <p className="mt-2 text-sm uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="container-bound relative z-10 mt-12 grid gap-6 md:grid-cols-3">
          {trustHighlights.map((feat, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              key={feat.title}
              className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.82)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="inline-flex rounded-2xl bg-primary-500/12 p-3 text-primary-300">
                {feat.icon}
              </div>
              <h3 className="mt-5 text-xl font-black text-white">{feat.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products Component */}
      <section className="relative overflow-hidden bg-slate-950 py-20">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0),rgba(15,23,42,0.48))]"></div>
        <div className="container-bound">
          <div className="mb-14 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="section-kicker border-white/10 bg-white/[0.04] text-primary-300">Featured Gear</span>
              <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                Clean picks for players building a sharper kit.
              </h2>
            </div>
            <div className="max-w-md space-y-2 text-sm leading-6 text-slate-400">
              {featuredCallouts.map((item) => (
                <p key={item} className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-primary-500"></span>
                  {item}
                </p>
              ))}
            </div>
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
                 <div key={idx} className="h-[420px] rounded-[1.8rem] border border-white/10 bg-white/[0.05] animate-pulse"></div>
              ))
            ) : products?.slice(0, 4).map((product) => (
              <motion.div variants={itemVariants} key={product._id} className="h-full">
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-14 text-center">
            <Link to="/shop" className="btn-primary inline-flex px-10 items-center justify-center">
              View Entire Collection
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative overflow-hidden bg-slate-950 py-20">
        <div className="container-bound">
          <div className="mb-12 text-center">
            <span className="section-kicker justify-center border-white/10 bg-white/[0.04] text-primary-300">Testimonials</span>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
              What players say about K.S. Sports.
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {reviews.map((review, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                key={review.name}
                className="rounded-[1.9rem] border border-white/10 bg-white/[0.05] p-7 shadow-[0_24px_60px_-35px_rgba(0,0,0,0.85)] backdrop-blur-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 text-yellow-400">
                    {[...Array(review.rating)].map((_, i) => <Star key={i} size={16} className="fill-yellow-400" />)}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-primary-300">
                    <Quote size={18} />
                  </div>
                </div>
                <p className="mt-6 text-base leading-8 text-slate-300">"{review.content}"</p>
                <div className="mt-6 border-t border-white/10 pt-5">
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-white">{review.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{review.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="relative overflow-hidden border-t border-white/10 bg-[#090c12] py-24">
        <div className="absolute inset-0 opacity-20">
           <img src="https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80" className="w-full h-full object-cover" alt="K.S. Sports newsletter texture"/>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/35 via-slate-950/70 to-slate-950"></div>
        <div className="container-bound relative z-10 text-center max-w-3xl">
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-600/50">
            <Mail size={28} className="text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Join the K.S. Sports Insider</h2>
          <p className="text-slate-300 mb-10 text-lg leading-relaxed">Receive premium drops, seasonal offers, and gear recommendations curated for athletes who want a sharper edge.</p>
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
