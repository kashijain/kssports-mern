import { motion } from 'framer-motion';
import { Target, ShieldCheck, Zap, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="bg-slate-50 dark:bg-dark-bg min-h-screen pt-24 pb-20 overflow-hidden">
      
      {/* Hero Section */}
      <div className="relative pt-12 pb-20 md:pt-20 md:pb-32 container-bound">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-600/10 dark:bg-primary-900/20 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="relative z-10 text-center max-w-4xl mx-auto">
           <motion.h1 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight mb-6 leading-tight"
           >
             Elevating the Game for <span className="text-primary-600">Every Athlete</span>
           </motion.h1>
           <motion.p 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
           >
             K.S. Sports was born out of a passion for performance. We provide professional-grade equipment engineered for those who refuse to settle for second best.
           </motion.p>
        </div>
      </div>

      {/* Origin Story */}
      <div className="container-bound mb-24">
         <div className="bg-white dark:bg-dark-card rounded-[2rem] shadow-premium dark:shadow-dark-premium border border-slate-100 dark:border-dark-border overflow-hidden flex flex-col lg:flex-row">
            <div className="lg:w-1/2 relative min-h-[400px]">
               <img src="https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80" alt="Athletes in training" className="absolute inset-0 w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 to-transparent"></div>
               <div className="absolute bottom-8 left-8 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 max-w-xs">
                  <p className="text-white font-bold text-lg leading-tight">"We don't just sell equipment; we equip champions for their legacy."</p>
               </div>
            </div>
            <div className="lg:w-1/2 p-10 md:p-16 lg:p-20 flex flex-col justify-center">
               <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">Our Origin Story</h2>
               <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 space-y-6">
                  <p>
                     Founded in 2018, K.S. Sports started as a small local shop catering to dedicated cricketers. Frustrated by the lack of premium, highly-engineered sports gear available at accessible prices, our founders decided to bridge the gap.
                  </p>
                  <p>
                     Today, we source and manufacture the highest quality equipment, from Grade A English Willow bats to aerodynamic training gear. Every piece of equipment that carries our seal has been rigorously tested by professional athletes.
                  </p>
                  <p>
                     We believe that peak performance requires uncompromised quality. It's not just about what you wear or wield; it's about the confidence that your gear will never hold you back.
                  </p>
               </div>
            </div>
         </div>
      </div>

      {/* Core Values */}
      <div className="container-bound mb-24">
         <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">The K.S. Standard</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400">Our core pillars that dictate every product we design and every order we fulfill.</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
               { icon: Target, title: 'Precision Driven', desc: 'Every millimeter and gram is calculated for optimum physical output and balance.' },
               { icon: ShieldCheck, title: 'Unyielding Quality', desc: 'Sourced from premium materials and rigorously field-tested by professionals.' },
               { icon: Zap, title: 'Innovation First', desc: 'We continuously evolve our designs integrating modern biomechanical science.' },
               { icon: Users, title: 'For The Athlete', desc: 'Built for the community. We listen, adapt, and create what athletes truly need.' }
            ].map((value, i) => (
               <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  key={i} 
                  className="bg-white dark:bg-dark-card p-8 rounded-3xl border border-slate-100 dark:border-dark-border shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group"
               >
                  <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm">
                     <value.icon size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{value.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{value.desc}</p>
               </motion.div>
            ))}
         </div>
      </div>

      {/* CTA Section */}
      <div className="container-bound">
         <div className="bg-slate-900 dark:bg-slate-950 rounded-[2rem] p-12 lg:p-20 text-center relative overflow-hidden border border-slate-800">
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:40px_40px] pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/20 rounded-full blur-[100px] pointer-events-none"></div>
            
            <div className="relative z-10 max-w-2xl mx-auto">
               <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-6">Ready to upgrade your game?</h2>
               <p className="text-lg text-slate-400 mb-10 text-center mx-auto">
                  Experience the difference that premium, professionally-engineered equipment makes on the field.
               </p>
               <Link to="/shop" className="btn-primary h-16 px-10 text-lg font-bold shadow-xl shadow-primary-600/30 inline-flex items-center justify-center">
                  Explore The Collection
               </Link>
            </div>
         </div>
      </div>

    </div>
  );
};

export default About;
