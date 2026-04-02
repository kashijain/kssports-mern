import Product from '../models/Product.js';
import StockInward from '../models/StockInward.js';

const DEFAULT_PRODUCT_IMAGE = '/uploads/product-placeholder.png';
const DEFAULT_PRODUCT_BRAND = 'K.S. Sports';
const PAYMENT_STATUSES = ['Paid', 'Pending', 'Partial'];

const toTrimmedString = (value) => String(value ?? '').trim();

const toNonNegativeNumber = (value, fieldName, { required = false } = {}) => {
  if (value === '' || value === null || value === undefined) {
    if (required) {
      throw new Error(`${fieldName} is required`);
    }
    return 0;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    throw new Error(`${fieldName} must be 0 or more`);
  }

  return numericValue;
};

const normalizeDate = (value) => {
  const normalizedDate = new Date(value);

  if (Number.isNaN(normalizedDate.getTime())) {
    throw new Error('Valid date is required');
  }

  return normalizedDate;
};

const getNormalizedItemsFromEntry = (entry) => {
  if (Array.isArray(entry?.items) && entry.items.length) {
    return entry.items.map((item) => ({
      product: String(item.product?._id || item.product),
      productName: item.productName || item.product?.name || '',
      quantity: Number(item.quantity || 0),
      costPrice: Number(item.costPrice || 0),
      lineTotal: Number(item.lineTotal || 0),
    }));
  }

  if (entry?.product) {
    return [
      {
        product: String(entry.product?._id || entry.product),
        productName: entry.productName || entry.product?.name || '',
        quantity: Number(entry.quantity || 0),
        costPrice: Number(entry.costPrice || 0),
        lineTotal:
          Number(entry.totalCost || 0) ||
          Number(entry.quantity || 0) * Number(entry.costPrice || 0),
      },
    ].filter((item) => item.product && item.quantity > 0);
  }

  return [];
};

const buildStockInwardPayload = async (payload = {}) => {
  const supplierName = toTrimmedString(payload.supplierName);
  const supplierPhone = toTrimmedString(payload.supplierPhone);
  const billNumber = toTrimmedString(payload.billNumber);
  const notes = toTrimmedString(payload.notes);
  const paymentStatus = toTrimmedString(payload.paymentStatus) || 'Pending';
  const date = normalizeDate(payload.date);
  const transportCharges = toNonNegativeNumber(payload.transportCharges, 'Transport Charges');
  const rentCharges = toNonNegativeNumber(payload.rentCharges, 'Rent Charges');
  const loadingCharges = toNonNegativeNumber(payload.loadingCharges, 'Loading Charges');
  const otherCharges = toNonNegativeNumber(payload.otherCharges, 'Other Charges');
  const paidAmount = toNonNegativeNumber(payload.paidAmount, 'Paid Amount');

  if (!supplierName) {
    throw new Error('Supplier / Wholesaler Name is required');
  }

  if (!PAYMENT_STATUSES.includes(paymentStatus)) {
    throw new Error('Payment Status must be Paid, Pending, or Partial');
  }

  const rawItems = Array.isArray(payload.items)
    ? payload.items
    : payload.items && typeof payload.items === 'object'
      ? [payload.items]
      : payload.product
        ? [
            {
              product: payload.product,
              quantity: payload.quantity,
              costPrice: payload.costPrice,
            },
          ]
        : [];

  if (!rawItems.length) {
    throw new Error('At least one product line item is required');
  }

  const normalizedItems = [];
  const seenProductIds = new Set();

  for (const [index, rawItem] of rawItems.entries()) {
    const productId = toTrimmedString(rawItem?.product);
    const quantity = toNonNegativeNumber(
      rawItem?.quantity,
      `Line ${index + 1} Quantity`,
      { required: true }
    );
    const costPrice = toNonNegativeNumber(
      rawItem?.costPrice,
      `Line ${index + 1} Cost Price`,
      { required: true }
    );

    if (!productId) {
      throw new Error(`Product is required for line ${index + 1}`);
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(`Quantity must be greater than 0 for line ${index + 1}`);
    }

    if (seenProductIds.has(productId)) {
      throw new Error('Please use one line per product in a stock inward bill');
    }

    seenProductIds.add(productId);

    const product = await Product.findById(productId).select('name');

    if (!product) {
      throw new Error(`Selected product was not found for line ${index + 1}`);
    }

    normalizedItems.push({
      product: product._id,
      productName: product.name,
      quantity,
      costPrice: Number(costPrice.toFixed(2)),
      lineTotal: Number((quantity * costPrice).toFixed(2)),
    });
  }

  const totalCost = Number(
    normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)
  );
  const finalTotalCost = Number(
    (totalCost + transportCharges + rentCharges + loadingCharges + otherCharges).toFixed(2)
  );
  const normalizedPaidAmount = Math.min(Number(paidAmount.toFixed(2)), finalTotalCost);
  const pendingAmount = Number((finalTotalCost - normalizedPaidAmount).toFixed(2));
  const firstItem = normalizedItems[0] || null;
  const totalQuantity = normalizedItems.reduce((sum, item) => sum + item.quantity, 0);

  if (paymentStatus === 'Paid' && pendingAmount !== 0) {
    throw new Error('Pending Amount must be 0 when payment status is Paid');
  }

  if (paymentStatus === 'Pending' && normalizedPaidAmount !== 0) {
    throw new Error('Paid Amount must be 0 when payment status is Pending');
  }

  if (paymentStatus === 'Partial' && (normalizedPaidAmount <= 0 || pendingAmount <= 0)) {
    throw new Error('Partial payment must include both paid and pending amounts');
  }

  return {
    items: normalizedItems,
    data: {
      date,
      supplierName,
      supplierPhone,
      billNumber,
      items: normalizedItems,
      product: firstItem?.product || null,
      quantity: totalQuantity,
      costPrice: firstItem?.costPrice || 0,
      totalCost,
      transportCharges: Number(transportCharges.toFixed(2)),
      rentCharges: Number(rentCharges.toFixed(2)),
      loadingCharges: Number(loadingCharges.toFixed(2)),
      otherCharges: Number(otherCharges.toFixed(2)),
      finalTotalCost,
      paymentStatus,
      paidAmount: normalizedPaidAmount,
      pendingAmount,
      notes,
    },
  };
};

const syncLatestProductCostPrice = async (productId, fallbackCostPrice = 0) => {
  const latestInward = await StockInward.findOne({ 'items.product': productId })
    .sort({ date: -1, createdAt: -1 })
    .select('items');

  const latestMatchingItem = latestInward?.items?.find(
    (item) => String(item.product) === String(productId)
  );

  await Product.updateOne(
    { _id: productId },
    { $set: { costPrice: latestMatchingItem ? latestMatchingItem.costPrice : fallbackCostPrice } }
  );
};

const syncLatestProductCostPrices = async (productIds = []) => {
  const uniqueProductIds = [...new Set(productIds.map((item) => String(item)).filter(Boolean))];
  await Promise.all(uniqueProductIds.map((productId) => syncLatestProductCostPrice(productId, 0)));
};

const applyProductStockChange = async ({ productId, quantityDelta, costPrice }) => {
  if (!quantityDelta && costPrice === undefined) {
    return;
  }

  if (quantityDelta < 0) {
    const updatedProduct = await Product.findOneAndUpdate(
      {
        _id: productId,
        countInStock: { $gte: Math.abs(quantityDelta) },
      },
      {
        $inc: { countInStock: quantityDelta },
        ...(costPrice !== undefined ? { $set: { costPrice } } : {}),
      },
      { new: true }
    ).select('countInStock');

    if (!updatedProduct) {
      const latestProduct = await Product.findById(productId).select('countInStock name');
      throw new Error(
        `Stock update would make inventory negative for ${latestProduct?.name || 'this product'}. Available stock: ${latestProduct?.countInStock ?? 0}`
      );
    }

    return;
  }

  const update = {
    ...(quantityDelta ? { $inc: { countInStock: quantityDelta } } : {}),
    ...(costPrice !== undefined ? { $set: { costPrice } } : {}),
  };

  await Product.updateOne({ _id: productId }, update);
};

const applyItemsStockChange = async (items = [], { direction = 'add' } = {}) => {
  const appliedItems = [];

  try {
    for (const item of items) {
      const normalizedQuantity = direction === 'remove' ? -Number(item.quantity || 0) : Number(item.quantity || 0);
      await applyProductStockChange({
        productId: item.product,
        quantityDelta: normalizedQuantity,
        costPrice: direction === 'add' ? Number(item.costPrice || 0) : undefined,
      });
      appliedItems.push(item);
    }
  } catch (error) {
    const rollbackDirection = direction === 'add' ? 'remove' : 'add';

    for (const appliedItem of [...appliedItems].reverse()) {
      await applyProductStockChange({
        productId: appliedItem.product,
        quantityDelta:
          rollbackDirection === 'add'
            ? Number(appliedItem.quantity || 0)
            : -Number(appliedItem.quantity || 0),
        costPrice: rollbackDirection === 'add' ? Number(appliedItem.costPrice || 0) : undefined,
      });
    }

    throw error;
  }
};

const buildSummary = async () => {
  const [summary] = await StockInward.aggregate([
    {
      $group: {
        _id: null,
        totalPurchaseValue: { $sum: '$finalTotalCost' },
        totalPaid: { $sum: '$paidAmount' },
        totalPending: { $sum: '$pendingAmount' },
        supplierNames: { $addToSet: '$supplierName' },
      },
    },
    {
      $project: {
        _id: 0,
        totalSuppliers: { $size: '$supplierNames' },
        totalPurchaseValue: 1,
        totalPaid: 1,
        totalPending: 1,
      },
    },
  ]);

  return (
    summary || {
      totalSuppliers: 0,
      totalPurchaseValue: 0,
      totalPaid: 0,
      totalPending: 0,
    }
  );
};

export const quickCreateStockInwardProduct = async (req, res) => {
  const name = toTrimmedString(req.body.name);
  const category = toTrimmedString(req.body.category);
  const description = toTrimmedString(req.body.description) || 'Added from Stock Inward quick create';
  const price = toNonNegativeNumber(req.body.price, 'Selling Price', { required: true });
  const costPrice = toNonNegativeNumber(req.body.costPrice, 'Cost Price', { required: true });
  const countInStock = toNonNegativeNumber(req.body.countInStock, 'Stock');

  if (!name) {
    res.status(400);
    throw new Error('Product Name is required');
  }

  if (!category) {
    res.status(400);
    throw new Error('Category is required');
  }

  const existingProduct = await Product.findOne({
    name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
  });

  if (existingProduct) {
    res.status(400);
    throw new Error('A product with this name already exists');
  }

  const product = await Product.create({
    user: req.user._id,
    name,
    image: DEFAULT_PRODUCT_IMAGE,
    images: [DEFAULT_PRODUCT_IMAGE],
    brand: DEFAULT_PRODUCT_BRAND,
    category,
    description,
    features: [],
    specifications: [],
    price,
    costPrice,
    countInStock,
    codAvailable: true,
  });

  res.status(201).json({
    message: 'Product created successfully',
    product,
  });
};

export const createStockInward = async (req, res) => {
  try {
    const { items, data } = await buildStockInwardPayload(req.body);
    const entry = await StockInward.create({
      ...data,
      createdBy: req.user._id,
    });

    try {
      await applyItemsStockChange(items, { direction: 'add' });
    } catch (error) {
      await StockInward.deleteOne({ _id: entry._id });
      throw error;
    }

    const populatedEntry = await StockInward.findById(entry._id).populate(
      'items.product',
      'name countInStock price costPrice category'
    );

    res.status(201).json({
      message: 'Stock inward entry saved successfully',
      entry: populatedEntry,
    });
  } catch (error) {
    res.status(400);
    throw error;
  }
};

export const getStockInwardEntries = async (req, res) => {
  const entries = await StockInward.find()
    .populate('items.product', 'name countInStock price costPrice category')
    .sort({ date: -1, createdAt: -1 });
  const summary = await buildSummary();

  res.json({
    entries,
    summary,
  });
};

export const getStockInwardEntryById = async (req, res) => {
  const entry = await StockInward.findById(req.params.id).populate(
    'items.product',
    'name countInStock price costPrice category'
  );

  if (!entry) {
    res.status(404);
    throw new Error('Stock inward entry not found');
  }

  res.json(entry);
};

export const updateStockInwardEntry = async (req, res) => {
  const existingEntry = await StockInward.findById(req.params.id);

  if (!existingEntry) {
    res.status(404);
    throw new Error('Stock inward entry not found');
  }

  try {
    const oldItems = getNormalizedItemsFromEntry(existingEntry);
    const { items, data } = await buildStockInwardPayload(req.body);
    const affectedProductIds = [
      ...oldItems.map((item) => item.product),
      ...items.map((item) => String(item.product)),
    ];

    await applyItemsStockChange(oldItems, { direction: 'remove' });

    try {
      await applyItemsStockChange(items, { direction: 'add' });
    } catch (error) {
      await applyItemsStockChange(oldItems, { direction: 'add' });
      throw error;
    }

    const previousState = {
      items: existingEntry.items,
      product: existingEntry.product,
      quantity: existingEntry.quantity,
      costPrice: existingEntry.costPrice,
      date: existingEntry.date,
      supplierName: existingEntry.supplierName,
      supplierPhone: existingEntry.supplierPhone,
      billNumber: existingEntry.billNumber,
      totalCost: existingEntry.totalCost,
      transportCharges: existingEntry.transportCharges,
      rentCharges: existingEntry.rentCharges,
      loadingCharges: existingEntry.loadingCharges,
      otherCharges: existingEntry.otherCharges,
      finalTotalCost: existingEntry.finalTotalCost,
      paymentStatus: existingEntry.paymentStatus,
      paidAmount: existingEntry.paidAmount,
      pendingAmount: existingEntry.pendingAmount,
      notes: existingEntry.notes,
    };

    Object.assign(existingEntry, data);

    try {
      await existingEntry.save();
    } catch (error) {
      Object.assign(existingEntry, previousState);
      await applyItemsStockChange(items, { direction: 'remove' });
      await applyItemsStockChange(oldItems, { direction: 'add' });
      throw error;
    }

    await syncLatestProductCostPrices(affectedProductIds);

    const populatedEntry = await StockInward.findById(existingEntry._id).populate(
      'items.product',
      'name countInStock price costPrice category'
    );

    res.json({
      message: 'Stock inward entry updated successfully',
      entry: populatedEntry,
    });
  } catch (error) {
    res.status(400);
    throw error;
  }
};

export const deleteStockInwardEntry = async (req, res) => {
  const entry = await StockInward.findById(req.params.id);

  if (!entry) {
    res.status(404);
    throw new Error('Stock inward entry not found');
  }

  const items = getNormalizedItemsFromEntry(entry);
  await applyItemsStockChange(items, { direction: 'remove' });
  await StockInward.deleteOne({ _id: entry._id });
  await syncLatestProductCostPrices(items.map((item) => item.product));

  res.json({ message: 'Stock inward entry deleted successfully' });
};
