import { formatPrice } from '../../utils/price';

export const storeInfo = {
  name: 'K.S. Sports',
  address: 'K.S. Sports, Shiv Colony',
  phone: '+91 7082252531',
};

export const formatBillDate = (dateValue) => {
  if (!dateValue) {
    return new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  return new Date(dateValue).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const generateBillNumber = (sale) => {
  const saleDate = new Date(sale?.saleDate || sale?.createdAt || Date.now());
  const dateCode = saleDate.toISOString().slice(0, 10).replaceAll('-', '');
  const token = String(sale?._id || sale?.createdAt || Date.now()).slice(-6).toUpperCase();

  return `KS-OFF-${dateCode}-${token}`;
};

export const getBillTotals = (sale) => {
  const subtotal = Number(sale?.totalSale) || 0;
  const pendingAmount = Math.max(Number(sale?.pendingAmount) || 0, 0);
  const paidAmount = sale?.receivedAmount !== undefined
    ? Number(sale.receivedAmount) || 0
    : Math.max(subtotal - pendingAmount, 0);

  return {
    subtotal,
    pendingAmount,
    paidAmount,
  };
};

export const getBillItems = (sale) => {
  if (Array.isArray(sale?.items) && sale.items.length > 0) {
    return sale.items.map((item) => ({
      productName: item.productName || item.product?.name || 'Offline Sale Item',
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.salePrice) || 0,
      lineTotal: Number(item.totalSale) || (Number(item.quantity) || 0) * (Number(item.salePrice) || 0),
    }));
  }

  const quantity = Number(sale?.quantitySold) || 0;
  const unitPrice = Number(sale?.salePricePerItem) || 0;

  return [
    {
      productName: sale?.productName || sale?.product?.name || 'Offline Sale Item',
      quantity,
      unitPrice,
      lineTotal: Number(sale?.totalSale) || quantity * unitPrice,
    },
  ];
};

export const formatPhoneForWhatsApp = (phone) => {
  const sanitizedPhone = String(phone || '').replace(/[\s\-+()]/g, '');

  if (!sanitizedPhone) {
    return null;
  }

  if (/^\d{10}$/.test(sanitizedPhone)) {
    return `91${sanitizedPhone}`;
  }

  if (/^91\d{10}$/.test(sanitizedPhone)) {
    return sanitizedPhone;
  }

  return null;
};

export const buildInvoiceDataFromSale = (sale) => {
  const billNumber = generateBillNumber(sale);
  const billDate = formatBillDate(sale?.saleDate || sale?.createdAt);
  const billItems = getBillItems(sale);
  const { subtotal, paidAmount, pendingAmount } = getBillTotals(sale);

  return {
    customerName: sale?.customerName || 'Walk-in Customer',
    customerPhone: sale?.customerPhone || '',
    billNumber,
    date: billDate,
    totalAmount: subtotal,
    paidAmount,
    pendingAmount,
    paymentMode: sale?.paymentMode || 'Cash',
    products: billItems,
    shopName: storeInfo.name,
  };
};

export const buildWhatsAppBillMessage = (invoiceData) => {
  const productLines = Array.isArray(invoiceData?.products) && invoiceData.products.length > 0
    ? invoiceData.products.map((item, index) => `${index + 1}. ${item.productName} x ${item.quantity}`)
    : ['1. Offline Sale Item x 1'];

  return [
    `${invoiceData?.shopName || storeInfo.name} Invoice`,
    '',
    `Customer: ${invoiceData?.customerName || 'Walk-in Customer'}`,
    `Bill No: ${invoiceData?.billNumber || '-'}`,
    `Date: ${invoiceData?.date || formatBillDate()}`,
    `Total Amount: ${formatPrice(invoiceData?.totalAmount || 0)}`,
    `Payment Mode: ${invoiceData?.paymentMode || 'Cash'}`,
    '',
    'Products:',
    ...productLines,
    '',
    'Thank you for shopping with K.S. Sports.',
  ].join('\n');
};
