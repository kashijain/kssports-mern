import Product from '../models/Product.js';

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;

  const keyword = req.query.keyword
    ? {
        name: {
          $regex: req.query.keyword,
          $options: 'i',
        },
      }
    : {};

  const count = await Product.countDocuments({ ...keyword });
  const products = await Product.find({ ...keyword })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ products, page, pages: Math.ceil(count / pageSize) });
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  console.log('\n--- CREATE PRODUCT CONTROLLER DEBUG ---');
  console.log('Req Files Exist:', !!req.files, 'Count:', req.files ? req.files.length : 0);
  console.log('Req Body Keys:', Object.keys(req.body));
  console.log('Req User Role:', req.user ? req.user.role : 'NO USER');

  const { name, price, brand, category, countInStock, description, codAvailable } = req.body;

  const productPrice = parseFloat(price) || 0;
  const stockCount = parseInt(countInStock, 10) || 0;
  const isCod = codAvailable === 'true';

  let imagePath = '/images/sample.jpg'; // fallback
  let imagesPaths = [];

  if (req.files && req.files.length > 0) {
    // Process array of files
    imagesPaths = req.files.map(file => `/${file.path.replace(/\\/g, '/')}`);
    imagePath = imagesPaths[0]; // Retain primary image string backwards compatibility
  } else if (req.body.image) {
    imagePath = req.body.image; 
    imagesPaths = [req.body.image];
  }

  const product = new Product({
    name: name || 'Sample name',
    price: productPrice,
    user: req.user._id,
    image: imagePath,
    images: imagesPaths,
    brand: brand || 'Sample brand',
    category: category || 'Sample category',
    countInStock: stockCount,
    codAvailable: isCod,
    numReviews: 0,
    description: description || 'Sample description',
  });

  try {
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(400).json({ message: 'Invalid product data', error: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  const { name, price, description, image, brand, category, countInStock } =
    req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    product.name = name;
    product.price = price;
    product.description = description;
    product.image = image;
    product.brand = brand;
    product.category = category;
    product.countInStock = countInStock;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    await Product.deleteOne({ _id: product._id });
    res.json({ message: 'Product removed' });
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
};
