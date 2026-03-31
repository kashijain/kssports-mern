import Product from '../models/Product.js';
import { hasCloudinaryConfig } from '../config/cloudinary.js';
import { uploadBufferToCloudinary } from '../utils/uploadToCloudinary.js';

const DEFAULT_PRODUCT_IMAGE = '/uploads/product-placeholder.png';
const CATEGORY_DETAIL_TEMPLATES = {
  Bat: {
    description: (name) =>
      `${name} is designed for dependable stroke play with a balanced pickup, responsive blade feel, and comfortable grip for regular match and practice sessions.`,
    features: [
      'Balanced pickup for controlled shots',
      'Comfortable grip for longer sessions',
      'Durable blade profile for regular use',
      'Suitable for net practice and match play',
    ],
    specifications: [
      { name: 'Weight', value: 'Light to Medium' },
      { name: 'Willow Type', value: 'Premium Sports Willow' },
      { name: 'Grip Type', value: 'Comfort Grip' },
      { name: 'Bat Size', value: 'Standard' },
    ],
  },
  Ball: {
    description: (name) =>
      `${name} is built for reliable performance, consistent bounce, and durable day-to-day use across training sessions, casual play, and competitive matches.`,
    features: [
      'Consistent bounce and feel',
      'Durable construction for repeated use',
      'Suitable for training and match play',
      'Easy handling and control',
    ],
    specifications: [
      { name: 'Weight', value: 'Standard Match Weight' },
      { name: 'Material', value: 'Durable Composite' },
      { name: 'Type', value: 'Practice / Match Use' },
      { name: 'Color', value: 'Standard' },
    ],
  },
  Gloves: {
    description: (name) =>
      `${name} offers a secure fit, comfortable feel, and dependable protection for players who need grip, flexibility, and all-session comfort.`,
    features: [
      'Secure fit with flexible feel',
      'Comfortable inner lining',
      'Reliable grip support',
      'Suitable for extended playing sessions',
    ],
    specifications: [
      { name: 'Size', value: 'Standard' },
      { name: 'Material', value: 'Synthetic Blend' },
      { name: 'Hand Type', value: 'Multi-fit' },
      { name: 'Padding Type', value: 'Comfort Padding' },
    ],
  },
  Accessories: {
    description: (name) =>
      `${name} is a practical sports accessory designed for everyday convenience, reliable durability, and easy use during training or match preparation.`,
    features: [
      'Useful for daily sports routines',
      'Durable build for repeated use',
      'Lightweight and easy to carry',
      'Suitable for training and match support',
    ],
    specifications: [
      { name: 'Size', value: 'Standard' },
      { name: 'Material', value: 'Durable Utility Material' },
      { name: 'Color', value: 'Standard Assorted' },
      { name: 'Quantity', value: '1 Unit' },
    ],
  },
  Sleeves: {
    description: (name) =>
      `${name} is designed for comfort, stretch, and reliable coverage, making it a useful addition for training, outdoor play, and regular sports use.`,
    features: [
      'Stretchable and comfortable fit',
      'Breathable feel for active use',
      'Lightweight for daily wear',
      'Suitable for training and outdoor sessions',
    ],
    specifications: [
      { name: 'Size', value: 'Free / Standard' },
      { name: 'Fabric', value: 'Stretch Performance Fabric' },
      { name: 'Color', value: 'Standard' },
      { name: 'Stretch Type', value: 'Flexible Fit' },
    ],
  },
  Shaker: {
    description: (name) =>
      `${name} is built for convenience and durability, making it easy to mix drinks quickly and carry as part of a daily fitness or training routine.`,
    features: [
      'Easy to carry and use',
      'Leak-resistant practical design',
      'Durable body for regular use',
      'Ideal for gym and sports routines',
    ],
    specifications: [
      { name: 'Capacity', value: 'Standard' },
      { name: 'Material', value: 'Food-grade Plastic' },
      { name: 'Color', value: 'Standard' },
      { name: 'Lid Type', value: 'Secure Flip / Screw Lid' },
    ],
  },
  Other: {
    description: (name) =>
      `${name} is a dependable sports product designed for practical daily use, solid durability, and easy integration into training or match-day routines.`,
    features: [
      'Practical for daily use',
      'Durable construction',
      'Easy to handle and maintain',
      'Suitable for regular sports use',
    ],
    specifications: [
      { name: 'Material', value: 'Standard Durable Material' },
      { name: 'Color', value: 'Standard' },
      { name: 'Size', value: 'Standard' },
      { name: 'Usage', value: 'Training / Regular Use' },
    ],
  },
};

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

const normalizeGeneratedText = (value = '') =>
  String(value || '').trim().replace(/\s+/g, ' ');

const getCategoryTemplate = (category = '') =>
  CATEGORY_DETAIL_TEMPLATES[normalizeGeneratedText(category)] ||
  CATEGORY_DETAIL_TEMPLATES.Other;

export const generateProductDetails = async (req, res) => {
  const name = normalizeGeneratedText(req.body.name);
  const category = normalizeGeneratedText(req.body.category);

  if (!name || !category) {
    res.status(400);
    throw new Error('Product name and category are required');
  }

  const template = getCategoryTemplate(category);

  res.json({
    description: template.description(name),
    features: template.features,
    specifications: template.specifications,
  });
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
