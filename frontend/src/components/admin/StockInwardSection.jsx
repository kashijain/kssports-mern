import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CalendarDays,
  FileText,
  PackagePlus,
  Plus,
  Printer,
  ReceiptText,
  Save,
  Truck,
  UserRound,
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

const toNumber = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
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
  const [form, setForm] = useState(createEmptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [createProductRowId, setCreateProductRowId] = useState('');
  const [quickProductForm, setQuickProductForm] = useState(createEmptyQuickProductForm());
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

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
        };
      }),
    [form.items, products]
  );

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
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load inventory products');
    }
  };

  useEffect(() => {
    loadProducts();

    try {
      const savedDraft = window.localStorage.getItem('ks-sports-stock-inward-draft');
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft);
        if (parsedDraft && Array.isArray(parsedDraft.items)) {
          setForm({
            ...createEmptyForm(),
            ...parsedDraft,
            items: parsedDraft.items.length
              ? parsedDraft.items.map((item) => createLineItem(item))
              : [createLineItem()],
          });
        }
      }
    } catch (error) {
      console.error('Failed to restore stock inward draft', error);
    }
  }, []);

  const resetForm = () => {
    setEditingId('');
    setForm(createEmptyForm());
    setCreateProductRowId('');
    setQuickProductForm(createEmptyQuickProductForm());
    setShowCreateProductModal(false);
    setShowPreviewModal(false);
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

  const handleSaveDraft = () => {
    try {
      window.localStorage.setItem('ks-sports-stock-inward-draft', JSON.stringify(form));
      toast.success('Draft saved on this device');
    } catch (error) {
      console.error('Failed to save stock inward draft', error);
      toast.error('Unable to save draft locally');
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
      await loadProducts();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          (editingId ? 'Failed to update stock inward entry' : 'Failed to save stock inward entry')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const summaryCards = [
    {
      label: 'Base Cost',
      value: formatPrice(baseCost),
      accent: 'border-white/10 bg-white/[0.04] text-white',
    },
    {
      label: 'Extra Charges',
      value: formatPrice(extraChargesTotal),
      accent: 'border-white/10 bg-white/[0.04] text-white',
    },
    {
      label: 'Final Total',
      value: formatPrice(finalTotalCost),
      accent: 'border-amber-400/20 bg-amber-400/10 text-amber-100',
    },
    {
      label: 'Paid',
      value: formatPrice(paidAmount),
      accent: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
    },
    {
      label: 'Pending',
      value: formatPrice(pendingAmount),
      accent: 'border-rose-500/20 bg-rose-500/10 text-rose-100',
    },
  ];

  const cardShell =
    'rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(25,25,25,0.98),rgba(17,22,29,0.98))] p-5 shadow-[0_24px_70px_-42px_rgba(0,0,0,0.95)] md:p-6';
  const inputClass =
    'h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40';
  const fieldLabelClass = 'text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500';
  const previewLines = items.filter((item) => item.product || item.quantityValue || item.costPriceValue);

  return (
    <div className="space-y-8">
      <section className="space-y-6 rounded-[2.25rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.16),transparent_28%),linear-gradient(180deg,rgba(17,24,39,0.96),rgba(10,13,18,0.99))] p-6 shadow-[0_35px_90px_-44px_rgba(0,0,0,1)] md:p-8">
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-300">Stock Management</p>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="max-w-3xl text-3xl font-black leading-tight tracking-tight text-white md:text-5xl">
                {editingId ? 'Update Stock Inward Entry' : 'Create Stock Inward Entry'}
              </h2>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
                <CalendarDays size={16} className="text-primary-300" />
                {formatStockInwardBillDate(form.date)}
              </div>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-400">
              Premium inward desk for supplier purchases, multi-product bill entry, and live invoice-ready review.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((card) => (
            <div className={`rounded-[1.7rem] border p-5 ${card.accent}`} key={card.label}>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{card.label}</p>
              <p className="mt-3 text-3xl font-black tracking-tight">{card.value}</p>
            </div>
          ))}
        </div>
      </section>

      <form className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.9fr)_minmax(320px,0.95fr)]" onSubmit={handleSubmit}>
        <div className="space-y-6">
          <section className={cardShell}>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-300">
                <UserRound size={18} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-300">Supplier Details</p>
                <h3 className="mt-1 text-xl font-black text-white">Vendor & bill basics</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className={fieldLabelClass}>Supplier Name</label>
                <input className={inputClass} onChange={(event) => updateFormField('supplierName', event.target.value)} placeholder="e.g. Spartan Sports India" required type="text" value={form.supplierName} />
              </div>
              <div className="space-y-2">
                <label className={fieldLabelClass}>Bill Number</label>
                <input className={inputClass} onChange={(event) => updateFormField('billNumber', event.target.value)} placeholder="BILL/2026/1001" type="text" value={form.billNumber} />
              </div>
              <div className="space-y-2">
                <label className={fieldLabelClass}>Date</label>
                <input className={inputClass} onChange={(event) => updateFormField('date', event.target.value)} required type="date" value={form.date} />
              </div>
              <div className="space-y-2">
                <label className={fieldLabelClass}>Supplier Phone</label>
                <input className={inputClass} onChange={(event) => updateFormField('supplierPhone', event.target.value)} placeholder="+91 98765 43210" type="text" value={form.supplierPhone} />
              </div>
            </div>
          </section>

          <section className={cardShell}>
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-300">
                  <PackagePlus size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-300">Product Entry</p>
                  <h3 className="mt-1 text-xl font-black text-white">Card-based inward items</h3>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-slate-100 transition-all hover:border-white/20 hover:bg-white/[0.06]" onClick={addLineItem} type="button">
                  <Plus size={16} />
                  Add Product
                </button>
                <button className="inline-flex items-center gap-2 rounded-2xl border border-primary-500/20 bg-primary-500/10 px-4 py-3 text-sm font-bold text-primary-100 transition-all hover:bg-primary-500/15" onClick={() => openCreateProductModal(form.items[form.items.length - 1]?.id || '')} type="button">
                  <Plus size={16} />
                  Create New Product
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-4 md:p-5" key={item.id}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Line Item {index + 1}</p>
                      <p className="mt-1 text-sm text-slate-400">Choose the product, quantity, and inward rate for this bill row.</p>
                    </div>
                    <button className="inline-flex items-center gap-2 self-start rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-rose-200 transition-all hover:bg-rose-500/15" onClick={() => removeLineItem(item.id)} type="button">
                      <X size={14} />
                      Remove
                    </button>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_120px_170px_160px]">
                    <div className="space-y-2">
                      <label className={fieldLabelClass}>Product Name</label>
                      <select className="relative z-10 h-12 w-full rounded-2xl border border-white/10 bg-[#151b24] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40" onChange={(event) => handleLineProductChange(item.id, event.target.value)} required value={item.product}>
                        <option className="bg-[#151b24] text-white" disabled value="">Select product from inventory</option>
                        {products.map((product) => (
                          <option className="bg-[#151b24] text-white" key={product._id} value={product._id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className={fieldLabelClass}>Qty</label>
                      <input className={inputClass} min="1" onChange={(event) => updateLineItem(item.id, 'quantity', event.target.value)} required type="number" value={item.quantity} />
                    </div>
                    <div className="space-y-2">
                      <label className={fieldLabelClass}>Cost Per Item</label>
                      <input className={inputClass} min="0" onChange={(event) => updateLineItem(item.id, 'costPrice', event.target.value)} required step="0.01" type="number" value={item.costPrice} />
                    </div>
                    <div className="space-y-2">
                      <label className={fieldLabelClass}>Total</label>
                      <div className="flex h-12 items-center rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 text-sm font-black text-amber-100">{formatPrice(item.lineTotal)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className={cardShell}>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-300">
                <Truck size={18} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-300">Additional Charges</p>
                <h3 className="mt-1 text-xl font-black text-white">Operational costs</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className={fieldLabelClass}>Transport</label>
                <input className={inputClass} min="0" onChange={(event) => updateFormField('transportCharges', event.target.value)} step="0.01" type="number" value={form.transportCharges} />
              </div>
              <div className="space-y-2">
                <label className={fieldLabelClass}>Loading / Unloading</label>
                <input className={inputClass} min="0" onChange={(event) => updateFormField('loadingCharges', event.target.value)} step="0.01" type="number" value={form.loadingCharges} />
              </div>
              <div className="space-y-2">
                <label className={fieldLabelClass}>Rent</label>
                <input className={inputClass} min="0" onChange={(event) => updateFormField('rentCharges', event.target.value)} step="0.01" type="number" value={form.rentCharges} />
              </div>
              <div className="space-y-2">
                <label className={fieldLabelClass}>Other</label>
                <input className={inputClass} min="0" onChange={(event) => updateFormField('otherCharges', event.target.value)} step="0.01" type="number" value={form.otherCharges} />
              </div>
            </div>
          </section>

          <section className={cardShell}>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-300">
                  <Wallet size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-300">Payment Setup</p>
                  <h3 className="mt-1 text-xl font-black text-white">Settlement & notes</h3>
                </div>
              </div>
              <span className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] ${form.paymentStatus === 'Paid' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : form.paymentStatus === 'Partial' ? 'border-amber-400/20 bg-amber-400/10 text-amber-200' : 'border-rose-500/20 bg-rose-500/10 text-rose-300'}`}>
                {form.paymentStatus}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className={fieldLabelClass}>Payment Status</label>
                <select className="h-12 w-full rounded-2xl border border-white/10 bg-[#151b24] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40" onChange={(event) => updateFormField('paymentStatus', event.target.value)} required value={form.paymentStatus}>
                  {paymentStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className={fieldLabelClass}>Paid Amount</label>
                <input className={`${inputClass} ${form.paymentStatus !== 'Partial' ? 'cursor-not-allowed text-slate-500' : ''}`} disabled={form.paymentStatus !== 'Partial'} min="0" onChange={(event) => updateFormField('paidAmount', event.target.value)} step="0.01" type="number" value={form.paymentStatus === 'Partial' ? form.paidAmount : paidAmount} />
              </div>
              <div className="rounded-[1.4rem] border border-amber-400/20 bg-amber-400/10 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200">Final Total</p>
                <p className="mt-3 text-3xl font-black text-amber-100">{formatPrice(finalTotalCost)}</p>
              </div>
              <div className="rounded-[1.4rem] border border-rose-500/20 bg-rose-500/10 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-200">Pending Amount</p>
                <p className="mt-3 text-3xl font-black text-rose-100">{formatPrice(pendingAmount)}</p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className={fieldLabelClass}>Internal Notes</label>
                <textarea className="w-full rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40" onChange={(event) => updateFormField('notes', event.target.value)} placeholder="Add delivery notes, settlement details, or supplier remarks..." rows="4" value={form.notes} />
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(25,25,25,0.98),rgba(17,22,29,0.98))] shadow-[0_28px_70px_-42px_rgba(0,0,0,1)]">
            <div className="border-b border-white/10 p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-300">K.S. SPORTS ADMIN</p>
              <h3 className="mt-2 text-2xl font-black text-white">Live Document Preview</h3>
              <p className="mt-2 text-sm text-slate-400">Dark invoice card that updates instantly as you fill the inward bill.</p>
            </div>

            <div className="space-y-5 p-6">
              <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Supplier</p>
                    <p className="mt-2 text-lg font-black text-white">{form.supplierName || 'Supplier name'}</p>
                    <p className="mt-1 text-sm text-slate-400">{form.supplierPhone || 'Phone number pending'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Bill No</p>
                    <p className="mt-2 text-sm font-bold text-white">{form.billNumber || 'DRAFT'}</p>
                    <p className="mt-2 text-xs text-slate-500">{formatStockInwardBillDate(form.date)}</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {previewLines.map((item, index) => (
                    <div className="rounded-[1.2rem] border border-white/10 bg-[#11161d] px-4 py-3" key={item.id}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-white">{item.productName || 'Select product'}</p>
                          <p className="mt-1 text-xs text-slate-500">Qty {item.quantityValue} x {formatPrice(item.costPriceValue)}</p>
                        </div>
                        <p className="text-sm font-black text-white">{formatPrice(item.lineTotal)}</p>
                      </div>
                      <p className="mt-2 text-[11px] font-medium text-slate-500">Item {index + 1}</p>
                    </div>
                  ))}
                  {!previewLines.length && (
                    <div className="rounded-[1.2rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-slate-500">
                      Add products to start building the document preview.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-5">
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between"><span>Base Cost</span><span className="font-bold">{formatPrice(baseCost)}</span></div>
                  <div className="flex items-center justify-between"><span>Charges</span><span className="font-bold">{formatPrice(extraChargesTotal)}</span></div>
                  <div className="flex items-center justify-between"><span>Paid</span><span className="font-bold text-emerald-300">{formatPrice(paidAmount)}</span></div>
                  <div className="flex items-center justify-between"><span>Balance</span><span className="font-bold text-rose-300">{formatPrice(pendingAmount)}</span></div>
                </div>
                <div className="mt-4 rounded-[1.2rem] border border-amber-400/20 bg-amber-400/10 px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200">Grand Total</p>
                  <p className="mt-2 text-3xl font-black text-amber-100">{formatPrice(finalTotalCost)}</p>
                </div>
              </div>

              <div className="grid gap-3">
                <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-6 py-3.5 text-sm font-black text-white shadow-[0_20px_44px_-20px_rgba(220,38,38,0.75)] transition-all hover:-translate-y-0.5 hover:bg-primary-700 disabled:opacity-60" disabled={submitting} type="submit">
                  <Save size={16} />
                  {submitting ? 'Saving...' : 'Confirm & Record Entry ->'}
                </button>
                <button className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-bold text-slate-200 transition-all hover:border-white/20 hover:bg-white/[0.06]" onClick={handleSaveDraft} type="button">
                  Save as Draft
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-slate-200 transition-all hover:border-white/20 hover:bg-white/[0.06]" onClick={() => setShowPreviewModal(true)} type="button">
                    <FileText size={16} />
                    Print
                  </button>
                  <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-slate-200 transition-all hover:border-white/20 hover:bg-white/[0.06]" onClick={() => openBillWindow(currentDraftEntry)} type="button">
                    <ReceiptText size={16} />
                    Export
                  </button>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </form>

      {showCreateProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#10151d] shadow-[0_32px_100px_-40px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-300">Quick Product Create</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-white">Add new inventory product</h3>
              </div>
              <button className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition-all hover:border-white/20 hover:bg-white/[0.06]" onClick={() => setShowCreateProductModal(false)} type="button">
                <X size={18} />
              </button>
            </div>
            <form className="space-y-6 p-6" onSubmit={handleQuickProductCreate}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className={fieldLabelClass}>Product Name</label>
                  <input className={inputClass} onChange={(event) => setQuickProductForm((current) => ({ ...current, name: event.target.value }))} placeholder="Enter product name" required type="text" value={quickProductForm.name} />
                </div>
                <div className="space-y-2">
                  <label className={fieldLabelClass}>Category</label>
                  <select className="h-12 w-full rounded-2xl border border-white/10 bg-[#151b24] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40" onChange={(event) => setQuickProductForm((current) => ({ ...current, category: event.target.value }))} required value={quickProductForm.category}>
                    {PRODUCT_CATEGORY_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={fieldLabelClass}>Selling Price</label>
                  <input className={inputClass} min="0" onChange={(event) => setQuickProductForm((current) => ({ ...current, price: event.target.value }))} required step="0.01" type="number" value={quickProductForm.price} />
                </div>
                <div className="space-y-2">
                  <label className={fieldLabelClass}>Cost Price</label>
                  <input className={inputClass} min="0" onChange={(event) => setQuickProductForm((current) => ({ ...current, costPrice: event.target.value }))} required step="0.01" type="number" value={quickProductForm.costPrice} />
                </div>
                <div className="space-y-2">
                  <label className={fieldLabelClass}>Stock</label>
                  <input className={inputClass} min="0" onChange={(event) => setQuickProductForm((current) => ({ ...current, countInStock: event.target.value }))} step="1" type="number" value={quickProductForm.countInStock} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className={fieldLabelClass}>Description</label>
                  <textarea className="w-full rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40" onChange={(event) => setQuickProductForm((current) => ({ ...current, description: event.target.value }))} placeholder="Optional short description" rows="3" value={quickProductForm.description} />
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-bold text-slate-200 transition-all hover:border-white/20 hover:bg-white/[0.06]" onClick={() => setShowCreateProductModal(false)} type="button">Cancel</button>
                <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-8 py-3 text-sm font-black text-white transition-all hover:bg-primary-700 disabled:opacity-60" disabled={creatingProduct} type="submit">
                  <Plus size={16} />
                  {creatingProduct ? 'Creating...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/80 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d] shadow-[0_32px_100px_-40px_rgba(0,0,0,1)]">
            <div className="flex flex-col gap-4 border-b border-white/10 p-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-300">Bill Preview</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-white">Stock Inward Draft</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-slate-200 transition-all hover:border-white/20 hover:bg-white/[0.06]" onClick={() => openBillWindow(currentDraftEntry)} type="button"><FileText size={16} />View Bill</button>
                <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-slate-200 transition-all hover:border-white/20 hover:bg-white/[0.06]" onClick={() => openBillWindow(currentDraftEntry, { autoPrint: true })} type="button"><Printer size={16} />Print Bill</button>
                <button className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-sm font-black text-white transition-all hover:bg-primary-700" onClick={() => openBillWindow(currentDraftEntry, { autoPrint: true })} type="button"><ReceiptText size={16} />Download PDF</button>
                <button className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-3 text-sm font-bold text-rose-300 transition-all hover:bg-rose-500/15" onClick={() => setShowPreviewModal(false)} type="button"><X size={16} />Close</button>
              </div>
            </div>
            <div className="max-h-[calc(92vh-110px)] overflow-y-auto p-6 md:p-8">
              <div className="rounded-[2rem] border border-white/10 bg-[#151b24] p-6 md:p-8">
                <StockInwardBill entry={currentDraftEntry} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockInwardSection;
