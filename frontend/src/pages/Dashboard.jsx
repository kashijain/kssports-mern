import { useState, useEffect } from 'react';
import { useAuthStore, useProductStore, useOrderStore } from '../store/useStore';
import toast from 'react-hot-toast';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Package, ShoppingBag, Users, DollarSign, Edit, Trash2, 
  Plus, Settings, LayoutDashboard, ChevronRight, CheckCircle2,
  Clock, XCircle, Search, Filter, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const { userInfo } = useAuthStore();
  const { products, fetchProducts, deleteProduct, createProduct } = useProductStore();
  const { orders, fetchMyOrders, fetchAllOrders, deliverOrder } = useOrderStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedImages, setSelectedImages] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith('/admin') && userInfo?.role !== 'seller') {
      navigate('/profile', { replace: true });
    }
  }, [location, userInfo, navigate]);

  useEffect(() => {
    if (userInfo?.role === 'seller') {
      const path = location.pathname;
      if (path === '/admin/add-product') {
        setActiveTab('add-product');
      } else if (path === '/admin/manage-products') {
        setActiveTab('inventory');
        fetchProducts();
      } else if (path === '/admin/orders') {
        setActiveTab('orders-admin');
        fetchAllOrders();
      } else {
        setActiveTab('overview');
        fetchProducts();
      }
    } else {
      fetchMyOrders();
      setActiveTab('orders');
    }
  }, [location.pathname, userInfo, fetchProducts, fetchAllOrders, fetchMyOrders]);

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
       try {
          await deleteProduct(id);
          toast.success('Product deleted successfully');
       } catch (err) {
          toast.error('Failed to delete product');
       }
    }
  };

  const handleDeliverOrder = async (id) => {
     try {
        await deliverOrder(id);
        toast.success('Order marked as delivered');
     } catch (err) {
        toast.error('Failed to update order');
     }
  };

  const handleImageChange = (e) => {
     const files = Array.from(e.target.files);
     if (files.length === 0) return;
     
     if (selectedImages.length + files.length > 4) {
        toast.error('You can only upload a maximum of 4 images');
        return;
     }

     const newImages = files.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file)
     }));

     setSelectedImages(prev => [...prev, ...newImages]);
     e.target.value = null; // reset input
  };

  const removeImage = (indexToRemove) => {
     setSelectedImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const AdminDashboard = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-dark-card p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-dark-border gap-4">
         <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">Admin Overview</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your elite store's inventory and elite performance.</p>
         </div>
         <button onClick={() => navigate('/admin/add-product')} className="btn-primary h-14 shadow-lg shadow-primary-600/20 px-6 tracking-wide font-bold w-full sm:w-auto">
            <Plus size={20}/> Add New Product
         </button>
      </div>

      {activeTab === 'overview' && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Revenue', value: '$24,590.50', icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10' },
          { title: 'Total Orders', value: '3,456', icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { title: 'Total Products', value: products?.length || 0, icon: Package, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-600/10' },
          { title: 'Total Athletes', value: '12,890', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="bg-white dark:bg-dark-card p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-dark-border relative overflow-hidden group"
          >
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${stat.bg} mix-blend-multiply dark:mix-blend-screen opacity-50 group-hover:scale-150 transition-transform duration-700`}></div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 relative z-10 ${stat.bg} border border-${stat.color.split('-')[1]}-100 dark:border-${stat.color.split('-')[1]}-900/50`}>
               <stat.icon className={stat.color} size={28} />
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest mb-1 relative z-10">{stat.title}</h3>
            <p className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight relative z-10">{stat.value}</p>
          </motion.div>
        ))}
      </div>
      )}

      {(activeTab === 'overview' || activeTab === 'inventory') && (
      <div className="bg-white dark:bg-dark-card rounded-3xl shadow-sm border border-slate-100 dark:border-dark-border overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-dark-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Product Inventory</h2>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
             <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                <input type="text" placeholder="Search products..." className="w-full bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30 transition-shadow text-slate-900 dark:text-white" />
             </div>
             <button className="p-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-slate-500 hover:text-primary-600 transition-colors">
                <Filter size={18} />
             </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-dark-bg/80 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                <th className="px-6 py-5 border-b border-slate-100 dark:border-dark-border">Product Details</th>
                <th className="px-6 py-5 border-b border-slate-100 dark:border-dark-border text-center">Price</th>
                <th className="px-6 py-5 border-b border-slate-100 dark:border-dark-border text-center">Category</th>
                <th className="px-6 py-5 border-b border-slate-100 dark:border-dark-border text-center">Stock Info</th>
                <th className="px-6 py-5 border-b border-slate-100 dark:border-dark-border text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {products?.map((product) => (
                <tr key={product._id} className="hover:bg-slate-50/50 dark:hover:bg-dark-bg/50 transition-colors group">
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl border border-slate-200 dark:border-dark-border overflow-hidden bg-white dark:bg-dark-card shrink-0">
                           <img src={product.images && product.images.length > 0 ? product.images[0] : product.image} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white line-clamp-2 max-w-[200px] leading-snug group-hover:text-primary-600 transition-colors cursor-pointer">{product.name}</div>
                     </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300 text-center font-extrabold text-sm">${product.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-slate-100 dark:bg-dark-bg text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-dark-border shadow-sm uppercase tracking-wider">{product.category}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {product.countInStock > 0 ? (
                      <span className="text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg text-xs border border-green-200 dark:border-green-900/50 flex items-center justify-center gap-1.5 w-fit mx-auto shadow-sm">
                        <CheckCircle2 size={14}/> {product.countInStock}
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg text-xs border border-red-200 dark:border-red-900/50 flex items-center justify-center gap-1.5 w-fit mx-auto shadow-sm">
                        <XCircle size={14} /> Out of Stock
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button className="p-2.5 text-slate-400 hover:text-primary-600 bg-white hover:bg-primary-50 dark:bg-dark-card dark:hover:bg-primary-900/20 rounded-xl transition-all shadow-sm border border-slate-100 dark:border-dark-border hover:border-primary-200 dark:hover:border-primary-900/50"><Edit size={16} /></button>
                       <button onClick={() => handleDeleteProduct(product._id)} className="p-2.5 text-slate-400 hover:text-red-600 bg-white hover:bg-red-50 dark:bg-dark-card dark:hover:bg-red-900/20 rounded-xl transition-all shadow-sm border border-slate-100 dark:border-dark-border hover:border-red-200 dark:hover:border-red-900/50"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {activeTab === 'orders-admin' && (
      <div className="bg-white dark:bg-dark-card rounded-3xl shadow-sm border border-slate-100 dark:border-dark-border overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-dark-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Customer Orders</h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
             <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                <input type="text" placeholder="Search orders..." className="w-full bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30 transition-shadow text-slate-900 dark:text-white" />
             </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-dark-bg/80 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                <th className="px-6 py-5 border-b border-slate-100 dark:border-dark-border">ID & Customer</th>
                <th className="px-6 py-5 border-b border-slate-100 dark:border-dark-border text-center">Date</th>
                <th className="px-6 py-5 border-b border-slate-100 dark:border-dark-border text-center">Amount</th>
                <th className="px-6 py-5 border-b border-slate-100 dark:border-dark-border text-center">Status</th>
                <th className="px-6 py-5 border-b border-slate-100 dark:border-dark-border text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {orders?.map((order) => (
                <tr key={order._id} className="hover:bg-slate-50/50 dark:hover:bg-dark-bg/50 transition-colors group">
                  <td className="px-6 py-4">
                     <div className="font-bold text-slate-900 dark:text-white">#{order._id.substring(0, 8).toUpperCase()}</div>
                     <div className="text-xs text-slate-500">{order.user?.name || 'Customer'}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-center font-medium">
                     {order.createdAt?.substring(0, 10)}
                  </td>
                  <td className="px-6 py-4 font-extrabold text-slate-900 dark:text-white text-center">${order.totalPrice?.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                     <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 w-fit mx-auto shadow-sm ${order.isDelivered ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:border-green-900/50' : order.isPaid ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:border-blue-900/50' : 'bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-900/50'}`}>
                        {order.isDelivered ? 'Delivered' : order.isPaid ? 'Processing' : 'Pending'}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!order.isDelivered && (
                       <button onClick={() => handleDeliverOrder(order._id)} className="text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-xl shadow-sm shadow-primary-600/20 transition-colors">
                          Deliver
                       </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {activeTab === 'add-product' && (
         <form className="bg-white dark:bg-dark-card rounded-3xl shadow-sm border border-slate-100 dark:border-dark-border overflow-hidden p-6 md:p-8 space-y-6" onSubmit={async (e) => { 
            e.preventDefault(); 
            if (selectedImages.length === 0) { toast.error('Please select at least 1 image'); return; }
            if (selectedImages.length > 4) { toast.error('Maximum 4 images allowed'); return; }
            const formData = new FormData();
            formData.append('name', e.target.name.value);
            formData.append('price', e.target.price.value);
            formData.append('brand', e.target.brand.value);
            formData.append('category', e.target.category.value);
            formData.append('countInStock', e.target.countInStock.value);
            formData.append('description', e.target.description.value);
            formData.append('codAvailable', e.target.codAvailable.checked);

            selectedImages.forEach((img) => formData.append('images', img.file));
            try { 
               await createProduct(formData); 
               toast.success('Product added successfully!'); 
               navigate('/admin/manage-products'); 
               setSelectedImages([]); 
            } catch (err) { toast.error('Failed to add product'); }
         }}>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-6">Create New Product</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Product Name</label>
                  <input name="name" required className="w-full bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-600/30 outline-none text-slate-900 dark:text-white font-medium" />
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Price ($)</label>
                  <input name="price" type="number" step="0.01" required className="w-full bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-600/30 outline-none text-slate-900 dark:text-white font-medium" />
               </div>
               <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Product Images (Max 4)</label>
                  
                  {selectedImages.length > 0 && (
                     <div className="flex flex-wrap gap-4 mb-4">
                        {selectedImages.map((img, idx) => (
                           <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 dark:border-dark-border shrink-0 bg-slate-50 dark:bg-dark-bg shadow-sm group">
                              <img src={img.previewUrl} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                              <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500/90 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600">
                                 <X size={14} />
                              </button>
                           </div>
                        ))}
                     </div>
                  )}
                  
                  {selectedImages.length < 4 && (
                     <div className="flex-1">
                        <input type="file" accept="image/*" multiple onChange={handleImageChange} className="w-full bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl px-4 py-3 text-sm outline-none text-slate-900 dark:text-white font-medium file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100 dark:file:bg-primary-900/20 dark:hover:file:bg-primary-900/40 transition-all cursor-pointer" />
                     </div>
                  )}
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Brand</label>
                  <input name="brand" required className="w-full bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-600/30 outline-none text-slate-900 dark:text-white font-medium" />
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Category</label>
                  <input name="category" required className="w-full bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-600/30 outline-none text-slate-900 dark:text-white font-medium" />
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Stock Count</label>
                  <input name="countInStock" type="number" required className="w-full bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-600/30 outline-none text-slate-900 dark:text-white font-medium" />
               </div>
               <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Description</label>
                  <textarea name="description" rows="4" required className="w-full bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-600/30 outline-none text-slate-900 dark:text-white font-medium resize-none"></textarea>
               </div>
               <div className="space-y-4 md:col-span-2 pt-2">
                  <label className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl cursor-pointer hover:border-primary-300 dark:hover:border-primary-900/50 transition-colors">
                     <input type="checkbox" name="codAvailable" defaultChecked className="w-5 h-5 text-primary-600 rounded bg-white dark:bg-dark-card border-slate-300 dark:border-dark-border focus:ring-primary-600 focus:ring-2" />
                     <div>
                        <span className="font-bold text-slate-900 dark:text-white block text-sm">Allow Cash on Delivery (COD)</span>
                        <span className="text-xs text-slate-500 font-medium">Customers can purchase this item physically securely via local delivery networks.</span>
                     </div>
                  </label>
               </div>
            </div>
            
            <div className="pt-4 flex justify-end gap-3">
               <button type="button" onClick={() => navigate('/admin/manage-products')} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors">Cancel</button>
               <button type="submit" className="btn-primary px-8 tracking-wide shadow-lg shadow-primary-600/20">Publish Product</button>
            </div>
         </form>
      )}
    </motion.div>
  );

  const UserDashboard = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-dark-card p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-dark-border gap-4">
         <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">Your Orders</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Track your premium gear and manage recent purchases.</p>
         </div>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-3xl shadow-sm border border-slate-100 dark:border-dark-border overflow-hidden">
        {orders?.length === 0 ? (
           <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-slate-50 dark:bg-dark-bg rounded-full flex items-center justify-center mb-6 text-slate-300">
                 <Package size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Active Orders</h3>
              <p className="text-slate-500 mb-6">You haven't placed any orders yet. Ready to elevate your game?</p>
              <Link to="/shop" className="btn-primary h-12 px-8">Shop Premium Gear</Link>
           </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-dark-bg/80 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                <th className="px-6 py-5 border-b border-slate-100 dark:border-dark-border">Order ID</th>
                <th className="px-6 py-5 border-b border-slate-100 dark:border-dark-border text-center">Date Placed</th>
                <th className="px-6 py-5 border-b border-slate-100 dark:border-dark-border text-center">Total Amount</th>
                <th className="px-6 py-5 border-b border-slate-100 dark:border-dark-border text-center">Status</th>
                <th className="px-6 py-5 border-b border-slate-100 dark:border-dark-border text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {orders?.map((order) => (
                <tr key={order._id} className="hover:bg-slate-50/50 dark:hover:bg-dark-bg/50 transition-colors group">
                  <td className="px-6 py-5 font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">#{order._id.substring(0, 8).toUpperCase()}</td>
                  <td className="px-6 py-5 text-slate-600 dark:text-slate-400 text-center font-medium">
                     <span className="flex items-center justify-center gap-2"><Clock size={14} className="text-slate-400" /> {order.createdAt?.substring(0, 10)}</span>
                  </td>
                  <td className="px-6 py-5 font-extrabold text-slate-900 dark:text-white text-center">${order.totalPrice?.toFixed(2)}</td>
                  <td className="px-6 py-5 text-center">
                     <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 w-fit mx-auto shadow-sm ${order.isDelivered ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:border-green-900/50' : order.isPaid ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:border-blue-900/50' : 'bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-900/50'}`}>
                        {order.isDelivered ? <><CheckCircle2 size={14}/> Completed</> : order.isPaid ? <><Package size={14}/> Processing</> : <><Clock size={14}/> Pending</>}
                     </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="text-sm font-bold text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition-colors inline-flex items-center gap-1 bg-white hover:bg-slate-50 dark:bg-dark-card dark:hover:bg-dark-bg border border-slate-200 dark:border-dark-border px-4 py-2 rounded-xl shadow-sm hover:shadow">
                       View <ChevronRight size={16}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </motion.div>
  );

  // Fallback for not logged in, though protected route should handle this
  if (!userInfo) return null; 

  return (
    <div className="bg-slate-50 dark:bg-dark-bg min-h-screen pt-24 pb-16">
      <div className="container-bound flex flex-col lg:flex-row gap-8 lg:gap-12">

        {/* Sidebar Nav */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-dark-border sticky top-28">
            
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100 dark:border-dark-border">
               <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-red-400 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-primary-600/30 shrink-0">
                  {userInfo.name.charAt(0).toUpperCase()}
               </div>
               <div className="overflow-hidden">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight truncate">{userInfo.name}</h3>
                  <p className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mt-1">
                     {userInfo.role === 'seller' ? 'Elite Seller' : 'Elite Member'}
                  </p>
               </div>
            </div>

            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => navigate('/admin')}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold transition-all text-sm tracking-wide ${activeTab === 'overview' ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-bg border border-transparent hover:border-slate-100 dark:hover:border-dark-border'}`}
                >
                  <LayoutDashboard size={18} /> Dashboard Overview
                </button>
              </li>
              {!userInfo.role === 'seller' ? (
                <li>
                  <button 
                    onClick={() => setActiveTab('orders')}
                    className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold transition-all text-sm tracking-wide ${activeTab === 'orders' ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-bg border border-transparent hover:border-slate-100 dark:hover:border-dark-border'}`}
                  >
                    <ShoppingBag size={18} /> Order History
                  </button>
                </li>
              ) : (
                <>
                  <li>
                    <button 
                      onClick={() => navigate('/admin/manage-products')}
                      className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold transition-all text-sm tracking-wide ${activeTab === 'inventory' ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-bg border border-transparent hover:border-slate-100 dark:hover:border-dark-border'}`}
                    >
                      <Package size={18} /> Product Inventory
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigate('/admin/add-product')}
                      className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold transition-all text-sm tracking-wide ${activeTab === 'add-product' ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-bg border border-transparent hover:border-slate-100 dark:hover:border-dark-border'}`}
                    >
                      <Plus size={18} /> Add Product
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigate('/admin/orders')}
                      className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold transition-all text-sm tracking-wide ${activeTab === 'orders-admin' ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-bg border border-transparent hover:border-slate-100 dark:hover:border-dark-border'}`}
                    >
                      <Users size={18} /> Manage Orders
                    </button>
                  </li>
                </>
              )}
              <li>
                <button className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold transition-all text-sm tracking-wide text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-bg border border-transparent hover:border-slate-100 dark:hover:border-dark-border">
                  <Settings size={18} /> Preferences
                </button>
              </li>
            </ul>

            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-dark-border">
               <button className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold transition-all text-sm tracking-wide text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 border border-transparent hover:border-red-100 dark:hover:border-red-900/30">
                  Sign Out
               </button>
            </div>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {userInfo.role === 'seller' ? <AdminDashboard /> : <UserDashboard />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
