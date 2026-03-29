import { API_ORIGIN } from '../api/axios';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80';

export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return FALLBACK_IMAGE;
  }

  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  if (imagePath.startsWith('/')) {
    return `${API_ORIGIN}${imagePath}`;
  }

  return `${API_ORIGIN}/${imagePath}`;
};

export const getPrimaryProductImage = (product) =>
  getImageUrl(product?.images?.[0] || product?.image);
