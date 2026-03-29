import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const normalizedApiUrl = rawApiUrl.replace(/\/+$/, '').endsWith('/api')
  ? rawApiUrl.replace(/\/+$/, '')
  : `${rawApiUrl.replace(/\/+$/, '')}/api`;
export const API_BASE_URL = normalizedApiUrl;
export const API_ORIGIN = normalizedApiUrl.replace(/\/api$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
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
