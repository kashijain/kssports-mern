import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Youtube, MapPin, Phone, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-white/10 bg-[#090c12] pt-20 text-slate-300">
      <div className="absolute inset-0 hero-glow opacity-60"></div>
      <div className="absolute inset-0 surface-grid opacity-[0.06]"></div>
      <div className="container-bound relative z-10">
        <div className="grid grid-cols-1 gap-12 pb-14 md:grid-cols-2 lg:grid-cols-4">
          
          {/* Brand Info */}
          <div>
            <Link to="/" className="mb-7 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 text-white shadow-[0_18px_38px_-16px_rgba(220,38,38,0.75)]">
                KS
              </div>
              <div className="leading-none">
                <span className="block text-xl font-black tracking-[0.16em] text-white">K.S. SPORTS</span>
                <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-500">Premium Athletic Goods</span>
              </div>
            </Link>

            <p className="mb-6 max-w-sm leading-7 text-slate-400">
              K.S. Sports Karnal - Imported & Kashmir Willow bats, custom sports gear, best quality at best rates, with all India delivery.
            </p>

            <div className="flex items-center gap-3 text-white">
              <a href="https://instagram.com/kssportsknl" target="_blank" rel="noreferrer" className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition hover:-translate-y-0.5 hover:bg-pink-500">
                <Instagram size={18} />
              </a>

              <a href="https://wa.me/917082252531" target="_blank" rel="noreferrer" className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition hover:-translate-y-0.5 hover:bg-green-500">
                <Phone size={18} />
              </a>

              <a href="mailto:ronikssports@gmail.com" className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition hover:-translate-y-0.5 hover:bg-blue-500">
                <Mail size={18} />
              </a>

              <a href="#" className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition hover:-translate-y-0.5 hover:bg-red-500">
                <Youtube size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-6 text-lg font-bold text-white">Quick Links</h3>
            <ul className="flex flex-col gap-3">
              <li><Link to="/" className="transition-colors hover:text-primary-400">Home</Link></li>
              <li><Link to="/shop" className="transition-colors hover:text-primary-400">Shop Everything</Link></li>
              <li><Link to="/about" className="transition-colors hover:text-primary-400">About Us</Link></li>
              <li><Link to="/contact" className="transition-colors hover:text-primary-400">Contact Us</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-6 text-lg font-bold text-white">Categories</h3>
            <ul className="flex flex-col gap-3">
              <li><Link to="/shop?category=Bats" className="transition-colors hover:text-primary-400">Cricket Bats</Link></li>
              <li><Link to="/shop?category=Balls" className="transition-colors hover:text-primary-400">Sports Balls</Link></li>
              <li><Link to="/shop?category=Kits" className="transition-colors hover:text-primary-400">Kits & Bags</Link></li>
              <li><Link to="/shop?category=Footwear" className="transition-colors hover:text-primary-400">Footwear</Link></li>
              <li><Link to="/shop?category=Accessories" className="transition-colors hover:text-primary-400">Accessories</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-6 text-lg font-bold text-white">Contact Us</h3>
            <ul className="flex flex-col gap-4">

              <li className="flex items-start gap-3">
                <MapPin className="text-primary-600 mt-1" size={20} />
                <span>
                  Shiv Colony, Main Kaithal Road,<br/>
                  Karnal, Haryana - 132001
                </span>
              </li>

              <li className="flex items-center gap-3">
                <Phone className="text-primary-600" size={20} />
                <a href="tel:+917082252531" className="transition-colors hover:text-white">
                  +91 7082252531
                </a>
              </li>

              <li className="flex items-center gap-3">
                <Mail className="text-primary-600" size={20} />
                <span>ronikssports@gmail.com</span>
              </li>

            </ul>
          </div>

        </div>

        {/* Bottom */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-8 text-center md:flex-row md:text-left">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} K.S. Sports. All rights reserved Degion by kashish jain .
          </p>
          <div className="flex gap-4 text-sm text-slate-500">
            <Link to="/privacy" className="transition-colors hover:text-white">Privacy Policy</Link>
            <Link to="/terms" className="transition-colors hover:text-white">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
