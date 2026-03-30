import { API_ORIGIN } from '../api/axios';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80';

const normalizeImagePath = (imagePath = '') => {
  const normalizedPath = String(imagePath).replace(/\\/g, '/').trim();

  if (!normalizedPath) {
    return normalizedPath;
  }

  if (/^https?:\/\//i.test(normalizedPath)) {
    return normalizedPath;
  }

  const uploadsIndex = normalizedPath.toLowerCase().lastIndexOf('/uploads/');

  if (uploadsIndex >= 0) {
    return normalizedPath.slice(uploadsIndex);
  }

  if (normalizedPath.toLowerCase().startsWith('uploads/')) {
    return `/${normalizedPath}`;
  }

  return normalizedPath;
};

export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return FALLBACK_IMAGE;
  }

  const normalizedPath = normalizeImagePath(imagePath);

  if (/^https?:\/\//i.test(normalizedPath)) {
    return normalizedPath;
  }

  if (normalizedPath.startsWith('/')) {
    return `${API_ORIGIN}${normalizedPath}`;
  }

  return `${API_ORIGIN}/${normalizedPath}`;
};

export const getPrimaryProductImage = (product) =>
  getImageUrl(product?.images?.[0] || product?.image);
