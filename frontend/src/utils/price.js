export const formatPrice = (price) =>
  `₹${Number(price || 0).toLocaleString('en-IN')}`;
