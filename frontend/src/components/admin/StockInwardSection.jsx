import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CalendarDays,
  CircleDollarSign,
  FileText,
  PackagePlus,
  Plus,
  Printer,
  ReceiptText,
  Save,
  Truck,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import api from '../../api/axios';
import { formatPrice } from '../../utils/price';
import StockInwardBill from './StockInwardBill';
import {
  buildStockInwardBillHtml,
  formatStockInwardBillDate,
} from './stockInwardBillUtils';

const getToday = () => new Date().toISOString().slice(0, 10);

const PRODUCT_CATEGORY_OPTIONS = ['Bat', 'Ball', 'Gloves', 'Accessories', 'Sleeves', 'Shaker', 'Other'];
const paymentStatuses = ['Paid', 'Pending', 'Partial'];

let nextStockInwardLineId = 0;
const createLineItem = (overrides = {}) => ({
  id: `line-${nextStockInwardLineId++}`,
  product: '',
  quantity: '1',
  costPrice: '',
  ...overrides,
});

const createEmptyForm = () => ({
  date: getToday(),
  supplierName: '',
  supplierPhone: '',
  billNumber: '',
  items: [createLineItem()],
  transportCharges: '0',
  rentCharges: '0',
  loadingCharges: '0',
  otherCharges: '0',
  paymentStatus: 'Pending',
  paidAmount: '0',
  notes: '',
});

const createEmptyQuickProductForm = () => ({
  name: '',
  category: PRODUCT_CATEGORY_OPTIONS[0],
  price: '',
  costPrice: '',
  countInStock: '0',
  description: '',
});

const formatDateForInput = (value) => (!value ? getToday() : new Date(value).toISOString().slice(0, 10));

const toNumber = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const getEntryItems = (entry = {}) => {
  if (Array.isArray(entry.items) && entry.items.length) {
    return entry.items.map((item, index) => ({
      id: item._id || `entry-item-${index}`,
      product: item.product?._id || item.product || '',
      productName: item.productName || item.product?.name || '-',
      quantity: toNumber(item.quantity),
      costPrice: toNumber(item.costPrice),
      lineTotal:
        toNumber(item.lineTotal) || toNumber(item.quantity) * toNumber(item.costPrice),
    }));
  }

  if (entry.product) {
    return [
      {
        id: 'legacy-entry-item',
        product: entry.product?._id || entry.product || '',
        productName: entry.productName || entry.product?.name || '-',
        quantity: toNumber(entry.quantity),
        costPrice: toNumber(entry.costPrice),
        lineTotal:
          toNumber(entry.totalCost) || toNumber(entry.quantity) * toNumber(entry.costPrice),
      },
    ];
  }

  return [];
};

const getEntryProductSummary = (entry) => {
  const items = getEntryItems(entry);

  if (!items.length) {
    return {
      primaryLabel: '-',
      secondaryLabel: 'No product lines',
      totalQuantity: 0,
    };
  }

  if (items.length === 1) {
    return {
      primaryLabel: items[0].productName,
      secondaryLabel: `${items[0].quantity} units`,
      totalQuantity: items[0].quantity,
    };
  }

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    primaryLabel: `${items[0].productName} +${items.length - 1} more`,
    secondaryLabel: `${totalQuantity} units across ${items.length} products`,
    totalQuantity,
  };
};

const openBillWindow = (entry, { autoPrint = false } = {}) => {
  if (!entry) {
    toast.error('Bill data is not available for this entry');
    return;
  }

  let billHtml = '';

  try {
    billHtml = buildStockInwardBillHtml(entry);
  } catch (error) {
    console.error('Failed to build stock inward bill HTML', error);
    toast.error('Failed to prepare bill preview');
    return;
  }

  const popup = window.open('', '_blank', 'width=980,height=860,scrollbars=yes,resizable=yes');

  if (!popup) {
    toast.error('Please allow popups to view the bill');
    return;
  }

  let hasPrinted = false;
  const triggerPrint = () => {
    if (!autoPrint || hasPrinted || popup.closed) {
      return;
    }

    hasPrinted = true;
    popup.focus();
    window.setTimeout(() => popup.print(), 150);
  };

  popup.onload = triggerPrint;
  popup.document.open();
  popup.document.write(billHtml);
  popup.document.close();
  popup.focus();

  if (popup.document.readyState === 'complete') {
    triggerPrint();
  } else if (autoPrint) {
    popup.document.onreadystatechange = () => {
      if (popup.document.readyState === 'complete') {
        triggerPrint();
      }
    };
  }
};

const StockInwardSection = () => {
  const [products, setProducts] = useState([]);
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(createEmptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [activeBill, setActiveBill] = useState(null);
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [createProductRowId, setCreateProductRowId] = useState('');
  const [quickProductForm, setQuickProductForm] = useState(createEmptyQuickProductForm());
  const [creatingProduct, setCreatingProduct] = useState(false);

  const items = useMemo(
    () =>
      (form.items || []).map((item) => {
        const product = products.find((productItem) => productItem._id === item.product) || null;
        const quantity = Math.max(toNumber(item.quantity), 0);
        const costPrice = Math.max(toNumber(item.costPrice), 0);

        return {
          ...item,
          productData: product,
          productName: product?.name || '',
          quantityValue: quantity,
          costPriceValue: costPrice,
          lineTotal: quantity * costPrice,
          projectedStock: (toNumber(product?.countInStock) || 0) + quantity,
        };
      }),
    [form.items, products]
  );

  const itemCount = items.length;
  const totalUnits = items.reduce((sum, item) => sum + item.quantityValue, 0);
  const transportCharges = toNumber(form.transportCharges);
  const rentCharges = toNumber(form.rentCharges);
  const loadingCharges = toNumber(form.loadingCharges);
  const otherCharges = toNumber(form.otherCharges);
  const baseCost = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const extraChargesTotal = transportCharges + rentCharges + loadingCharges + otherCharges;
  const finalTotalCost = baseCost + extraChargesTotal;

  const paidAmount = useMemo(() => {
    if (form.paymentStatus === 'Paid') {
      return finalTotalCost;
    }

    if (form.paymentStatus === 'Pending') {
      return 0;
    }

    return Math.min(Math.max(toNumber(form.paidAmount), 0), finalTotalCost);
  }, [finalTotalCost, form.paidAmount, form.paymentStatus]);

  const pendingAmount = Math.max(finalTotalCost - paidAmount, 0);

  const currentDraftEntry = {
    date: form.date,
    supplierName: form.supplierName || 'Supplier name',
    supplierPhone: form.supplierPhone || '',
    billNumber: form.billNumber || 'DRAFT',
    items: items.map((item) => ({
      productName: item.productName || 'Select product',
      quantity: item.quantityValue,
      costPrice: item.costPriceValue,
      lineTotal: item.lineTotal,
    })),
    totalCost: baseCost,
    transportCharges,
    rentCharges,
    loadingCharges,
    otherCharges,
    finalTotalCost,
    paymentStatus: form.paymentStatus,
    paidAmount,
    pendingAmount,
    notes: form.notes,
  };

  const loadProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data.products || []);
      return data.products || [];
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load inventory products');
      return [];
    }
  };

  const loadEntries = async () => {
    setLoading(true);

    try {
      const { data } = await api.get('/admin-inventory/stock-inward');
      setEntries(data.entries || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load stock inward history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadEntries();
  }, []);

  const resetForm = () => {
    setEditingId('');
    setForm(createEmptyForm());
    setCreateProductRowId('');
    setQuickProductForm(createEmptyQuickProductForm());
    setShowCreateProductModal(false);
  };

  const updateFormField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateLineItem = (lineId, field, value) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === lineId ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleLineProductChange = (lineId, productId) => {
    const product = products.find((item) => item._id === productId);

    setForm((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === lineId
          ? {
              ...item,
              product: productId,
              costPrice:
                item.costPrice && Number(item.costPrice) > 0
                  ? item.costPrice
                  : product?.costPrice !== undefined
                    ? String(product.costPrice)
                    : '',
            }
          : item
      ),
    }));
  };

  const addLineItem = () => {
    setForm((current) => ({
      ...current,
      items: [...current.items, createLineItem()],
    }));
  };

  const removeLineItem = (lineId) => {
    setForm((current) => ({
      ...current,
      items:
        current.items.length === 1
          ? [createLineItem()]
          : current.items.filter((item) => item.id !== lineId),
    }));
  };

  const openCreateProductModal = (lineId = '') => {
    setCreateProductRowId(lineId);
    setQuickProductForm(createEmptyQuickProductForm());
    setShowCreateProductModal(true);
  };

  const handleQuickProductCreate = async (event) => {
    event.preventDefault();
    setCreatingProduct(true);

    try {
      const payload = {
        ...quickProductForm,
        price: toNumber(quickProductForm.price),
        costPrice: toNumber(quickProductForm.costPrice),
        countInStock: toNumber(quickProductForm.countInStock),
      };

      const { data } = await api.post('/admin-inventory/stock-inward/products', payload);
      const createdProduct = data.product;

      setProducts((current) => {
        const withoutDuplicate = current.filter((item) => item._id !== createdProduct._id);
        return [...withoutDuplicate, createdProduct];
      });

      if (createProductRowId) {
        setForm((current) => ({
          ...current,
          items: current.items.map((item) =>
            item.id === createProductRowId
              ? {
                  ...item,
                  product: createdProduct._id,
                  costPrice: String(createdProduct.costPrice ?? ''),
                }
              : item
          ),
        }));
      }

      setShowCreateProductModal(false);
      setQuickProductForm(createEmptyQuickProductForm());
      setCreateProductRowId('');
      toast.success('New product created and added to the bill');
      await loadProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create product');
    } finally {
      setCreatingProduct(false);
    }
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    const validItems = items.filter((item) => item.product && item.quantityValue > 0);

    if (!validItems.length) {
      toast.error('Add at least one product line with quantity');
      return;
    }

    if (validItems.length !== items.length) {
      toast.error('Complete all product lines before saving');
      return;
    }

    if (new Set(validItems.map((item) => item.product)).size !== validItems.length) {
      toast.error('Please keep one row per product in the inward bill');
      return;
    }

    if (form.paymentStatus === 'Partial' && paidAmount <= 0) {
      toast.error('Paid amount is required for partial payment');
      return;
    }

    setSubmitting(true);

    const payload = {
      date: form.date,
      supplierName: form.supplierName,
      supplierPhone: form.supplierPhone,
      billNumber: form.billNumber,
      items: validItems.map((item) => ({
        product: item.product,
        quantity: item.quantityValue,
        costPrice: item.costPriceValue,
      })),
      transportCharges,
      rentCharges,
      loadingCharges,
      otherCharges,
      paymentStatus: form.paymentStatus,
      paidAmount,
      notes: form.notes,
    };

    try {
      if (editingId) {
        await api.put(`/admin-inventory/stock-inward/${editingId}`, payload);
        toast.success('Stock inward entry updated');
      } else {
        await api.post('/admin-inventory/stock-inward', payload);
        toast.success('Stock inward entry saved');
      }

      window.localStorage.removeItem('ks-sports-stock-inward-draft');
      resetForm();
      await Promise.all([loadProducts(), loadEntries()]);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          (editingId ? 'Failed to update stock inward entry' : 'Failed to save stock inward entry')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (entry) => {
    const entryItems = getEntryItems(entry);

    setEditingId(entry._id);
    setForm({
      date: formatDateForInput(entry.date),
      supplierName: entry.supplierName || '',
      supplierPhone: entry.supplierPhone || '',
      billNumber: entry.billNumber || '',
      items: entryItems.length
        ? entryItems.map((item) =>
            createLineItem({
              product: item.product,
              quantity: String(item.quantity || 1),
              costPrice: String(item.costPrice ?? ''),
            })
          )
        : [createLineItem()],
      transportCharges: String(entry.transportCharges ?? 0),
      rentCharges: String(entry.rentCharges ?? 0),
      loadingCharges: String(entry.loadingCharges ?? 0),
      otherCharges: String(entry.otherCharges ?? 0),
      paymentStatus: entry.paymentStatus || 'Pending',
      paidAmount: String(entry.paidAmount ?? 0),
      notes: entry.notes || '',
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm('Delete this stock inward entry? This will reduce stock accordingly.')) {
      return;
    }

    try {
      await api.delete(`/admin-inventory/stock-inward/${entryId}`);

      if (editingId === entryId) {
        resetForm();
      }

      if (activeBill?._id === entryId) {
        setActiveBill(null);
      }

      toast.success('Stock inward entry deleted');
      await Promise.all([loadProducts(), loadEntries()]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete stock inward entry');
    }
  };

  const handleSaveDraft = () => {
    try {
      window.localStorage.setItem('ks-sports-stock-inward-draft', JSON.stringify(form));
      toast.success('Draft saved on this device');
    } catch (error) {
      console.error('Failed to save stock inward draft', error);
      toast.error('Unable to save draft locally');
    }
  };

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.96),rgba(10,13,18,0.98))] p-6 shadow-[0_35px_90px_-44px_rgba(0,0,0,1)] backdrop-blur-xl md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.20),transparent_30%),radial-gradient(circle_at_right,rgba(250,204,21,0.08),transparent_20%)]"></div>
        <div className="relative space-y-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3 rounded-full border border-primary-500/20 bg-primary-500/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-primary-200"><span className="h-2 w-2 rounded-full bg-primary-400"></span>Stock Management</div>
              <div>
                <h2 className="max-w-3xl text-3xl font-black leading-tight tracking-tight text-white md:text-5xl">{editingId ? 'Update Stock Inward Entry' : 'Create Stock Inward Entry'}</h2>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-400"><div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2"><CalendarDays size={16} className="text-primary-300" />{formatStockInwardBillDate(form.date)}</div><p>Premium inward desk for supplier purchases, stock updates, and bill-ready records.</p></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 xl:w-[360px]">
              <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-5"><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Product Lines</p><p className="mt-3 text-3xl font-black text-white">{itemCount}</p><p className="mt-2 text-sm text-slate-400">Desktop bill rows ready</p></div>
              <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-5"><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Total Units</p><p className="mt-3 text-3xl font-black text-white">{totalUnits}</p><p className="mt-2 text-sm text-slate-400">Across selected products</p></div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-5">
            <div className="rounded-[1.8rem] border border-white/10 bg-[#171717] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Base Cost</p><p className="mt-3 text-3xl font-black text-white">{formatPrice(baseCost)}</p><p className="mt-2 text-sm text-slate-400">{itemCount} lines / {totalUnits} units</p></div>
            <div className="rounded-[1.8rem] border border-white/10 bg-[#171717] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Extra Charges</p><p className="mt-3 text-3xl font-black text-white">{formatPrice(extraChargesTotal)}</p><p className="mt-2 text-sm text-slate-400">Transport, rent, loading, other</p></div>
            <div className="rounded-[1.8rem] border border-amber-400/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.16),rgba(23,23,23,0.95))] p-5 shadow-[0_20px_60px_-40px_rgba(250,204,21,0.6)]"><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200">Final Total</p><p className="mt-3 text-4xl font-black text-amber-100">{formatPrice(finalTotalCost)}</p><p className="mt-2 text-sm text-amber-100/70">The complete inward bill value</p></div>
            <div className="rounded-[1.8rem] border border-emerald-500/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.15),rgba(23,23,23,0.95))] p-5"><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-200">Paid</p><p className="mt-3 text-3xl font-black text-emerald-100">{formatPrice(paidAmount)}</p><p className="mt-2 text-sm text-emerald-100/70">{form.paymentStatus} payment plan</p></div>
            <div className="rounded-[1.8rem] border border-red-500/20 bg-[linear-gradient(180deg,rgba(239,68,68,0.16),rgba(23,23,23,0.95))] p-5"><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-red-200">Pending</p><p className="mt-3 text-3xl font-black text-red-100">{formatPrice(pendingAmount)}</p><p className="mt-2 text-sm text-red-100/70">Balance left to settle</p></div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(16,21,29,0.96),rgba(11,15,21,0.98))] p-6 shadow-[0_35px_90px_-44px_rgba(0,0,0,1)] backdrop-blur-xl md:p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-300">Desktop Workspace</p><h3 className="mt-2 text-2xl font-black tracking-tight text-white">Structured Stock Inward Form</h3><p className="mt-2 max-w-2xl text-sm text-slate-400">Supplier details, multi-product inward lines, charges, and payment review arranged for a faster desktop workflow.</p></div>
          <div className="flex flex-wrap gap-3"><button type="button" onClick={() => openCreateProductModal(form.items[form.items.length - 1]?.id || '')} className="inline-flex items-center gap-2 rounded-2xl border border-primary-500/20 bg-primary-500/10 px-5 py-3 text-sm font-bold text-primary-100 transition-all hover:bg-primary-500/15"><Plus size={16} />Create New Product</button>{editingId && <button type="button" onClick={resetForm} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-slate-200 transition-all hover:border-white/20 hover:bg-white/[0.06]"><X size={16} />Cancel Edit</button>}</div>
        </div>

        <form className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_410px] 2xl:grid-cols-[minmax(0,1.65fr)_430px]" onSubmit={handleSubmit}>
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-white/10 bg-[#15181f] p-5 shadow-[0_24px_70px_-42px_rgba(0,0,0,0.95)] md:p-6">
              <div className="mb-5 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-300"><Users size={18} /></div><div><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-300">Supplier Details</p><h4 className="mt-1 text-xl font-black text-white">Vendor and document basics</h4></div></div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2"><label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Date</label><input className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40" onChange={(event) => updateFormField('date', event.target.value)} required type="date" value={form.date} /></div>
                <div className="space-y-2"><label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Bill Number</label><input className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40" onChange={(event) => updateFormField('billNumber', event.target.value)} placeholder="Bill / invoice number" type="text" value={form.billNumber} /></div>
                <div className="space-y-2"><label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Supplier / Wholesaler Name</label><input className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40" onChange={(event) => updateFormField('supplierName', event.target.value)} placeholder="Enter supplier name" required type="text" value={form.supplierName} /></div>
                <div className="space-y-2"><label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Supplier Phone</label><input className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40" onChange={(event) => updateFormField('supplierPhone', event.target.value)} placeholder="Phone number" type="text" value={form.supplierPhone} /></div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-[#15181f] p-5 shadow-[0_24px_70px_-42px_rgba(0,0,0,0.95)] md:p-6">
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-300"><PackagePlus size={18} /></div><div><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-300">Product Details</p><h4 className="mt-1 text-xl font-black text-white">Table-style inward bill lines</h4></div></div>
                <div className="flex flex-wrap gap-3"><button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-200 transition-all hover:border-white/20 hover:bg-white/[0.06]" onClick={addLineItem} type="button"><Plus size={14} />Add Product</button><div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{itemCount} lines active</div></div>
              </div>

              <div className="rounded-[1.7rem] border border-white/10 bg-[#10151d] p-4 md:p-5">
                <div className="mb-4 hidden grid-cols-[minmax(0,1.6fr)_120px_160px_150px_auto] gap-4 border-b border-white/10 pb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500 lg:grid"><span>Product Name</span><span>Qty</span><span>Cost / Item</span><span>Total</span><span className="text-right">Actions</span></div>
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4" key={item.id}>
                      <div className="mb-3 flex items-center justify-between lg:hidden"><div><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Line Item {index + 1}</p><p className="mt-1 text-sm text-slate-400">{item.productData ? `${item.productData.countInStock || 0} in stock before inward` : 'Select or create a product'}</p></div><button className="inline-flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-red-300 transition-all hover:bg-red-500/15" onClick={() => removeLineItem(item.id)} type="button"><X size={14} />Remove</button></div>

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.6fr)_120px_160px_150px_auto] lg:items-end">
                        <div className="space-y-2"><label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Product Name</label><select className="relative z-10 h-12 w-full rounded-2xl border border-white/10 bg-[#151b24] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40" onChange={(event) => handleLineProductChange(item.id, event.target.value)} required value={item.product}><option className="bg-[#151b24] text-white" disabled value="">Select product from inventory</option>{products.map((product) => (<option className="bg-[#151b24] text-white" key={product._id} value={product._id}>{product.name}</option>))}</select></div>
                        <div className="space-y-2"><label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Qty</label><input className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40" min="1" onChange={(event) => updateLineItem(item.id, 'quantity', event.target.value)} required type="number" value={item.quantity} /></div>
                        <div className="space-y-2"><label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Cost Price</label><input className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40" min="0" onChange={(event) => updateLineItem(item.id, 'costPrice', event.target.value)} placeholder="Purchase rate" required step="0.01" type="number" value={item.costPrice} /></div>
                        <div className="space-y-2"><label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Total</label><div className="flex h-12 items-center rounded-2xl border border-primary-500/20 bg-primary-500/10 px-4 text-sm font-black text-primary-100">{formatPrice(item.lineTotal)}</div></div>
                        <div className="flex flex-wrap justify-end gap-2"><button className="inline-flex items-center gap-2 rounded-2xl border border-primary-500/20 bg-primary-500/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-primary-100 transition-all hover:bg-primary-500/15" onClick={() => openCreateProductModal(item.id)} type="button"><Plus size={14} />Create</button><button className="hidden items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-red-300 transition-all hover:bg-red-500/15 lg:inline-flex" onClick={() => removeLineItem(item.id)} type="button"><X size={14} />Remove</button></div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-3"><div className="rounded-[1.15rem] border border-white/10 bg-[#10151d]/70 px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Current Stock</p><p className="mt-2 text-lg font-black text-white">{item.productData?.countInStock ?? 0}</p></div><div className="rounded-[1.15rem] border border-white/10 bg-[#10151d]/70 px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Projected Stock</p><p className="mt-2 text-lg font-black text-white">{item.projectedStock}</p></div><div className="rounded-[1.15rem] border border-white/10 bg-[#10151d]/70 px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Selected Product</p><p className="mt-2 text-sm font-bold text-white">{item.productData?.name || 'Waiting for selection'}</p></div></div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-[#15181f] p-5 shadow-[0_24px_70px_-42px_rgba(0,0,0,0.95)] md:p-6">
              <div className="mb-5 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-300"><Truck size={18} /></div><div><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-300">Additional Charges</p><h4 className="mt-1 text-xl font-black text-white">Operational cost breakdown</h4></div></div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2"><label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Transport Charges</label><input className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40" min="0" onChange={(event) => updateFormField('transportCharges', event.target.value)} step="0.01" type="number" value={form.transportCharges} /></div>
                <div className="space-y-2"><label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Rent Charges</label><input className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40" min="0" onChange={(event) => updateFormField('rentCharges', event.target.value)} step="0.01" type="number" value={form.rentCharges} /></div>
                <div className="space-y-2"><label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Loading Charges</label><input className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40" min="0" onChange={(event) => updateFormField('loadingCharges', event.target.value)} step="0.01" type="number" value={form.loadingCharges} /></div>
                <div className="space-y-2"><label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Other Charges</label><input className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40" min="0" onChange={(event) => updateFormField('otherCharges', event.target.value)} step="0.01" type="number" value={form.otherCharges} /></div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(26,20,20,0.98),rgba(21,24,31,0.98))] p-5 shadow-[0_24px_70px_-42px_rgba(0,0,0,0.95)] md:p-6">
              <div className="mb-5 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300"><Wallet size={18} /></div><div><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-300">Payment Summary</p><h4 className="mt-1 text-xl font-black text-white">Settlement and final review</h4></div></div><span className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] ${form.paymentStatus === 'Paid' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : form.paymentStatus === 'Partial' ? 'border-amber-400/20 bg-amber-400/10 text-amber-200' : 'border-red-500/20 bg-red-500/10 text-red-300'}`}>{form.paymentStatus}</span></div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2"><label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Payment Status</label><select className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40" onChange={(event) => updateFormField('paymentStatus', event.target.value)} required value={form.paymentStatus}>{paymentStatuses.map((status) => (<option key={status} value={status}>{status}</option>))}</select></div>
                <div className="space-y-2"><label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Paid Amount</label><input className={`h-12 w-full rounded-2xl border px-4 text-sm outline-none transition-all ${form.paymentStatus === 'Partial' ? 'border-white/10 bg-white/[0.04] text-white focus:border-primary-500/40' : 'border-white/10 bg-white/[0.04] text-slate-400'}`} min="0" onChange={(event) => updateFormField('paidAmount', event.target.value)} readOnly={form.paymentStatus !== 'Partial'} step="0.01" type="number" value={form.paymentStatus === 'Paid' ? String(finalTotalCost) : form.paymentStatus === 'Pending' ? '0' : form.paidAmount} /></div>
                <div className="space-y-2"><label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Base Cost</label><input className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white outline-none" readOnly type="text" value={formatPrice(baseCost)} /></div>
                <div className="space-y-2"><label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Final Total Cost</label><input className="h-12 w-full rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 text-sm font-semibold text-amber-100 outline-none" readOnly type="text" value={formatPrice(finalTotalCost)} /></div>
                <div className="rounded-[1.4rem] border border-red-500/15 bg-[linear-gradient(180deg,rgba(80,20,20,0.55),rgba(46,16,16,0.8))] p-4 md:col-span-2"><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-red-200">Pending Amount</p><p className="mt-2 text-3xl font-black text-red-100">{formatPrice(pendingAmount)}</p></div>
                <div className="space-y-2 md:col-span-2"><label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Notes</label><textarea className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40" onChange={(event) => updateFormField('notes', event.target.value)} placeholder="Transport details, payment note, supplier reminder, or any internal note" rows="3" value={form.notes} /></div>
              </div>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end"><button className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-bold text-slate-200 transition-all hover:border-white/20 hover:bg-white/[0.06]" onClick={resetForm} type="button">Reset</button><button className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-bold text-slate-200 transition-all hover:border-white/20 hover:bg-white/[0.06]" onClick={handleSaveDraft} type="button">Save as Draft</button><button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-8 py-3 text-sm font-black tracking-[0.08em] text-white shadow-[0_20px_44px_-20px_rgba(220,38,38,0.75)] transition-all hover:-translate-y-0.5 hover:bg-primary-700 disabled:opacity-60" disabled={submitting} type="submit"><Save size={16} />{submitting ? 'Saving...' : 'Confirm & Record Entry ->'}</button></div>
          </div>
          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,24,0.98),rgba(18,22,28,0.98))] shadow-[0_28px_70px_-42px_rgba(0,0,0,1)]">
              <div className="border-b border-white/10 p-6"><div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-300">K.S. SPORTS ADMIN</p><h4 className="mt-2 text-2xl font-black text-white">Stock Inward Draft</h4></div><div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Live Preview</div></div></div>
              <div className="space-y-5 p-6">
                <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Supplier</p><p className="mt-2 text-lg font-black text-white">{form.supplierName || 'Supplier name'}</p><p className="mt-1 text-sm text-slate-400">{form.supplierPhone || 'Phone number pending'}</p></div><div className="text-right"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Bill Number</p><p className="mt-2 text-sm font-bold text-white">{form.billNumber || 'DRAFT'}</p><p className="mt-2 text-xs text-slate-500">{formatStockInwardBillDate(form.date)}</p></div></div>
                  <div className="mt-5 space-y-3">{items.map((item, index) => (<div className="grid grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-3 rounded-[1.1rem] border border-white/10 bg-[#11161d] px-3 py-3" key={item.id}><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-500/10 text-[11px] font-black text-primary-200">{index + 1}</div><div className="min-w-0"><p className="truncate text-sm font-bold text-white">{item.productName || 'Select product'}</p><p className="mt-1 text-xs text-slate-500">{item.quantityValue} x {formatPrice(item.costPriceValue)}</p></div><p className="text-sm font-black text-white">{formatPrice(item.lineTotal)}</p></div>))}</div>
                </div>

                <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
                  <div className="grid grid-cols-2 gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Products</p><p className="mt-2 text-xl font-black text-white">{itemCount}</p></div><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Units</p><p className="mt-2 text-xl font-black text-white">{totalUnits}</p></div></div>
                  <div className="mt-5 space-y-3 border-t border-white/10 pt-4"><div className="flex items-center justify-between text-sm text-slate-300"><span>Base cost</span><span className="font-bold">{formatPrice(baseCost)}</span></div><div className="flex items-center justify-between text-sm text-slate-300"><span>Extra charges</span><span className="font-bold">{formatPrice(extraChargesTotal)}</span></div><div className="flex items-center justify-between text-sm text-slate-300"><span>Paid</span><span className="font-bold text-emerald-300">{formatPrice(paidAmount)}</span></div><div className="flex items-center justify-between rounded-[1.15rem] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-amber-100"><span className="font-black uppercase tracking-[0.14em]">Grand Total</span><span className="text-xl font-black">{formatPrice(finalTotalCost)}</span></div></div>
                </div>

                <div className="grid grid-cols-1 gap-3"><button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-6 py-3.5 text-sm font-black tracking-[0.08em] text-white shadow-[0_20px_44px_-20px_rgba(220,38,38,0.75)] transition-all hover:-translate-y-0.5 hover:bg-primary-700 disabled:opacity-60" disabled={submitting} type="submit"><Save size={16} />{submitting ? 'Saving...' : 'Confirm & Record Entry ->'}</button><button className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-bold text-slate-200 transition-all hover:border-white/20 hover:bg-white/[0.06]" onClick={handleSaveDraft} type="button">Save as Draft</button><button className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-bold text-slate-200 transition-all hover:border-white/20 hover:bg-white/[0.06]" onClick={() => openBillWindow(currentDraftEntry)} type="button">Print Preview</button></div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-[#15181f] p-5 shadow-[0_24px_70px_-42px_rgba(0,0,0,0.95)] md:p-6">
              <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-300"><CircleDollarSign size={18} /></div><div><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-300">Live Calculations</p><h4 className="mt-1 text-xl font-black text-white">Desktop cash + stock view</h4></div></div>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2"><div className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4"><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Products</p><p className="mt-2 text-2xl font-black text-white">{itemCount}</p></div><div className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4"><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Units Added</p><p className="mt-2 text-2xl font-black text-white">{totalUnits}</p></div><div className="rounded-[1.3rem] border border-emerald-500/20 bg-emerald-500/10 p-4"><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-200">Paid</p><p className="mt-2 text-2xl font-black text-emerald-100">{formatPrice(paidAmount)}</p></div><div className="rounded-[1.3rem] border border-red-500/20 bg-red-500/10 p-4"><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-red-200">Pending</p><p className="mt-2 text-2xl font-black text-red-100">{formatPrice(pendingAmount)}</p></div></div>
            </section>
          </aside>
        </form>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d]/95 shadow-[0_28px_80px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 border-b border-white/10 p-6 md:flex-row md:items-center md:justify-between md:p-8"><div><p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-300">Purchase History</p><h3 className="mt-2 text-2xl font-black tracking-tight text-white">Stock Inward Entries</h3></div><div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{loading ? 'Loading history...' : `${entries.length} visible entries`}</div></div>
        <div className="overflow-x-auto">
          <table className="min-w-[1300px] text-left">
            <thead><tr className="bg-white/[0.02] text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500"><th className="px-6 py-5">Date</th><th className="px-6 py-5">Supplier</th><th className="px-6 py-5">Bill</th><th className="px-6 py-5">Products</th><th className="px-6 py-5 text-center">Qty</th><th className="px-6 py-5 text-center">Cost</th><th className="px-6 py-5 text-center">Final Total</th><th className="px-6 py-5 text-center">Payment</th><th className="px-6 py-5 text-center">Paid</th><th className="px-6 py-5 text-center">Pending</th><th className="px-6 py-5">Notes</th><th className="px-6 py-5 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-white/5">
              {!loading && entries.length === 0 && <tr><td className="px-6 py-12 text-center text-sm text-slate-500" colSpan="12">No stock inward entries yet. Create your first purchase entry to update inventory.</td></tr>}
              {entries.map((entry) => {
                const entryItems = getEntryItems(entry);
                const productSummary = getEntryProductSummary(entry);
                return (
                  <tr className="transition-colors hover:bg-white/[0.03]" key={entry._id}>
                    <td className="px-6 py-5 text-sm text-slate-300">{formatStockInwardBillDate(entry.date)}</td>
                    <td className="px-6 py-5"><p className="font-bold text-white">{entry.supplierName}</p><p className="mt-1 text-xs text-slate-500">{entry.supplierPhone || 'No phone added'}</p></td>
                    <td className="px-6 py-5 text-sm font-semibold text-slate-300">{entry.billNumber || '-'}</td>
                    <td className="px-6 py-5"><p className="font-bold text-white">{productSummary.primaryLabel}</p><p className="mt-1 text-xs text-slate-500">{productSummary.secondaryLabel}</p></td>
                    <td className="px-6 py-5 text-center text-sm font-semibold text-slate-300">{productSummary.totalQuantity}</td>
                    <td className="px-6 py-5 text-center text-sm font-bold text-white">{entryItems.length > 1 ? `${entryItems.length} lines` : formatPrice(entryItems[0]?.costPrice || entry.costPrice || 0)}</td>
                    <td className="px-6 py-5 text-center text-sm font-black text-primary-300">{formatPrice(entry.finalTotalCost)}</td>
                    <td className="px-6 py-5 text-center"><span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] ${entry.paymentStatus === 'Paid' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : entry.paymentStatus === 'Partial' ? 'border-sky-500/20 bg-sky-500/10 text-sky-300' : 'border-amber-500/20 bg-amber-500/10 text-amber-300'}`}>{entry.paymentStatus}</span></td>
                    <td className="px-6 py-5 text-center text-sm font-semibold text-slate-300">{formatPrice(entry.paidAmount)}</td>
                    <td className="px-6 py-5 text-center text-sm font-semibold text-amber-300">{formatPrice(entry.pendingAmount)}</td>
                    <td className="px-6 py-5 text-sm text-slate-400">{entry.notes || '-'}</td>
                    <td className="px-6 py-5 text-right"><div className="flex flex-wrap justify-end gap-2"><button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-200 transition-all hover:border-white/20 hover:bg-white/[0.06]" onClick={() => setActiveBill(entry)} type="button"><FileText size={14} />View Bill</button><button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-200 transition-all hover:border-white/20 hover:bg-white/[0.06]" onClick={() => openBillWindow(entry, { autoPrint: true })} type="button"><Printer size={14} />Print Bill</button><button className="inline-flex items-center gap-2 rounded-2xl border border-primary-500/20 bg-primary-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-primary-200 transition-all hover:bg-primary-500/15" onClick={() => openBillWindow(entry, { autoPrint: true })} type="button"><ReceiptText size={14} />Download PDF</button><button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-200 transition-all hover:border-white/20 hover:bg-white/[0.06]" onClick={() => handleEdit(entry)} type="button"><CalendarDays size={14} />Edit</button><button className="inline-flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-red-300 transition-all hover:bg-red-500/15" onClick={() => handleDelete(entry._id)} type="button"><X size={14} />Delete</button></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {showCreateProductModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/80 p-4 backdrop-blur-sm"><div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#10151d] shadow-[0_32px_100px_-40px_rgba(0,0,0,1)]"><div className="flex items-center justify-between border-b border-white/10 p-6"><div><p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-300">Quick Product Create</p><h3 className="mt-2 text-2xl font-black tracking-tight text-white">Add new inventory product</h3></div><button className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition-all hover:border-white/20 hover:bg-white/[0.06]" onClick={() => setShowCreateProductModal(false)} type="button"><X size={18} /></button></div><form className="space-y-6 p-6" onSubmit={handleQuickProductCreate}><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div className="space-y-2 md:col-span-2"><label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Product Name</label><input className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40" onChange={(event) => setQuickProductForm((current) => ({ ...current, name: event.target.value }))} placeholder="Enter product name" required type="text" value={quickProductForm.name} /></div><div className="space-y-2"><label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Category</label><select className="h-12 w-full rounded-2xl border border-white/10 bg-[#151b24] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40" onChange={(event) => setQuickProductForm((current) => ({ ...current, category: event.target.value }))} required value={quickProductForm.category}>{PRODUCT_CATEGORY_OPTIONS.map((option) => (<option key={option} value={option}>{option}</option>))}</select></div><div className="space-y-2"><label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Selling Price</label><input className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40" min="0" onChange={(event) => setQuickProductForm((current) => ({ ...current, price: event.target.value }))} required step="0.01" type="number" value={quickProductForm.price} /></div><div className="space-y-2"><label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Cost Price</label><input className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40" min="0" onChange={(event) => setQuickProductForm((current) => ({ ...current, costPrice: event.target.value }))} required step="0.01" type="number" value={quickProductForm.costPrice} /></div><div className="space-y-2"><label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Stock</label><input className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40" min="0" onChange={(event) => setQuickProductForm((current) => ({ ...current, countInStock: event.target.value }))} step="1" type="number" value={quickProductForm.countInStock} /></div><div className="space-y-2 md:col-span-2"><label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Description</label><textarea className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40" onChange={(event) => setQuickProductForm((current) => ({ ...current, description: event.target.value }))} placeholder="Optional short description" rows="3" value={quickProductForm.description} /></div></div><div className="flex flex-col gap-3 sm:flex-row sm:justify-end"><button className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-bold text-slate-200 transition-all hover:border-white/20 hover:bg-white/[0.06]" onClick={() => setShowCreateProductModal(false)} type="button">Cancel</button><button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-8 py-3 text-sm font-black tracking-[0.08em] text-white transition-all hover:bg-primary-700 disabled:opacity-60" disabled={creatingProduct} type="submit"><Plus size={16} />{creatingProduct ? 'Creating...' : 'Create Product'}</button></div></form></div></div>}

      {activeBill && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/80 p-4 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d] shadow-[0_32px_100px_-40px_rgba(0,0,0,1)]"><div className="flex flex-col gap-4 border-b border-white/10 p-6 md:flex-row md:items-center md:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-300">Bill Preview</p><h3 className="mt-2 text-2xl font-black tracking-tight text-white">Purchase Bill</h3></div><div className="flex flex-wrap gap-3"><button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-slate-200 transition-all hover:border-white/20 hover:bg-white/[0.06]" onClick={() => openBillWindow(activeBill)} type="button"><FileText size={16} />View Bill</button><button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-slate-200 transition-all hover:border-white/20 hover:bg-white/[0.06]" onClick={() => openBillWindow(activeBill, { autoPrint: true })} type="button"><Printer size={16} />Print Bill</button><button className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition-all hover:bg-primary-700" onClick={() => openBillWindow(activeBill, { autoPrint: true })} type="button"><ReceiptText size={16} />Download PDF</button><button className="inline-flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-300 transition-all hover:bg-red-500/15" onClick={() => setActiveBill(null)} type="button"><X size={16} />Close</button></div></div><div className="max-h-[calc(92vh-110px)] overflow-y-auto p-6 md:p-8"><div className="rounded-[2rem] border border-white/10 bg-[#151b24] p-6 md:p-8"><div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-300">K.S. Sports</p><h4 className="mt-2 text-3xl font-black tracking-tight text-white">Supplier Purchase Bill</h4><p className="mt-2 text-sm text-slate-400">Use Print or Download PDF to save this bill with your browser print dialog.</p></div><div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-4"><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Bill Number</p><p className="mt-2 text-lg font-black text-white">{activeBill.billNumber || '-'}</p><p className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Date</p><p className="mt-2 text-sm font-semibold text-slate-300">{formatStockInwardBillDate(activeBill.date)}</p></div></div><div className="mt-8"><StockInwardBill entry={activeBill} /></div></div></div></div></div>}
    </div>
  );
};

export default StockInwardSection;
