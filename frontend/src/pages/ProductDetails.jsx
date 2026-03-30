import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCartStore, useProductStore } from '../store/useStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { Star, Truck, ShieldCheck, Heart, Share2, ChevronRight, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '../utils/media';

const ProductDetails = () => {
  const { id } = useParams();
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [activeImage, setActiveImage] = useState(0);
  const navigate = useNavigate();
  
  const { addToCart } = useCartStore();
  const { product, loading, fetchProductById } = useProductStore();
  const { wishlistItems, addToWishlist, removeFromWishlist } = useWishlistStore();

  useEffect(() => {
    fetchProductById(id);
    window.scrollTo(0, 0);
  }, [id, fetchProductById]);

  const addToCartHandler = () => {
    addToCart(product, qty);
    toast.success(`${qty} x ${product.name} added to cart`);
  };

  const galleryImages =
    product?.images?.length > 0
      ? product.images.map((image) => getImageUrl(image))
      : [getImageUrl(product?.image)];
  const productSpecifications = product?.specifications?.filter(
    (spec) => spec?.name && spec?.value
  ) || [];

  if (loading || !product) return (
    <div className="bg-slate-50 dark:bg-dark-bg min-h-screen pt-24 pb-12">
      <div className="container-bound">
        <div className="animate-pulse flex flex-col lg:flex-row gap-12">
          <div className="w-full lg:w-1/2 aspect-[4/5] bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border rounded-3xl"></div>
          <div className="w-full lg:w-1/2 space-y-6 pt-8">
             <div className="h-4 bg-slate-200 dark:bg-gray-800 rounded w-1/4"></div>
             <div className="h-12 bg-slate-200 dark:bg-gray-800 rounded w-3/4"></div>
             <div className="h-6 bg-slate-200 dark:bg-gray-800 rounded w-full"></div>
             <div className="h-6 bg-slate-200 dark:bg-gray-800 rounded w-full"></div>
             <div className="h-12 bg-slate-200 dark:bg-gray-800 rounded w-1/3 mt-8"></div>
             <div className="h-32 bg-slate-200 dark:bg-gray-800 rounded w-full mt-4"></div>
          </div>
        </div>
      </div>
    </div>
  );

  const isWishlisted = wishlistItems.some((item) => item._id === product._id);
  const handleWishlistToggle = () => {
    if (isWishlisted) {
      removeFromWishlist(product._id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist(product);
      toast.success('Added to wishlist');
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-dark-bg min-h-screen pt-24 pb-16">
      <div className="container-bound">
        
        {/* Breadcrumbs */}
        <nav className="flex text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link to="/" className="hover:text-primary-600 transition-colors">Home</Link>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRight size={16} className="mx-1 text-slate-300 dark:text-slate-600" />
                <Link to="/shop" className="hover:text-primary-600 transition-colors">Shop</Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRight size={16} className="mx-1 text-slate-300 dark:text-slate-600" />
                <span className="text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-[400px]">{product.name}</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* Left: Product Gallery */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-6 xl:col-span-6 flex flex-col gap-4"
          >
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border shadow-sm group">
              <AnimatePresence mode="wait">
                <motion.img 
                  key={activeImage}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  src={galleryImages[activeImage] || galleryImages[0]}
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = getImageUrl();
                  }}
                />
              </AnimatePresence>
              
              <div className="absolute top-5 right-5 flex flex-col gap-3 z-10">
                <button onClick={handleWishlistToggle} className="w-12 h-12 bg-white/90 dark:bg-dark-card/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-700 dark:text-gray-200 shadow-md hover:scale-110 hover:text-red-500 transition-all border border-slate-200 dark:border-dark-border">
                  <Heart size={20} className={isWishlisted ? "fill-red-500 text-red-500" : ""} />
                </button>
                <button className="w-12 h-12 bg-white/90 dark:bg-dark-card/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-700 dark:text-gray-200 shadow-md hover:scale-110 hover:text-primary-600 transition-all border border-slate-200 dark:border-dark-border">
                  <Share2 size={20} />
                </button>
              </div>
            </div>
            {/* Gallery Thumbnails */}
            <div className="grid grid-cols-4 gap-4">
               {galleryImages.map((img, i) => (
                 <button 
                  key={i} 
                  onClick={() => setActiveImage(i)}
                  className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300 ${activeImage === i ? 'border-primary-600 shadow-md scale-95' : 'border-transparent hover:border-primary-600/50 hover:scale-105'}`}
                 >
                    <img
                      src={img}
                      className="w-full h-full object-cover bg-white dark:bg-dark-card"
                      onError={(e) => {
                        e.currentTarget.src = getImageUrl();
                      }}
                    />
                 </button>
               ))}
            </div>
          </motion.div>

          {/* Right: Product Details & Purchase Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-6 xl:col-span-6 flex flex-col"
          >
            <div className="mb-8 border-b border-slate-200 dark:border-dark-border pb-8">
              <span className="text-sm font-bold text-primary-600 dark:text-primary-400 tracking-wider uppercase mb-3 block">
                {product.brand} • {product.category}
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white leading-[1.1] mb-5 tracking-tight">
                {product.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 mb-8">
                <div className="flex items-center gap-1.5 px-4 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 rounded-full text-sm font-bold border border-yellow-200 dark:border-yellow-900/50">
                  <Star size={16} className="fill-yellow-500 text-yellow-500" /> 
                  {product.rating}
                </div>
                <button className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 underline decoration-slate-300 dark:decoration-dark-border underline-offset-4 transition-colors">
                  Based on {product.numReviews} Reviews
                </button>
              </div>

              <div className="flex items-end gap-4 mb-2">
                <span className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                  ${product.price.toFixed(2)}
                </span>
                <span className="text-xl font-medium text-slate-400 line-through mb-1.5">
                  ${(product.price * 1.25).toFixed(2)}
                </span>
                <span className="text-sm font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full mb-1.5 border border-red-100 dark:border-red-900/50">Save 25%</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Taxes and shipping calculated at checkout</p>
            </div>

            {/* Purchase Action Box */}
            <div className="bg-white dark:bg-dark-card rounded-3xl p-6 md:p-8 mb-8 border border-slate-100 dark:border-dark-border shadow-md">
              <div className="flex justify-between items-center mb-6">
                <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-sm">Availability</span>
                {product.countInStock > 0 ? (
                  <span className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-full text-sm border border-green-200 dark:border-green-900/50 shadow-sm">
                    <Check size={18} /> In Stock ({product.countInStock} available)
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-full text-sm border border-red-200 dark:border-red-900/50 shadow-sm">
                    Out of Stock
                  </span>
                )}
              </div>

              {product.countInStock > 0 && (
                <div className="space-y-6">
                  <div>
                    <span className="block font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider text-sm">Quantity</span>
                    <div className="flex items-center border border-slate-200 dark:border-dark-border rounded-xl w-36 h-14 bg-slate-50 dark:bg-dark-bg overflow-hidden">
                      <button 
                        onClick={() => setQty(Math.max(1, qty - 1))} 
                        className="w-12 h-full flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-gray-800 transition-colors text-xl font-medium"
                      >-</button>
                      <input 
                        type="number" 
                        value={qty} 
                        readOnly 
                        className="w-12 h-full text-center bg-transparent font-bold text-slate-900 dark:text-white text-lg appearance-none focus:outline-none" 
                      />
                      <button 
                        onClick={() => setQty(Math.min(product.countInStock, qty + 1))} 
                        className="w-12 h-full flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-gray-800 transition-colors text-xl font-medium"
                      >+</button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <button 
                      onClick={addToCartHandler}
                      className="flex-1 btn-secondary h-16 text-lg tracking-wide border-slate-300 dark:border-dark-border font-bold shadow-sm"
                    >
                      Add to Cart
                    </button>
                    <button 
                      onClick={() => { addToCartHandler(); navigate('/cart'); }}
                      className="flex-1 btn-primary h-16 text-lg tracking-wide font-bold shadow-lg shadow-primary-600/30"
                    >
                      Buy it Now
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Extra Info Icons */}
            <div className="grid grid-cols-2 gap-4 mb-12">
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border shadow-sm group hover:border-primary-600/30 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Truck size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Free Shipping</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">On orders over $50</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border shadow-sm group hover:border-primary-600/30 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Secure Payment</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">100% money back guarantee</p>
                </div>
              </div>
            </div>

            {/* Product Tabs */}
            <div className="border border-slate-200 dark:border-dark-border rounded-3xl overflow-hidden bg-white dark:bg-dark-card shadow-sm">
              <div className="flex border-b border-slate-200 dark:border-dark-border overflow-x-auto hide-scrollbar">
                {['description', 'specifications', 'reviews'].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 min-w-[140px] py-5 px-6 text-sm font-bold tracking-wider uppercase transition-colors border-b-2 ${activeTab === tab ? 'text-primary-600 border-primary-600 bg-primary-50/50 dark:bg-dark-bg' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white border-transparent bg-white dark:bg-dark-card'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="p-8">
                {activeTab === 'description' && (
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.3}} className="prose dark:prose-invert max-w-none">
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg mb-6">
                      {product.description}
                    </p>
                    <h4 className="text-slate-900 dark:text-white font-bold mb-4">Key Features:</h4>
                    <ul className="space-y-3 text-slate-600 dark:text-slate-300 list-disc pl-5 marker:text-primary-600">
                      <li>Grade 1 Premium English Willow</li>
                      <li>Custom made for professional balance and unmatched ping</li>
                      <li>Handcrafted by master bat makers with 10+ years experience</li>
                      <li>Includes premium thick-padded bat cover and extra grip</li>
                    </ul>
                  </motion.div>
                )}
                {activeTab === 'specifications' && (
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.3}} className="space-y-1">
                     {productSpecifications.length > 0 ? (
                       productSpecifications.map((spec, index) => (
                         <div key={`${spec.name}-${index}`} className="flex justify-between py-4 border-b border-slate-100 dark:border-dark-border gap-6">
                           <span className="text-slate-500 font-medium">{spec.name}</span>
                           <span className="font-bold text-slate-900 dark:text-white text-right">{spec.value}</span>
                         </div>
                       ))
                     ) : (
                       <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                         Specifications will appear here when the seller adds them.
                       </div>
                     )}
                  </motion.div>
                )}
                {activeTab === 'reviews' && (
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.3}} className="text-center py-12">
                     <div className="w-20 h-20 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm"><Star size={32} className="fill-yellow-500"/></div>
                     <h3 className="font-bold text-2xl text-slate-900 dark:text-white mb-2">{product.rating} out of 5</h3>
                     <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">Based on {product.numReviews} certified buyer reviews</p>
                     <button className="btn-secondary h-12 px-8 shadow-sm">Write a verified Review</button>
                  </motion.div>
                )}
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
