import Product from '../models/Product.js';
import StockInward from '../models/StockInward.js';

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

const buildStockInwardPayload = async (payload = {}) => {
  const productId = toTrimmedString(payload.product);
  const supplierName = toTrimmedString(payload.supplierName);
  const supplierPhone = toTrimmedString(payload.supplierPhone);
  const billNumber = toTrimmedString(payload.billNumber);
  const notes = toTrimmedString(payload.notes);
  const paymentStatus = toTrimmedString(payload.paymentStatus) || 'Pending';
  const date = normalizeDate(payload.date);
  const quantity = toNonNegativeNumber(payload.quantity, 'Quantity Purchased', { required: true });
  const costPrice = toNonNegativeNumber(payload.costPrice, 'Cost Price Per Item', { required: true });
  const transportCharges = toNonNegativeNumber(payload.transportCharges, 'Transport Charges');
  const rentCharges = toNonNegativeNumber(payload.rentCharges, 'Rent Charges');
  const loadingCharges = toNonNegativeNumber(payload.loadingCharges, 'Loading Charges');
  const otherCharges = toNonNegativeNumber(payload.otherCharges, 'Other Charges');
  const paidAmount = toNonNegativeNumber(payload.paidAmount, 'Paid Amount');

  if (!productId) {
    throw new Error('Product is required');
  }

  if (!supplierName) {
    throw new Error('Supplier / Wholesaler Name is required');
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error('Quantity Purchased must be greater than 0');
  }

  if (!PAYMENT_STATUSES.includes(paymentStatus)) {
    throw new Error('Payment Status must be Paid, Pending, or Partial');
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new Error('Selected product was not found');
  }

  const totalCost = Number((quantity * costPrice).toFixed(2));
  const finalTotalCost = Number(
    (totalCost + transportCharges + rentCharges + loadingCharges + otherCharges).toFixed(2)
  );
  const normalizedPaidAmount = Math.min(Number(paidAmount.toFixed(2)), finalTotalCost);
  const pendingAmount = Number((finalTotalCost - normalizedPaidAmount).toFixed(2));

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
    product,
    data: {
      date,
      supplierName,
      supplierPhone,
      billNumber,
      product: product._id,
      quantity,
      costPrice: Number(costPrice.toFixed(2)),
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
  const latestInward = await StockInward.findOne({ product: productId })
    .sort({ date: -1, createdAt: -1 })
    .select('costPrice');

  await Product.updateOne(
    { _id: productId },
    { $set: { costPrice: latestInward ? latestInward.costPrice : fallbackCostPrice } }
  );
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

export const createStockInward = async (req, res) => {
  try {
    const { product, data } = await buildStockInwardPayload(req.body);
    const entry = await StockInward.create({
      ...data,
      createdBy: req.user._id,
    });

    try {
      await applyProductStockChange({
        productId: product._id,
        quantityDelta: data.quantity,
        costPrice: data.costPrice,
      });
    } catch (error) {
      await StockInward.deleteOne({ _id: entry._id });
      throw error;
    }

    const populatedEntry = await StockInward.findById(entry._id).populate(
      'product',
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
    .populate('product', 'name countInStock price costPrice category')
    .sort({ date: -1, createdAt: -1 });
  const summary = await buildSummary();

  res.json({
    entries,
    summary,
  });
};

export const getStockInwardEntryById = async (req, res) => {
  const entry = await StockInward.findById(req.params.id).populate(
    'product',
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
    const { product, data } = await buildStockInwardPayload(req.body);
    const oldProductId = String(existingEntry.product);
    const newProductId = String(product._id);
    const previousState = {
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
    let restoredOriginalProduct = false;
    let appliedNewProduct = false;

    if (oldProductId === newProductId) {
      const quantityDelta = data.quantity - existingEntry.quantity;
      await applyProductStockChange({
        productId: product._id,
        quantityDelta,
        costPrice: data.costPrice,
      });
    } else {
      await applyProductStockChange({
        productId: existingEntry.product,
        quantityDelta: -existingEntry.quantity,
      });
      restoredOriginalProduct = true;

      try {
        await applyProductStockChange({
          productId: product._id,
          quantityDelta: data.quantity,
          costPrice: data.costPrice,
        });
        appliedNewProduct = true;
      } catch (error) {
        await applyProductStockChange({
          productId: existingEntry.product,
          quantityDelta: existingEntry.quantity,
          costPrice: existingEntry.costPrice,
        });
        throw error;
      }
    }

    Object.assign(existingEntry, data);
    try {
      await existingEntry.save();
    } catch (error) {
      Object.assign(existingEntry, previousState);

      if (oldProductId === newProductId) {
        await applyProductStockChange({
          productId: product._id,
          quantityDelta: existingEntry.quantity - data.quantity,
          costPrice: existingEntry.costPrice,
        });
      } else {
        if (restoredOriginalProduct) {
          await applyProductStockChange({
            productId: previousState.product,
            quantityDelta: previousState.quantity,
            costPrice: previousState.costPrice,
          });
        }

        if (appliedNewProduct) {
          await applyProductStockChange({
            productId: product._id,
            quantityDelta: -data.quantity,
          });
          await syncLatestProductCostPrice(product._id, 0);
        }
      }

      throw error;
    }

    if (oldProductId !== newProductId) {
      await syncLatestProductCostPrice(oldProductId, 0);
    }

    const populatedEntry = await StockInward.findById(existingEntry._id).populate(
      'product',
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

  await applyProductStockChange({
    productId: entry.product,
    quantityDelta: -entry.quantity,
  });
  await StockInward.deleteOne({ _id: entry._id });
  await syncLatestProductCostPrice(entry.product, 0);

  res.json({ message: 'Stock inward entry deleted successfully' });
};
