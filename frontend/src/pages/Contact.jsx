import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { motion } from 'framer-motion';

const Contact = () => {
  return (
    <div className="bg-slate-50 dark:bg-dark-bg min-h-screen pt-24 pb-20">
      
      <div className="container-bound">
         {/* Header */}
         <div className="text-center max-w-3xl mx-auto mb-16 pt-8">
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
               Get in <span className="text-primary-600">Touch</span>
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
               Whether you have a question about our premium gear, need sizing assistance, or want to inquire about bulk team orders, our experts are ready to assist.
            </p>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            
            {/* Contact Info */}
            <div className="lg:col-span-5 space-y-8">
               <div className="bg-slate-900 dark:bg-dark-card rounded-3xl p-8 md:p-10 shadow-premium dark:shadow-dark-premium text-white relative overflow-hidden h-full">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/20 rounded-full blur-[80px] pointer-events-none"></div>
                  
                  <h3 className="text-2xl font-bold mb-8 relative z-10">Contact Information</h3>
                  
                  <div className="space-y-8 relative z-10">
                     <div className="flex items-start gap-5">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                           <MapPin className="text-primary-400" size={24} />
                        </div>
                        <div>
                           <h4 className="font-bold text-lg mb-1">Headquarters</h4>
                           <p className="text-slate-400 leading-relaxed">124 Sports Avenue, Athletics District<br/>New York, NY 10001</p>
                        </div>
                     </div>
                     
                     <div className="flex items-start gap-5">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                           <Phone className="text-primary-400" size={24} />
                        </div>
                        <div>
                           <h4 className="font-bold text-lg mb-1">Phone</h4>
                           <p className="text-slate-400 flex flex-col gap-1">
                              <span>Toll-Free: +1 (800) 123-4567</span>
                              <span>Local: +1 (212) 555-0198</span>
                           </p>
                        </div>
                     </div>

                     <div className="flex items-start gap-5">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                           <Mail className="text-primary-400" size={24} />
                        </div>
                        <div>
                           <h4 className="font-bold text-lg mb-1">Email</h4>
                           <p className="text-slate-400 flex flex-col gap-1">
                              <span>support@kssports.com</span>
                              <span>wholesale@kssports.com</span>
                           </p>
                        </div>
                     </div>

                     <div className="flex items-start gap-5">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                           <Clock className="text-primary-400" size={24} />
                        </div>
                        <div>
                           <h4 className="font-bold text-lg mb-1">Working Hours</h4>
                           <p className="text-slate-400 flex flex-col gap-1">
                              <span>Monday - Friday: 9am - 8pm</span>
                              <span>Saturday - Sunday: 10am - 6pm</span>
                           </p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-7">
               <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-dark-card rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100 dark:border-dark-border"
               >
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Send us a Message</h3>
                  
                  <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                           <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">First Name</label>
                           <input type="text" placeholder="John" className="input-premium h-14 bg-slate-50 dark:bg-dark-bg" />
                        </div>
                        <div>
                           <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Last Name</label>
                           <input type="text" placeholder="Doe" className="input-premium h-14 bg-slate-50 dark:bg-dark-bg" />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                           <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Email Address</label>
                           <input type="email" placeholder="john@example.com" className="input-premium h-14 bg-slate-50 dark:bg-dark-bg" />
                        </div>
                        <div>
                           <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Phone (Optional)</label>
                           <input type="tel" placeholder="+1 (555) 000-0000" className="input-premium h-14 bg-slate-50 dark:bg-dark-bg" />
                        </div>
                     </div>

                     <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Subject</label>
                        <select className="input-premium h-14 bg-slate-50 dark:bg-dark-bg appearance-none">
                           <option>General Inquiry</option>
                           <option>Order Status Support</option>
                           <option>Returns & Exchanges</option>
                           <option>Product Sizing Advice</option>
                           <option>Bulk/Team Orders</option>
                        </select>
                     </div>

                     <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Message</label>
                        <textarea 
                           rows="5" 
                           placeholder="How can we help you today?" 
                           className="w-full bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600/30 transition-shadow resize-none"
                        ></textarea>
                     </div>

                     <button className="btn-primary w-full h-16 text-lg font-bold shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2 group">
                        Send Message <Send size={20} className="group-hover:translate-x-1 transition-transform" />
                     </button>
                  </form>
               </motion.div>
            </div>

         </div>
      </div>
    </div>
  );
};

export default Contact;
