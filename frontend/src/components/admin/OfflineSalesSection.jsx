import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { formatPrice } from '../../utils/price';

const paymentModes = ['Cash', 'Online', 'UPI'];

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
  receivedAmount: '',
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
  const receivedAmount = useMemo(() => {
    if (form.receivedAmount === '') {
      return totalSale;
    }

    const value = Number(form.receivedAmount);
    return Number.isFinite(value) ? value : 0;
  }, [form.receivedAmount, totalSale]);
  const pendingAmount = useMemo(
    () => Math.max(totalSale - receivedAmount, 0),
    [receivedAmount, totalSale]
  );
  const paymentStatus = useMemo(() => {
    if (receivedAmount === totalSale) {
      return 'Full Payment';
    }

    if (receivedAmount > 0 && receivedAmount < totalSale) {
      return 'Partial Payment';
    }

    return 'Pending';
  }, [receivedAmount, totalSale]);

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
    const normalizedReceivedAmount = form.receivedAmount === '' ? totalSale : Number(form.receivedAmount);

    if (normalizedReceivedAmount > totalSale) {
      toast.error('Received amount cannot be greater than total sale');
      return;
    }

    if (pendingAmount > 0 && !form.customerName.trim()) {
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
      receivedAmount: normalizedReceivedAmount,
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
      receivedAmount: String(sale.receivedAmount ?? sale.totalSale ?? ''),
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
      <section
        ref={formRef}
        className="panel-premium p-6 md:p-8 space-y-6"
      >
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Upload Offline Sales Sheet</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Upload .xlsx or .csv with columns: Date, Product Name, Quantity Sold, Sale Price Per Item, Cost Price Per Item, Payment Mode, Notes
          </p>
        </div>

        <form onSubmit={handleSheetUpload} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Offline Sales Sheet</label>
            <input
              type="file"
              accept=".xlsx,.csv"
              onChange={(event) => setSheetFile(event.target.files?.[0] || null)}
              className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Example row: 2026-03-31, KC Bat, 2, 1200, 900, Cash, Counter sale
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploadingSheet}
              className="btn-primary px-8 shadow-lg shadow-primary-600/20 disabled:opacity-60"
            >
              {uploadingSheet ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>

        {sheetResult && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 dark:bg-emerald-900/10 dark:border-emerald-900/30 px-4 py-3">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{sheetResult.message}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                ['Total Rows Processed', sheetResult.totalRowsProcessed ?? 0],
                ['Imported Successfully', sheetResult.importedSuccessfully ?? 0],
                ['Skipped / Failed', sheetResult.skippedRows ?? 0],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-2xl p-4"
                >
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{value}</p>
                </div>
              ))}
            </div>

            {Array.isArray(sheetResult.errors) && sheetResult.errors.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 dark:bg-amber-900/10 dark:border-amber-900/30 p-4">
                <p className="text-sm font-bold text-amber-700 dark:text-amber-300 mb-3">Skipped Rows</p>
                <div className="space-y-2">
                  {sheetResult.errors.map((item) => (
                    <p key={item} className="text-sm text-amber-700 dark:text-amber-200">
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="panel-premium p-6 md:p-8 space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Offline Sales</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Record date-wise offline sales without affecting the online payment flow.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Date</label>
            <input
              type="date"
              value={form.saleDate}
              onChange={(event) => setForm((current) => ({ ...current, saleDate: event.target.value }))}
              className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Product Name</label>
            <select
              value={form.productId}
              onChange={(event) => handleProductChange(event.target.value)}
              className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"
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
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Quantity Sold</label>
            <input
              type="number"
              min="1"
              value={form.quantitySold}
              onChange={(event) => setForm((current) => ({ ...current, quantitySold: event.target.value }))}
              className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Sale Price Per Item</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.salePricePerItem}
              onChange={(event) => setForm((current) => ({ ...current, salePricePerItem: event.target.value }))}
              className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Total Sale</label>
            <input
              type="text"
              value={formatPrice(totalSale)}
              readOnly
              className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Cost Price Per Item</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.costPricePerItem}
              onChange={(event) => setForm((current) => ({ ...current, costPricePerItem: event.target.value }))}
              className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"
              placeholder={selectedProduct ? 'Enter cost price' : ''}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Total Cost</label>
            <input
              type="text"
              value={formatPrice(totalCost)}
              readOnly
              className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Profit</label>
            <input
              type="text"
              value={formatPrice(profit)}
              readOnly
              className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Payment Mode</label>
            <select
              value={form.paymentMode}
              onChange={(event) => setForm((current) => ({ ...current, paymentMode: event.target.value }))}
              className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"
              required
            >
              {paymentModes.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Received Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.receivedAmount}
              onChange={(event) => setForm((current) => ({ ...current, receivedAmount: event.target.value }))}
              className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"
              placeholder={totalSale ? String(totalSale) : '0'}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Pending Amount</label>
            <input
              type="text"
              value={formatPrice(pendingAmount)}
              readOnly
              className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Payment Status</label>
            <input
              type="text"
              value={paymentStatus}
              readOnly
              className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Customer Name</label>
            <input
              type="text"
              value={form.customerName}
              onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))}
              className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"
              placeholder="Optional for full payment"
            />
          </div>

          <div className="space-y-2 md:col-span-2 xl:col-span-3">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Notes</label>
            <textarea
              rows="3"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"
              placeholder="Optional notes"
            />
          </div>

          <div className="md:col-span-2 xl:col-span-3 flex justify-end gap-3">
            {editingSaleId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-dark-bg"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary px-8 shadow-lg shadow-primary-600/20 disabled:opacity-60"
            >
              {submitting ? 'Saving...' : editingSaleId ? 'Update Offline Sale' : 'Save Offline Sale'}
            </button>
          </div>
        </form>
      </section>

      <section className="panel-premium p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Filters and Summary</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Filter by single date, month, or custom range.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={applyFilters}
              className="px-5 py-3 rounded-xl font-bold text-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="px-5 py-3 rounded-xl font-bold text-sm border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-bg"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Single Date</label>
            <input
              type="date"
              value={filters.date}
              onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value, month: '' }))}
              className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Month</label>
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
              className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">From</label>
            <input
              type="date"
              value={filters.from}
              onChange={(event) =>
                setFilters((current) => ({ ...current, date: '', month: '', from: event.target.value }))
              }
              className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">To</label>
            <input
              type="date"
              value={filters.to}
              onChange={(event) =>
                setFilters((current) => ({ ...current, date: '', month: '', to: event.target.value }))
              }
              className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"
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
              className="metric-card rounded-2xl p-5"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="table-shell">
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-dark-border">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Offline Sales Entries</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table-premium">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-dark-bg/80 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                <th className="px-6 py-5 border-b">Date</th>
                <th className="px-6 py-5 border-b">Product Name</th>
                <th className="px-6 py-5 border-b text-center">Qty</th>
                <th className="px-6 py-5 border-b text-center">Sale Price</th>
                <th className="px-6 py-5 border-b text-center">Total Sale</th>
                <th className="px-6 py-5 border-b text-center">Cost Price</th>
                <th className="px-6 py-5 border-b text-center">Total Cost</th>
                <th className="px-6 py-5 border-b text-center">Profit</th>
                <th className="px-6 py-5 border-b text-center">Payment Mode</th>
                <th className="px-6 py-5 border-b">Notes</th>
                <th className="px-6 py-5 border-b text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {!loadingSales && sales.length === 0 && (
                <tr>
                  <td colSpan="11" className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                    No offline sales found for the selected filter.
                  </td>
                </tr>
              )}
              {sales.map((sale) => (
                <tr key={sale._id} className="hover:bg-slate-50/60 dark:hover:bg-dark-bg/50">
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    {sale.saleDate?.slice(0, 10)}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{sale.productName}</td>
                  <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300">{sale.quantitySold}</td>
                  <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300">{formatPrice(sale.salePricePerItem)}</td>
                  <td className="px-6 py-4 text-center font-semibold text-slate-900 dark:text-white">{formatPrice(sale.totalSale)}</td>
                  <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300">{formatPrice(sale.costPricePerItem)}</td>
                  <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300">{formatPrice(sale.totalCost)}</td>
                  <td className="px-6 py-4 text-center font-semibold text-emerald-700 dark:text-emerald-300">{formatPrice(sale.profit)}</td>
                  <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300">{sale.paymentMode}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{sale.notes || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(sale)}
                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-dark-border text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-bg"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(sale._id)}
                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-dark-border text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                      >
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
    </div>
  );
};

export default OfflineSalesSection;
