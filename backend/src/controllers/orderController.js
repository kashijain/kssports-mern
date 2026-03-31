import crypto from 'crypto';
import Razorpay from 'razorpay';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

const roundCurrency = (value) => Number(Number(value || 0).toFixed(2));

const calculateOrderAmounts = (baseAmount) => {
  const normalizedBaseAmount = roundCurrency(baseAmount);
  const convenienceCharge = roundCurrency(normalizedBaseAmount * 0.02);
  const tax = 0;
  const finalAmount = roundCurrency(normalizedBaseAmount + convenienceCharge);

  return {
    baseAmount: normalizedBaseAmount,
    convenienceCharge,
    tax,
    finalAmount,
  };
};

const calculateOrderAmountsFromItems = (orderItems) => {
  const baseAmount = orderItems.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.qty),
    0
  );

  return calculateOrderAmounts(baseAmount);
};

const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    const error = new Error('Razorpay keys not configured');
    error.statusCode = 500;
    throw error;
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const verifyRazorpaySignature = ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    const error = new Error('Payment verification details are required');
    error.statusCode = 400;
    throw error;
  }

  if (!process.env.RAZORPAY_KEY_SECRET) {
    const error = new Error('Razorpay secret is not configured');
    error.statusCode = 500;
    throw error;
  }

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(String(razorpay_signature));

  return (
    expectedBuffer.length === actualBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  );
};

const mapOrderItemsFromProducts = async (orderItems) => {
  const productIds = orderItems.map((item) => item._id || item.product);
  const products = await Product.find({ _id: { $in: productIds } });

  return orderItems.map((item) => {
    const matchedProduct = products.find(
      (product) => product._id.toString() === String(item._id || item.product)
    );

    if (!matchedProduct) {
      throw new Error(`Product not found for item ${item.name || item._id}`);
    }

    if (matchedProduct.countInStock < Number(item.qty)) {
      throw new Error(`Insufficient stock for ${matchedProduct.name}`);
    }

    return {
      name: matchedProduct.name,
      qty: Number(item.qty),
      image: matchedProduct.image,
      price: matchedProduct.price,
      product: matchedProduct._id,
    };
  });
};

const ensureStockAvailability = async (orderItems) => {
  const productIds = orderItems.map((item) => item.product || item._id);
  const products = await Product.find({ _id: { $in: productIds } });

  orderItems.forEach((item) => {
    const matchedProduct = products.find(
      (product) => product._id.toString() === String(item.product || item._id)
    );

    if (!matchedProduct) {
      throw new Error(`Product not found for item ${item.name || item._id}`);
    }

    if (matchedProduct.countInStock < Number(item.qty)) {
      throw new Error(`Insufficient stock for ${matchedProduct.name}`);
    }
  });
};

const decrementStockForItems = async (orderItems) => {
  await Promise.all(
    orderItems.map((item) =>
      Product.findByIdAndUpdate(item.product, {
        $inc: { countInStock: -Number(item.qty) },
      })
    )
  );
};

export const addOrderItems = async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
  } = req.body;

  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }

  if (
    !shippingAddress?.address ||
    !shippingAddress?.city ||
    !shippingAddress?.postalCode ||
    !shippingAddress?.country
  ) {
    res.status(400);
    throw new Error('Complete shipping address is required');
  }

  const sanitizedItems = await mapOrderItemsFromProducts(orderItems);
  const { baseAmount, convenienceCharge, tax, finalAmount } =
    calculateOrderAmountsFromItems(sanitizedItems);

  const order = await Order.create({
    user: req.user._id,
    orderItems: sanitizedItems,
    shippingAddress,
    paymentMethod,
    itemsPrice: baseAmount,
    convenienceCharge,
    taxPrice: tax,
    shippingPrice: 0,
    totalPrice: finalAmount,
    isPaid: false,
    paidAt: null,
    paymentResult:
      paymentMethod === 'COD'
        ? {
            status: 'COD_PENDING_COLLECTION',
          }
        : {
            status: 'PENDING_PAYMENT',
          },
  });

  if (paymentMethod === 'COD') {
    await ensureStockAvailability(sanitizedItems);
    await decrementStockForItems(sanitizedItems);
  }

  res.status(201).json(order);
};

export const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const canAccess =
    req.user.role === 'seller' ||
    order.user._id.toString() === req.user._id.toString();

  if (!canAccess) {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }

  res.json(order);
};

export const createPaymentOrder = async (req, res) => {
  const parsedAmount = Number(req.body.baseAmount);

  if (!parsedAmount || parsedAmount <= 0) {
    res.status(400);
    throw new Error('A valid base amount is required');
  }

  const { baseAmount, convenienceCharge, tax, finalAmount } =
    calculateOrderAmounts(parsedAmount);

  const instance = getRazorpayInstance();

  const order = await instance.orders.create({
    amount: Math.round(finalAmount * 100),
    currency: 'INR',
    receipt: `kssports_${Date.now()}`,
  });

  res.json({
    success: true,
    order_id: order.id,
    baseAmount,
    convenienceCharge,
    tax,
    finalAmount,
    currency: order.currency,
    key_id: process.env.RAZORPAY_KEY_ID,
  });
};

export const verifyPaymentSignature = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const isValidSignature = verifyRazorpaySignature({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });

  if (!isValidSignature) {
    res.status(400);
    return res.json({
      success: false,
      message: 'Payment verification failed',
    });
  }

  return res.json({
    success: true,
    message: 'Payment verified successfully',
  });
};

export const updateOrderToPaid = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const canAccess =
    req.user.role === 'seller' || order.user.toString() === req.user._id.toString();

  if (!canAccess) {
    res.status(403);
    throw new Error('Not authorized to update this order');
  }

  if (order.isPaid) {
    return res.json(order);
  }

  if (req.body.razorpay_payment_id) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    await ensureStockAvailability(order.orderItems);
    await decrementStockForItems(order.orderItems);

    order.paymentResult = {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      status: 'PAID',
    };
  } else {
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer?.email_address || '',
    };
  }

  order.isPaid = true;
  order.paidAt = Date.now();

  const updatedOrder = await order.save();
  res.json(updatedOrder);
};

export const cancelUnpaidOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const canAccess =
    req.user.role === 'seller' || order.user.toString() === req.user._id.toString();

  if (!canAccess) {
    res.status(403);
    throw new Error('Not authorized to cancel this order');
  }

  if (order.isPaid) {
    res.status(400);
    throw new Error('Paid orders cannot be cancelled here');
  }

  if (order.paymentMethod !== 'Razorpay') {
    res.status(400);
    throw new Error('Only unpaid Razorpay orders can be cancelled here');
  }

  await order.deleteOne();

  res.json({
    success: true,
    message: 'Pending unpaid order cancelled',
  });
};

export const updateOrderToDelivered = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.isDelivered = true;
  order.deliveredAt = Date.now();

  const updatedOrder = await order.save();
  res.json(updatedOrder);
};

export const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
};

export const getOrders = async (req, res) => {
  const orders = await Order.find({})
    .populate('user', 'id name email')
    .sort({ createdAt: -1 });

  res.json(orders);
};
