import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

export const useCartStore = create(
  persist(
    (set, get) => ({
      cartItems: [],
      addToCart: (product, qty) => {
        const item = { ...product, qty };
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

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const { data } = await api.post('/users/auth', { email, password });
          set({ userInfo: data, loading: false });
          return data;
        } catch (error) {
          set({ error: error.response?.data?.message || 'Login failed', loading: false });
          throw error;
        }
      },

      register: async (name, email, password, role = 'customer', sellerSecret = '') => {
        set({ loading: true, error: null });
        try {
          const { data } = await api.post('/users', { name, email, password, role, sellerSecret });
          set({ userInfo: data, loading: false });
          return data;
        } catch (error) {
          set({ error: error.response?.data?.message || 'Registration failed', loading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.post('/users/logout');
          set({ userInfo: null });
        } catch (error) {
          console.error("Logout error:", error);
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ userInfo: state.userInfo }),
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
      const { data } = await api.get(`/products${keyword ? `?keyword=${keyword}` : ''}`);
      set({ products: data.products || data, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch products', loading: false });
    }
  },

  fetchProductById: async (id) => {
    set({ loading: true, error: null, product: null });
    try {
      const { data } = await api.get(`/products/${id}`);
      set({ product: data, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch product', loading: false });
    }
  },

  createProduct: async (productData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/products', productData);
      set({ products: [...get().products, data], loading: false });
      return data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to create product', loading: false });
      throw error;
    }
  },

  updateProduct: async (id, productData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.put(`/products/${id}`, productData);
      set({ products: get().products.map(p => p._id === id ? data : p), loading: false });
      return data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to update product', loading: false });
      throw error;
    }
  },

  deleteProduct: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/products/${id}`);
      set({ products: get().products.filter(p => p._id !== id), loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to delete product', loading: false });
      throw error;
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
      set({ error: error.response?.data?.message || 'Failed to create order', loading: false });
      throw error;
    }
  },

  fetchMyOrders: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/orders/myorders');
      set({ orders: data, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch orders', loading: false });
    }
  },

  fetchAllOrders: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/orders');
      set({ orders: data, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch all orders', loading: false });
    }
  },

  deliverOrder: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.put(`/orders/${id}/deliver`);
      set({ orders: get().orders.map(o => o._id === id ? data : o), loading: false });
      return data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to mark order as delivered', loading: false });
      throw error;
    }
  }
}));