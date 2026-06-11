import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/product/ProductCard";
import {
  Search,
  SlidersHorizontal,
  Check,
  X,
  Filter,
  ChevronDown,
  Sparkles,
  Star,
  ArrowRight,
  Camera,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useProductStore } from "../store/useStore";
import VisualSearchModal from "../components/product/VisualSearchModal";
import { Helmet } from "react-helmet-async";

const categoryOptions = [
  { label: "All", values: ["All"] },
  { label: "Bats", values: ["Bats", "Bat"] },
  { label: "Balls", values: ["Balls", "Ball"] },
  { label: "Accessories", values: ["Accessories", "Accessory", "other"] },
  { label: "Gloves", values: ["Gloves", "Glove"] },
  { label: "Shoes", values: ["Shoes", "Shoe", "Footwear"] },
  { label: "Gear", values: ["Kits", "Kit", "Gear"] },
];

const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "name", label: "Name: A to Z" },
];

const featuredLabelByIndex = ["Best Seller", "Featured", "", "New Arrival"];

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [sortBy, setSortBy] = useState("featured");
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(15000);

  const [isVisualSearchModalOpen, setIsVisualSearchModalOpen] = useState(false);

  const {
    products,
    loading,
    fetchProducts,
    searchTerm,
    setSearchTerm,
    visualSearchResults,
    isVisualSearchActive,
    visualSearchLoading,
    uploadedImagePreview,
    clearVisualSearch,
  } = useProductStore();

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (typeof fetchProducts === "function") {
        fetchProducts(searchTerm).catch(() => {});
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, fetchProducts]);

  useEffect(() => {
    setCategory(searchParams.get("category") || "All");
  }, [searchParams]);

  const triggerLocalLoading = () => {
    setLocalLoading(true);
    setTimeout(() => setLocalLoading(false), 250);
  };

  const handleCategoryChange = (selectedCategory) => {
    triggerLocalLoading();
    setCategory(selectedCategory);
    if (selectedCategory === "All") {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("category");
      setSearchParams(nextParams);
      return;
    }

    setSearchParams({ category: selectedCategory });
  };

  const handleSearchChange = (e) => {
    triggerLocalLoading();
    setSearchTerm(e.target.value);
  };

  const clearFilters = () => {
    triggerLocalLoading();
    setSearchTerm("");
    setCategory("All");
    setSortBy("featured");
    setMinRating(0);
    setMaxPrice(highestPrice);
    setShowMobileFilters(false);
    setSearchParams({});
    clearVisualSearch();
  };

  const safeProducts = useMemo(() => {
    return Array.isArray(products) ? products : [];
  }, [products]);

  const highestPrice = useMemo(() => {
    const sourceProducts = isVisualSearchActive ? visualSearchResults : safeProducts;
    const maxProductPrice = sourceProducts.reduce(
      (max, product) => Math.max(max, Number(product?.price || 0)),
      0
    );
    return Math.max(15000, Math.ceil(maxProductPrice / 500) * 500 || 15000);
  }, [safeProducts, visualSearchResults, isVisualSearchActive]);

  useEffect(() => {
    setMaxPrice(highestPrice);
  }, [highestPrice]);

  const filteredProducts = useMemo(() => {
    const activeCategory = categoryOptions.find((item) => item.label === category);
    const sourceProducts = isVisualSearchActive ? visualSearchResults : safeProducts;

    const nextProducts = sourceProducts.filter((product) => {
      const productCategory = String(product?.category || "").toLowerCase();

      const matchCategory =
        !activeCategory ||
        category === "All" ||
        activeCategory.values.some((value) => productCategory === String(value).toLowerCase());
      const matchPrice = Number(product?.price || 0) <= maxPrice;
      const matchRating = Number(product?.rating || 0) >= minRating;
      const matchSimilarity = !isVisualSearchActive || (product?.similarity || 0) >= 50;

      return matchCategory && matchPrice && matchRating && matchSimilarity;
    });

    return [...nextProducts].sort((a, b) => {
      if (isVisualSearchActive && sortBy === "featured") {
        return Number(b?.similarity || 0) - Number(a?.similarity || 0);
      }
      if (sortBy === "price-low") return Number(a?.price || 0) - Number(b?.price || 0);
      if (sortBy === "price-high") return Number(b?.price || 0) - Number(a?.price || 0);
      if (sortBy === "rating") return Number(b?.rating || 0) - Number(a?.rating || 0);
      if (sortBy === "name") return String(a?.name || "").localeCompare(String(b?.name || ""));
      return 0;
    });
  }, [safeProducts, visualSearchResults, isVisualSearchActive, category, maxPrice, minRating, sortBy]);

  const isDataLoading = loading || localLoading || visualSearchLoading;

  const hasLowConfidence = useMemo(() => {
    if (!isVisualSearchActive) return false;
    if (visualSearchResults.length === 0) return true;
    const maxScore = Math.max(...visualSearchResults.map(p => p.similarity || 0));
    return maxScore < 55;
  }, [isVisualSearchActive, visualSearchResults]);

  const hasActiveFilters =
    searchTerm || category !== "All" || minRating > 0 || maxPrice < highestPrice || sortBy !== "featured";

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      <Helmet>
        <title>Shop Premium Sports Gear - K.S. Sports</title>
        <meta name="description" content="Browse our premium selection of sports goods. Filter by category, price, and rating to find the perfect gear for your match or practice session." />
        <link rel="canonical" href="https://kssports-mern-96j7.vercel.app/shop" />
        <meta property="og:title" content="Shop Premium Sports Gear - K.S. Sports" />
        <meta property="og:description" content="Browse our premium selection of sports goods. Filter by category, price, and rating to find the perfect gear for your match or practice session." />
        <meta property="og:url" content="https://kssports-mern-96j7.vercel.app/shop" />
      </Helmet>
      <div className="container-bound pt-8">
        <div className="relative mb-12 overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#0c1017] px-6 py-16 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.9)] md:px-10 md:py-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_24%),linear-gradient(180deg,rgba(2,6,23,0),rgba(2,6,23,0.55))]"></div>
          <div className="absolute inset-0 opacity-20">
            <img
              src="https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80"
              alt="K.S. Sports collection backdrop"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-bold uppercase tracking-[0.26em] text-primary-300 backdrop-blur-xl">
              <Sparkles size={14} />
              Performance Collection
            </div>
            <h1 className="max-w-4xl text-4xl font-black uppercase tracking-tight text-white md:text-6xl">
              Premium Cricket & Sports Gear
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Explore the full K.S. Sports collection with premium gear for match day, training, recovery, and every serious upgrade in between.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-slate-400">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2">
                <span className="h-2 w-2 rounded-full bg-primary-500"></span>
                Premium athletic goods
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2">
                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                Trusted by serious players
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container-bound">
        <div className="flex flex-col gap-10 lg:flex-row">
          <div className="hidden space-y-6 lg:block lg:w-[300px]">
            {/* Search Box */}
            <div className="rounded-[2rem] border border-white/10 bg-[#11151d] p-6 shadow-[0_24px_70px_-38px_rgba(0,0,0,0.9)]">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-white">
                <Search size={16} className="text-primary-500" /> Search Catalog
              </h3>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Search premium gear..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="input-premium h-12 w-full border-white/10 bg-white/[0.05] pl-11 pr-20 text-white placeholder:text-slate-500 focus:border-primary-600 focus:ring-primary-600/20"
                />

                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />

                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerLocalLoading();
                        setSearchTerm("");
                      }}
                      className="rounded-full bg-white/[0.06] p-1 text-slate-400 transition-colors hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsVisualSearchModalOpen(true)}
                    className="rounded-full bg-white/[0.06] p-1.5 text-slate-400 transition-colors hover:bg-primary-600 hover:text-white"
                    title="Search by image"
                  >
                    <Camera size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div className="rounded-[2rem] border border-white/10 bg-[#11151d] p-6 shadow-[0_24px_70px_-38px_rgba(0,0,0,0.9)]">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-white">
                <Filter size={16} className="text-primary-500" /> Category
              </h3>

              <ul className="space-y-2">
                {categoryOptions.map((item) => (
                  <li key={item.label}>
                    <button
                      type="button"
                      onClick={() => handleCategoryChange(item.label)}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left font-medium transition-all duration-300 ${
                        category === item.label
                          ? "border-primary-500/40 bg-primary-600/12 text-white"
                          : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      <span>{item.label}</span>
                      {category === item.label && <Check size={18} className="text-primary-400" />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#11151d] p-6 shadow-[0_24px_70px_-38px_rgba(0,0,0,0.9)]">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-white">Price Range</h3>
              <input
                type="range"
                min="0"
                max={highestPrice}
                step="500"
                value={maxPrice}
                onChange={(e) => {
                  triggerLocalLoading();
                  setMaxPrice(Number(e.target.value));
                }}
                className="h-2 w-full cursor-pointer accent-primary-500"
              />
              <div className="mt-4 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                <span>Rs. 0</span>
                <span>Rs. {maxPrice.toLocaleString()}</span>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#11151d] p-6 shadow-[0_24px_70px_-38px_rgba(0,0,0,0.9)]">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-white">Minimum Rating</h3>
              <div className="space-y-2">
                {[0, 3, 4].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      triggerLocalLoading();
                      setMinRating(value);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                      minRating === value
                        ? "border-primary-500/40 bg-primary-600/12 text-white"
                        : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <span>{value === 0 ? "All Ratings" : `${value} Stars & Up`}</span>
                    <div className="flex gap-1 text-yellow-400">
                      {[...Array(value || 5)].map((_, idx) => (
                        <Star key={idx} size={12} className="fill-yellow-400" />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-primary-500/20 bg-[linear-gradient(180deg,rgba(220,38,38,0.16),rgba(14,20,30,0.85))] p-6 shadow-[0_24px_70px_-38px_rgba(220,38,38,0.4)]">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary-300">Pro Feature</p>
              <h3 className="mt-4 text-2xl font-black text-white">Built for match-ready confidence.</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Use filters to narrow by category, set a tighter price cap, and surface higher-rated picks faster.
              </p>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="w-full rounded-xl border border-white/10 py-3 text-sm font-bold uppercase tracking-[0.18em] text-red-400 transition-colors hover:bg-red-500/10"
              >
                Clear All Filters
              </button>
            )}
          </div>

          {/* Mobile Filter Toggle */}
          <div className="mb-6 flex flex-col gap-4 lg:hidden">
            <div className="flex justify-between items-center gap-4">
              <button
                type="button"
                onClick={() => setShowMobileFilters((prev) => !prev)}
                className="btn-secondary h-12 flex-1 border-white/10 bg-white/[0.05] text-white"
              >
                <SlidersHorizontal size={18} />
                Filters
                {hasActiveFilters && (
                  <span className="w-2.5 h-2.5 rounded-full bg-primary-600 shadow-sm shadow-primary-600/50"></span>
                )}
              </button>

              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="input-premium h-12 w-full border-white/10 bg-white/[0.05] pl-10 pr-20 text-white placeholder:text-slate-500"
                />
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerLocalLoading();
                        setSearchTerm("");
                      }}
                      className="rounded-full bg-white/[0.06] p-1.5 text-slate-400 transition-colors hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsVisualSearchModalOpen(true)}
                    className="rounded-full bg-white/[0.06] p-1.5 text-slate-400 transition-colors hover:bg-primary-600 hover:text-white"
                    title="Search by image"
                  >
                    <Camera size={15} />
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {showMobileFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-[1.6rem] border border-white/10 bg-[#11151d] p-5">
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-white">
                      Categories
                    </h3>

                    <div className="flex flex-wrap gap-2">
                      {categoryOptions.map((item) => (
                        <button
                          type="button"
                          key={item.label}
                          onClick={() => {
                            handleCategoryChange(item.label);
                            setShowMobileFilters(false);
                          }}
                          className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-colors ${
                            category === item.label
                              ? "bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-600/20"
                              : "bg-transparent text-slate-300 border-white/10 hover:border-primary-600"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <div className="mt-5">
                      <label className="mb-3 block text-sm font-bold uppercase tracking-[0.18em] text-white">
                        Sort By
                      </label>
                      <div className="relative">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="input-premium h-12 w-full appearance-none border-white/10 bg-white/[0.05] pr-10 text-white"
                        >
                          {sortOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Product Grid */}
          <div className="lg:flex-1">
            {isVisualSearchActive && (
              <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-emerald-500/20 bg-emerald-950/15 p-5 shadow-[0_20px_50px_rgba(16,185,129,0.06)] md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  {uploadedImagePreview && (
                    <div className="h-16 w-16 overflow-hidden rounded-xl border border-white/10 bg-[#0a0d13]">
                      <img
                        src={uploadedImagePreview}
                        alt="Uploaded preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-black uppercase tracking-wide text-emerald-400">
                      Visual Search Results
                    </h3>
                    <p className="text-xs text-slate-400">
                      Showing products matched using CLIP vision AI, sorted by similarity.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => clearVisualSearch()}
                  className="btn-secondary h-11 border-emerald-500/30 bg-emerald-500/5 px-5 text-xs font-bold uppercase tracking-wider text-emerald-400 hover:bg-emerald-600 hover:text-white"
                >
                  Clear Visual Search
                </button>
              </div>
            )}

            <div className="mb-8 flex flex-col gap-5 rounded-[2rem] border border-white/10 bg-[#11151d] p-6 shadow-[0_24px_70px_-38px_rgba(0,0,0,0.9)] xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                {category === "All" ? "All Products" : category}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Discover premium picks curated for players who want sharper performance and cleaner design.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative min-w-[220px]">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="input-premium h-12 w-full appearance-none border-white/10 bg-white/[0.05] pr-10 text-white"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>

                <p className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-slate-400 shadow-sm">
                  <span className="font-bold text-white">
                  {isDataLoading ? "..." : filteredProducts.length}
                </span>{" "}
                  Results
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {isDataLoading ? (
                [...Array(6)].map((_, i) => (
                  <div
                    key={`skel-${i}`}
                    className="h-[520px] rounded-[2rem] border border-white/10 bg-white/[0.05] animate-pulse"
                  />
                ))
              ) : hasLowConfidence ? (
                <div className="col-span-full rounded-[2rem] border border-white/10 bg-[#11151d] px-6 py-14 text-center shadow-[0_24px_70px_-38px_rgba(0,0,0,0.9)]">
                  <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search size={32} className="text-primary-600" />
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-2">
                    No similar products found
                  </h2>

                  <p className="text-slate-400 max-w-md mx-auto mb-8">
                    The uploaded image did not match any products in our catalog with sufficient confidence.
                  </p>

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="btn-primary inline-flex px-8 h-12"
                  >
                    Clear Visual Search
                  </button>
                </div>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product, index) => (
                  <motion.div
                    key={product?._id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: index * 0.03 }}
                    className="h-full"
                  >
                    <ProductCard
                      product={product}
                      variant="shop"
                      badgeLabel={featuredLabelByIndex[index % featuredLabelByIndex.length]}
                    />
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full rounded-[2rem] border border-white/10 bg-[#11151d] px-6 py-14 text-center shadow-[0_24px_70px_-38px_rgba(0,0,0,0.9)]">
                  <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search size={32} className="text-primary-600" />
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-2">
                    No products found
                  </h2>

                  <p className="text-slate-400 max-w-md mx-auto mb-8">
                    We couldn't find any products matching your current filters
                    or search term{" "}
                    <span className="font-bold text-slate-200">
                      "{searchTerm}"
                    </span>
                    .
                  </p>

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="btn-primary inline-flex px-8 h-12"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>

            <div className="mt-14 flex justify-center">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-slate-400">
                More premium gear is added regularly
                <ArrowRight size={16} className="text-primary-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <VisualSearchModal
        isOpen={isVisualSearchModalOpen}
        onClose={() => setIsVisualSearchModalOpen(false)}
      />
    </div>
  );
};

export default Shop;
