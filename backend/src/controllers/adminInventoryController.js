import multer from 'multer';
import XLSX from 'xlsx';
import Product from '../models/Product.js';
import OfflineSale from '../models/OfflineSale.js';

const DEFAULT_PRODUCT_IMAGE = '/uploads/product-placeholder.png';
const DEFAULT_PRODUCT_BRAND = 'K.S. Sports';
const OFFLINE_PAYMENT_MODES = ['Cash', 'Online', 'Pending'];
const PRODUCT_NAME_ALIASES = {
  'glubes regular': 'Gloves Regular',
  'glubes perium': 'Gloves Premium',
  'ks bat special edtion': 'KS Bat Special Edition',
  'sai bat legend edition': 'Sai Bat Legend Edition',
  'sai bat legend': 'Sai Bat Legend Edition',
  'cock (50)': 'Cock (50)',
};

const sheetUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowedMimeTypes = new Set([
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv',
      'text/plain',
    ]);
    const lowerName = String(file.originalname || '').toLowerCase();

    if (
      allowedMimeTypes.has(file.mimetype) ||
      lowerName.endsWith('.xlsx') ||
      lowerName.endsWith('.csv')
    ) {
      cb(null, true);
      return;
    }

    cb(new Error('Only .xlsx and .csv files are allowed'));
  },
});

const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toTrimmedString = (value) => String(value ?? '').trim();

const normalizeLookupName = (value = '') =>
  toTrimmedString(value).replace(/\s+/g, ' ').toLowerCase();

const resolveAliasedProductName = (value = '') => {
  const normalizedValue = normalizeLookupName(value);
  return PRODUCT_NAME_ALIASES[normalizedValue] || toTrimmedString(value);
};

const buildLooseTokenRegex = (value = '') =>
  normalizeLookupName(value)
    .split(' ')
    .filter(Boolean)
    .map(escapeRegex)
    .join('.*');

const toOptionalNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : undefined;
};

const parseFeatures = (value) =>
  toTrimmedString(value)
    .split(/\r?\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean);

const getRowValue = (row, aliases) => {
  const normalizedEntries = Object.entries(row).map(([key, value]) => [
    key.toLowerCase().trim(),
    value,
  ]);

  for (const alias of aliases) {
    const match = normalizedEntries.find(([key]) => key === alias);
    if (match) {
      return match[1];
    }
  }

  return '';
};

const parseSheetRows = (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  return XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
    defval: '',
    raw: false,
  });
};

const isBlankRow = (row = {}) =>
  Object.values(row).every((value) => !toTrimmedString(value));

const normalizeSaleDateInput = (value) => {
  const dateValue = new Date(value);

  if (Number.isNaN(dateValue.getTime())) {
    return null;
  }

  return dateValue;
};

const normalizePaymentMode = (value, { strict = false } = {}) => {
  const normalizedValue = normalizeLookupName(value);
  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue === 'cash') {
    return 'Cash';
  }

  if (normalizedValue === 'pending') {
    return 'Pending';
  }

  if (
    normalizedValue === 'online' ||
    (!strict && normalizedValue === 'upi') ||
    (!strict && normalizedValue === 'online/upi')
  ) {
    return strict ? 'Online' : normalizedValue === 'online' ? 'Online' : 'Online/UPI';
  }

  return null;
};

const derivePaymentDetails = ({ totalSale, paymentMode, pendingAmount, customerName }) => {
  const normalizedCustomerName = toTrimmedString(customerName);
  const normalizedPendingAmount = Number(pendingAmount ?? 0);

  if (paymentMode === 'Pending') {
    if (!Number.isFinite(normalizedPendingAmount) || normalizedPendingAmount <= 0) {
      throw new Error('Pending amount must be greater than 0');
    }

    if (normalizedPendingAmount > totalSale) {
      throw new Error('Pending Amount cannot be greater than Total Sale');
    }

    if (!normalizedCustomerName) {
      throw new Error('Customer name is required when payment is Pending');
    }

    return {
      receivedAmount: totalSale - normalizedPendingAmount,
      pendingAmount: normalizedPendingAmount,
      paymentStatus: 'Pending',
      customerName: normalizedCustomerName,
    };
  }

  return {
    receivedAmount: totalSale,
    pendingAmount: 0,
    paymentStatus: 'Full Payment',
    customerName: normalizedCustomerName,
  };
};

const getClosestProductNames = async (productName) => {
  const normalizedName = normalizeLookupName(resolveAliasedProductName(productName));

  if (!normalizedName) {
    return [];
  }

  const looseRegex = buildLooseTokenRegex(normalizedName);
  const firstToken = normalizedName.split(' ').find(Boolean);
  const regexOptions = [];

  if (looseRegex) {
    regexOptions.push({ name: { $regex: looseRegex, $options: 'i' } });
  }

  if (firstToken) {
    regexOptions.push({ name: { $regex: escapeRegex(firstToken), $options: 'i' } });
  }

  if (!regexOptions.length) {
    return [];
  }

  const candidates = await Product.find({ $or: regexOptions })
    .select('name')
    .limit(5);

  return candidates.map((product) => product.name);
};

const findProductByFlexibleName = async (productName) => {
  const normalizedName = normalizeLookupName(resolveAliasedProductName(productName));

  if (!normalizedName) {
    return null;
  }

  const exactProduct = await Product.findOne({
    name: { $regex: `^${escapeRegex(normalizedName)}$`, $options: 'i' },
  });

  if (exactProduct) {
    return exactProduct;
  }

  const normalizedTokens = normalizedName.split(' ').filter(Boolean);

  if (!normalizedTokens.length) {
    return null;
  }

  const candidateProducts = await Product.find({
    name: {
      $regex: normalizedTokens.map(escapeRegex).join('.*'),
      $options: 'i',
    },
  }).limit(10);

  const normalizedCandidates = candidateProducts.filter(
    (product) =>
      normalizeLookupName(product.name).includes(normalizedName) ||
      normalizedName.includes(normalizeLookupName(product.name))
  );

  if (normalizedCandidates.length === 1) {
    return normalizedCandidates[0];
  }

  return null;
};

const logUnmatchedProductName = (productName, contextLabel, closestMatches = []) => {
  console.warn(
    `[${contextLabel}] Product not found for lookup: "${toTrimmedString(productName)}"${
      closestMatches.length ? ` | Closest matches: ${closestMatches.join(', ')}` : ''
    }`
  );
};

const detectDayStatus = (productName, notes = '') => {
  const normalizedName = normalizeLookupName(productName);
  const normalizedNotes = normalizeLookupName(notes);
  const combined = `${normalizedName} ${normalizedNotes}`.trim();

  if (combined.includes('sunday')) {
    return 'Sunday';
  }

  if (combined.includes('holiday') || combined.includes('vacation')) {
    return 'Holiday';
  }

  if (combined.includes('close') || combined.includes('closed')) {
    return 'Closed';
  }

  if (combined.includes('no sale')) {
    return 'No Sale';
  }

  return '';
};

const detectServiceRowType = (productName = '') => {
  const normalizedName = normalizeLookupName(productName);
  return normalizedName.includes('repair') || normalizedName.includes('service')
    ? 'service'
    : 'misc';
};

const getDateRangeQuery = ({ date, month, from, to }) => {
  if (date) {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);

    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      return { saleDate: { $gte: start, $lte: end } };
    }
  }

  if (month) {
    const start = new Date(`${month}-01T00:00:00.000Z`);

    if (!Number.isNaN(start.getTime())) {
      const end = new Date(start);
      end.setUTCMonth(end.getUTCMonth() + 1);
      end.setUTCMilliseconds(end.getUTCMilliseconds() - 1);
      return { saleDate: { $gte: start, $lte: end } };
    }
  }

  if (from || to) {
    const range = {};

    if (from) {
      const start = new Date(`${from}T00:00:00.000Z`);
      if (!Number.isNaN(start.getTime())) {
        range.$gte = start;
      }
    }

    if (to) {
      const end = new Date(`${to}T23:59:59.999Z`);
      if (!Number.isNaN(end.getTime())) {
        range.$lte = end;
      }
    }

    if (range.$gte || range.$lte) {
      return { saleDate: range };
    }
  }

  return {};
};

const summarizeSales = (sales) =>
  sales.reduce(
    (summary, sale) => ({
      totalSale: summary.totalSale + Number(sale.totalSale || 0),
      totalCost: summary.totalCost + Number(sale.totalCost || 0),
      totalProfit: summary.totalProfit + Number(sale.profit || 0),
      totalQuantitySold: summary.totalQuantitySold + Number(sale.quantitySold || 0),
    }),
    {
      totalSale: 0,
      totalCost: 0,
      totalProfit: 0,
      totalQuantitySold: 0,
    }
  );

const normalizeOfflineSalePayload = async ({
  saleDate,
  productId,
  productName,
  quantitySold,
  salePricePerItem,
  costPricePerItem,
  pendingAmount,
  customerName,
  paymentMode,
  notes,
  source = 'manual',
  strictPaymentMode = false,
}) => {
  const normalizedSaleDate = normalizeSaleDateInput(saleDate);
  const normalizedQuantity = Number(quantitySold);
  const normalizedSalePrice = Number(salePricePerItem);
  const normalizedPaymentMode = normalizePaymentMode(paymentMode, {
    strict: strictPaymentMode,
  });

  if (!normalizedSaleDate) {
    throw new Error('Valid sale date is required');
  }

  if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
    throw new Error(`Quantity Sold must be greater than 0. Received: ${quantitySold}`);
  }

  if (!Number.isFinite(normalizedSalePrice) || normalizedSalePrice < 0) {
    throw new Error('Sale Price Per Item must be 0 or more');
  }

  if (!normalizedPaymentMode) {
    throw new Error(
      strictPaymentMode
        ? `Invalid Payment Mode: "${toTrimmedString(paymentMode)}". Use Cash, Online, or Pending`
        : `Invalid Payment Mode: "${toTrimmedString(paymentMode)}". Use Cash, Pending, or Online/UPI`
    );
  }

  let product = null;

  if (productId) {
    product = await Product.findById(productId);
  } else if (productName) {
    product = await findProductByFlexibleName(productName);
  }

  if (!product) {
    if (productName) {
      const closestMatches = await getClosestProductNames(productName);
      logUnmatchedProductName(productName, 'offline-sales', closestMatches);
      throw new Error(
        `Product not found: "${toTrimmedString(productName)}"${
          closestMatches.length ? `. Closest matches: ${closestMatches.join(', ')}` : ''
        }`
      );
    }
    throw new Error('Product not found');
  }

  const resolvedCostPrice =
    costPricePerItem !== undefined && costPricePerItem !== null && costPricePerItem !== ''
      ? Number(costPricePerItem)
      : Number(product.costPrice);

  const totalSale = normalizedQuantity * normalizedSalePrice;

  if (!Number.isFinite(resolvedCostPrice) || resolvedCostPrice < 0) {
    throw new Error('Cost Price Per Item must be 0 or more');
  }

  const totalCost = normalizedQuantity * resolvedCostPrice;
  const paymentDetails = derivePaymentDetails({
    totalSale,
    paymentMode: normalizedPaymentMode,
    pendingAmount,
    customerName,
  });

  return {
    source,
    product,
    rowType: 'product_sale',
    dayStatus: '',
    productName: product.name,
    saleDate: normalizedSaleDate,
    quantitySold: normalizedQuantity,
    salePricePerItem: normalizedSalePrice,
    costPricePerItem: resolvedCostPrice,
    totalSale,
    totalCost,
    profit: totalSale - totalCost,
    paymentMode: normalizedPaymentMode,
    paymentStatus: paymentDetails.paymentStatus,
    receivedAmount: paymentDetails.receivedAmount,
    pendingAmount: paymentDetails.pendingAmount,
    customerName: paymentDetails.customerName,
    notes: toTrimmedString(notes),
  };
};

const createOfflineSaleRecord = async (normalizedSale, userId) => {
  if (normalizedSale.rowType && normalizedSale.rowType !== 'product_sale') {
    const sale = await OfflineSale.create({
      product: normalizedSale.product?._id || null,
      rowType: normalizedSale.rowType,
      source: normalizedSale.source || 'manual',
      dayStatus: normalizedSale.dayStatus || '',
      productName: normalizedSale.productName,
      saleDate: normalizedSale.saleDate,
      quantitySold: normalizedSale.quantitySold ?? 0,
      salePricePerItem: normalizedSale.salePricePerItem ?? 0,
      totalSale: normalizedSale.totalSale ?? 0,
      costPricePerItem: normalizedSale.costPricePerItem ?? 0,
      totalCost: normalizedSale.totalCost ?? 0,
      profit: normalizedSale.profit ?? 0,
      paymentMode: normalizedSale.paymentMode || '',
      paymentStatus: normalizedSale.paymentStatus || 'Full Payment',
      receivedAmount: normalizedSale.receivedAmount ?? normalizedSale.totalSale ?? 0,
      pendingAmount: normalizedSale.pendingAmount ?? 0,
      customerName: normalizedSale.customerName || '',
      notes: normalizedSale.notes,
      createdBy: userId,
    });

    return { sale, productStock: null };
  }

  if (normalizedSale.source === 'history_import') {
    const sale = await OfflineSale.create({
      product: normalizedSale.product?._id || null,
      rowType: normalizedSale.rowType || 'product_sale',
      source: 'history_import',
      dayStatus: normalizedSale.dayStatus || '',
      productName: normalizedSale.productName,
      saleDate: normalizedSale.saleDate,
      quantitySold: normalizedSale.quantitySold,
      salePricePerItem: normalizedSale.salePricePerItem,
      totalSale: normalizedSale.totalSale,
      costPricePerItem: normalizedSale.costPricePerItem,
      totalCost: normalizedSale.totalCost,
      profit: normalizedSale.profit,
      paymentMode: normalizedSale.paymentMode,
      paymentStatus: normalizedSale.paymentStatus || 'Full Payment',
      receivedAmount: normalizedSale.receivedAmount ?? normalizedSale.totalSale ?? 0,
      pendingAmount: normalizedSale.pendingAmount ?? 0,
      customerName: normalizedSale.customerName || '',
      notes: normalizedSale.notes,
      createdBy: userId,
    });

    return { sale, productStock: null };
  }

  const updatedProduct = await Product.findOneAndUpdate(
    {
      _id: normalizedSale.product._id,
      countInStock: { $gte: normalizedSale.quantitySold },
    },
    { $inc: { countInStock: -normalizedSale.quantitySold } },
    { new: true }
  );

  if (!updatedProduct) {
    const latestProduct = await Product.findById(normalizedSale.product._id).select('countInStock');
    throw new Error(
      `Insufficient stock for this offline sale. Requested qty: ${normalizedSale.quantitySold}, available stock: ${latestProduct?.countInStock ?? 0}`
    );
  }

  try {
    const sale = await OfflineSale.create({
      product: updatedProduct._id,
      rowType: normalizedSale.rowType || 'product_sale',
      source: normalizedSale.source || 'manual',
      dayStatus: normalizedSale.dayStatus || '',
      productName: updatedProduct.name,
      saleDate: normalizedSale.saleDate,
      quantitySold: normalizedSale.quantitySold,
      salePricePerItem: normalizedSale.salePricePerItem,
      totalSale: normalizedSale.totalSale,
      costPricePerItem: normalizedSale.costPricePerItem,
      totalCost: normalizedSale.totalCost,
      profit: normalizedSale.profit,
      paymentMode: normalizedSale.paymentMode,
      paymentStatus: normalizedSale.paymentStatus,
      receivedAmount: normalizedSale.receivedAmount,
      pendingAmount: normalizedSale.pendingAmount,
      customerName: normalizedSale.customerName,
      notes: normalizedSale.notes,
      createdBy: userId,
    });

    return {
      sale,
      productStock: updatedProduct.countInStock,
    };
  } catch (error) {
    await Product.updateOne(
      { _id: normalizedSale.product._id },
      { $inc: { countInStock: normalizedSale.quantitySold } }
    );
    throw error;
  }
};

const updateOfflineSaleRecord = async (existingSale, normalizedSale) => {
  if ((existingSale.source || 'manual') === 'history_import') {
    existingSale.product = normalizedSale.product?._id || null;
    existingSale.rowType = normalizedSale.rowType || existingSale.rowType || 'product_sale';
    existingSale.source = 'history_import';
    existingSale.dayStatus = normalizedSale.dayStatus || '';
    existingSale.productName = normalizedSale.productName;
    existingSale.saleDate = normalizedSale.saleDate;
    existingSale.quantitySold = normalizedSale.quantitySold;
    existingSale.salePricePerItem = normalizedSale.salePricePerItem;
    existingSale.totalSale = normalizedSale.totalSale;
    existingSale.costPricePerItem = normalizedSale.costPricePerItem;
    existingSale.totalCost = normalizedSale.totalCost;
    existingSale.profit = normalizedSale.profit;
    existingSale.paymentMode = normalizedSale.paymentMode;
    existingSale.paymentStatus = normalizedSale.paymentStatus || 'Full Payment';
    existingSale.receivedAmount = normalizedSale.receivedAmount ?? normalizedSale.totalSale ?? 0;
    existingSale.pendingAmount = normalizedSale.pendingAmount ?? 0;
    existingSale.customerName = normalizedSale.customerName || '';
    existingSale.notes = normalizedSale.notes;

    const sale = await existingSale.save();
    return { sale };
  }

  const oldProductId = String(existingSale.product);
  const newProductId = String(normalizedSale.product._id);
  const oldProductRef = existingSale.product;
  const oldQuantitySold = existingSale.quantitySold;
  let sameProductStockDelta = 0;
  let restoredOldProduct = false;
  let reducedNewProduct = false;

  if (oldProductId === newProductId) {
    sameProductStockDelta = normalizedSale.quantitySold - existingSale.quantitySold;

    if (sameProductStockDelta > 0) {
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: normalizedSale.product._id,
          countInStock: { $gte: sameProductStockDelta },
        },
        { $inc: { countInStock: -sameProductStockDelta } },
        { new: true }
      );

      if (!updatedProduct) {
        const latestProduct = await Product.findById(normalizedSale.product._id).select('countInStock');
        throw new Error(
          `Insufficient stock for this offline sale. Requested qty: ${normalizedSale.quantitySold}, available stock: ${latestProduct?.countInStock ?? 0}`
        );
      }
    } else if (sameProductStockDelta < 0) {
      await Product.updateOne(
        { _id: normalizedSale.product._id },
        { $inc: { countInStock: Math.abs(sameProductStockDelta) } }
      );
    }
  } else {
    const updatedNewProduct = await Product.findOneAndUpdate(
      {
        _id: normalizedSale.product._id,
        countInStock: { $gte: normalizedSale.quantitySold },
      },
      { $inc: { countInStock: -normalizedSale.quantitySold } },
      { new: true }
    );

    if (!updatedNewProduct) {
      const latestProduct = await Product.findById(normalizedSale.product._id).select('countInStock');
      throw new Error(
        `Insufficient stock for this offline sale. Requested qty: ${normalizedSale.quantitySold}, available stock: ${latestProduct?.countInStock ?? 0}`
      );
    }

    reducedNewProduct = true;

    await Product.updateOne(
      { _id: oldProductRef },
      { $inc: { countInStock: oldQuantitySold } }
    );
    restoredOldProduct = true;
  }

  existingSale.product = normalizedSale.product._id;
  existingSale.productName = normalizedSale.product.name;
  existingSale.saleDate = normalizedSale.saleDate;
  existingSale.quantitySold = normalizedSale.quantitySold;
  existingSale.salePricePerItem = normalizedSale.salePricePerItem;
  existingSale.totalSale = normalizedSale.totalSale;
  existingSale.costPricePerItem = normalizedSale.costPricePerItem;
  existingSale.totalCost = normalizedSale.totalCost;
  existingSale.profit = normalizedSale.profit;
  existingSale.paymentMode = normalizedSale.paymentMode;
  existingSale.paymentStatus = normalizedSale.paymentStatus;
  existingSale.receivedAmount = normalizedSale.receivedAmount;
  existingSale.pendingAmount = normalizedSale.pendingAmount;
  existingSale.customerName = normalizedSale.customerName;
  existingSale.notes = normalizedSale.notes;

  try {
    const sale = await existingSale.save();
    return { sale };
  } catch (error) {
    if (oldProductId === newProductId) {
      if (sameProductStockDelta > 0) {
        await Product.updateOne(
          { _id: normalizedSale.product._id },
          { $inc: { countInStock: sameProductStockDelta } }
        );
      } else if (sameProductStockDelta < 0) {
        await Product.updateOne(
          { _id: normalizedSale.product._id },
          { $inc: { countInStock: sameProductStockDelta } }
        );
      }
    } else {
      if (restoredOldProduct) {
        await Product.updateOne(
          { _id: oldProductRef },
          { $inc: { countInStock: -oldQuantitySold } }
        );
      }

      if (reducedNewProduct) {
        await Product.updateOne(
          { _id: normalizedSale.product._id },
          { $inc: { countInStock: normalizedSale.quantitySold } }
        );
      }
    }

    throw error;
  }
};

export const uploadStockSheetMiddleware = sheetUpload.single('stockSheet');
export const uploadOfflineSalesSheetMiddleware = sheetUpload.single('offlineSalesSheet');

export const uploadStockSheet = async (req, res) => {
  if (!req.file?.buffer) {
    res.status(400);
    throw new Error('Please upload a .xlsx or .csv stock sheet');
  }

  const rows = parseSheetRows(req.file.buffer);

  if (!rows.length) {
    res.status(400);
    throw new Error('The uploaded sheet is empty');
  }

  let created = 0;
  let updated = 0;
  let processed = 0;
  const errors = [];

  for (const [index, row] of rows.entries()) {
    const productName = toTrimmedString(
      getRowValue(row, ['product name', 'product', 'name'])
    );
    const category = toTrimmedString(getRowValue(row, ['category']));
    const openingStock = toOptionalNumber(
      getRowValue(row, ['opening stock'])
    );
    const totalSold = toOptionalNumber(
      getRowValue(row, ['total sold'])
    ) ?? 0;
    const currentStockValue = toOptionalNumber(
      getRowValue(row, ['current stock', 'stock', 'countinstock'])
    );
    const costPrice = toOptionalNumber(
      getRowValue(row, ['cost price'])
    );
    const salePrice = toOptionalNumber(
      getRowValue(row, ['sale price', 'price'])
    );
    const computedCurrentStock =
      openingStock !== undefined ? openingStock - totalSold : undefined;
    const stock = currentStockValue ?? computedCurrentStock;

    if (!productName) {
      errors.push(`Row ${index + 2}: Product Name is required`);
      continue;
    }

    if (openingStock === undefined) {
      errors.push(`Row ${index + 2}: Opening Stock is required`);
      continue;
    }

    if (costPrice === undefined) {
      errors.push(`Row ${index + 2}: Cost Price is required`);
      continue;
    }

    if (salePrice === undefined) {
      errors.push(`Row ${index + 2}: Sale Price is required`);
      continue;
    }

    if (stock === undefined) {
      errors.push(`Row ${index + 2}: Current Stock could not be calculated`);
      continue;
    }

    if (stock < 0) {
      errors.push(`Row ${index + 2}: Current Stock cannot be negative`);
      continue;
    }

    const existingProduct = await findProductByFlexibleName(productName);

    if (existingProduct) {
      existingProduct.countInStock = stock;

      existingProduct.price = salePrice;
      if (category) {
        existingProduct.category = category;
      }
      if (!existingProduct.image) {
        existingProduct.image = DEFAULT_PRODUCT_IMAGE;
        existingProduct.images = existingProduct.images?.length
          ? existingProduct.images
          : [DEFAULT_PRODUCT_IMAGE];
      }

      await existingProduct.save();
      updated += 1;
      processed += 1;
      continue;
    }

    if (!category) {
      errors.push(`Row ${index + 2}: Category is required for new products`);
      continue;
    }

    await Product.create({
      user: req.user._id,
      name: productName,
      image: DEFAULT_PRODUCT_IMAGE,
      images: [DEFAULT_PRODUCT_IMAGE],
      brand: DEFAULT_PRODUCT_BRAND,
      category,
      description: 'Added from stock sheet import',
      features: [],
      price: salePrice,
      countInStock: stock,
      codAvailable: true,
    });

    created += 1;
    processed += 1;
  }

  res.json({
    message: errors.length
      ? 'Stock sheet imported with some skipped rows'
      : 'Stock sheet imported successfully',
    totalProductsProcessed: processed,
    created,
    updated,
    errors,
  });
};

export const uploadOfflineSalesSheet = async (req, res) => {
  if (!req.file?.buffer) {
    res.status(400);
    throw new Error('Please upload a .xlsx or .csv offline sales sheet');
  }

  const rows = parseSheetRows(req.file.buffer);

  if (!rows.length) {
    res.status(400);
    throw new Error('The uploaded sheet is empty');
  }

  let importedSuccessfully = 0;
  let processedRows = 0;
  const errors = [];

  for (const [index, row] of rows.entries()) {
    if (isBlankRow(row)) {
      continue;
    }

    processedRows += 1;

    try {
      const rawProductName = getRowValue(row, ['product name', 'product', 'name']);
      const notes = getRowValue(row, ['notes', 'note']);
      const dayStatus = detectDayStatus(rawProductName, notes);
      let normalizedSale;

      if (dayStatus) {
        normalizedSale = {
          rowType: 'day_status',
          source: 'history_import',
          dayStatus,
          productName: dayStatus,
          saleDate: normalizeSaleDateInput(getRowValue(row, ['date', 'sale date'])),
          quantitySold: 0,
          salePricePerItem: 0,
          totalSale: 0,
          costPricePerItem: 0,
          totalCost: 0,
          profit: 0,
          paymentMode: '',
          notes: toTrimmedString(notes),
        };

        if (!normalizedSale.saleDate) {
          throw new Error('Valid sale date is required');
        }
      } else {
        const matchedProduct = await findProductByFlexibleName(rawProductName);

        if (matchedProduct) {
          normalizedSale = await normalizeOfflineSalePayload({
            saleDate: getRowValue(row, ['date', 'sale date']),
            productName: rawProductName,
            quantitySold: getRowValue(row, ['qty', 'quantity sold', 'quantity']),
            salePricePerItem: getRowValue(row, ['sale price', 'sale price per item']),
            costPricePerItem: getRowValue(row, ['cost price', 'cost price per item']),
            paymentMode: getRowValue(row, ['payment mode', 'payment']),
            notes,
            source: 'history_import',
          });
          normalizedSale.rowType = 'product_sale';
          normalizedSale.source = 'history_import';
          normalizedSale.dayStatus = '';
          normalizedSale.productName = matchedProduct.name;
        } else {
          const normalizedSaleDate = normalizeSaleDateInput(getRowValue(row, ['date', 'sale date']));
          const normalizedQuantity = Number(getRowValue(row, ['qty', 'quantity sold', 'quantity']));
          const normalizedSalePrice = Number(getRowValue(row, ['sale price', 'sale price per item']));
          const normalizedPaymentMode = normalizePaymentMode(getRowValue(row, ['payment mode', 'payment']));
          const normalizedCostPrice = toOptionalNumber(getRowValue(row, ['cost price', 'cost price per item'])) ?? 0;
          const normalizedProductName = resolveAliasedProductName(rawProductName);

          if (!normalizedSaleDate) {
            throw new Error('Valid sale date is required');
          }

          if (!normalizedProductName) {
            throw new Error('Product Name is required');
          }

          if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
            throw new Error(`Quantity Sold must be greater than 0. Received: ${getRowValue(row, ['qty', 'quantity sold', 'quantity'])}`);
          }

          if (!Number.isFinite(normalizedSalePrice) || normalizedSalePrice < 0) {
            throw new Error('Sale Price Per Item must be 0 or more');
          }

          if (!normalizedPaymentMode) {
            throw new Error(`Invalid Payment Mode: "${toTrimmedString(getRowValue(row, ['payment mode', 'payment']))}". Use Cash, Pending, or Online/UPI`);
          }

          const totalSale = normalizedQuantity * normalizedSalePrice;
          const totalCost = normalizedQuantity * normalizedCostPrice;

          normalizedSale = {
            rowType: detectServiceRowType(normalizedProductName),
            source: 'history_import',
            dayStatus: '',
            product: null,
            productName: normalizedProductName,
            saleDate: normalizedSaleDate,
            quantitySold: normalizedQuantity,
            salePricePerItem: normalizedSalePrice,
            totalSale,
            costPricePerItem: normalizedCostPrice,
            totalCost,
            profit: totalSale - totalCost,
            paymentMode: normalizedPaymentMode,
            notes: toTrimmedString(notes),
          };
        }
      }

      await createOfflineSaleRecord(normalizedSale, req.user._id);
      importedSuccessfully += 1;
    } catch (error) {
      errors.push(`Row ${index + 2}: ${error.message}`);
    }
  }

  res.json({
    message: errors.length
      ? 'Offline sales sheet imported with some skipped rows'
      : 'Offline sales sheet imported successfully',
    totalRowsProcessed: processedRows,
    importedSuccessfully,
    skippedRows: processedRows - importedSuccessfully,
    errors,
  });
};

export const createOfflineSale = async (req, res) => {
  try {
    const normalizedSale = await normalizeOfflineSalePayload({
      ...req.body,
      source: 'manual',
      strictPaymentMode: true,
    });
    const result = await createOfflineSaleRecord(normalizedSale, req.user._id);

    res.status(201).json({
      message: 'Offline sale saved successfully',
      ...result,
    });
  } catch (error) {
    res.status(400);
    throw error;
  }
};

export const updateOfflineSale = async (req, res) => {
  const existingSale = await OfflineSale.findById(req.params.id);

  if (!existingSale) {
    res.status(404);
    throw new Error('Offline sale not found');
  }

  try {
    const normalizedSale = await normalizeOfflineSalePayload({
      ...req.body,
      source: existingSale.source || 'manual',
      strictPaymentMode: true,
    });
    const result = await updateOfflineSaleRecord(existingSale, normalizedSale);

    res.json({
      message: 'Offline sale updated successfully',
      ...result,
    });
  } catch (error) {
    res.status(400);
    throw error;
  }
};

export const deleteOfflineSale = async (req, res) => {
  const sale = await OfflineSale.findById(req.params.id);

  if (!sale) {
    res.status(404);
    throw new Error('Offline sale not found');
  }

  if (sale.source !== 'history_import' && sale.rowType === 'product_sale' && sale.product) {
    await Product.updateOne(
      { _id: sale.product },
      { $inc: { countInStock: sale.quantitySold } }
    );
  }

  await OfflineSale.deleteOne({ _id: sale._id });

  res.json({ message: 'Offline sale deleted successfully' });
};

export const getOfflineSales = async (req, res) => {
  const query = getDateRangeQuery(req.query);
  const sales = await OfflineSale.find(query).sort({ saleDate: -1, createdAt: -1 });
  const summary = summarizeSales(sales);

  res.json({
    sales,
    summary,
  });
};

export const getPendingOfflinePayments = async (req, res) => {
  const { fromDate, toDate } = req.query;
  const rangeConditions = [];

  if (fromDate || toDate) {
    const dateRange = {};

    if (fromDate) {
      const start = new Date(`${fromDate}T00:00:00.000Z`);
      if (!Number.isNaN(start.getTime())) {
        dateRange.$gte = start;
      }
    }

    if (toDate) {
      const end = new Date(`${toDate}T23:59:59.999Z`);
      if (!Number.isNaN(end.getTime())) {
        dateRange.$lte = end;
      }
    }

    if ((fromDate && !dateRange.$gte) || (toDate && !dateRange.$lte)) {
      res.status(400);
      throw new Error('Valid fromDate/toDate are required');
    }

    if (dateRange.$gte || dateRange.$lte) {
      rangeConditions.push({ saleDate: dateRange }, { date: dateRange });
    }
  }

  const query = {
    pendingAmount: { $gt: 0 },
    ...(rangeConditions.length ? { $or: rangeConditions } : {}),
  };

  const pendingSales = await OfflineSale.find(query).sort({ saleDate: 1, createdAt: 1 });

  const normalizedEntries = pendingSales
    .map((sale) => {
      const totalSale = Number(sale.totalSale || 0);
      const pendingAmount = Number(sale.pendingAmount || 0);
      const paidAmount = totalSale - pendingAmount;
      const saleDate = sale.saleDate || sale.date || null;

      return {
        _id: sale._id,
        date: saleDate,
        customerName: sale.customerName || '',
        productName: sale.productName || '',
        totalSale,
        paidAmount,
        pendingAmount,
        paymentMode: sale.paymentMode || '',
        notes: sale.notes || '',
      };
    })
    .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

  const totalPendingAmount = normalizedEntries.reduce(
    (sum, sale) => sum + Number(sale.pendingAmount || 0),
    0
  );
  const totalPendingEntries = normalizedEntries.length;
  const totalUniqueCustomers = new Set(
    normalizedEntries
      .map((sale) => String(sale.customerName || '').trim())
      .filter(Boolean)
  ).size;

  res.json({
    pendingPayments: normalizedEntries,
    summary: {
      totalPendingAmount,
      totalPendingEntries,
      totalUniqueCustomers,
    },
  });
};
