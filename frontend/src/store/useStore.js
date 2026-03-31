import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || fallback;

export const useCartStore = create(
  persist(
    (set, get) => ({
      cartItems: [],
      addToCart: (product, qty) => {
        const normalizedQty = Math.max(1, Number(qty) || 1);
        const item = { ...product, qty: normalizedQty };
        const existItem = get().cartItems.find((x) => x._id === item._id);

        if (existItem) {
          set({
            cartItems: get().cartItems.map((x) =>
              x._id === existItem._id ? item : x
            ),
          });
        } else {
          set({ cartItems: [...get().cartItems, item] });
        }
      },
      removeFromCart: (id) =>
        set({ cartItems: get().cartItems.filter((x) => x._id !== id) }),
      clearCart: () => set({ cartItems: [] }),
    }),
    {
      name: 'cart-storage',
    }
  )
);

export const useAuthStore = create(
  persist(
    (set) => ({
      userInfo: null,
      loading: false,
      error: null,
      authReady: false,

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const { data } = await api.post('/users/auth', { email, password });
          set({ userInfo: data, loading: false, authReady: true });
          return data;
        } catch (error) {
          const message = getErrorMessage(error, 'Login failed');
          set({ error: message, loading: false, authReady: true });
          throw new Error(message);
        }
      },

      register: async (name, email, password, role = 'customer', sellerSecret = '') => {
        set({ loading: true, error: null });
        try {
          const { data } = await api.post('/users', { name, email, password, role, sellerSecret });
          set({ userInfo: data, loading: false, authReady: true });
          return data;
        } catch (error) {
          const message = getErrorMessage(error, 'Registration failed');
          set({ error: message, loading: false, authReady: true });
          throw new Error(message);
        }
      },

      syncProfile: async () => {
        try {
          const { data } = await api.get('/users/profile');
          set((state) => ({
            userInfo: state.userInfo ? { ...state.userInfo, ...data } : data,
            authReady: true,
            error: null,
          }));
          return data;
        } catch (error) {
          set({ userInfo: null, authReady: true });
          throw error;
        }
      },

      hydrateAuth: async () => {
        set({ authReady: false });
        try {
          await useAuthStore.getState().syncProfile();
        } catch {
          set({ authReady: true });
        }
      },

      logout: async () => {
        try {
          await api.post('/users/logout');
        } finally {
          set({ userInfo: null, error: null, authReady: true });
        }
      },

      clearError: () => set({ error: null }),
      markHydrated: () => set({ authReady: true }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ userInfo: state.userInfo }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    }
  )
);

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light',
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'theme-storage',
    }
  )
);

export const useProductStore = create((set, get) => ({
  products: [],
  product: null,
  loading: false,
  error: null,

  fetchProducts: async (keyword = '') => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (keyword) {
        params.set('keyword', keyword);
      }

      const query = params.toString();
      const { data } = await api.get(`/products${query ? `?${query}` : ''}`);
      set({ products: data.products || [], loading: false });
      return data.products || [];
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to fetch products');
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  fetchProductById: async (id) => {
    set({ loading: true, error: null, product: null });
    try {
      const { data } = await api.get(`/products/${id}`);
      set({ product: data, loading: false });
      return data;
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to fetch product');
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  createProduct: async (productData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/products', productData);
      set({ products: [data, ...get().products], loading: false });
      return data;
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to create product');
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  updateProduct: async (id, productData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.put(`/products/${id}`, productData);
      set({
        products: get().products.map((p) => (p._id === id ? data : p)),
        product: data,
        loading: false,
      });
      return data;
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to update product');
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  deleteProduct: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/products/${id}`);
      set({ products: get().products.filter((p) => p._id !== id), loading: false });
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to delete product');
      set({ error: message, loading: false });
      throw new Error(message);
    }
  }
}));

export const useOrderStore = create((set, get) => ({
  orders: [],
  orderDetails: null,
  loading: false,
  error: null,

  createOrder: async (order) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/orders', order);
      set({ loading: false });
      return data;
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to create order');
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  fetchMyOrders: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/orders/myorders');
      set({ orders: data, loading: false });
      return data;
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to fetch orders');
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  fetchAllOrders: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/orders');
      set({ orders: data, loading: false });
      return data;
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to fetch all orders');
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  deliverOrder: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.put(`/orders/${id}/deliver`);
      set({ orders: get().orders.map((o) => o._id === id ? data : o), loading: false });
      return data;
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to mark order as delivered');
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  deleteOrder: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/orders/${id}`);
      set({ orders: get().orders.filter((o) => o._id !== id), loading: false });
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to delete order');
      set({ error: message, loading: false });
      throw new Error(message);
    }
  }
}));
