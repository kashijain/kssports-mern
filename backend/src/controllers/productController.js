import Product from '../models/Product.js';
import { hasCloudinaryConfig } from '../config/cloudinary.js';
import { uploadBufferToCloudinary } from '../utils/uploadToCloudinary.js';

const DEFAULT_PRODUCT_IMAGE = '/uploads/product-placeholder.png';

const normalizeImageValue = (filePath = '') => {
  const normalizedPath = String(filePath).replace(/\\/g, '/').trim();

  if (!normalizedPath) {
    return '';
  }

  if (/^https?:\/\//i.test(normalizedPath)) {
    return normalizedPath;
  }

  const uploadsIndex = normalizedPath.toLowerCase().lastIndexOf('/uploads/');

  if (uploadsIndex >= 0) {
    return normalizedPath.slice(uploadsIndex);
  }

  const fileName = normalizedPath.split('/').filter(Boolean).pop();
  return fileName ? `/uploads/${fileName}` : DEFAULT_PRODUCT_IMAGE;
};

const uploadIncomingFiles = async (req) => {
  if (req.files?.length) {
    if (!hasCloudinaryConfig()) {
      console.error('Product upload blocked: Cloudinary is not configured for permanent image storage');
      const error = new Error(
        'Cloudinary is not configured. Please add Cloudinary credentials for permanent product image storage.'
      );
      error.statusCode = 500;
      throw error;
    }

    const uploadedImages = await Promise.all(
      req.files.map((file) => uploadBufferToCloudinary(file))
    );

    return uploadedImages.filter(Boolean);
  }

  return [];
};

const getIncomingImages = (req) => {
  const bodyImages = [];

  if (Array.isArray(req.body.images)) {
    bodyImages.push(...req.body.images);
  }

  if (typeof req.body.images === 'string' && req.body.images.trim()) {
    try {
      const parsed = JSON.parse(req.body.images);
      if (Array.isArray(parsed)) {
        bodyImages.push(...parsed);
      }
    } catch {
      bodyImages.push(
        ...req.body.images
        .split(',')
        .map((image) => image.trim())
        .filter(Boolean)
      );
    }
  }

  if (typeof req.body.image === 'string' && req.body.image.trim()) {
    bodyImages.push(req.body.image.trim());
  }

  return bodyImages.filter(Boolean).map(normalizeImageValue);
};

const getIncomingSpecifications = (req) => {
  if (Array.isArray(req.body.specifications)) {
    return req.body.specifications
      .filter((item) => item?.name && item?.value)
      .map((item) => ({
        name: item.name.trim(),
        value: item.value.trim(),
      }));
  }

  if (typeof req.body.specifications === 'string' && req.body.specifications.trim()) {
    try {
      const parsed = JSON.parse(req.body.specifications);

      if (Array.isArray(parsed)) {
        return parsed
          .filter((item) => item?.name && item?.value)
          .map((item) => ({
            name: item.name.trim(),
            value: item.value.trim(),
          }));
      }
    } catch {
      return [];
    }
  }

  return [];
};

const getIncomingFeatures = (req) => {
  if (Array.isArray(req.body.features)) {
    return req.body.features
      .map((feature) => String(feature || '').trim())
      .filter(Boolean);
  }

  if (typeof req.body.features === 'string' && req.body.features.trim()) {
    try {
      const parsed = JSON.parse(req.body.features);

      if (Array.isArray(parsed)) {
        return parsed
          .map((feature) => String(feature || '').trim())
          .filter(Boolean);
      }
    } catch {
      return req.body.features
        .split(',')
        .map((feature) => feature.trim())
        .filter(Boolean);
    }
  }

  return [];
};

export const getProducts = async (req, res) => {
  const pageSize = Number(req.query.pageSize) || 50;
  const page = Number(req.query.pageNumber) || 1;

  const keyword = req.query.keyword
    ? {
        name: {
          $regex: req.query.keyword,
          $options: 'i',
        },
      }
    : {};

  const count = await Product.countDocuments(keyword);
  const products = await Product.find(keyword)
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    products,
    page,
    pages: Math.max(1, Math.ceil(count / pageSize)),
    totalProducts: count,
  });
};

export const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.json(product);
};

export const createProduct = async (req, res) => {
  const { name, price, brand, category, countInStock, description, codAvailable } = req.body;

  if (!name || !price || !brand || !category || !description) {
    res.status(400);
    throw new Error('Name, price, brand, category, and description are required');
  }

  const uploadedImages = await uploadIncomingFiles(req);
  const images = uploadedImages.length ? uploadedImages : getIncomingImages(req);
  const specifications = getIncomingSpecifications(req);
  const features = getIncomingFeatures(req);

  if (!images.length) {
    res.status(400);
    throw new Error('At least one product image is required');
  }

  const product = await Product.create({
    name: name.trim(),
    price: Number(price),
    user: req.user._id,
    image: images[0] || DEFAULT_PRODUCT_IMAGE,
    images,
    brand: brand.trim(),
    category: category.trim(),
    countInStock: Number(countInStock) || 0,
    codAvailable:
      codAvailable === true ||
      codAvailable === 'true' ||
      codAvailable === 'on',
    features,
    specifications,
    numReviews: 0,
    description: description.trim(),
  });

  res.status(201).json(product);
};

export const updateProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const uploadedImages = await uploadIncomingFiles(req);
  const incomingImages = uploadedImages.length ? uploadedImages : getIncomingImages(req);
  const featuresProvided = req.body.features !== undefined;
  const incomingFeatures = getIncomingFeatures(req);
  const specificationsProvided = req.body.specifications !== undefined;
  const incomingSpecifications = getIncomingSpecifications(req);
  const nextImages = incomingImages.length ? incomingImages : product.images;

  product.name = req.body.name?.trim() || product.name;
  product.price =
    req.body.price !== undefined ? Number(req.body.price) : product.price;
  product.description = req.body.description?.trim() || product.description;
  product.brand = req.body.brand?.trim() || product.brand;
  product.category = req.body.category?.trim() || product.category;
  product.countInStock =
    req.body.countInStock !== undefined
      ? Number(req.body.countInStock)
      : product.countInStock;
  product.codAvailable =
    req.body.codAvailable !== undefined
      ? req.body.codAvailable === true ||
        req.body.codAvailable === 'true' ||
        req.body.codAvailable === 'on'
      : product.codAvailable;
  product.features = featuresProvided ? incomingFeatures : product.features;
  product.specifications = specificationsProvided
    ? incomingSpecifications
    : product.specifications;
  product.images = nextImages;
  product.image = nextImages[0] || DEFAULT_PRODUCT_IMAGE;

  const updatedProduct = await product.save();
  res.json(updatedProduct);
};

export const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  await Product.deleteOne({ _id: product._id });
  res.json({ message: 'Product removed' });
};
