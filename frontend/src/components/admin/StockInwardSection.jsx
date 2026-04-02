import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CalendarDays,
  CircleDollarSign,
  FileText,
  PackagePlus,
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

const emptySummary = {
  totalSuppliers: 0,
  totalPurchaseValue: 0,
  totalPaid: 0,
  totalPending: 0,
};

const createEmptyForm = () => ({
  date: getToday(),
  supplierName: '',
  supplierPhone: '',
  billNumber: '',
  product: '',
  quantity: '1',
  costPrice: '',
  transportCharges: '0',
  rentCharges: '0',
  loadingCharges: '0',
  otherCharges: '0',
  paymentStatus: 'Pending',
  paidAmount: '0',
  notes: '',
});

const paymentStatuses = ['Paid', 'Pending', 'Partial'];

const formatDateForInput = (value) => {
  if (!value) {
    return getToday();
  }

  return new Date(value).toISOString().slice(0, 10);
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
    window.setTimeout(() => {
      popup.print();
    }, 150);
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
  const [summary, setSummary] = useState(emptySummary);
  const [form, setForm] = useState(createEmptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [activeBill, setActiveBill] = useState(null);

  const selectedProduct = useMemo(
    () => products.find((product) => product._id === form.product) || null,
    [products, form.product]
  );

  const quantity = Number(form.quantity) || 0;
  const costPrice = Number(form.costPrice) || 0;
  const transportCharges = Number(form.transportCharges) || 0;
  const rentCharges = Number(form.rentCharges) || 0;
  const loadingCharges = Number(form.loadingCharges) || 0;
  const otherCharges = Number(form.otherCharges) || 0;
  const totalCost = quantity * costPrice;
  const finalTotalCost =
    totalCost + transportCharges + rentCharges + loadingCharges + otherCharges;

  const paidAmount = useMemo(() => {
    if (form.paymentStatus === 'Paid') {
      return finalTotalCost;
    }

    if (form.paymentStatus === 'Pending') {
      return 0;
    }

    const value = Number(form.paidAmount);
    if (!Number.isFinite(value) || value < 0) {
      return 0;
    }

    return Math.min(value, finalTotalCost);
  }, [finalTotalCost, form.paymentStatus, form.paidAmount]);

  const pendingAmount = Math.max(finalTotalCost - paidAmount, 0);

  const loadProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data.products || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load inventory products');
    }
  };

  const loadEntries = async () => {
    setLoading(true);

    try {
      const { data } = await api.get('/admin-inventory/stock-inward');
      setEntries(data.entries || []);
      setSummary(data.summary || emptySummary);
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
  };

  const handleProductChange = (productId) => {
    const product = products.find((item) => item._id === productId);

    setForm((current) => ({
      ...current,
      product: productId,
      costPrice:
        current.costPrice && Number(current.costPrice) > 0
          ? current.costPrice
          : product?.costPrice !== undefined
            ? String(product.costPrice)
            : '',
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

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
      product: form.product,
      quantity,
      costPrice,
      totalCost,
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

    try {
      if (editingId) {
        await api.put(`/admin-inventory/stock-inward/${editingId}`, payload);
        toast.success('Stock inward entry updated');
      } else {
        await api.post('/admin-inventory/stock-inward', payload);
        toast.success('Stock inward entry saved');
      }

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
    setEditingId(entry._id);
    setForm({
      date: formatDateForInput(entry.date),
      supplierName: entry.supplierName || '',
      supplierPhone: entry.supplierPhone || '',
      billNumber: entry.billNumber || '',
      product: entry.product?._id || entry.product || '',
      quantity: String(entry.quantity ?? 1),
      costPrice: String(entry.costPrice ?? ''),
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

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d]/95 p-6 shadow-[0_28px_80px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl md:p-8">
        <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.18),transparent_52%)]"></div>
        <div className="relative space-y-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-300">K.S. Sports Procurement Desk</p>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white md:text-4xl">Stock Inward</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                Record supplier purchases, push stock directly into inventory, and keep a clean inward history with bill-ready records.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Selected Product</p>
              <p className="mt-2 text-xl font-black text-white">{selectedProduct?.name || 'Choose product'}</p>
              <p className="mt-1 text-sm text-slate-400">
                {selectedProduct ? `${selectedProduct.countInStock || 0} currently in stock` : 'Inventory products load from the existing catalog'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#151b24] p-5 shadow-[0_22px_60px_-36px_rgba(0,0,0,0.95)]">
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-white/5 blur-3xl"></div>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-300">
                <Users size={20} />
              </div>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Total Suppliers</p>
              <p className="mt-3 text-3xl font-black tracking-tight text-white">{summary.totalSuppliers || 0}</p>
              <p className="mt-2 text-sm text-slate-400">Unique wholesalers in inward history</p>
            </div>

            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#151b24] p-5 shadow-[0_22px_60px_-36px_rgba(0,0,0,0.95)]">
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-white/5 blur-3xl"></div>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-300">
                <CircleDollarSign size={20} />
              </div>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Total Purchase Value</p>
              <p className="mt-3 text-3xl font-black tracking-tight text-white">{formatPrice(summary.totalPurchaseValue || 0)}</p>
              <p className="mt-2 text-sm text-slate-400">{entries.length} inward records</p>
            </div>

            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#151b24] p-5 shadow-[0_22px_60px_-36px_rgba(0,0,0,0.95)]">
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-white/5 blur-3xl"></div>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                <Wallet size={20} />
              </div>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Total Paid</p>
              <p className="mt-3 text-3xl font-black tracking-tight text-white">{formatPrice(summary.totalPaid || 0)}</p>
              <p className="mt-2 text-sm text-slate-400">Captured from saved inward entries</p>
            </div>

            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#151b24] p-5 shadow-[0_22px_60px_-36px_rgba(0,0,0,0.95)]">
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-white/5 blur-3xl"></div>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300">
                <Truck size={20} />
              </div>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Total Pending</p>
              <p className="mt-3 text-3xl font-black tracking-tight text-white">{formatPrice(summary.totalPending || 0)}</p>
              <p className="mt-2 text-sm text-slate-400">Open supplier balance</p>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d]/95 p-6 shadow-[0_28px_80px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-300">Purchase Form</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-white">
              {editingId ? 'Update Stock Inward Entry' : 'Create Stock Inward Entry'}
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Saving this entry increases inventory stock automatically and updates the latest product cost price.
            </p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-slate-200 transition-all hover:border-white/20 hover:bg-white/[0.06]"
            >
              <X size={16} />
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Date</label>
              <input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40" required />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Supplier / Wholesaler Name</label>
              <input type="text" value={form.supplierName} onChange={(event) => setForm((current) => ({ ...current, supplierName: event.target.value }))} className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40" placeholder="Enter supplier name" required />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Supplier Phone</label>
              <input type="text" value={form.supplierPhone} onChange={(event) => setForm((current) => ({ ...current, supplierPhone: event.target.value }))} className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40" placeholder="Phone number" />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Bill Number</label>
              <input type="text" value={form.billNumber} onChange={(event) => setForm((current) => ({ ...current, billNumber: event.target.value }))} className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40" placeholder="Bill / invoice number" />
            </div>

            <div className="space-y-2 xl:col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Product Name</label>
              <select value={form.product} onChange={(event) => handleProductChange(event.target.value)} className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40" required>
                <option value="" disabled>Select product from inventory</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Quantity Purchased</label>
              <input type="number" min="1" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40" required />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Cost Price Per Item</label>
              <input type="number" min="0" step="0.01" value={form.costPrice} onChange={(event) => setForm((current) => ({ ...current, costPrice: event.target.value }))} className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40" placeholder="Purchase rate" required />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Total Cost</label>
              <input type="text" readOnly value={formatPrice(totalCost)} className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white outline-none" />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Transport Charges</label>
              <input type="number" min="0" step="0.01" value={form.transportCharges} onChange={(event) => setForm((current) => ({ ...current, transportCharges: event.target.value }))} className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40" />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Rent Charges</label>
              <input type="number" min="0" step="0.01" value={form.rentCharges} onChange={(event) => setForm((current) => ({ ...current, rentCharges: event.target.value }))} className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40" />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Loading Charges</label>
              <input type="number" min="0" step="0.01" value={form.loadingCharges} onChange={(event) => setForm((current) => ({ ...current, loadingCharges: event.target.value }))} className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40" />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Other Charges</label>
              <input type="number" min="0" step="0.01" value={form.otherCharges} onChange={(event) => setForm((current) => ({ ...current, otherCharges: event.target.value }))} className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40" />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Final Total Cost</label>
              <input type="text" readOnly value={formatPrice(finalTotalCost)} className="h-12 w-full rounded-2xl border border-primary-500/20 bg-primary-500/10 px-4 text-sm font-semibold text-white outline-none" />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Payment Status</label>
              <select value={form.paymentStatus} onChange={(event) => setForm((current) => ({ ...current, paymentStatus: event.target.value }))} className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40" required>
                {paymentStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Paid Amount</label>
              <input type="number" min="0" step="0.01" value={form.paymentStatus === 'Paid' ? String(finalTotalCost) : form.paymentStatus === 'Pending' ? '0' : form.paidAmount} onChange={(event) => setForm((current) => ({ ...current, paidAmount: event.target.value }))} readOnly={form.paymentStatus !== 'Partial'} className={`h-12 w-full rounded-2xl border px-4 text-sm outline-none transition-all ${form.paymentStatus === 'Partial' ? 'border-white/10 bg-white/[0.04] text-white focus:border-primary-500/40' : 'border-white/10 bg-white/[0.04] text-slate-400'}`} />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Pending Amount</label>
              <input type="text" readOnly value={formatPrice(pendingAmount)} className="h-12 w-full rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 text-sm font-semibold text-white outline-none" />
            </div>

            <div className="space-y-2 md:col-span-2 xl:col-span-4">
              <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Notes</label>
              <textarea rows="3" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40" placeholder="Transport details, payment note, supplier reminder, or any internal note" />
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-white/10 bg-[#151b24] p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-300">Live Purchase Calculation</p>
                <h4 className="mt-2 text-xl font-black text-white">Stock + Cost Snapshot</h4>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                New stock after save: {(selectedProduct?.countInStock || 0) + quantity}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-300">
                  <PackagePlus size={18} />
                </div>
                <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Current Stock</p>
                <p className="mt-2 text-2xl font-black text-white">{selectedProduct?.countInStock || 0}</p>
              </div>

              <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-300">
                  <CalendarDays size={18} />
                </div>
                <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Purchased Qty</p>
                <p className="mt-2 text-2xl font-black text-white">{quantity}</p>
              </div>

              <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-300">
                  <Wallet size={18} />
                </div>
                <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Paid Amount</p>
                <p className="mt-2 text-2xl font-black text-white">{formatPrice(paidAmount)}</p>
              </div>

              <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-300">
                  <ReceiptText size={18} />
                </div>
                <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Pending Amount</p>
                <p className="mt-2 text-2xl font-black text-white">{formatPrice(pendingAmount)}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={resetForm} className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-bold text-slate-200 transition-all hover:border-white/20 hover:bg-white/[0.06]">
              Reset
            </button>
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-8 py-3 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_20px_44px_-20px_rgba(220,38,38,0.75)] transition-all hover:-translate-y-0.5 hover:bg-primary-700 disabled:opacity-60">
              <Save size={16} />
              {submitting ? 'Saving...' : editingId ? 'Update Entry' : 'Save Entry'}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d]/95 shadow-[0_28px_80px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 border-b border-white/10 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-300">Purchase History</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-white">Stock Inward Entries</h3>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            {loading ? 'Loading history...' : `${entries.length} visible entries`}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1300px] text-left">
            <thead>
              <tr className="bg-white/[0.02] text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5">Supplier</th>
                <th className="px-6 py-5">Bill</th>
                <th className="px-6 py-5">Product</th>
                <th className="px-6 py-5 text-center">Qty</th>
                <th className="px-6 py-5 text-center">Cost Price</th>
                <th className="px-6 py-5 text-center">Final Total</th>
                <th className="px-6 py-5 text-center">Payment</th>
                <th className="px-6 py-5 text-center">Paid</th>
                <th className="px-6 py-5 text-center">Pending</th>
                <th className="px-6 py-5">Notes</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {!loading && entries.length === 0 && (
                <tr>
                  <td colSpan="12" className="px-6 py-12 text-center text-sm text-slate-500">
                    No stock inward entries yet. Create your first purchase entry to update inventory.
                  </td>
                </tr>
              )}

              {entries.map((entry) => (
                <tr key={entry._id} className="transition-colors hover:bg-white/[0.03]">
                  <td className="px-6 py-5 text-sm text-slate-300">{formatStockInwardBillDate(entry.date)}</td>
                  <td className="px-6 py-5">
                    <p className="font-bold text-white">{entry.supplierName}</p>
                    <p className="mt-1 text-xs text-slate-500">{entry.supplierPhone || 'No phone added'}</p>
                  </td>
                  <td className="px-6 py-5 text-sm font-semibold text-slate-300">{entry.billNumber || '-'}</td>
                  <td className="px-6 py-5">
                    <p className="font-bold text-white">{entry.product?.name || '-'}</p>
                    <p className="mt-1 text-xs text-slate-500">Latest stock: {entry.product?.countInStock ?? '-'}</p>
                  </td>
                  <td className="px-6 py-5 text-center text-sm font-semibold text-slate-300">{entry.quantity}</td>
                  <td className="px-6 py-5 text-center text-sm font-bold text-white">{formatPrice(entry.costPrice)}</td>
                  <td className="px-6 py-5 text-center text-sm font-black text-primary-300">{formatPrice(entry.finalTotalCost)}</td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] ${entry.paymentStatus === 'Paid' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : entry.paymentStatus === 'Partial' ? 'border-sky-500/20 bg-sky-500/10 text-sky-300' : 'border-amber-500/20 bg-amber-500/10 text-amber-300'}`}>
                      {entry.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center text-sm font-semibold text-slate-300">{formatPrice(entry.paidAmount)}</td>
                  <td className="px-6 py-5 text-center text-sm font-semibold text-amber-300">{formatPrice(entry.pendingAmount)}</td>
                  <td className="px-6 py-5 text-sm text-slate-400">{entry.notes || '-'}</td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button type="button" onClick={() => setActiveBill(entry)} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-200 transition-all hover:border-white/20 hover:bg-white/[0.06]">
                        <FileText size={14} />
                        View Bill
                      </button>
                      <button type="button" onClick={() => openBillWindow(entry, { autoPrint: true })} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-200 transition-all hover:border-white/20 hover:bg-white/[0.06]">
                        <Printer size={14} />
                        Print Bill
                      </button>
                      <button type="button" onClick={() => openBillWindow(entry, { autoPrint: true })} className="inline-flex items-center gap-2 rounded-2xl border border-primary-500/20 bg-primary-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-primary-200 transition-all hover:bg-primary-500/15">
                        <ReceiptText size={14} />
                        Download PDF
                      </button>
                      <button type="button" onClick={() => handleEdit(entry)} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-200 transition-all hover:border-white/20 hover:bg-white/[0.06]">
                        <CalendarDays size={14} />
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(entry._id)} className="inline-flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-red-300 transition-all hover:bg-red-500/15">
                        <X size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {activeBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/80 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d] shadow-[0_32px_100px_-40px_rgba(0,0,0,1)]">
            <div className="flex flex-col gap-4 border-b border-white/10 p-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-300">Bill Preview</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-white">Purchase Bill</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => openBillWindow(activeBill)} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-slate-200 transition-all hover:border-white/20 hover:bg-white/[0.06]">
                  <FileText size={16} />
                  View Bill
                </button>
                <button type="button" onClick={() => openBillWindow(activeBill, { autoPrint: true })} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-slate-200 transition-all hover:border-white/20 hover:bg-white/[0.06]">
                  <Printer size={16} />
                  Print Bill
                </button>
                <button type="button" onClick={() => openBillWindow(activeBill, { autoPrint: true })} className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition-all hover:bg-primary-700">
                  <ReceiptText size={16} />
                  Download PDF
                </button>
                <button type="button" onClick={() => setActiveBill(null)} className="inline-flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-300 transition-all hover:bg-red-500/15">
                  <X size={16} />
                  Close
                </button>
              </div>
            </div>

            <div className="max-h-[calc(92vh-110px)] overflow-y-auto p-6 md:p-8">
              <div className="rounded-[2rem] border border-white/10 bg-[#151b24] p-6 md:p-8">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-300">K.S. Sports</p>
                    <h4 className="mt-2 text-3xl font-black tracking-tight text-white">Supplier Purchase Bill</h4>
                    <p className="mt-2 text-sm text-slate-400">Use Print or Download PDF to save this bill with your browser print dialog.</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Bill Number</p>
                    <p className="mt-2 text-lg font-black text-white">{activeBill.billNumber || '-'}</p>
                    <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Date</p>
                    <p className="mt-2 text-sm font-semibold text-slate-300">{formatStockInwardBillDate(activeBill.date)}</p>
                  </div>
                </div>

                <div className="mt-8">
                  <StockInwardBill entry={activeBill} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockInwardSection;
