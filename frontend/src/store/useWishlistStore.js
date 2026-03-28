import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      wishlistItems: [],
      addToWishlist: (product) => {
        const existItem = get().wishlistItems.find((x) => x._id === product._id);
        if (!existItem) {
          set({ wishlistItems: [...get().wishlistItems, product] });
        }
      },
      removeFromWishlist: (id) =>
        set({ wishlistItems: get().wishlistItems.filter((x) => x._id !== id) }),
      clearWishlist: () => set({ wishlistItems: [] }),
    }),
    {
      name: 'wishlist-storage',
    }
  )
);
