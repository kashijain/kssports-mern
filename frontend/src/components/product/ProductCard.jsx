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
    <div className="card-premium group relative flex flex-col h-full bg-white dark:bg-dark-card rounded-2xl overflow-hidden transition-all duration-500 border border-slate-100 dark:border-dark-border shadow-sm">
      
      {/* Image Container with Zoom effect */}
      <Link to={`/product/${product._id}`} className="relative aspect-[4/5] overflow-hidden bg-slate-100 dark:bg-gray-800/80 block">
        {product.countInStock === 0 && (
          <div className="absolute top-3 left-3 z-10 bg-red-500/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
            Sold Out
          </div>
        )}
        <div className="absolute top-3 right-3 z-10 bg-white/90 dark:bg-dark-card/90 backdrop-blur-md text-slate-800 dark:text-white text-xs font-bold px-2 py-1.5 rounded-full shadow-sm flex items-center gap-1 border border-slate-200 dark:border-dark-border">
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
        <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 flex justify-center gap-3 bg-gradient-to-t from-black/60 to-transparent">
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
      <div className="p-5 flex flex-col flex-grow relative bg-white dark:bg-dark-card z-10">
        <Link to={`/shop?category=${product.category}`} className="text-xs text-primary-600 dark:text-primary-400 font-bold mb-1.5 uppercase tracking-wider hover:text-red-500 transition-colors inline-block w-fit">
          {product.category}
        </Link>
        
        <Link to={`/product/${product._id}`}>
          <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2 line-clamp-2 leading-tight group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Price & Action Row (Pushed to bottom) */}
        <div className="mt-auto flex items-end justify-between pt-4 border-t border-slate-100 dark:border-dark-border/50">
          <div className="flex flex-col">
            <span className="text-sm text-slate-400 line-through mb-0.5">{formatPrice(product.price * 1.2)}</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white leading-none">
              {formatPrice(product.price)}
            </span>
          </div>
          
          <button 
            onClick={handleAddToCart}
            disabled={product.countInStock === 0}
            className="flex items-center justify-center h-12 w-12 rounded-full bg-slate-100 text-slate-600 hover:bg-primary-600 hover:text-white dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-primary-600 dark:hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-100 disabled:hover:text-slate-400 shadow-sm hover:shadow-primary-600/30 group/btn"
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
