import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CalendarDays,
  Download,
  FileText,
  PackagePlus,
  Plus,
  Printer,
  ReceiptText,
  RotateCcw,
  Save,
  Search,
  Truck,
  UserRound,
  Wallet,
  X,
} from 'lucide-react';
import api from '../../api/axios';
import { formatPrice } from '../../utils/price';

const DRAFT_KEY = 'ks-sports-purchase-bill-draft';
const categoryOptions = ['Bat', 'Ball', 'Gloves', 'Accessories', 'Sleeves', 'Shaker', 'Other'];
const paymentModes = ['cash', 'online', 'upi', 'partial', 'pending'];
const paymentStatuses = ['pending', 'paid', 'partial'];

let rowCounter = 0;
const createRow = (overrides = {}) => ({
  id: `purchase-row-${rowCounter++}`,
  product: '',
  quantity: '1',
  costPrice: '',
  sellingPrice: '',
  ...overrides,
});

const todayInput = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  supplierName: '',
  firmName: '',
  mobile: '',
  address: '',
  gstNumber: '',
  billNumber: '',
  billDate: todayInput(),
  paymentMode: 'pending',
  paymentStatus: 'pending',
  notes: '',
  transportCharges: '0',
  packingCharges: '0',
  otherCharges: '0',
  paidAmount: '0',
  items: [createRow()],
});

const emptyQuickProduct = () => ({
  name: '',
  category: 'Bat',
  price: '',
  costPrice: '',
  countInStock: '0',
  description: '',
});

const toNumber = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const formatDate = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const buildBillHtml = (bill) => {
  const rows = bill.items
    .map(
      (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(item.productName || '-')}</td>
          <td>${item.quantity || 0}</td>
          <td>Rs. ${Number(item.costPrice || 0).toFixed(2)}</td>
          <td>Rs. ${Number(item.lineTotal || 0).toFixed(2)}</td>
        </tr>`
    )
    .join('');

  return `<!doctype html>
    <html><head><meta charset="utf-8" /><title>${escapeHtml(bill.billNumber || 'Purchase Bill')}</title>
    <style>
      body{font-family:Inter,Arial,sans-serif;background:#fff;color:#111;margin:0;padding:24px}
      .sheet{max-width:920px;margin:0 auto;border:1px solid #111;padding:24px}
      .top{display:flex;justify-content:space-between;gap:16px;border-bottom:2px solid #111;padding-bottom:16px}
      h1{margin:0;font-size:30px;letter-spacing:0.08em;text-transform:uppercase}
      .sub{margin-top:6px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#555}
      .badge{display:inline-block;margin-top:14px;padding:8px 12px;background:#111;color:#fff;font-size:11px;letter-spacing:0.2em;text-transform:uppercase}
      .grid{display:grid;grid-template-columns:repeat(2,1fr);border-left:1px solid #111;border-top:1px solid #111;margin-top:18px}
      .cell{padding:12px;border-right:1px solid #111;border-bottom:1px solid #111}
      .label{font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:#666;font-weight:700}
      .value{margin-top:8px;font-size:14px;font-weight:700}
      table{width:100%;border-collapse:collapse;margin-top:18px}
      th,td{border:1px solid #111;padding:12px;font-size:13px;text-align:left}
      th{background:#f3f4f6;font-size:11px;letter-spacing:0.18em;text-transform:uppercase}
      .bottom{display:grid;grid-template-columns:1fr 300px;gap:18px;margin-top:18px}
      .box{border:1px solid #111;padding:14px}
      .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #ddd;font-size:14px}
      .row:last-child{border-bottom:none;font-weight:800}
      @media print { body{padding:0} .sheet{border:none} }
    </style></head>
    <body><div class="sheet">
      <div class="top">
        <div><h1>K.S. Sports</h1><div class="sub">Premium Athletic Goods</div><div class="badge">Stock Inward / Purchase Bill</div></div>
        <div style="text-align:right"><div class="label">Bill Number</div><div class="value">${escapeHtml(bill.billNumber || '-')}</div><div class="label" style="margin-top:12px">Bill Date</div><div class="value">${escapeHtml(formatDate(bill.billDate))}</div></div>
      </div>
      <div class="grid">
        <div class="cell"><div class="label">Supplier</div><div class="value">${escapeHtml(bill.supplierName || '-')}</div></div>
        <div class="cell"><div class="label">Firm Name</div><div class="value">${escapeHtml(bill.firmName || '-')}</div></div>
        <div class="cell"><div class="label">Mobile</div><div class="value">${escapeHtml(bill.mobile || '-')}</div></div>
        <div class="cell"><div class="label">GST</div><div class="value">${escapeHtml(bill.gstNumber || '-')}</div></div>
        <div class="cell" style="grid-column:span 2"><div class="label">Address</div><div class="value">${escapeHtml(bill.address || '-')}</div></div>
      </div>
      <table><thead><tr><th>Sr.</th><th>Product</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="bottom">
        <div class="box"><div class="label">Notes</div><div class="value">${escapeHtml(bill.notes || 'No notes')}</div><div class="sub" style="margin-top:48px">Authorized Signature ____________________</div></div>
        <div class="box">
          <div class="row"><span>Subtotal</span><span>Rs. ${Number(bill.subtotal || 0).toFixed(2)}</span></div>
          <div class="row"><span>Extra Charges</span><span>Rs. ${Number(bill.extraChargesTotal || 0).toFixed(2)}</span></div>
          <div class="row"><span>Final Total</span><span>Rs. ${Number(bill.finalTotal || 0).toFixed(2)}</span></div>
          <div class="row"><span>Paid</span><span>Rs. ${Number(bill.paidAmount || 0).toFixed(2)}</span></div>
          <div class="row"><span>Pending</span><span>Rs. ${Number(bill.pendingAmount || 0).toFixed(2)}</span></div>
        </div>
      </div>
    </div></body></html>`;
};

const StockInwardSection = () => {
  const [products, setProducts] = useState([]);
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState({ totalBills: 0, totalPurchaseValue: 0, totalPaid: 0, totalPending: 0 });
  const [form, setForm] = useState(emptyForm());
  const [filters, setFilters] = useState({ supplier: '', billNumber: '', date: '', paymentStatus: '' });
  const [editingBillId, setEditingBillId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingBills, setLoadingBills] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [targetRowId, setTargetRowId] = useState('');
  const [quickProductForm, setQuickProductForm] = useState(emptyQuickProduct());
  const [creatingProduct, setCreatingProduct] = useState(false);

  const computedItems = useMemo(
    () =>
      form.items.map((item) => {
        const product = products.find((productItem) => productItem._id === item.product) || null;
        const quantity = Math.max(toNumber(item.quantity), 0);
        const costPrice = Math.max(toNumber(item.costPrice), 0);
        const sellingPrice = Math.max(toNumber(item.sellingPrice), 0);
        return {
          ...item,
          productData: product,
          productName: product?.name || '',
          quantityValue: quantity,
          costPriceValue: costPrice,
          sellingPriceValue: sellingPrice,
          lineTotal: quantity * costPrice,
        };
      }),
    [form.items, products]
  );

  const subtotal = computedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const transportCharges = Math.max(toNumber(form.transportCharges), 0);
  const packingCharges = Math.max(toNumber(form.packingCharges), 0);
  const otherCharges = Math.max(toNumber(form.otherCharges), 0);
  const extraChargesTotal = transportCharges + packingCharges + otherCharges;
  const finalTotal = subtotal + extraChargesTotal;
  const paidAmount = Math.min(Math.max(toNumber(form.paidAmount), 0), finalTotal);
  const pendingAmount = Math.max(finalTotal - paidAmount, 0);
  const paymentStatus = form.paymentStatus || 'pending';
  const totalProducts = computedItems.filter((item) => item.product).length;

  const previewBill = {
    supplierName: form.supplierName,
    firmName: form.firmName,
    mobile: form.mobile,
    address: form.address,
    gstNumber: form.gstNumber,
    billNumber: form.billNumber || 'DRAFT',
    billDate: form.billDate,
    items: computedItems.map((item) => ({
      productName: item.productName || 'Select product',
      quantity: item.quantityValue,
      costPrice: item.costPriceValue,
      lineTotal: item.lineTotal,
    })),
    subtotal,
    extraChargesTotal,
    finalTotal,
    paidAmount,
    pendingAmount,
    paymentStatus,
    notes: form.notes,
  };
  const loadProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data.products || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load products');
    }
  };

  const loadBills = async (activeFilters = filters) => {
    setLoadingBills(true);

    try {
      const params = new URLSearchParams();
      if (activeFilters.supplier) params.set('supplier', activeFilters.supplier);
      if (activeFilters.billNumber) params.set('billNumber', activeFilters.billNumber);
      if (activeFilters.date) params.set('date', activeFilters.date);
      if (activeFilters.paymentStatus) params.set('paymentStatus', activeFilters.paymentStatus);

      const query = params.toString();
      const { data } = await api.get(`/admin-inventory/purchase-bills${query ? `?${query}` : ''}`);
      setBills(data.bills || []);
      setSummary(data.summary || { totalBills: 0, totalPurchaseValue: 0, totalPaid: 0, totalPending: 0 });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load purchase bills');
    } finally {
      setLoadingBills(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadBills();

    try {
      const savedDraft = window.localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft);
        if (parsedDraft?.items?.length) {
          setForm({
            ...emptyForm(),
            ...parsedDraft,
            items: parsedDraft.items.map((item) => createRow(item)),
          });
          toast.success('Draft restored');
        }
      }
    } catch (error) {
      console.error('Failed to restore draft', error);
    }
    // Initial load + draft restore should only run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateRow = (rowId, field, value) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === rowId ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleProductSelect = (rowId, productId) => {
    const product = products.find((item) => item._id === productId);
    setForm((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === rowId
          ? {
              ...item,
              product: productId,
              costPrice: item.costPrice || String(product?.costPrice ?? ''),
              sellingPrice: item.sellingPrice || String(product?.price ?? ''),
            }
          : item
      ),
    }));
  };

  const addRow = () => {
    setForm((current) => ({ ...current, items: [...current.items, createRow()] }));
  };

  const removeRow = (rowId) => {
    setForm((current) => ({
      ...current,
      items: current.items.length === 1
        ? [createRow()]
        : current.items.filter((item) => item.id !== rowId),
    }));
  };

  const resetForm = () => {
    setEditingBillId('');
    setForm(emptyForm());
    setShowQuickCreate(false);
    setTargetRowId('');
    setQuickProductForm(emptyQuickProduct());
  };

  const saveDraft = () => {
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      toast.success('Draft saved');
    } catch (error) {
      console.error('Failed to save draft', error);
      toast.error('Unable to save draft');
    }
  };

  const buildPayload = (isDraft = false) => ({
    supplierName: form.supplierName,
    firmName: form.firmName,
    mobile: form.mobile,
    address: form.address,
    gstNumber: form.gstNumber,
    billNumber: form.billNumber,
    billDate: form.billDate,
    paymentMode: form.paymentMode,
    paymentStatus: form.paymentStatus,
    notes: form.notes,
    transportCharges,
    packingCharges,
    otherCharges,
    paidAmount,
    isDraft,
    items: computedItems.map((item) => ({
      product: item.product,
      quantity: item.quantityValue,
      costPrice: item.costPriceValue,
      sellingPrice: item.sellingPriceValue,
    })),
  });

  const validateForm = () => {
    if (!form.supplierName.trim()) {
      toast.error('Supplier name is required');
      return false;
    }

    if (!form.billNumber.trim()) {
      toast.error('Bill number is required');
      return false;
    }

    if (!form.billDate) {
      toast.error('Bill date is required');
      return false;
    }

    if (!computedItems.length || computedItems.some((item) => !item.product)) {
      toast.error('Select a product in every row');
      return false;
    }

    if (computedItems.some((item) => item.quantityValue <= 0)) {
      toast.error('Quantity must be greater than 0');
      return false;
    }

    if (computedItems.some((item) => item.costPriceValue < 0)) {
      toast.error('Cost price cannot be negative');
      return false;
    }

    if (toNumber(form.paidAmount) > finalTotal) {
      toast.error('Paid amount cannot exceed final total');
      return false;
    }

    if (new Set(computedItems.map((item) => item.product)).size !== computedItems.length) {
      toast.error('Use one row per product');
      return false;
    }

    return true;
  };

  const submitBill = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      if (editingBillId) {
        await api.put(`/admin-inventory/purchase-bills/${editingBillId}`, buildPayload(false));
        toast.success('Purchase bill updated and stock synced');
      } else {
        await api.post('/admin-inventory/purchase-bills', buildPayload(false));
        toast.success('Purchase bill saved and stock updated');
      }

      window.localStorage.removeItem(DRAFT_KEY);
      resetForm();
      await Promise.all([loadProducts(), loadBills()]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save purchase bill');
    } finally {
      setSubmitting(false);
    }
  };

  const createQuickProduct = async (event) => {
    event.preventDefault();
    setCreatingProduct(true);

    try {
      const { data } = await api.post('/admin-inventory/purchase-bills/products', {
        ...quickProductForm,
        price: toNumber(quickProductForm.price),
        costPrice: toNumber(quickProductForm.costPrice),
        countInStock: toNumber(quickProductForm.countInStock),
      });

      setProducts((current) => [data.product, ...current.filter((item) => item._id !== data.product._id)]);

      if (targetRowId) {
        setForm((current) => ({
          ...current,
          items: current.items.map((item) =>
            item.id === targetRowId
              ? {
                  ...item,
                  product: data.product._id,
                  costPrice: String(data.product.costPrice ?? ''),
                  sellingPrice: String(data.product.price ?? ''),
                }
              : item
          ),
        }));
      }

      setShowQuickCreate(false);
      setQuickProductForm(emptyQuickProduct());
      setTargetRowId('');
      toast.success('Product created');
      await loadProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create product');
    } finally {
      setCreatingProduct(false);
    }
  };

  const editBill = (bill) => {
    setEditingBillId(bill._id);
    setForm({
      supplierName: bill.supplierName || '',
      firmName: bill.firmName || '',
      mobile: bill.mobile || '',
      address: bill.address || '',
      gstNumber: bill.gstNumber || '',
      billNumber: bill.billNumber || '',
      billDate: bill.billDate ? bill.billDate.slice(0, 10) : todayInput(),
      paymentMode: bill.paymentMode || 'pending',
      paymentStatus: bill.paymentStatus || 'pending',
      notes: bill.notes || '',
      transportCharges: String(bill.transportCharges ?? 0),
      packingCharges: String(bill.packingCharges ?? 0),
      otherCharges: String(bill.otherCharges ?? 0),
      paidAmount: String(bill.paidAmount ?? 0),
      items: bill.items?.length
        ? bill.items.map((item) =>
            createRow({
              product: item.product?._id || item.product || '',
              quantity: String(item.quantity ?? 1),
              costPrice: String(item.costPrice ?? 0),
              sellingPrice: String(item.sellingPrice ?? ''),
            })
          )
        : [createRow()],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openPrintWindow = (bill, autoPrint = false) => {
    const popup = window.open('', '_blank', 'width=980,height=860,scrollbars=yes,resizable=yes');

    if (!popup) {
      toast.error('Please allow popups to view the bill');
      return;
    }

    let printed = false;
    const triggerPrint = () => {
      if (!autoPrint || printed || popup.closed) return;
      printed = true;
      popup.focus();
      setTimeout(() => popup.print(), 150);
    };

    popup.onload = triggerPrint;
    popup.document.open();
    popup.document.write(buildBillHtml(bill));
    popup.document.close();
    popup.focus();

    if (popup.document.readyState === 'complete') {
      triggerPrint();
    }
  };
  const summaryCards = [
    { label: 'Total Products', value: totalProducts, tone: 'border-white/10 bg-white/[0.04] text-white' },
    { label: 'Base Cost', value: formatPrice(subtotal), tone: 'border-white/10 bg-white/[0.04] text-white' },
    { label: 'Extra Charges', value: formatPrice(extraChargesTotal), tone: 'border-white/10 bg-white/[0.04] text-white' },
    { label: 'Final Total', value: formatPrice(finalTotal), tone: 'border-amber-400/20 bg-amber-400/10 text-amber-100' },
    { label: 'Paid', value: formatPrice(paidAmount), tone: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100' },
    { label: 'Pending', value: formatPrice(pendingAmount), tone: 'border-rose-500/20 bg-rose-500/10 text-rose-100' },
  ];

  const cardClass = 'rounded-[2rem] border border-white/10 bg-[#10151d]/95 p-6 shadow-[0_28px_80px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl';
  const inputClass = 'h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40';
  const labelClass = 'text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500';

  return (
    <div className="space-y-8">
      <section className={cardClass}>
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-300">Stock Management</p>
        <div className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-white md:text-4xl">
              Stock Inward / Purchase Bill
            </h2>
            <p className="mt-3 flex items-center gap-2 text-sm text-slate-400">
              <CalendarDays size={16} className="text-primary-300" />
              {formatDate(form.billDate)}
            </p>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-400">
            Record supplier bills, auto-update inventory quantity, track paid vs pending amounts, and print clean purchase documents.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {summaryCards.map((card) => (
            <article className={`rounded-[1.6rem] border p-5 ${card.tone}`} key={card.label}>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{card.label}</p>
              <p className="mt-3 text-2xl font-black tracking-tight md:text-3xl">{card.value}</p>
            </article>
          ))}
        </div>
      </section>

      <form className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.7fr)_400px]" onSubmit={submitBill}>
        <div className="space-y-8">
          <section className={cardClass}>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-300">
                <UserRound size={18} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-300">Supplier Details</p>
                <h3 className="mt-1 text-2xl font-black text-white">Supplier & firm info</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className={labelClass}>Supplier Name *</label>
                <input className={inputClass} value={form.supplierName} onChange={(event) => updateForm('supplierName', event.target.value)} placeholder="Supplier / wholesaler name" />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Firm / Shop Name</label>
                <input className={inputClass} value={form.firmName} onChange={(event) => updateForm('firmName', event.target.value)} placeholder="Supplier firm name" />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Mobile Number</label>
                <input className={inputClass} value={form.mobile} onChange={(event) => updateForm('mobile', event.target.value)} placeholder="+91 98765 43210" />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>GST Number</label>
                <input className={inputClass} value={form.gstNumber} onChange={(event) => updateForm('gstNumber', event.target.value)} placeholder="Optional GST number" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className={labelClass}>Address</label>
                <input className={inputClass} value={form.address} onChange={(event) => updateForm('address', event.target.value)} placeholder="Supplier address" />
              </div>
            </div>
          </section>

          <section className={cardClass}>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-300">
                <ReceiptText size={18} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-300">Bill Details</p>
                <h3 className="mt-1 text-2xl font-black text-white">Document & payment mode</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className={labelClass}>Bill Number *</label>
                <input className={inputClass} value={form.billNumber} onChange={(event) => updateForm('billNumber', event.target.value)} placeholder="BILL/2026/001" />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Bill Date *</label>
                <input className={inputClass} value={form.billDate} onChange={(event) => updateForm('billDate', event.target.value)} type="date" />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Payment Mode</label>
                <select className="h-12 w-full rounded-2xl border border-white/10 bg-[#151b24] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40" value={form.paymentMode} onChange={(event) => updateForm('paymentMode', event.target.value)}>
                  {paymentModes.map((mode) => (
                    <option key={mode} value={mode}>{mode.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Payment Status</label>
                <select
                  className="h-12 w-full rounded-2xl border border-white/10 bg-[#151b24] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40"
                  value={form.paymentStatus}
                  onChange={(event) => updateForm('paymentStatus', event.target.value)}
                >
                  {paymentStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className={labelClass}>Notes / Remarks</label>
                <textarea className="w-full rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40" rows="4" value={form.notes} onChange={(event) => updateForm('notes', event.target.value)} placeholder="Delivery notes, credit terms, or supplier remarks" />
              </div>
            </div>
          </section>

          <section className={cardClass}>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-300">
                  <PackagePlus size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-300">Product Entry</p>
                  <h3 className="mt-1 text-2xl font-black text-white">Multi-item stock lines</h3>
                </div>
              </div>
              <button type="button" onClick={addRow} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-slate-200 transition-all hover:bg-white/[0.06]">
                <Plus size={16} /> Add Product
              </button>
            </div>

            <div className="space-y-5">
              {computedItems.map((item, index) => (
                <div
                  key={item.id}
                  className="w-full max-w-full overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0d1118]/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:p-6"
                >
                  <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Item {index + 1}</p>
                      <p className="mt-2 min-w-0 truncate text-sm leading-6 text-slate-400">{item.productData?.name || 'Select or create a product'}</p>
                    </div>
                    <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                      <button type="button" onClick={() => { setTargetRowId(item.id); setQuickProductForm(emptyQuickProduct()); setShowQuickCreate(true); }} className="inline-flex items-center gap-2 rounded-2xl border border-primary-500/20 bg-primary-500/10 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-primary-100 transition-all hover:bg-primary-500/15">
                        <Plus size={14} /> Create New
                      </button>
                      <button type="button" onClick={() => removeRow(item.id)} className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-rose-200 transition-all hover:bg-rose-500/15">
                        <X size={14} /> Remove
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid w-full max-w-full grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_140px]">
                    <div className="min-w-0 space-y-2.5">
                      <label className={`${labelClass} block`}>Product</label>
                      <select
                        className="h-12 w-full min-w-0 max-w-full rounded-2xl border border-white/10 bg-[#151b24] px-4 pr-10 text-sm text-white outline-none transition-all focus:border-primary-500/40 focus:ring-2 focus:ring-primary-500/10"
                        value={item.product}
                        onChange={(event) => handleProductSelect(item.id, event.target.value)}
                      >
                        <option value="" disabled>Select inventory product</option>
                        {products.map((product) => (
                          <option key={product._id} value={product._id}>{product.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="min-w-0 space-y-2.5">
                      <label className={`${labelClass} block`}>Qty</label>
                      <input className={inputClass} type="number" min="1" value={item.quantity} onChange={(event) => updateRow(item.id, 'quantity', event.target.value)} />
                    </div>
                  </div>

                  <div className="mt-4 grid w-full max-w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div className="min-w-0 space-y-2.5">
                      <label className={`${labelClass} block`}>Cost Price</label>
                      <input className={inputClass} type="number" min="0" step="0.01" value={item.costPrice} onChange={(event) => updateRow(item.id, 'costPrice', event.target.value)} />
                    </div>
                    <div className="min-w-0 space-y-2.5">
                      <label className={`${labelClass} block`}>Selling Price</label>
                      <input className={inputClass} type="number" min="0" step="0.01" value={item.sellingPrice} onChange={(event) => updateRow(item.id, 'sellingPrice', event.target.value)} />
                    </div>
                    <div className="min-w-0 space-y-2.5">
                      <label className={`${labelClass} block`}>Row Total</label>
                      <div className="flex h-12 w-full items-center rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 text-sm font-black text-amber-100">{formatPrice(item.lineTotal)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={cardClass}>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-300">
                <Truck size={18} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-300">Additional Charges</p>
                <h3 className="mt-1 text-2xl font-black text-white">Transport, packing & other</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className={labelClass}>Transport Charges</label>
                <input className={inputClass} type="number" min="0" step="0.01" value={form.transportCharges} onChange={(event) => updateForm('transportCharges', event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Packing Charges</label>
                <input className={inputClass} type="number" min="0" step="0.01" value={form.packingCharges} onChange={(event) => updateForm('packingCharges', event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Other Charges</label>
                <input className={inputClass} type="number" min="0" step="0.01" value={form.otherCharges} onChange={(event) => updateForm('otherCharges', event.target.value)} />
              </div>
            </div>
          </section>

          <section className={cardClass}>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-300">
                <Wallet size={18} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-300">Payment Section</p>
                <h3 className="mt-1 text-2xl font-black text-white">Paid & pending settlement</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] border border-amber-400/20 bg-amber-400/10 p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200">Final Total</p>
                <p className="mt-3 text-3xl font-black text-amber-100">{formatPrice(finalTotal)}</p>
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Paid Amount</label>
                <input className={inputClass} type="number" min="0" step="0.01" value={form.paidAmount} onChange={(event) => updateForm('paidAmount', event.target.value)} />
              </div>
              <div className="rounded-[1.5rem] border border-rose-500/20 bg-rose-500/10 p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-rose-200">Pending Amount</p>
                <p className="mt-3 text-3xl font-black text-rose-100">{formatPrice(pendingAmount)}</p>
              </div>
            </div>
          </section>
        </div>
        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <section className={cardClass}>
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-300">K.S. Sports</p>
                <h3 className="mt-2 text-2xl font-black text-white">Live Bill Preview</h3>
              </div>
              <span className={`rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] ${paymentStatus === 'paid' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : paymentStatus === 'partial' ? 'border-amber-400/20 bg-amber-400/10 text-amber-200' : 'border-rose-500/20 bg-rose-500/10 text-rose-300'}`}>
                {paymentStatus}
              </span>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Supplier</p>
                  <p className="mt-2 text-lg font-black text-white">{form.supplierName || 'Supplier name'}</p>
                  <p className="mt-1 text-sm text-slate-400">{form.firmName || 'Firm name'} • {form.mobile || 'Mobile'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Bill No</p>
                  <p className="mt-2 text-sm font-black text-white">{form.billNumber || 'DRAFT'}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(form.billDate)}</p>
                </div>
              </div>

              <div className="my-5 h-px bg-white/10" />

              <div className="space-y-3">
                {computedItems.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-[1.2rem] border border-white/10 bg-[#0d1118] px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{index + 1}. {item.productName || 'Select product'}</p>
                      <p className="mt-1 text-xs text-slate-500">Qty {item.quantityValue} × {formatPrice(item.costPriceValue)}</p>
                    </div>
                    <p className="text-sm font-black text-white">{formatPrice(item.lineTotal)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-3 rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                <div className="flex justify-between"><span>Subtotal</span><span className="font-bold text-white">{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between"><span>Extra Charges</span><span className="font-bold text-white">{formatPrice(extraChargesTotal)}</span></div>
                <div className="flex justify-between"><span>Paid</span><span className="font-bold text-emerald-300">{formatPrice(paidAmount)}</span></div>
                <div className="flex justify-between"><span>Pending</span><span className="font-bold text-rose-300">{formatPrice(pendingAmount)}</span></div>
                <div className="flex justify-between rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-amber-100"><span className="font-black">Grand Total</span><span className="font-black">{formatPrice(finalTotal)}</span></div>
              </div>

              {form.notes && <p className="mt-4 text-sm leading-6 text-slate-400">{form.notes}</p>}
            </div>

            <div className="mt-6 grid gap-3">
              <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-white shadow-[0_18px_40px_-20px_rgba(220,38,38,0.75)] transition-all hover:bg-primary-700 disabled:opacity-60">
                <Save size={16} />
                {submitting ? 'Saving...' : 'Confirm & Record Entry'}
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={saveDraft} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-slate-200 transition-all hover:bg-white/[0.06]">Save as Draft</button>
                <button type="button" onClick={resetForm} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-slate-200 transition-all hover:bg-white/[0.06]"><RotateCcw size={16} /> Reset</button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button type="button" onClick={() => openPrintWindow(previewBill, false)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-200 transition-all hover:bg-white/[0.06]"><FileText size={14} /> View</button>
                <button type="button" onClick={() => openPrintWindow(previewBill, true)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-200 transition-all hover:bg-white/[0.06]"><Printer size={14} /> Print</button>
                <button type="button" onClick={() => openPrintWindow(previewBill, true)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-200 transition-all hover:bg-white/[0.06]"><Download size={14} /> PDF</button>
              </div>
            </div>
          </section>
        </aside>
      </form>

      <section className={cardClass}>
        <div className="flex flex-col gap-5 border-b border-white/10 pb-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-300">Purchase History</p>
            <h3 className="mt-2 text-2xl font-black text-white">Saved Supplier Bills</h3>
            <p className="mt-2 text-sm text-slate-400">{summary.totalBills} bills • {formatPrice(summary.totalPurchaseValue)} purchase value • {formatPrice(summary.totalPending)} pending</p>
          </div>
          <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-4 xl:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 text-slate-500" size={16} />
              <input className={`${inputClass} pl-9`} value={filters.supplier} onChange={(event) => setFilters((current) => ({ ...current, supplier: event.target.value }))} placeholder="Search supplier" />
            </div>
            <input className={inputClass} value={filters.billNumber} onChange={(event) => setFilters((current) => ({ ...current, billNumber: event.target.value }))} placeholder="Bill number" />
            <input className={inputClass} type="date" value={filters.date} onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))} />
            <select className="h-12 w-full rounded-2xl border border-white/10 bg-[#151b24] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40" value={filters.paymentStatus} onChange={(event) => setFilters((current) => ({ ...current, paymentStatus: event.target.value }))}>
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => loadBills(filters)} className="rounded-2xl bg-primary-600 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white shadow-[0_18px_40px_-20px_rgba(220,38,38,0.75)]">Apply Filters</button>
          <button type="button" onClick={() => { const cleared = { supplier: '', billNumber: '', date: '', paymentStatus: '' }; setFilters(cleared); loadBills(cleared); }} className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-slate-200">Clear Filters</button>
        </div>

        <div className="mt-8 grid gap-4">
          {loadingBills && <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-slate-400">Loading purchase bills...</div>}
          {!loadingBills && !bills.length && <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.03] p-12 text-center text-sm text-slate-500">No purchase bills found yet.</div>}
          {!loadingBills && bills.map((bill) => (
            <article key={bill._id} className="rounded-[1.7rem] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h4 className="text-xl font-black text-white">{bill.supplierName}</h4>
                    <span className={`rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] ${bill.paymentStatus === 'paid' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : bill.paymentStatus === 'partial' ? 'border-amber-400/20 bg-amber-400/10 text-amber-200' : 'border-rose-500/20 bg-rose-500/10 text-rose-300'}`}>{bill.paymentStatus}</span>
                    {bill.isDraft && <span className="rounded-full border border-slate-500/20 bg-slate-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">Draft</span>}
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{bill.firmName || 'Firm not provided'} • {bill.billNumber} • {formatDate(bill.billDate)}</p>
                  <p className="mt-3 text-sm text-slate-500">{bill.items.map((item) => `${item.productName} x${item.quantity}`).join(', ')}</p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-right">
                  <div><p className={labelClass}>Final</p><p className="mt-2 text-lg font-black text-amber-100">{formatPrice(bill.finalTotal)}</p></div>
                  <div><p className={labelClass}>Paid</p><p className="mt-2 text-lg font-black text-emerald-200">{formatPrice(bill.paidAmount)}</p></div>
                  <div><p className={labelClass}>Pending</p><p className="mt-2 text-lg font-black text-rose-200">{formatPrice(bill.pendingAmount)}</p></div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={() => editBill(bill)} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-slate-200">Edit</button>
                <button type="button" onClick={() => openPrintWindow(bill, false)} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-slate-200">View Bill</button>
                <button type="button" onClick={() => openPrintWindow(bill, true)} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-slate-200">Print / PDF</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {showQuickCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#10151d] shadow-[0_32px_100px_-40px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-300">Quick Create Product</p>
                <h3 className="mt-2 text-2xl font-black text-white">Add missing product</h3>
              </div>
              <button type="button" onClick={() => setShowQuickCreate(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300">
                <X size={18} />
              </button>
            </div>
            <form className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2" onSubmit={createQuickProduct}>
              <div className="space-y-2 md:col-span-2"><label className={labelClass}>Product Name</label><input className={inputClass} value={quickProductForm.name} onChange={(event) => setQuickProductForm((current) => ({ ...current, name: event.target.value }))} placeholder="Product name" /></div>
              <div className="space-y-2"><label className={labelClass}>Category</label><select className="h-12 w-full rounded-2xl border border-white/10 bg-[#151b24] px-4 text-sm text-white outline-none" value={quickProductForm.category} onChange={(event) => setQuickProductForm((current) => ({ ...current, category: event.target.value }))}>{categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}</select></div>
              <div className="space-y-2"><label className={labelClass}>Selling Price</label><input className={inputClass} type="number" min="0" step="0.01" value={quickProductForm.price} onChange={(event) => setQuickProductForm((current) => ({ ...current, price: event.target.value }))} /></div>
              <div className="space-y-2"><label className={labelClass}>Cost Price</label><input className={inputClass} type="number" min="0" step="0.01" value={quickProductForm.costPrice} onChange={(event) => setQuickProductForm((current) => ({ ...current, costPrice: event.target.value }))} /></div>
              <div className="space-y-2"><label className={labelClass}>Opening Stock</label><input className={inputClass} type="number" min="0" value={quickProductForm.countInStock} onChange={(event) => setQuickProductForm((current) => ({ ...current, countInStock: event.target.value }))} /></div>
              <div className="space-y-2 md:col-span-2"><label className={labelClass}>Description</label><textarea className="w-full rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none" rows="3" value={quickProductForm.description} onChange={(event) => setQuickProductForm((current) => ({ ...current, description: event.target.value }))} placeholder="Optional short description" /></div>
              <div className="flex flex-col gap-3 md:col-span-2 md:flex-row md:justify-end">
                <button type="button" onClick={() => setShowQuickCreate(false)} className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-bold text-slate-200">Cancel</button>
                <button type="submit" disabled={creatingProduct} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-8 py-3 text-sm font-black uppercase tracking-[0.14em] text-white disabled:opacity-60">
                  <Plus size={16} /> {creatingProduct ? 'Creating...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockInwardSection;

