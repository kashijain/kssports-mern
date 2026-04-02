import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CalendarDays,
  ChartColumn,
  CircleDollarSign,
  Clock3,
  Download,
  FileUp,
  Filter,
  Package,
  Pencil,
  Trash2,
  Wallet,
} from 'lucide-react';
import api from '../../api/axios';
import { formatPrice } from '../../utils/price';

const paymentModes = ['Cash', 'Online', 'Pending'];

const getToday = () => new Date().toISOString().slice(0, 10);

const emptySummary = {
  totalSale: 0,
  totalCost: 0,
  totalProfit: 0,
  totalQuantitySold: 0,
};

const createEmptyForm = () => ({
  saleDate: getToday(),
  productId: '',
  quantitySold: '1',
  salePricePerItem: '',
  costPricePerItem: '',
  pendingAmount: '',
  customerName: '',
  paymentMode: 'Cash',
  notes: '',
});

const OfflineSalesSection = () => {
  const formRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState(emptySummary);
  const [loadingSales, setLoadingSales] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingSheet, setUploadingSheet] = useState(false);
  const [sheetFile, setSheetFile] = useState(null);
  const [sheetResult, setSheetResult] = useState(null);
  const [editingSaleId, setEditingSaleId] = useState('');
  const [filters, setFilters] = useState({ date: '', month: '', from: '', to: '' });
  const [appliedFilters, setAppliedFilters] = useState({ date: '', month: '', from: '', to: '' });
  const [form, setForm] = useState(createEmptyForm());

  const selectedProduct = useMemo(
    () => products.find((item) => item._id === form.productId) || null,
    [products, form.productId]
  );

  const totalSale = useMemo(
    () => (Number(form.quantitySold) || 0) * (Number(form.salePricePerItem) || 0),
    [form.quantitySold, form.salePricePerItem]
  );
  const totalCost = useMemo(
    () => (Number(form.quantitySold) || 0) * (Number(form.costPricePerItem) || 0),
    [form.quantitySold, form.costPricePerItem]
  );
  const profit = useMemo(() => totalSale - totalCost, [totalSale, totalCost]);
  const pendingAmount = useMemo(() => {
    if (form.paymentMode !== 'Pending') {
      return 0;
    }

    const value = Number(form.pendingAmount);
    return Number.isFinite(value) && value >= 0 ? value : 0;
  }, [form.paymentMode, form.pendingAmount]);
  const pendingBalance = useMemo(
    () => sales.reduce((sum, sale) => sum + (Number(sale.pendingAmount) || 0), 0),
    [sales]
  );
  const todayRevenue = useMemo(() => {
    const today = getToday();
    return sales.reduce(
      (sum, sale) =>
        sale.saleDate?.slice(0, 10) === today ? sum + (Number(sale.totalSale) || 0) : sum,
      0
    );
  }, [sales]);
  const todaySalesCount = useMemo(() => {
    const today = getToday();
    return sales.filter((sale) => sale.saleDate?.slice(0, 10) === today).length;
  }, [sales]);

  const resetForm = () => {
    setEditingSaleId('');
    setForm(createEmptyForm());
  };

  const loadProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data.products || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load products');
    }
  };

  const loadSales = async (activeFilters = appliedFilters) => {
    setLoadingSales(true);

    try {
      const params = new URLSearchParams();

      if (activeFilters.date) {
        params.set('date', activeFilters.date);
      } else if (activeFilters.month) {
        params.set('month', activeFilters.month);
      } else {
        if (activeFilters.from) {
          params.set('from', activeFilters.from);
        }
        if (activeFilters.to) {
          params.set('to', activeFilters.to);
        }
      }

      const query = params.toString();
      const { data } = await api.get(`/admin-inventory/offline-sales${query ? `?${query}` : ''}`);
      setSales(data.sales || []);
      setSummary(data.summary || emptySummary);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load offline sales');
    } finally {
      setLoadingSales(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    loadSales(appliedFilters);
  }, [appliedFilters]);

  const handleProductChange = (productId) => {
    const nextProduct = products.find((item) => item._id === productId);

    setForm((current) => ({
      ...current,
      productId,
      salePricePerItem:
        nextProduct && nextProduct.price !== undefined ? String(nextProduct.price) : '',
      costPricePerItem:
        nextProduct && nextProduct.costPrice !== undefined ? String(nextProduct.costPrice) : '',
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedPendingAmount = form.paymentMode === 'Pending' ? Number(form.pendingAmount) : 0;

    if (form.paymentMode === 'Pending' && (!Number.isFinite(normalizedPendingAmount) || normalizedPendingAmount <= 0)) {
      toast.error('Pending amount is required for pending payment');
      return;
    }

    if (normalizedPendingAmount > totalSale) {
      toast.error('Pending amount cannot be greater than total sale');
      return;
    }

    if (form.paymentMode === 'Pending' && !form.customerName.trim()) {
      toast.error('Customer name is required when payment is pending');
      return;
    }

    setSubmitting(true);

    const payload = {
      saleDate: form.saleDate,
      productId: form.productId,
      quantitySold: Number(form.quantitySold),
      salePricePerItem: Number(form.salePricePerItem),
      costPricePerItem: Number(form.costPricePerItem),
      pendingAmount: normalizedPendingAmount,
      customerName: form.customerName,
      paymentMode: form.paymentMode,
      notes: form.notes,
    };

    try {
      if (editingSaleId) {
        await api.put(`/admin-inventory/offline-sales/${editingSaleId}`, payload);
        toast.success('Offline sale updated');
      } else {
        await api.post('/admin-inventory/offline-sales', payload);
        toast.success('Offline sale saved');
      }

      resetForm();
      await Promise.all([loadProducts(), loadSales(appliedFilters)]);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          (editingSaleId ? 'Failed to update offline sale' : 'Failed to save offline sale')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (sale) => {
    setEditingSaleId(sale._id);
    setForm({
      saleDate: sale.saleDate?.slice(0, 10) || getToday(),
      productId: sale.product?._id || sale.product,
      quantitySold: String(sale.quantitySold ?? 1),
      salePricePerItem: String(sale.salePricePerItem ?? ''),
      costPricePerItem: String(sale.costPricePerItem ?? ''),
      pendingAmount: String(sale.pendingAmount ?? ''),
      customerName: sale.customerName || '',
      paymentMode: sale.paymentMode || 'Cash',
      notes: sale.notes || '',
    });

    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleDelete = async (saleId) => {
    if (!window.confirm('Delete this offline sale entry?')) {
      return;
    }

    try {
      await api.delete(`/admin-inventory/offline-sales/${saleId}`);

      if (editingSaleId === saleId) {
        resetForm();
      }

      toast.success('Offline sale deleted');
      await Promise.all([loadProducts(), loadSales(appliedFilters)]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete offline sale');
    }
  };

  const handleSheetUpload = async (event) => {
    event.preventDefault();

    if (!sheetFile) {
      toast.error('Please choose an offline sales sheet first');
      return;
    }

    const formData = new FormData();
    formData.append('offlineSalesSheet', sheetFile);
    setUploadingSheet(true);

    try {
      const { data } = await api.post('/admin-inventory/offline-sales/upload', formData);
      setSheetResult(data);
      toast.success(data.message || 'Offline sales sheet uploaded');
      await Promise.all([loadProducts(), loadSales(appliedFilters)]);
    } catch (error) {
      setSheetResult(null);
      toast.error(error.response?.data?.message || 'Failed to upload offline sales sheet');
    } finally {
      setUploadingSheet(false);
    }
  };

  const applyFilters = () => {
    setAppliedFilters(filters);
  };

  const clearFilters = () => {
    const cleared = { date: '', month: '', from: '', to: '' };
    setFilters(cleared);
    setAppliedFilters(cleared);
  };

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d]/95 p-6 shadow-[0_28px_80px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl md:p-8">
        <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.18),transparent_52%)]"></div>
        <div className="relative space-y-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-300">K.S. Sports Sales Console</p>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white md:text-4xl">Offline Sales Tracker</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                Monitor premium counter sales, protect margin visibility, and keep pending collections clearly tracked in one place.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Today's Tracking</p>
              <p className="mt-2 text-xl font-black text-white">{todaySalesCount} entries</p>
              <p className="mt-1 text-sm text-slate-400">{formatPrice(todayRevenue)} booked today</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Today's Revenue",
                value: formatPrice(todayRevenue),
                note: `${todaySalesCount} sales today`,
                icon: CircleDollarSign,
                tone: 'text-emerald-300 bg-emerald-500/15',
              },
              {
                label: 'Total Units Sold',
                value: summary.totalQuantitySold || 0,
                note: `${sales.length} records in current view`,
                icon: Package,
                tone: 'text-sky-300 bg-sky-500/15',
              },
              {
                label: 'Total Profit',
                value: formatPrice(summary.totalProfit || 0),
                note: 'Based on current filtered sales',
                icon: ChartColumn,
                tone: 'text-primary-300 bg-primary-500/15',
              },
              {
                label: 'Pending Balance',
                value: formatPrice(pendingBalance),
                note: `${sales.filter((sale) => Number(sale.pendingAmount) > 0).length} pending entries`,
                icon: Wallet,
                tone: 'text-amber-300 bg-amber-500/15',
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#151b24] p-5 shadow-[0_22px_60px_-36px_rgba(0,0,0,0.95)]">
                  <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-white/5 blur-3xl"></div>
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${card.tone}`}>
                    <Icon size={20} />
                  </div>
                  <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">{card.label}</p>
                  <p className="mt-3 text-3xl font-black tracking-tight text-white">{card.value}</p>
                  <p className="mt-2 text-sm text-slate-400">{card.note}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section
        ref={formRef}
        className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d]/95 p-6 shadow-[0_28px_80px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl md:p-8"
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-300">Import Sheet</p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-white">Upload Offline Sales Sheet</h3>
          <p className="mt-2 text-sm text-slate-400">
            Upload .xlsx or .csv with columns: Date, Product Name, Quantity Sold, Sale Price Per Item, Cost Price Per Item, Payment Mode, Notes
          </p>
        </div>

        <form onSubmit={handleSheetUpload} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Offline Sales Sheet</label>
            <input
              type="file"
              accept=".xlsx,.csv"
              onChange={(event) => setSheetFile(event.target.files?.[0] || null)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none file:mr-4 file:rounded-xl file:border-0 file:bg-primary-600 file:px-4 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-[0.16em] file:text-white"
            />
            <p className="text-xs text-slate-500">
              Example row: 2026-03-31, KC Bat, 2, 1200, 900, Cash, Counter sale
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploadingSheet}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-bold text-white transition-all hover:border-white/20 hover:bg-white/[0.06] disabled:opacity-60"
            >
              <FileUp size={16} />
              {uploadingSheet ? 'Uploading...' : 'Upload Sheet'}
            </button>
          </div>
        </form>

        {sheetResult && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
              <p className="text-sm font-semibold text-emerald-300">{sheetResult.message}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                ['Total Rows Processed', sheetResult.totalRowsProcessed ?? 0],
                ['Imported Successfully', sheetResult.importedSuccessfully ?? 0],
                ['Skipped / Failed', sheetResult.skippedRows ?? 0],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-[1.3rem] border border-white/10 bg-[#151b24] p-4"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">{label}</p>
                  <p className="mt-3 text-2xl font-black text-white">{value}</p>
                </div>
              ))}
            </div>

            {Array.isArray(sheetResult.errors) && sheetResult.errors.length > 0 && (
              <div className="rounded-[1.3rem] border border-amber-500/20 bg-amber-500/10 p-4">
                <p className="mb-3 text-sm font-bold text-amber-300">Skipped Rows</p>
                <div className="space-y-2">
                  {sheetResult.errors.map((item) => (
                    <p key={item} className="text-sm text-amber-200">
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d]/95 p-6 shadow-[0_28px_80px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl md:p-8">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-300">{editingSaleId ? 'Edit Entry' : 'Record New Sale'}</p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-white">Offline Sales Entry Panel</h3>
          <p className="mt-2 text-sm text-slate-400">
            Record date-wise offline sales without affecting the online payment flow.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Date</label>
            <input
              type="date"
              value={form.saleDate}
              onChange={(event) => setForm((current) => ({ ...current, saleDate: event.target.value }))}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Product Name</label>
            <select
              value={form.productId}
              onChange={(event) => handleProductChange(event.target.value)}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40"
              required
            >
              <option value="" disabled>Select Product</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Quantity Sold</label>
            <input
              type="number"
              min="1"
              value={form.quantitySold}
              onChange={(event) => setForm((current) => ({ ...current, quantitySold: event.target.value }))}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Sale Price Per Item</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.salePricePerItem}
              onChange={(event) => setForm((current) => ({ ...current, salePricePerItem: event.target.value }))}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Total Sale</label>
            <input
              type="text"
              value={formatPrice(totalSale)}
              readOnly
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Cost Price Per Item</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.costPricePerItem}
              onChange={(event) => setForm((current) => ({ ...current, costPricePerItem: event.target.value }))}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40"
              placeholder={selectedProduct ? 'Enter cost price' : ''}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Total Cost</label>
            <input
              type="text"
              value={formatPrice(totalCost)}
              readOnly
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Profit</label>
            <input
              type="text"
              value={formatPrice(profit)}
              readOnly
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-emerald-300 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Payment Mode</label>
            <select
              value={form.paymentMode}
              onChange={(event) => setForm((current) => ({ ...current, paymentMode: event.target.value }))}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40"
              required
            >
              {paymentModes.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>

          {form.paymentMode === 'Pending' ? (
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Pending Amount</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.pendingAmount}
                onChange={(event) => setForm((current) => ({ ...current, pendingAmount: event.target.value }))}
                className="h-12 w-full rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 text-sm text-white outline-none transition-all focus:border-amber-400/50"
                required
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Pending Amount</label>
              <input
                type="text"
                value={formatPrice(0)}
                readOnly
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-slate-400 outline-none"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Customer Name {form.paymentMode === 'Pending' ? <span className="text-primary-300">(Required)</span> : null}</label>
            <input
              type="text"
              value={form.customerName}
              onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))}
              className={`h-12 w-full rounded-2xl border px-4 text-sm text-white outline-none transition-all ${
                form.paymentMode === 'Pending'
                  ? 'border-primary-500/30 bg-primary-500/10 focus:border-primary-500/50'
                  : 'border-white/10 bg-white/[0.04] focus:border-primary-500/40'
              }`}
              placeholder={form.paymentMode === 'Pending' ? 'Required for pending payment' : 'Optional'}
              required={form.paymentMode === 'Pending'}
            />
          </div>

          <div className="space-y-2 md:col-span-2 xl:col-span-3">
            <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Notes</label>
            <textarea
              rows="3"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40"
              placeholder="Optional notes"
            />
          </div>

          <div className="md:col-span-2 xl:col-span-3 flex justify-end gap-3">
            {editingSaleId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-bold text-slate-300 transition-all hover:border-white/20 hover:bg-white/[0.06]"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-primary-600 px-8 py-3 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_20px_44px_-20px_rgba(220,38,38,0.75)] transition-all hover:-translate-y-0.5 hover:bg-primary-700 disabled:opacity-60"
            >
              {submitting ? 'Saving...' : editingSaleId ? 'Update Offline Sale' : 'Save Offline Sale'}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d]/95 p-6 shadow-[0_28px_80px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl md:p-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-300">Sales History Log</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-white">Filters and Summary</h3>
            <p className="mt-2 text-sm text-slate-400">
              Filter by single date, month, or custom range.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={applyFilters}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-[0_18px_40px_-22px_rgba(220,38,38,0.75)] transition-all hover:bg-primary-700"
            >
              <Filter size={16} />
              Apply Filters
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-200 transition-all hover:border-white/20 hover:bg-white/[0.06]"
            >
              <Download size={16} />
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Single Date</label>
            <input
              type="date"
              value={filters.date}
              onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value, month: '' }))}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Month</label>
            <input
              type="month"
              value={filters.month}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  date: '',
                  month: event.target.value,
                  from: '',
                  to: '',
                }))
              }
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">From</label>
            <input
              type="date"
              value={filters.from}
              onChange={(event) =>
                setFilters((current) => ({ ...current, date: '', month: '', from: event.target.value }))
              }
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">To</label>
            <input
              type="date"
              value={filters.to}
              onChange={(event) =>
                setFilters((current) => ({ ...current, date: '', month: '', to: event.target.value }))
              }
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {[
            ['Total Sale', formatPrice(summary.totalSale || 0)],
            ['Total Cost', formatPrice(summary.totalCost || 0)],
            ['Total Profit', formatPrice(summary.totalProfit || 0)],
            ['Total Quantity Sold', summary.totalQuantitySold || 0],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-[1.5rem] border border-white/10 bg-[#151b24] p-5 shadow-[0_20px_50px_-34px_rgba(0,0,0,0.95)]"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">{label}</p>
              <p className="mt-3 text-2xl font-black text-white">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d]/95 shadow-[0_28px_80px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 border-b border-white/10 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-300">Sales History Log</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-white">Offline Sales Entries</h3>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            {sales.length} visible entries
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="bg-white/[0.02] text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5">Product</th>
                <th className="px-6 py-5 text-center">Qty</th>
                <th className="px-6 py-5 text-center">Total Sale</th>
                <th className="px-6 py-5 text-center">Total Profit</th>
                <th className="px-6 py-5 text-center">Payment</th>
                <th className="px-6 py-5 text-center">Pending Amount</th>
                <th className="px-6 py-5">Customer Name</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {!loadingSales && sales.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-sm text-slate-500">
                    No offline sales found for the selected filter.
                  </td>
                </tr>
              )}
              {sales.map((sale) => (
                <tr
                  key={sale._id}
                  className={`transition-colors hover:bg-white/[0.03] ${sale.paymentMode === 'Pending' ? 'bg-amber-500/[0.06]' : ''}`}
                >
                  <td className="px-6 py-5 text-sm text-slate-300">
                    {sale.saleDate?.slice(0, 10)}
                  </td>
                  <td className="px-6 py-5">
                    <p className="font-bold text-white">{sale.productName}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{sale.notes || 'Offline sale'}</p>
                  </td>
                  <td className="px-6 py-5 text-center text-sm font-semibold text-slate-300">{sale.quantitySold}</td>
                  <td className="px-6 py-5 text-center text-sm font-bold text-white">{formatPrice(sale.totalSale)}</td>
                  <td className="px-6 py-5 text-center text-sm font-bold text-emerald-300">{formatPrice(sale.profit)}</td>
                  <td className="px-6 py-5 text-center">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] ${
                        sale.paymentMode === 'Pending'
                          ? 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                          : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                      }`}
                    >
                      {sale.paymentMode}
                    </span>
                  </td>
                  <td className={`px-6 py-5 text-center text-sm font-bold ${sale.pendingAmount > 0 ? 'text-amber-300' : 'text-slate-400'}`}>
                    {sale.pendingAmount > 0 ? formatPrice(sale.pendingAmount) : formatPrice(0)}
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-300">{sale.customerName || '-'}</td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(sale)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-200 transition-all hover:border-white/20 hover:bg-white/[0.06]"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(sale._id)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-red-300 transition-all hover:bg-red-500/15"
                      >
                        <Trash2 size={14} />
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

      <section className="rounded-[2rem] border border-primary-500/20 bg-gradient-to-r from-primary-600/10 via-[#151b24] to-[#151b24] p-6 shadow-[0_26px_70px_-42px_rgba(0,0,0,0.95)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-[0_18px_38px_-20px_rgba(220,38,38,0.8)]">
              <Clock3 size={22} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-300">Recovery Insight</p>
              <h4 className="mt-2 text-2xl font-black tracking-tight text-white">Pending collection watch</h4>
              <p className="mt-2 text-sm text-slate-400">
                Current pending balance stands at {formatPrice(pendingBalance)} across {sales.filter((sale) => Number(sale.pendingAmount) > 0).length} entries.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={applyFilters}
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition-all hover:border-white/20 hover:bg-white/[0.09]"
          >
            Refresh Insight
          </button>
        </div>
      </section>
    </div>
  );
};

export default OfflineSalesSection;
