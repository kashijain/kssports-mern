import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const normalizeWishlistProduct = (product = {}) => ({
  _id: product._id,
  name: product.name || '',
  brand: product.brand || '',
  category: product.category || '',
  price: Number(product.price || 0),
  image: product.image || '',
  images: Array.isArray(product.images) ? product.images.filter(Boolean) : [],
  countInStock: Number(product.countInStock || 0),
  rating: Number(product.rating || 0),
  numReviews: Number(product.numReviews || 0),
  codAvailable: product.codAvailable !== false,
  description: product.description || '',
  features: Array.isArray(product.features) ? product.features : [],
  specifications: Array.isArray(product.specifications) ? product.specifications : [],
});

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      wishlistItems: [],
      isWishlisted: (productId) =>
        get().wishlistItems.some((item) => item._id === productId),
      addToWishlist: (product) => {
        if (!product?._id) {
          return false;
        }

        const existItem = get().wishlistItems.find((x) => x._id === product._id);

        if (existItem) {
          return false;
        }

        const wishlistProduct = normalizeWishlistProduct(product);
        set({ wishlistItems: [wishlistProduct, ...get().wishlistItems] });
        return true;
      },
      removeFromWishlist: (id) => {
        const exists = get().wishlistItems.some((item) => item._id === id);

        if (!exists) {
          return false;
        }

        set({ wishlistItems: get().wishlistItems.filter((x) => x._id !== id) });
        return true;
      },
      toggleWishlist: (product) => {
        if (!product?._id) {
          return { added: false, removed: false };
        }

        if (get().isWishlisted(product._id)) {
          get().removeFromWishlist(product._id);
          return { added: false, removed: true };
        }

        get().addToWishlist(product);
        return { added: true, removed: false };
      },
      clearWishlist: () => set({ wishlistItems: [] }),
    }),
    {
      name: 'wishlist-storage',
      partialize: (state) => ({ wishlistItems: state.wishlistItems }),
    }
  )
);
