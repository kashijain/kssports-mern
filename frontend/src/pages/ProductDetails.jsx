import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useCartStore, useProductStore } from '../store/useStore';
import { useWishlistStore } from '../store/useWishlistStore';
import {
  Star,
  Truck,
  ShieldCheck,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Check,
  ShoppingCart,
  Gauge,
  Sparkles,
  BadgeCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl, getPrimaryProductImage } from '../utils/media';
import { formatPrice } from '../utils/price';
import { Helmet } from 'react-helmet-async';

const ProductDetails = () => {
  const { id } = useParams();
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [activeImage, setActiveImage] = useState(0);
  const imageTouchStartX = useRef(null);
  const navigate = useNavigate();

  const { addToCart } = useCartStore();
  const { product, loading, fetchProductById } = useProductStore();
  const { wishlistItems, toggleWishlist } = useWishlistStore();

  useEffect(() => {
    fetchProductById(id);
    window.scrollTo(0, 0);
  }, [id, fetchProductById]);

  const addToCartHandler = () => {
    addToCart(product, qty);
    toast.success(`${qty} x ${product.name} added to cart`);
  };

  const galleryImages = useMemo(
    () =>
      product?.images?.length > 0
        ? product.images.map((image) => getImageUrl(image))
        : [getPrimaryProductImage(product)],
    [product]
  );

  const hasMultipleImages = galleryImages.length > 1;

  const productFeatures = useMemo(
    () => product?.features?.filter((feature) => String(feature || '').trim()) || [],
    [product]
  );

  const productSpecifications = useMemo(
    () => product?.specifications?.filter((spec) => spec?.name && spec?.value) || [],
    [product]
  );

  const quickHighlights = useMemo(() => {
    const derived = [];

    if (product?.category) derived.push(product.category);
    if (product?.brand) derived.push(product.brand);
    if (productFeatures.length > 0) derived.push(...productFeatures.slice(0, 2));
    if (productSpecifications.length > 0) {
      productSpecifications.slice(0, 2).forEach((spec) => derived.push(spec.value));
    }

    return [...new Set(derived.filter(Boolean))].slice(0, 4);
  }, [product, productFeatures, productSpecifications]);

  const performanceCards = useMemo(() => {
    const cards = [];

    if (productFeatures.length > 0) {
      cards.push({
        title: productFeatures[0],
        desc: 'Built to support a premium on-field feel with cleaner response, sharper control, and confident match-day performance.',
      });
    }

    if (productSpecifications.length > 0) {
      cards.push({
        title: productSpecifications[0].name,
        desc: `${productSpecifications[0].value} gives this product a more refined and dependable performance profile for serious players.`,
      });
    }

    cards.push({
      title: 'Build Quality',
      desc: 'Crafted to feel premium in hand, hold up through regular use, and stay reliable through training and match sessions.',
    });

    cards.push({
      title: 'Performance Balance',
      desc: 'Designed to support comfort, control, and confidence without sacrificing the premium sporting feel K.S. Sports stands for.',
    });

    return cards.slice(0, 4);
  }, [productFeatures, productSpecifications]);

  const specPreview = useMemo(() => {
    if (productSpecifications.length > 0) {
      return productSpecifications.slice(0, 6);
    }

    return [
      { name: 'Category', value: product?.category || 'Premium Gear' },
      { name: 'Brand', value: product?.brand || 'K.S. Sports' },
      { name: 'Availability', value: product?.countInStock > 0 ? 'In Stock' : 'Out of Stock' },
      { name: 'Quality', value: 'Premium Finish' },
    ];
  }, [product, productSpecifications]);

  if (loading || !product)
    return (
      <div className="min-h-screen bg-slate-950 pb-16 pt-24">
        <div className="container-bound">
          <div className="animate-pulse space-y-8">
            <div className="h-5 w-56 rounded bg-white/10"></div>
            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-4">
                <div className="aspect-[4/5] rounded-[1.6rem] bg-white/10"></div>
              </div>
              <div className="space-y-5">
                <div className="h-5 w-40 rounded bg-white/10"></div>
                <div className="h-16 w-3/4 rounded bg-white/10"></div>
                <div className="h-8 w-48 rounded bg-white/10"></div>
                <div className="h-24 rounded bg-white/10"></div>
                <div className="h-48 rounded-[2rem] bg-white/10"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

  const isWishlisted = wishlistItems.some((item) => item._id === product._id);

  const handleWishlistToggle = () => {
    const result = toggleWishlist(product);

    if (result.removed) {
      toast.success('Removed from wishlist');
    } else if (result.added) {
      toast.success('Added to wishlist');
    }
  };

  const goToNextImage = () => {
    if (!hasMultipleImages) return;
    setActiveImage((current) => (current + 1) % galleryImages.length);
  };

  const goToPrevImage = () => {
    if (!hasMultipleImages) return;
    setActiveImage((current) => (current - 1 + galleryImages.length) % galleryImages.length);
  };

  const handleGalleryTouchStart = (event) => {
    imageTouchStartX.current = event.touches?.[0]?.clientX ?? null;
  };

  const handleGalleryTouchEnd = (event) => {
    if (!hasMultipleImages || imageTouchStartX.current === null) return;

    const endX = event.changedTouches?.[0]?.clientX ?? imageTouchStartX.current;
    const distanceX = endX - imageTouchStartX.current;
    imageTouchStartX.current = null;

    if (Math.abs(distanceX) < 40) return;

    if (distanceX < 0) {
      goToNextImage();
    } else {
      goToPrevImage();
    }
  };

  const handleShareProduct = async () => {
    const shareData = {
      title: product.name,
      text: `Check out this product from K.S. Sports: ${product.name}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
      toast.success('Product link copied');
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error('Unable to share product');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <Helmet>
        <title>{`${product.name} - K.S. Sports`}</title>
        <meta name="description" content={product.description || `Buy ${product.name} at K.S. Sports. Explore features, specifications, and client reviews of our high-quality gear.`} />
        <link rel="canonical" href={`https://kssports-mern-96j7.vercel.app/product/${product._id}`} />
        <meta property="og:title" content={`${product.name} - K.S. Sports`} />
        <meta property="og:description" content={product.description || `Buy ${product.name} at K.S. Sports.`} />
        <meta property="og:image" content={galleryImages[0]} />
        <meta property="og:url" content={`https://kssports-mern-96j7.vercel.app/product/${product._id}`} />
      </Helmet>
      <div className="container-bound pt-8">
        <nav className="mb-8 flex text-sm font-medium text-slate-500" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link to="/" className="transition-colors hover:text-primary-400">
                Home
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRight size={16} className="mx-1 text-slate-700" />
                <Link to="/shop" className="transition-colors hover:text-primary-400">
                  Shop
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRight size={16} className="mx-1 text-slate-700" />
                <span className="max-w-[220px] truncate text-slate-200 sm:max-w-[420px]">
                  {product.name}
                </span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0c1017] p-6 shadow-[0_34px_90px_-44px_rgba(0,0,0,0.96)] md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.18),transparent_24%),linear-gradient(180deg,rgba(2,6,23,0),rgba(2,6,23,0.4))]"></div>

          <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid gap-4 md:grid-cols-[88px_minmax(0,1fr)]"
            >
              <div className="order-2 flex gap-3 overflow-x-auto md:order-1 md:flex-col">
                {galleryImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`relative h-20 min-w-[80px] overflow-hidden rounded-[1.35rem] border transition-all duration-300 md:h-24 md:min-w-0 ${
                      activeImage === i
                        ? 'border-primary-500 shadow-[0_14px_34px_-16px_rgba(220,38,38,0.55)]'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <img
                      src={img}
                      className="h-full w-full bg-[#0b0f15] object-cover"
                      alt={`${product.name} ${i + 1}`}
                      onError={(e) => {
                        e.currentTarget.src = getPrimaryProductImage(product);
                      }}
                    />
                  </button>
                ))}
              </div>

              <div className="order-1 rounded-[2rem] border border-white/10 bg-white/[0.04] p-3 md:order-2">
                <div
                  className="group relative aspect-[4/5] overflow-hidden rounded-[1.7rem] bg-[#080b10]"
                  onTouchStart={handleGalleryTouchStart}
                  onTouchEnd={handleGalleryTouchEnd}
                >
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeImage}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.04 }}
                      transition={{ duration: 0.3 }}
                      src={galleryImages[activeImage] || galleryImages[0]}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      onError={(e) => {
                        e.currentTarget.src = getImageUrl();
                      }}
                    />
                  </AnimatePresence>

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent"></div>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(220,38,38,0.22),transparent_26%)]"></div>

                  {hasMultipleImages && (
                    <>
                      <button
                        type="button"
                        onClick={goToPrevImage}
                        aria-label="Previous product image"
                        className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-950/75 text-white backdrop-blur-md transition-all hover:scale-105 hover:text-primary-400"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        type="button"
                        onClick={goToNextImage}
                        aria-label="Next product image"
                        className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-950/75 text-white backdrop-blur-md transition-all hover:scale-105 hover:text-primary-400"
                      >
                        <ChevronRight size={20} />
                      </button>
                      <div className="absolute bottom-5 right-5 z-10 rounded-full border border-white/10 bg-slate-950/75 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
                        {activeImage + 1} / {galleryImages.length}
                      </div>
                    </>
                  )}

                  <div className="absolute right-5 top-5 z-10 flex flex-col gap-3">
                    <button
                      onClick={handleWishlistToggle}
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-slate-950/75 text-white backdrop-blur-md transition-all hover:scale-105 hover:text-red-500"
                    >
                      <Heart size={20} className={isWishlisted ? 'fill-red-500 text-red-500' : ''} />
                    </button>
                    <button
                      type="button"
                      onClick={handleShareProduct}
                      aria-label="Share product"
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-slate-950/75 text-white backdrop-blur-md transition-all hover:scale-105 hover:text-primary-400"
                    >
                      <Share2 size={20} />
                    </button>
                  </div>

                  <div className="absolute bottom-5 left-5 rounded-[1.4rem] border border-white/10 bg-slate-950/72 px-5 py-4 backdrop-blur-xl">
                    <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-primary-300">
                      Premium Athletic Goods
                    </p>
                    <p className="mt-2 text-lg font-black text-white">{product.brand || 'K.S. Sports'}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col"
            >
              <div className="mb-8">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-primary-500/30 bg-primary-600 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-white shadow-[0_16px_35px_-20px_rgba(220,38,38,0.9)]">
                    Featured Gear
                  </span>
                  <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                    {product.brand} • {product.category}
                  </span>
                </div>
                <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-tight text-white md:text-6xl">
                  {product.name}
                </h1>

                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1 text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className={i < Math.round(product.rating || 0) ? 'fill-yellow-400' : ''} />
                    ))}
                  </div>
                  <p className="text-sm font-semibold text-slate-300">
                    {Number(product.rating || 0).toFixed(1)} rating
                  </p>
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
                    ({product.numReviews || 0} reviews)
                  </p>
                </div>

                <div className="mt-7 flex flex-wrap items-end gap-4">
                  <span className="text-5xl font-black leading-none text-white md:text-6xl">
                    {formatPrice(product.price)}
                  </span>
                  <span className="mb-1 text-xl font-medium text-slate-500 line-through">
                    {formatPrice(product.price * 1.25)}
                  </span>
                </div>

                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">{product.description}</p>

                {quickHighlights.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-3">
                    {quickHighlights.map((highlight, index) => (
                      <span
                        key={`${highlight}-${index}`}
                        className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-200"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-8 rounded-[2rem] border border-white/10 bg-[#121720] p-6 shadow-[0_26px_64px_-36px_rgba(0,0,0,0.95)] md:p-7">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                      Availability
                    </p>
                    <div className="mt-2">
                      {product.countInStock > 0 ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300">
                          <Check size={16} /> In Stock ({product.countInStock} available)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-300">
                          Out of Stock
                        </span>
                      )}
                    </div>
                  </div>

                  {product.countInStock > 0 && (
                    <div>
                      <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                        Quantity
                      </p>
                      <div className="flex h-14 items-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                        <button
                          onClick={() => setQty(Math.max(1, qty - 1))}
                          className="flex h-full w-12 items-center justify-center text-xl font-medium text-slate-300 transition-colors hover:bg-white/[0.08]"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={qty}
                          readOnly
                          className="h-full w-12 bg-transparent text-center text-lg font-bold text-white focus:outline-none"
                        />
                        <button
                          onClick={() => setQty(Math.min(product.countInStock, qty + 1))}
                          className="flex h-full w-12 items-center justify-center text-xl font-medium text-slate-300 transition-colors hover:bg-white/[0.08]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {product.countInStock > 0 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <button
                      onClick={addToCartHandler}
                      className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition-all hover:-translate-y-0.5 hover:border-primary-600 hover:bg-primary-600"
                    >
                      <ShoppingCart size={18} />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => {
                        addToCartHandler();
                        navigate('/cart');
                      }}
                      className="inline-flex items-center justify-center gap-3 rounded-2xl bg-primary-600 px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-white shadow-[0_22px_44px_-20px_rgba(220,38,38,0.6)] transition-all hover:-translate-y-0.5 hover:bg-primary-700"
                    >
                      Buy Now
                    </button>
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/12 text-primary-300">
                      <Truck size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-[0.14em] text-white">
                        Fast Delivery
                      </h4>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        Quick dispatch on eligible orders with trusted shipping support.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/12 text-primary-300">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-[0.14em] text-white">
                        Secure Checkout
                      </h4>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        Protected payments and dependable post-purchase support.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-[2rem] border border-white/10 bg-[#121720] p-6">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary-300">
                  Technical Overview
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {specPreview.map((spec, index) => (
                    <div
                      key={`${spec.name}-${index}`}
                      className="rounded-[1.3rem] border border-white/8 bg-white/[0.03] p-4"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                        {spec.name}
                      </p>
                      <p className="mt-2 text-sm font-bold text-white">{spec.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <section className="mt-14 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2.2rem] border border-white/10 bg-[#11151d] p-7 shadow-[0_28px_70px_-40px_rgba(0,0,0,0.95)]">
            <div className="mb-6 flex items-center gap-3">
              <Gauge className="text-primary-400" size={20} />
              <h2 className="text-3xl font-black uppercase tracking-tight text-white">
                Performance Data
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {performanceCards.map((card, index) => (
                <div
                  key={`${card.title}-${index}`}
                  className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-5"
                >
                  <div className="inline-flex rounded-2xl bg-primary-500/12 p-3 text-primary-300">
                    {index % 2 === 0 ? <Sparkles size={18} /> : <BadgeCheck size={18} />}
                  </div>
                  <h3 className="mt-4 text-xl font-black text-white">{card.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{card.desc}</p>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-300"
                      style={{ width: `${82 - index * 8}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-white/10 bg-[#11151d] p-7 shadow-[0_28px_70px_-40px_rgba(0,0,0,0.95)]">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary-300">
                Product Details
              </p>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
                Deeper Product Info
              </h2>
            </div>

            <div className="overflow-hidden rounded-[1.7rem] border border-white/10">
              <div className="hide-scrollbar flex overflow-x-auto border-b border-white/10">
                {['description', 'specifications', 'reviews'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`min-w-[140px] flex-1 border-b-2 px-5 py-4 text-sm font-black uppercase tracking-[0.16em] transition-colors ${
                      activeTab === tab
                        ? 'border-primary-500 bg-primary-500/10 text-white'
                        : 'border-transparent bg-transparent text-slate-500 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'description' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
                    <p className="text-base leading-8 text-slate-300">{product.description}</p>
                    {productFeatures.length > 0 && (
                      <div className="mt-6">
                        <h4 className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-white">
                          Key Highlights
                        </h4>
                        <div className="space-y-3">
                          {productFeatures.map((feature, index) => (
                            <div key={`${feature}-${index}`} className="flex items-start gap-3">
                              <span className="mt-2 h-2 w-2 rounded-full bg-primary-500"></span>
                              <p className="text-sm leading-7 text-slate-400">{feature}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'specifications' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-2"
                  >
                    {productSpecifications.length > 0 ? (
                      productSpecifications.map((spec, index) => (
                        <div
                          key={`${spec.name}-${index}`}
                          className="flex items-center justify-between gap-6 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4"
                        >
                          <span className="text-sm font-medium text-slate-400">{spec.name}</span>
                          <span className="text-right text-sm font-bold text-white">{spec.value}</span>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-slate-500">
                        Specifications will appear here when the seller adds them.
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'reviews' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="py-6 text-center"
                  >
                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-400">
                      <Star size={32} className="fill-yellow-400" />
                    </div>
                    <h3 className="text-2xl font-black text-white">
                      {Number(product.rating || 0).toFixed(1)} out of 5
                    </h3>
                    <p className="mt-2 text-sm font-medium text-slate-400">
                      Based on {product.numReviews || 0} buyer reviews
                    </p>
                    <button className="btn-secondary mt-6 h-12 border-white/10 bg-white/[0.05] px-8 text-white">
                      Write a Review
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-14">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary-300">
                Customer Feedback
              </p>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
                The Verdict
              </h2>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {[
              {
                name: 'Rahul S.',
                role: 'Club Player',
                text: 'Premium finish, confident pickup, and a much cleaner feel in hand than most standard options I have used.',
              },
              {
                name: 'Arjun M.',
                role: 'Academy Mentor',
                text: 'The build quality stands out immediately. It feels dependable, balanced, and genuinely suited for serious use.',
              },
            ].map((review) => (
              <div
                key={review.name}
                className="rounded-[2rem] border border-white/10 bg-[#11151d] p-6 shadow-[0_24px_60px_-38px_rgba(0,0,0,0.95)]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.16em] text-white">
                      {review.name}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      {review.role}
                    </p>
                  </div>
                  <div className="flex gap-1 text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className="fill-yellow-400" />
                    ))}
                  </div>
                </div>
                <p className="mt-6 text-sm leading-7 text-slate-300">&quot;{review.text}&quot;</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductDetails;
