import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, MapPin, Phone, Mail } from 'lucide-react';

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
              K.S. Sports Karnal - Imported & Kashmir Willow bats, custom sports gear, best quality at best rates, with all India delivery.
            </p>

            <div className="flex items-center gap-4 text-white">
              <a href="https://instagram.com/kssportsknl" target="_blank" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-pink-500 transition">
                <Instagram size={18} />
              </a>

              <a href="https://wa.me/917082252531" target="_blank" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-green-500 transition">
                <Phone size={18} />
              </a>

              <a href="mailto:ronikssports@gmail.com" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-500 transition">
                <Mail size={18} />
              </a>

              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-red-500 transition">
                <Youtube size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Quick Links</h3>
            <ul className="flex flex-col gap-3">
              <li><Link to="/" className="hover:text-primary-500">Home</Link></li>
              <li><Link to="/shop" className="hover:text-primary-500">Shop Everything</Link></li>
              <li><Link to="/about" className="hover:text-primary-500">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-primary-500">Contact Us</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Categories</h3>
            <ul className="flex flex-col gap-3">
              <li><Link to="/shop?category=Bats">Cricket Bats</Link></li>
              <li><Link to="/shop?category=Balls">Sports Balls</Link></li>
              <li><Link to="/shop?category=Kits">Kits & Bags</Link></li>
              <li><Link to="/shop?category=Footwear">Footwear</Link></li>
              <li><Link to="/shop?category=Accessories">Accessories</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Contact Us</h3>
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
                <a href="tel:+917082252531" className="hover:text-white">
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
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} K.S. Sports. All rights reserved Degion by kashish jain .
          </p>
          <div className="flex gap-4 text-sm text-slate-500">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;