import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/product/ProductCard";
import {
  Search,
  SlidersHorizontal,
  Check,
  X,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useProductStore } from "../store/useStore";

const Shop = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  const { products, loading, fetchProducts } = useProductStore();

  const categories = ["All", "Bats", "Ball", "Shoes", "Kits","others"];

  useEffect(() => {
    if (typeof fetchProducts === "function") {
      fetchProducts().catch(() => {});
    }
  }, [fetchProducts]);

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
    setShowMobileFilters(false);
    setSearchParams({});
  };

  const safeProducts = useMemo(() => {
    return Array.isArray(products) ? products : [];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return safeProducts.filter((product) => {
      const productName = String(product?.name || "").toLowerCase();
      const productCategory = String(product?.category || "").toLowerCase();
      const normalizedSearch = searchTerm.toLowerCase();
      const normalizedCategory = category.toLowerCase();

      const matchSearch = productName.includes(normalizedSearch);
      const matchCategory =
        category === "All" || productCategory === normalizedCategory;

      return matchSearch && matchCategory;
    });
  }, [safeProducts, searchTerm, category]);

  const isDataLoading = loading || localLoading;

  return (
    <div className="bg-slate-50 dark:bg-dark-bg min-h-screen pt-24 pb-24">
      {/* Page Header */}
      <div className="bg-white dark:bg-dark-card border-y border-slate-200 dark:border-dark-border py-12 md:py-16 mb-12 shadow-sm">
        <div className="container-bound flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Premium <span className="text-gradient">Collections</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
            Browse our complete catalog of professional-grade sports equipment.
            Filter by category or search directly for your next upgrade.
          </p>
        </div>
      </div>

      <div className="container-bound">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar / Filters */}
          <div className="lg:w-1/4 hidden lg:block space-y-8">
            {/* Search Box */}
            <div className="bg-white dark:bg-dark-card rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-dark-border">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
                <Search size={16} className="text-primary-600" /> Search Catalog
              </h3>

              <div className="relative">
                <input
                  type="text"
                  placeholder="E.g., Cricket Bat..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="input-premium w-full pl-11 pr-10 h-12 bg-slate-50 border-slate-200 focus:border-primary-600 focus:ring-primary-600/20"
                />

                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />

                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerLocalLoading();
                      setSearchTerm("");
                    }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors bg-slate-100 dark:bg-gray-800 rounded-full p-1"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div className="bg-white dark:bg-dark-card rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-dark-border">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
                <Filter size={16} className="text-primary-600" /> Categories
              </h3>

              <ul className="space-y-2">
                {categories.map((item) => (
                  <li key={item}>
                    <button
                      type="button"
                      onClick={() => handleCategoryChange(item)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                        category === item
                          ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 shadow-sm border border-primary-200 dark:border-primary-900/50"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-bg border border-transparent hover:border-slate-200 dark:hover:border-gray-800"
                      }`}
                    >
                      <span>{item}</span>
                      {category === item && (
                        <Check
                          size={18}
                          className="text-primary-600 dark:text-primary-400"
                        />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {(searchTerm || category !== "All") && (
              <button
                type="button"
                onClick={clearFilters}
                className="w-full py-3 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors text-sm uppercase tracking-wider"
              >
                Clear All Filters
              </button>
            )}
          </div>

          {/* Mobile Filter Toggle */}
          <div className="lg:hidden flex flex-col gap-4 mb-6">
            <div className="flex justify-between items-center gap-4">
              <button
                type="button"
                onClick={() => setShowMobileFilters((prev) => !prev)}
                className="btn-secondary flex-1 border-slate-200 dark:border-dark-border h-12"
              >
                <SlidersHorizontal size={18} />
                Filters
                {category !== "All" && (
                  <span className="w-2.5 h-2.5 rounded-full bg-primary-600 shadow-sm shadow-primary-600/50"></span>
                )}
              </button>

              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="input-premium w-full pl-10 h-12"
                />
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
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
                  <div className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-slate-100 dark:border-dark-border shadow-sm">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-sm uppercase tracking-wider">
                      Categories
                    </h3>

                    <div className="flex flex-wrap gap-2">
                      {categories.map((item) => (
                        <button
                          type="button"
                          key={item}
                          onClick={() => {
                            handleCategoryChange(item);
                            setShowMobileFilters(false);
                          }}
                          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors border ${
                            category === item
                              ? "bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-600/20"
                              : "bg-transparent text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-border hover:border-primary-600"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Product Grid */}
          <div className="lg:w-3/4">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-dark-border">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {category === "All" ? "All Products" : category}
              </h2>

              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm bg-white dark:bg-dark-card px-4 py-2 rounded-full border border-slate-200 dark:border-dark-border shadow-sm">
                <span className="font-bold text-slate-900 dark:text-white">
                  {isDataLoading ? "..." : filteredProducts.length}
                </span>{" "}
                Results
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {isDataLoading ? (
                [...Array(6)].map((_, i) => (
                  <div
                    key={`skel-${i}`}
                    className="h-[400px] bg-white dark:bg-dark-card rounded-2xl animate-pulse shadow-sm border border-slate-100 dark:border-dark-border"
                  />
                ))
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product, index) => (
                  <motion.div
                    key={product?._id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: index * 0.03 }}
                    className="h-full"
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-24 text-center bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-dark-border border-dashed shadow-sm">
                  <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search size={32} className="text-primary-600" />
                  </div>

                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    No products found
                  </h2>

                  <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
                    We couldn't find any products matching your current filters
                    or search term{" "}
                    <span className="font-bold text-slate-700 dark:text-slate-300">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
