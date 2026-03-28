import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    try {
      const authStorage = localStorage.getItem('auth-storage');

      if (authStorage) {
        const parsedData = JSON.parse(authStorage);
        const token = parsedData?.state?.userInfo?.token;

        if (token) {
          if (config.headers && typeof config.headers.set === 'function') {
             config.headers.set('Authorization', `Bearer ${token}`);
          } else {
             config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
          }
        }
      }
    } catch (e) {
      console.error('Error parsing auth token', e);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;