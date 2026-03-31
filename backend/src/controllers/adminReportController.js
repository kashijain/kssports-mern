import OfflineSale from '../models/OfflineSale.js';
import Order from '../models/Order.js';

const roundCurrency = (value) => Number(Number(value || 0).toFixed(2));

const getStartOfDay = (value) => {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const getEndOfDay = (value) => {
  const date = new Date(value);
  date.setUTCHours(23, 59, 59, 999);
  return date;
};

const normalizeRange = ({ from, to }) => {
  const today = new Date();
  const defaultTo = getEndOfDay(today);
  const defaultFrom = getStartOfDay(today);
  const fromDate = from ? getStartOfDay(from) : defaultFrom;
  const toDate = to ? getEndOfDay(to) : defaultTo;

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return null;
  }

  return fromDate <= toDate
    ? { fromDate, toDate }
    : { fromDate: toDate, toDate: fromDate };
};

const getDateKey = (value) => getStartOfDay(value).toISOString().slice(0, 10);

const enumerateDateKeys = (fromDate, toDate) => {
  const keys = [];
  const cursor = new Date(fromDate);

  while (cursor <= toDate) {
    keys.push(getDateKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return keys;
};

const createEmptyDay = (date) => ({
  date,
  offlineSale: 0,
  onlineSale: 0,
  totalSale: 0,
  totalProfit: 0,
  status: '',
  offlineTransactions: 0,
  onlineTransactions: 0,
  totalQuantitySold: 0,
});

const INVALID_OFFLINE_PRODUCT_NAMES = new Set(['close', 'no sale', 'sunday']);

const normalizeOfflineProductName = (value = '') =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const isFiniteNumber = (value) => Number.isFinite(Number(value));

const isValidOfflineSalesRow = (entry) => {
  const productName = normalizeOfflineProductName(entry.productName);
  const quantity = Number(entry.quantitySold);
  const totalSale = Number(entry.totalSale);
  const totalCost = Number(entry.totalCost);

  return (
    productName &&
    !INVALID_OFFLINE_PRODUCT_NAMES.has(productName) &&
    isFiniteNumber(quantity) &&
    quantity > 0 &&
    isFiniteNumber(totalSale) &&
    isFiniteNumber(totalCost)
  );
};

export const getSalesReport = async (req, res) => {
  const normalizedRange = normalizeRange(req.query);

  if (!normalizedRange) {
    res.status(400);
    throw new Error('Valid from/to dates are required');
  }

  const { fromDate, toDate } = normalizedRange;
  const dateKeys = enumerateDateKeys(fromDate, toDate);
  const dayMap = new Map(dateKeys.map((date) => [date, createEmptyDay(date)]));

  const offlineSales = await OfflineSale.find({
    saleDate: { $gte: fromDate, $lte: toDate },
  }).sort({ saleDate: 1, createdAt: 1 });

  const onlineOrders = await Order.find({
    isPaid: true,
    paidAt: { $gte: fromDate, $lte: toDate },
  })
    .populate('orderItems.product', 'costPrice')
    .sort({ paidAt: 1, createdAt: 1 });

  const summary = {
    totalOfflineSale: 0,
    totalOnlineSale: 0,
    combinedTotalSale: 0,
    combinedTotalCost: 0,
    combinedTotalProfit: 0,
    totalTransactions: 0,
    totalQuantitySold: 0,
  };

  offlineSales.forEach((entry) => {
    const key = getDateKey(entry.saleDate);
    const day = dayMap.get(key) || createEmptyDay(key);

    if (entry.rowType === 'day_status' && entry.dayStatus) {
      day.status = entry.dayStatus;
    }

    if (!isValidOfflineSalesRow(entry)) {
      dayMap.set(key, day);
      return;
    }

    const entrySale = roundCurrency(Number(entry.totalSale));
    const entryCost = roundCurrency(Number(entry.totalCost));
    const entryProfit = roundCurrency(entrySale - entryCost);
    const entryQty = Number(entry.quantitySold);

    day.offlineSale = roundCurrency(day.offlineSale + entrySale);
    day.totalSale = roundCurrency(day.totalSale + entrySale);
    day.totalProfit = roundCurrency(day.totalProfit + entryProfit);
    day.offlineTransactions += 1;
    day.totalQuantitySold += entryQty;

    dayMap.set(key, day);

    summary.totalOfflineSale = roundCurrency(summary.totalOfflineSale + entrySale);
    summary.combinedTotalSale = roundCurrency(summary.combinedTotalSale + entrySale);
    summary.combinedTotalCost = roundCurrency(summary.combinedTotalCost + entryCost);
    summary.combinedTotalProfit = roundCurrency(summary.combinedTotalProfit + entryProfit);
    summary.totalTransactions += 1;
    summary.totalQuantitySold += entryQty;
  });

  onlineOrders.forEach((order) => {
    const key = getDateKey(order.paidAt || order.createdAt);
    const day = dayMap.get(key) || createEmptyDay(key);
    const orderSale = roundCurrency(order.totalPrice);
    const orderQty = order.orderItems.reduce(
      (sum, item) => sum + Number(item.qty || 0),
      0
    );
    const orderCost = roundCurrency(
      order.orderItems.reduce((sum, item) => {
        const productCost = Number(item.product?.costPrice || 0);
        return sum + productCost * Number(item.qty || 0);
      }, 0)
    );
    const orderProfit = roundCurrency(orderSale - orderCost);

    day.onlineSale = roundCurrency(day.onlineSale + orderSale);
    day.totalSale = roundCurrency(day.totalSale + orderSale);
    day.totalProfit = roundCurrency(day.totalProfit + orderProfit);
    day.onlineTransactions += 1;
    day.totalQuantitySold += orderQty;
    dayMap.set(key, day);

    summary.totalOnlineSale = roundCurrency(summary.totalOnlineSale + orderSale);
    summary.combinedTotalSale = roundCurrency(summary.combinedTotalSale + orderSale);
    summary.combinedTotalCost = roundCurrency(summary.combinedTotalCost + orderCost);
    summary.combinedTotalProfit = roundCurrency(summary.combinedTotalProfit + orderProfit);
    summary.totalTransactions += 1;
    summary.totalQuantitySold += orderQty;
  });

  const dailyBreakdown = dateKeys.map((date) => dayMap.get(date) || createEmptyDay(date));

  res.json({
    range: {
      from: getDateKey(fromDate),
      to: getDateKey(toDate),
    },
    summary,
    dailyBreakdown,
  });
};
