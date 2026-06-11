import Product from '../models/Product.js';
import PurchaseBill from '../models/PurchaseBill.js';

const DEFAULT_PRODUCT_IMAGE = '/uploads/product-placeholder.png';
const CATEGORY_OPTIONS = ['Bat', 'Ball', 'Gloves', 'Accessories', 'Sleeves', 'Shaker', 'Other'];
const PAYMENT_MODES = new Set(['cash', 'online', 'upi', 'partial', 'pending']);
const PAYMENT_STATUSES = new Set(['pending', 'paid', 'partial']);

const toNumber = (value, fallback = 0) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const toTrimmedString = (value) => String(value ?? '').trim();

const normalizeItems = async (items = []) => {
  if (!Array.isArray(items) || !items.length) {
    const error = new Error('At least one purchase item is required');
    error.statusCode = 400;
    throw error;
  }

  const normalizedItems = [];

  for (const row of items) {
    const productId = toTrimmedString(row.product);
    const quantity = toNumber(row.quantity);
    const costPrice = Math.max(toNumber(row.costPrice), 0);
    const sellingPrice = Math.max(toNumber(row.sellingPrice), 0);

    if (!productId) {
      const error = new Error('Each item must have a valid product selected');
      error.statusCode = 400;
      throw error;
    }

    if (quantity <= 0) {
      const error = new Error('Item quantity must be greater than 0');
      error.statusCode = 400;
      throw error;
    }

    const product = await Product.findById(productId);

    if (!product) {
      const error = new Error('Selected product not found');
      error.statusCode = 404;
      throw error;
    }

    normalizedItems.push({
      product: product._id,
      productName: product.name,
      quantity,
      costPrice,
      sellingPrice,
      lineTotal: quantity * costPrice,
    });
  }

  const uniqueProductCount = new Set(normalizedItems.map((item) => String(item.product))).size;

  if (uniqueProductCount !== normalizedItems.length) {
    const error = new Error('Please use one line per product in a purchase bill');
    error.statusCode = 400;
    throw error;
  }

  return normalizedItems;
};

const buildPurchasePayload = async (body = {}, userId) => {
  const supplierName = toTrimmedString(body.supplierName);
  const billNumber = toTrimmedString(body.billNumber);
  const billDate = body.billDate ? new Date(body.billDate) : null;
  const paymentMode = PAYMENT_MODES.has(String(body.paymentMode || '').toLowerCase())
    ? String(body.paymentMode).toLowerCase()
    : 'pending';
  const paymentStatusValue = String(body.paymentStatus || 'pending').toLowerCase();
  const isDraft = Boolean(body.isDraft);

  if (!supplierName) {
    const error = new Error('Supplier name is required');
    error.statusCode = 400;
    throw error;
  }

  if (!billNumber) {
    const error = new Error('Bill number is required');
    error.statusCode = 400;
    throw error;
  }

  if (!billDate || Number.isNaN(billDate.getTime())) {
    const error = new Error('Valid bill date is required');
    error.statusCode = 400;
    throw error;
  }

  if (!PAYMENT_STATUSES.has(paymentStatusValue)) {
    const error = new Error('Payment status must be pending, paid, or partial');
    error.statusCode = 400;
    throw error;
  }

  const items = await normalizeItems(body.items);
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const transportCharges = Math.max(toNumber(body.transportCharges), 0);
  const packingCharges = Math.max(toNumber(body.packingCharges), 0);
  const otherCharges = Math.max(toNumber(body.otherCharges), 0);
  const extraChargesTotal = transportCharges + packingCharges + otherCharges;
  const finalTotal = subtotal + extraChargesTotal;
  const paidAmount = Math.min(Math.max(toNumber(body.paidAmount), 0), finalTotal);
  const pendingAmount = Math.max(finalTotal - paidAmount, 0);

  if (toNumber(body.paidAmount) > finalTotal) {
    const error = new Error('Paid amount cannot exceed final total');
    error.statusCode = 400;
    throw error;
  }

  return {
    supplierName,
    firmName: toTrimmedString(body.firmName),
    mobile: toTrimmedString(body.mobile),
    address: toTrimmedString(body.address),
    gstNumber: toTrimmedString(body.gstNumber),
    billNumber,
    billDate,
    items,
    subtotal,
    transportCharges,
    packingCharges,
    otherCharges,
    extraChargesTotal,
    finalTotal,
    paidAmount,
    pendingAmount,
    paymentMode,
    paymentStatus: paymentStatusValue,
    notes: toTrimmedString(body.notes),
    isDraft,
    createdBy: userId,
  };
};

const applyStockDelta = async (items = [], direction = 1) => {
  for (const item of items) {
    const product = await Product.findById(item.product);

    if (!product) {
      const error = new Error(`Product not found for ${item.productName}`);
      error.statusCode = 404;
      throw error;
    }

    const nextStock = Number(product.countInStock || 0) + direction * Number(item.quantity || 0);

    if (nextStock < 0) {
      const error = new Error(`Cannot reduce stock below zero for ${product.name}`);
      error.statusCode = 400;
      throw error;
    }

    product.countInStock = nextStock;

    if (direction > 0) {
      if (item.costPrice !== undefined) {
        product.costPrice = Number(item.costPrice) || 0;
      }

      if (item.sellingPrice !== undefined && Number(item.sellingPrice) > 0) {
        product.price = Number(item.sellingPrice);
      }
    }

    await product.save();
  }
};

const populatePurchaseBill = (query) => query.populate('items.product', 'name price costPrice countInStock category');

export const createPurchaseProduct = async (req, res) => {
  const name = toTrimmedString(req.body.name);
  const category = CATEGORY_OPTIONS.includes(toTrimmedString(req.body.category))
    ? toTrimmedString(req.body.category)
    : 'Other';
  const price = Math.max(toNumber(req.body.price), 0);
  const costPrice = Math.max(toNumber(req.body.costPrice), 0);
  const countInStock = Math.max(toNumber(req.body.countInStock), 0);
  const description =
    toTrimmedString(req.body.description) || `${name} added from Stock Inward quick create.`;

  if (!name) {
    res.status(400);
    throw new Error('Product name is required');
  }

  const existingProduct = await Product.findOne({
    name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
  });

  if (existingProduct) {
    res.status(409);
    throw new Error('Product already exists');
  }

  const product = await Product.create({
    user: req.user._id,
    name,
    image: DEFAULT_PRODUCT_IMAGE,
    images: [DEFAULT_PRODUCT_IMAGE],
    brand: 'K.S. Sports',
    category,
    description,
    price,
    costPrice,
    countInStock,
    codAvailable: true,
    features: [],
    specifications: [],
    numReviews: 0,
  });

  res.status(201).json({ product });
};

export const createPurchaseBill = async (req, res) => {
  const payload = await buildPurchasePayload(req.body, req.user._id);
  const stockApplied = !payload.isDraft;
  const bill = await PurchaseBill.create({
    ...payload,
    stockApplied,
  });

  try {
    if (stockApplied) {
      await applyStockDelta(payload.items, 1);
    }
  } catch (error) {
    await PurchaseBill.deleteOne({ _id: bill._id });
    throw error;
  }

  const savedBill = await populatePurchaseBill(PurchaseBill.findById(bill._id));
  res.status(201).json({ bill: savedBill });
};

export const getPurchaseBills = async (req, res) => {
  const filter = {};

  if (req.query.paymentStatus) {
    filter.paymentStatus = req.query.paymentStatus;
  }

  const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  if (req.query.supplier) {
    filter.supplierName = { $regex: escapeRegex(req.query.supplier), $options: 'i' };
  }

  if (req.query.billNumber) {
    filter.billNumber = { $regex: escapeRegex(req.query.billNumber), $options: 'i' };
  }

  if (req.query.date) {
    const start = new Date(req.query.date);
    const end = new Date(req.query.date);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    filter.billDate = { $gte: start, $lte: end };
  }

  const bills = await populatePurchaseBill(
    PurchaseBill.find(filter).sort({ billDate: -1, createdAt: -1 })
  );

  const summary = bills.reduce(
    (acc, bill) => {
      acc.totalBills += 1;
      acc.totalPurchaseValue += Number(bill.finalTotal || 0);
      acc.totalPaid += Number(bill.paidAmount || 0);
      acc.totalPending += Number(bill.pendingAmount || 0);
      return acc;
    },
    {
      totalBills: 0,
      totalPurchaseValue: 0,
      totalPaid: 0,
      totalPending: 0,
    }
  );

  res.json({ bills, summary });
};

export const getPurchaseBillById = async (req, res) => {
  const bill = await populatePurchaseBill(PurchaseBill.findById(req.params.id));

  if (!bill) {
    res.status(404);
    throw new Error('Purchase bill not found');
  }

  res.json({ bill });
};

export const updatePurchaseBill = async (req, res) => {
  const bill = await PurchaseBill.findById(req.params.id);

  if (!bill) {
    res.status(404);
    throw new Error('Purchase bill not found');
  }

  const previousItems = bill.items.map((item) => item.toObject());
  const wasStockApplied = bill.stockApplied;
  const payload = await buildPurchasePayload(req.body, bill.createdBy);
  const shouldApplyStock = !payload.isDraft;

  if (wasStockApplied) {
    await applyStockDelta(previousItems, -1);
  }

  try {
    Object.assign(bill, payload, {
      stockApplied: shouldApplyStock,
      createdBy: bill.createdBy,
    });

    await bill.save();

    if (shouldApplyStock) {
      await applyStockDelta(payload.items, 1);
    }
  } catch (error) {
    if (wasStockApplied) {
      await applyStockDelta(previousItems, 1);
    }
    throw error;
  }

  const updatedBill = await populatePurchaseBill(PurchaseBill.findById(bill._id));
  res.json({ bill: updatedBill });
};
