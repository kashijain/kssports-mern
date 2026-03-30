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
  <div className="bg-slate-900 dark:bg-dark-card rounded-3xl p-8 md:p-10 shadow-premium text-white relative overflow-hidden h-full">
    
    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/20 rounded-full blur-[80px]"></div>
    
    <h3 className="text-2xl font-bold mb-8 relative z-10">Contact Information</h3>

    <div className="space-y-8 relative z-10">

      {/* ADDRESS */}
      <div className="flex items-start gap-5">
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
          <MapPin className="text-primary-400" size={24} />
        </div>
        <div>
          <h4 className="font-bold text-lg mb-1">Headquarters</h4>
          <p className="text-slate-400 leading-relaxed">
            K.S. Sports, Shiv Colony<br/>
            Main Kaithal Road, Karnal<br/>
            Haryana, India - 132001
          </p>
        </div>
      </div>

      {/* PHONE */}
      <div className="flex items-start gap-5">
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
          <Phone className="text-primary-400" size={24} />
        </div>
        <div>
          <h4 className="font-bold text-lg mb-1">Phone</h4>
          <p className="text-slate-400 mb-2">+91 7082252531</p>

          <a
            href="tel:+917082252531"
            className="bg-green-500 px-4 py-2 rounded-lg text-white text-sm"
          >
            Call Now
          </a>
        </div>
      </div>

      {/* EMAIL */}
      <div className="flex items-start gap-5">
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
          <Mail className="text-primary-400" size={24} />
        </div>
        <div>
          <h4 className="font-bold text-lg mb-1">Email</h4>
          <p className="text-slate-400 flex flex-col gap-1">
            <span>ronishamra70822@gmail.com</span>
            <span>ronikssports@gmail.com</span>
          </p>
        </div>
      </div>

      {/* WORKING HOURS */}
      <div className="flex items-start gap-5">
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
          <Clock className="text-primary-400" size={24} />
        </div>
        <div>
          <h4 className="font-bold text-lg mb-1">Working Hours</h4>
          <p className="text-slate-400 flex flex-col gap-1">
            <span>Monday - Saturday: 10 AM - 8 PM</span>
            <span>Sunday: Holiday (On-call booking available)</span>
          </p>
        </div>
      </div>

      {/* SOCIAL + WHATSAPP */}
      <div className="flex gap-3 flex-wrap mt-4">

        <a
          href="https://wa.me/917082252531?text=Hi%20I%20want%20to%20buy%20a%20bat"
          target="_blank"
          className="bg-green-600 px-4 py-2 rounded-lg text-white text-sm"
        >
          WhatsApp
        </a>

        <a
          href="https://instagram.com/kssportsknl"
          target="_blank"
          className="bg-pink-500 px-4 py-2 rounded-lg text-white text-sm"
        >
          Instagram
        </a>

      </div>

      {/* GOOGLE MAP */}
      <div className="mt-6 rounded-xl overflow-hidden">
        <iframe
          src="https://www.google.com/maps?q=Karnal,Haryana&output=embed"
          width="100%"
          height="250"
          style={{ border: 0 }}
          loading="lazy"
        ></iframe>
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
