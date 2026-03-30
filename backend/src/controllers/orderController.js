import crypto from 'crypto';
import Razorpay from 'razorpay';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

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

export const addOrderItems = async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
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

  const order = await Order.create({
    user: req.user._id,
    orderItems: sanitizedItems,
    shippingAddress,
    paymentMethod,
    itemsPrice: Number(itemsPrice) || 0,
    taxPrice: Number(taxPrice) || 0,
    shippingPrice: Number(shippingPrice) || 0,
    totalPrice: Number(totalPrice) || 0,
    isPaid: false,
    paidAt: null,
    paymentResult:
      paymentMethod === 'COD'
        ? {
            status: 'COD_PENDING_COLLECTION',
          }
        : {},
  });

  await Promise.all(
    sanitizedItems.map((item) =>
      Product.findByIdAndUpdate(item.product, {
        $inc: { countInStock: -item.qty },
      })
    )
  );

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

export const createRazorpayOrder = async (req, res) => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    res.status(500);
    throw new Error('Razorpay keys not configured');
  }

  const parsedAmount = Number(req.body.amount);

  if (!parsedAmount || parsedAmount <= 0) {
    res.status(400);
    throw new Error('A valid amount is required');
  }

  const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  const order = await instance.orders.create({
    amount: Math.round(parsedAmount * 100),
    currency: 'INR',
    receipt: `kssports_${Date.now()}`,
  });

  res.json({
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    key_id: process.env.RAZORPAY_KEY_ID,
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

  if (req.body.razorpay_payment_id) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      res.status(400);
      throw new Error('Invalid payment signature');
    }

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
