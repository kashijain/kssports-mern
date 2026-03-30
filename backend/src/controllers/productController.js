import Product from '../models/Product.js';

const DEFAULT_PRODUCT_IMAGE = '/uploads/product-placeholder.png';

const normalizeUploadPath = (filePath = '') =>
  `/${filePath.replace(/\\/g, '/').replace(/^\/+/, '')}`;

const getIncomingImages = (req) => {
  if (req.files?.length) {
    return req.files.map((file) => normalizeUploadPath(file.path));
  }

  if (Array.isArray(req.body.images)) {
    return req.body.images.filter(Boolean);
  }

  if (typeof req.body.images === 'string' && req.body.images.trim()) {
    try {
      const parsed = JSON.parse(req.body.images);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }
    } catch {
      return req.body.images
        .split(',')
        .map((image) => image.trim())
        .filter(Boolean);
    }
  }

  if (typeof req.body.image === 'string' && req.body.image.trim()) {
    return [req.body.image.trim()];
  }

  return [];
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

  const images = getIncomingImages(req);
  const specifications = getIncomingSpecifications(req);

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

  const incomingImages = getIncomingImages(req);
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
