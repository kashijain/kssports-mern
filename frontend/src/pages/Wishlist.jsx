import React from 'react';
import { useWishlistStore } from '../store/useStore';
import { useWishlistStore as useWishlistCustomStore } from '../store/useWishlistStore';
import ProductCard from '../components/product/ProductCard';
import { Heart, Search, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Wishlist = () => {
  // Use the newly created custom wishlist store
  const { wishlistItems, clearWishlist } = useWishlistCustomStore();

  return (
    <div className="bg-slate-50 dark:bg-dark-bg min-h-screen pt-24 pb-24">
      {/* Page Header */}
      <div className="bg-white dark:bg-dark-card border-y border-slate-200 dark:border-dark-border py-12 md:py-16 mb-12 shadow-sm">
        <div className="container-bound flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
            <Heart size={30} className="fill-red-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Your <span className="text-red-500">Wishlist</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
            Keep track of the premium gear you love. Add them to your cart when you're ready to dominate the game.
          </p>
        </div>
      </div>

      <div className="container-bound">
        {wishlistItems.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 bg-white dark:bg-dark-card rounded-3xl border border-slate-100 dark:border-dark-border shadow-sm flex flex-col items-center"
          >
            <div className="w-24 h-24 bg-slate-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 text-slate-400">
              <Heart size={40} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-4">Your wishlist is empty</h2>
            <p className="text-slate-500 dark:text-gray-400 max-w-md mx-auto mb-8">
              Looks like you haven't saved any items yet. Explore our premium collection and find your next favorite gear!
            </p>
            <Link to="/shop" className="btn-primary inline-flex px-8 h-14 items-center">
              Explore Collection
            </Link>
          </motion.div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-8 border-b border-slate-200 dark:border-dark-border pb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Saved Items <span className="text-slate-400 font-normal">({wishlistItems.length})</span>
              </h2>
              <button 
                onClick={clearWishlist}
                className="text-sm font-bold text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 px-4 py-2 rounded-xl transition-colors"
              >
                Clear Wishlist
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {wishlistItems.map((product) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={product._id}
                    className="h-full"
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
