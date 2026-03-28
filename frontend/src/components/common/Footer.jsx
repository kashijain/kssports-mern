import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, MapPin, Phone, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-300 pt-16 pb-8 mt-auto">
      <div className="container-bound">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Info */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                KS
              </div>
              <span className="font-bold text-2xl tracking-tight text-white">
                K.S. <span className="text-primary-600">Sports</span>
              </span>
            </Link>
            <p className="text-slate-400 mb-6 leading-relaxed">
              Premium sports gear and equipment for champions. Elevate your game with the highest quality products curated for athletes of all levels.
            </p>
            <div className="flex items-center gap-4 text-white">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary-600 transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary-600 transition-colors">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary-600 transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary-600 transition-colors">
                <Youtube size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Quick Links</h3>
            <ul className="flex flex-col gap-3">
              <li><Link to="/" className="hover:text-primary-500 transition-colors">Home</Link></li>
              <li><Link to="/shop" className="hover:text-primary-500 transition-colors">Shop Everything</Link></li>
              <li><Link to="/about" className="hover:text-primary-500 transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-primary-500 transition-colors">Contact Us</Link></li>
              <li><Link to="/faq" className="hover:text-primary-500 transition-colors">FAQs</Link></li>
            </ul>
          </div>

          {/* Top Categories */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Categories</h3>
            <ul className="flex flex-col gap-3">
              <li><Link to="/shop?category=Bats" className="hover:text-primary-500 transition-colors">Cricket Bats</Link></li>
              <li><Link to="/shop?category=Balls" className="hover:text-primary-500 transition-colors">Sports Balls</Link></li>
              <li><Link to="/shop?category=Kits" className="hover:text-primary-500 transition-colors">Kits & Bags</Link></li>
              <li><Link to="/shop?category=Footwear" className="hover:text-primary-500 transition-colors">Footwear</Link></li>
              <li><Link to="/shop?category=Accessories" className="hover:text-primary-500 transition-colors">Accessories</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Contact Us</h3>
            <ul className="flex flex-col gap-4">
              <li className="flex items-start gap-3">
                <MapPin className="text-primary-600 mt-1 shrink-0" size={20} />
                <span>123 Sports Avenue, Athletic District, NY 10001</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-primary-600 shrink-0" size={20} />
                <span>+1 (800) 123-4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-primary-600 shrink-0" size={20} />
                <span>support@kssports.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} K.S. Sports. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-slate-500">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
