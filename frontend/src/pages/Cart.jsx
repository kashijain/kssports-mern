import { useCartStore, useAuthStore, useOrderStore } from '../store/useStore';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, ShieldCheck, Tag, ShoppingBag, Info, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useState, useEffect } from 'react';

const Cart = () => {
  const { userInfo } = useAuthStore();
  const { cartItems, addToCart, removeFromCart, clearCart } = useCartStore();
  const { createOrder } = useOrderStore();
  const navigate = useNavigate();

  const [showCheckout, setShowCheckout] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({ address: '', city: '', postalCode: '', country: '' });
  const [paymentMethod, setPaymentMethod] = useState('Razorpay');
  const [isProcessing, setIsProcessing] = useState(false);

  const isCodEligible = cartItems.every(ite => ite.codAvailable !== false);

  useEffect(() => {
     if (!isCodEligible && paymentMethod === 'COD') setPaymentMethod('Razorpay');
  }, [isCodEligible, paymentMethod]);

  const handleQtyChange = (product, qty) => {
    addToCart(product, Number(qty));
  };

  const removeItemHandler = (id) => {
    removeFromCart(id);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.qty * item.price, 0).toFixed(2);
  const shipping = subtotal > 50 ? 0 : 15;
  const tax = (subtotal * 0.08).toFixed(2);
  const total = (Number(subtotal) + shipping + Number(tax)).toFixed(2);

  const loadRazorpaySDK = () => {
     return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => { resolve(true); };
        script.onerror = () => { resolve(false); };
        document.body.appendChild(script);
     });
  };

  const handlePlaceOrder = async (e) => {
     e.preventDefault();
     if (!userInfo) {
        toast.error('Please login to place an order');
        navigate('/login');
        return;
     }

     setIsProcessing(true);
     try {
        const order = await createOrder({
           orderItems: cartItems,
           shippingAddress,
           paymentMethod,
           itemsPrice: Number(subtotal),
           taxPrice: Number(tax),
           shippingPrice: shipping,
           totalPrice: Number(total),
        });

        if (paymentMethod === 'COD') {
           toast.success('Order placed successfully via Cash on Delivery!');
           clearCart();
           navigate('/profile');
        } else {
           const sdkReady = await loadRazorpaySDK();
           if (!sdkReady) { toast.error('Razorpay SDK failed to load'); setIsProcessing(false); return; }

           const { data: rzpyOrder } = await api.post('/orders/razorpay', { amount: Number(total) });

           const options = {
              key: rzpyOrder.key_id,
              amount: rzpyOrder.amount,
              currency: rzpyOrder.currency,
              name: "K.S. Sports",
              description: "Premium Sports Gear",
              order_id: rzpyOrder.id,
              handler: async function (response) {
                 try {
                    await api.put(`/orders/${order._id}/pay`, {
                       razorpay_payment_id: response.razorpay_payment_id,
                       razorpay_order_id: response.razorpay_order_id,
                       razorpay_signature: response.razorpay_signature
                    });
                    toast.success('Payment successful! Order placed.');
                    clearCart();
                    navigate('/profile');
                 } catch (err) {
                    toast.error('Payment verification failed.');
                 }
              },
              prefill: { name: userInfo.name, email: userInfo.email },
              theme: { color: "#2563EB" },
              modal: {
                 ondismiss: function() {
                    toast.error('Payment cancelled. Order saved as unpaid.');
                    clearCart();
                    navigate('/profile');
                 }
              }
           };

           const rzp = new window.Razorpay(options);
           rzp.open();
        }
     } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to place order');
     } finally {
        setIsProcessing(false);
     }
  };

  return (
    <div className="bg-slate-50 dark:bg-dark-bg min-h-screen pt-24 pb-20">
      <div className="container-bound max-w-7xl">
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">Shopping Cart</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
        
        {cartItems.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 bg-white dark:bg-dark-card rounded-3xl border border-slate-100 dark:border-dark-border shadow-sm flex flex-col items-center"
          >
            <div className="w-24 h-24 bg-slate-50 dark:bg-dark-bg rounded-full flex items-center justify-center mb-6 text-slate-400 border border-slate-100 dark:border-dark-border">
              <ShoppingBag size={40} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">Your cart is empty</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-10 leading-relaxed">
              Looks like you haven't added anything to your cart yet. Let's get you ready for the game and find standard-setting gear.
            </p>
            <Link to="/shop" className="btn-primary inline-flex px-10 h-14 items-center">
              Explore Premium Gear
            </Link>
          </motion.div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            
            {/* Cart Items List */}
            <div className="lg:w-2/3">
              <div className="bg-white dark:bg-dark-card rounded-3xl shadow-sm border border-slate-100 dark:border-dark-border overflow-hidden">
                <div className="p-6 md:px-8 md:py-5 hidden sm:grid grid-cols-12 gap-4 border-b border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">
                  <div className="col-span-6 flex items-center">Product Details</div>
                  <div className="col-span-3 text-center flex items-center justify-center">Quantity</div>
                  <div className="col-span-2 text-right flex items-center justify-end">Price</div>
                  <div className="col-span-1 text-right"></div>
                </div>
                
                <div className="divide-y divide-slate-100 dark:divide-dark-border px-6 md:px-8">
                  <AnimatePresence>
                    {cartItems.map((item) => (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} layout
                        key={item._id} 
                        className="py-6 sm:py-8 flex flex-col sm:grid sm:grid-cols-12 items-center sm:items-start gap-6 group"
                      >
                        {/* Img & Title */}
                        <div className="col-span-6 w-full flex items-center gap-6">
                          <Link to={`/product/${item._id}`} className="shrink-0 w-24 h-24 bg-slate-50 dark:bg-dark-bg rounded-2xl overflow-hidden border border-slate-200 dark:border-dark-border shadow-sm">
                            <img src={item.images && item.images.length > 0 ? item.images[0] : item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]" />
                          </Link>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">{item.category}</span>
                            <Link to={`/product/${item._id}`} className="font-bold text-slate-900 dark:text-white hover:text-primary-600 transition-colors text-lg line-clamp-2 leading-tight">
                              {item.name}
                            </Link>
                            <span className="text-slate-500 dark:text-slate-400 font-medium text-sm block sm:hidden mt-2">${item.price.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        {/* Quantity Selector */}
                        <div className="col-span-3 w-full sm:w-auto flex justify-center sm:block pt-2 sm:pt-0">
                          <div className="flex items-center border border-slate-200 dark:border-dark-border rounded-xl w-32 h-12 bg-slate-50 dark:bg-dark-bg overflow-hidden mx-auto shadow-inner shadow-slate-100 dark:shadow-black">
                            <button onClick={() => handleQtyChange(item, Math.max(1, item.qty - 1))} className="w-10 h-full flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white transition-colors">-</button>
                            <div className="w-12 h-full flex items-center justify-center font-bold text-slate-900 dark:text-white bg-transparent">{item.qty}</div>
                            <button onClick={() => handleQtyChange(item, Math.min(item.countInStock, item.qty + 1))} className="w-10 h-full flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white transition-colors">+</button>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="col-span-2 w-full sm:w-auto hidden sm:flex justify-end items-center text-xl font-extrabold text-slate-900 dark:text-white h-12 pt-2 sm:pt-0">
                          ${(item.price * item.qty).toFixed(2)}
                        </div>
                        
                        {/* Remove Action */}
                        <div className="col-span-1 w-full sm:w-auto flex justify-end h-12 items-center pt-2 sm:pt-0">
                          <button 
                            onClick={() => removeItemHandler(item._id)}
                            className="p-3 text-slate-400 hover:text-red-500 bg-white hover:bg-red-50 dark:bg-transparent dark:hover:bg-red-900/20 rounded-xl transition-all shadow-sm border border-transparent hover:border-red-100 dark:hover:border-red-900/50"
                            title="Remove item"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:w-1/3">
              <div className="bg-white dark:bg-dark-card rounded-3xl shadow-md border border-slate-100 dark:border-dark-border p-6 md:p-8 sticky top-28">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Order Summary</h2>
                
                {/* Promo Code */}
                <div className="mb-8 relative">
                  <div className="relative flex items-center bg-slate-50 dark:bg-dark-bg rounded-xl border border-slate-200 dark:border-dark-border p-1 focus-within:ring-2 focus-within:ring-primary-600/20 focus-within:border-primary-600 transition-all">
                     <Tag className="absolute left-4 text-slate-400" size={18}/>
                     <input type="text" placeholder="Promo code" className="w-full bg-transparent pl-11 pr-24 h-12 text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400" />
                     <button className="absolute right-2 font-bold text-sm text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-primary-600 dark:hover:bg-primary-600 dark:hover:text-white px-5 py-2.5 rounded-lg transition-colors">Apply</button>
                  </div>
                </div>

                {/* Subtotals */}
                <div className="space-y-4 mb-8 text-[15px] font-medium border-t border-slate-100 dark:border-dark-border pt-6">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-900 dark:text-white">${subtotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Shipping</span>
                    {shipping === 0 ? (
                      <span className="font-bold text-green-500 uppercase tracking-widest text-xs mt-1">Free</span>
                    ) : (
                      <span className="font-bold text-slate-900 dark:text-white">${shipping.toFixed(2)}</span>
                    )}
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Tax (8%)</span>
                    <span className="font-bold text-slate-900 dark:text-white">${tax}</span>
                  </div>
                  
                  {shipping > 0 && (
                    <div className="p-4 bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 text-primary-700 dark:text-primary-300 text-sm rounded-xl flex items-start gap-3 mt-4 leading-relaxed">
                       <Info size={18} className="shrink-0 mt-0.5 text-primary-500"/>
                       <span>Add <span className="font-bold">${(50 - subtotal).toFixed(2)}</span> more to your cart to get <strong className="font-black text-primary-600 dark:text-primary-400">Free Shipping!</strong></span>
                    </div>
                  )}

                  <div className="border-t border-slate-200 dark:border-dark-border pt-6 pb-2 mt-6 flex justify-between items-end">
                    <span className="font-bold text-lg text-slate-900 dark:text-white uppercase tracking-wider">Total</span>
                    <span className="font-black text-4xl text-slate-900 dark:text-white tracking-tight leading-none">${total}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pb-2">
                  <button onClick={() => setShowCheckout(true)} className="w-full btn-primary h-16 text-lg tracking-wide font-bold shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2">
                    Proceed to Checkout <ArrowRight size={20} />
                  </button>
                  <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5 mt-2">
                    <ShieldCheck size={14} className="text-green-500" /> Secure SSL Checkout
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isProcessing && setShowCheckout(false)} />
             
             <motion.div initial={{opacity: 0, scale: 0.95, y: 20}} animate={{opacity: 1, scale: 1, y: 0}} exit={{opacity: 0, scale: 0.95, y: 20}} className="relative w-full max-w-2xl bg-white dark:bg-dark-card rounded-3xl shadow-2xl border border-slate-100 dark:border-dark-border overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-dark-border bg-slate-50 dark:bg-dark-bg">
                   <h3 className="font-extrabold text-2xl text-slate-900 dark:text-white tracking-tight">Secure Checkout</h3>
                   <button onClick={() => !isProcessing && setShowCheckout(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 dark:bg-gray-800 text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                      <X size={20} />
                   </button>
                </div>
                
                <div className="p-6 md:p-8 overflow-y-auto hide-scrollbar">
                   <form id="checkoutAuthForm" onSubmit={handlePlaceOrder} className="space-y-8">
                      {/* Shipping Details */}
                      <div>
                         <h4 className="text-sm font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-4">1. Shipping Address</h4>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2 space-y-1.5">
                               <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Street Address</label>
                               <input required value={shippingAddress.address} onChange={(e) => setShippingAddress({...shippingAddress, address: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-600/30 outline-none text-slate-900 dark:text-white font-medium" />
                            </div>
                            <div className="space-y-1.5">
                               <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">City</label>
                               <input required value={shippingAddress.city} onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-600/30 outline-none text-slate-900 dark:text-white font-medium" />
                            </div>
                            <div className="space-y-1.5">
                               <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Postal Code</label>
                               <input required value={shippingAddress.postalCode} onChange={(e) => setShippingAddress({...shippingAddress, postalCode: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-600/30 outline-none text-slate-900 dark:text-white font-medium" />
                            </div>
                            <div className="sm:col-span-2 space-y-1.5">
                               <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Country</label>
                               <input required value={shippingAddress.country} onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-600/30 outline-none text-slate-900 dark:text-white font-medium" />
                            </div>
                         </div>
                      </div>

                      {/* Payment Method */}
                      <div>
                         <h4 className="text-sm font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-4">2. Payment Method</h4>
                         
                         {!isCodEligible && (
                            <div className="mb-4 p-4 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 flex items-start gap-3">
                               <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={18} />
                               <p className="text-sm text-orange-800 dark:text-orange-300 font-medium leading-relaxed">
                                  Some items in your cart are not eligible for Cash on Delivery. Please use Online Payment for this order.
                               </p>
                            </div>
                         )}

                         <div className="space-y-3">
                            <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'Razorpay' ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/10 shadow-sm' : 'border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg'}`}>
                               <div className="flex items-center gap-4">
                                  <input type="radio" name="paymentMethod" value="Razorpay" checked={paymentMethod === 'Razorpay'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-primary-600 border-slate-300 focus:ring-primary-600" />
                                  <div className="flex-1">
                                     <span className="font-bold text-slate-900 dark:text-white block">Pay Online (Razorpay)</span>
                                     <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Secured via Credit Cards, UPI, Netbanking.</span>
                                  </div>
                               </div>
                            </label>
                            
                            <label className={`block p-4 rounded-xl border-2 transition-all ${!isCodEligible ? 'opacity-50 cursor-not-allowed grayscale border-slate-200 dark:border-dark-border bg-slate-100 dark:bg-dark-card' : paymentMethod === 'COD' ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/10 shadow-sm cursor-pointer' : 'border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg cursor-pointer'}`}>
                               <div className="flex items-center gap-4">
                                  <input type="radio" name="paymentMethod" value="COD" disabled={!isCodEligible} checked={paymentMethod === 'COD'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-primary-600 border-slate-300 focus:ring-primary-600 disabled:opacity-50" />
                                  <div className="flex-1">
                                     <span className="font-bold text-slate-900 dark:text-white block">Cash on Delivery</span>
                                     <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pay physically to the delivery agent.</span>
                                  </div>
                               </div>
                            </label>
                         </div>
                      </div>
                   </form>
                </div>
                
                <div className="p-6 border-t border-slate-100 dark:border-dark-border bg-slate-50 dark:bg-dark-bg flex items-center justify-between gap-4 shrink-0">
                   <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">Total to Pay</span>
                      <span className="text-2xl font-black text-slate-900 dark:text-white">${total}</span>
                   </div>
                   <button form="checkoutAuthForm" disabled={isProcessing} className="btn-primary px-8 h-14 tracking-wide shadow-lg shadow-primary-600/20 w-full sm:w-auto disabled:opacity-50">
                      {isProcessing ? 'Processing...' : `Pay ${paymentMethod === 'Razorpay' ? 'Securely' : 'on Delivery'}`}
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Cart;
