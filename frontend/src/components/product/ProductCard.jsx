import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Eye, Heart } from 'lucide-react';
import { useCartStore } from '../../store/useStore';
import { useWishlistStore } from '../../store/useWishlistStore';
import toast from 'react-hot-toast';
import { getPrimaryProductImage } from '../../utils/media';
import { formatPrice } from '../../utils/price';

const ProductCard = ({ product }) => {
  const { addToCart } = useCartStore();
  const { wishlistItems, toggleWishlist } = useWishlistStore();

  const isWishlisted = wishlistItems.some((item) => item._id === product._id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product, 1);
    toast.success(`${product.name} added to cart`);
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    const result = toggleWishlist(product);

    if (result.removed) {
      toast.success('Removed from wishlist');
    } else if (result.added) {
      toast.success('Added to wishlist');
    }
  };

  return (
    <div className="card-premium group relative flex h-full flex-col overflow-hidden">
      
      {/* Image Container with Zoom effect */}
      <Link to={`/product/${product._id}`} className="relative block aspect-[4/5] overflow-hidden bg-slate-100 dark:bg-gray-800/80">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/30 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
        {product.countInStock === 0 && (
          <div className="absolute left-4 top-4 z-10 rounded-full border border-red-400/30 bg-red-500/90 px-3 py-1.5 text-xs font-bold text-white shadow-sm backdrop-blur-md">
            Sold Out
          </div>
        )}
        <div className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-full border border-slate-200 bg-white/92 px-2.5 py-1.5 text-xs font-bold text-slate-800 shadow-sm backdrop-blur-md dark:border-dark-border dark:bg-dark-card/90 dark:text-white">
          <Star size={12} className="fill-yellow-400 text-yellow-400" />
          {product.rating}
        </div>
        
        <img 
          src={getPrimaryProductImage(product)} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = getPrimaryProductImage({});
          }}
        />
        
        {/* Quick Actions (Hover) */}
        <div className="absolute inset-x-0 bottom-0 flex translate-y-4 justify-center gap-3 bg-gradient-to-t from-black/60 via-black/15 to-transparent p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button 
            onClick={handleWishlistToggle}
            className="w-10 h-10 bg-white dark:bg-dark-card rounded-full flex items-center justify-center text-slate-700 dark:text-gray-200 shadow-xl hover:scale-110 transition-transform"
          >
            <Heart size={18} className={isWishlisted ? "fill-red-500 text-red-500" : "hover:text-red-500 transition-colors"} />
          </button>
          <div className="w-10 h-10 bg-white dark:bg-dark-card rounded-full flex items-center justify-center text-slate-700 dark:text-gray-200 shadow-xl hover:scale-110 transition-transform">
            <Eye size={18} />
          </div>
        </div>
      </Link>

      {/* Content Container */}
      <div className="relative z-10 flex flex-grow flex-col bg-white/95 p-5 dark:bg-dark-card/95">
        <Link to={`/shop?category=${product.category}`} className="mb-2 inline-flex w-fit items-center rounded-full border border-primary-500/15 bg-primary-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-primary-700 transition-colors hover:text-red-500 dark:border-primary-500/20 dark:bg-primary-500/12 dark:text-primary-300">
          {product.category}
        </Link>
        
        <Link to={`/product/${product._id}`}>
          <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2 line-clamp-2 leading-tight group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Price & Action Row (Pushed to bottom) */}
        <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-4 dark:border-dark-border/50">
          <div className="flex flex-col">
            <span className="mb-0.5 text-sm text-slate-400 line-through">{formatPrice(product.price * 1.2)}</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white leading-none">
              {formatPrice(product.price)}
            </span>
          </div>
          
          <button 
            onClick={handleAddToCart}
            disabled={product.countInStock === 0}
            className="group/btn flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-600 hover:bg-primary-600 hover:text-white hover:shadow-primary-600/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-slate-100 disabled:hover:text-slate-400 dark:border-dark-border dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-primary-600 dark:hover:text-white"
            aria-label="Add to Cart"
          >
            <ShoppingCart size={20} className="group-hover/btn:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
