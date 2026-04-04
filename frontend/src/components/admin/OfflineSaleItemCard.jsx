import { AlertCircle, PackageSearch, Trash2 } from 'lucide-react';
import { formatPrice } from '../../utils/price';

const inputBaseClass =
  'h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40';

const labelClass =
  'text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500';

const OfflineSaleItemCard = ({
  item,
  index,
  products,
  canRemove,
  onChange,
  onRemove,
}) => (
  <div className="rounded-[1.5rem] border border-white/10 bg-[#0d1118]/80 p-5 shadow-[0_20px_50px_-34px_rgba(0,0,0,0.95)]">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-200">
          <PackageSearch size={18} />
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-white">
            Product {index + 1}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Available stock: {item.availableStock ?? '-'}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        className="inline-flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-red-200 transition-all hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Trash2 size={14} />
        Remove
      </button>
    </div>

    <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="space-y-2 lg:col-span-4">
        <label className={labelClass}>Product</label>
        <select
          value={item.productId}
          onChange={(event) => onChange('productId', event.target.value)}
          className={inputBaseClass}
          required
        >
          <option value="" disabled>
            Select Product
          </option>
          {products.map((product) => (
            <option key={product._id} value={product._id}>
              {product.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 lg:col-span-2">
        <label className={labelClass}>Qty</label>
        <input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(event) => onChange('quantity', event.target.value)}
          className={inputBaseClass}
          required
        />
      </div>

      <div className="space-y-2 lg:col-span-3">
        <label className={labelClass}>Sale Price</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Rs.
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={item.salePrice}
            onChange={(event) => onChange('salePrice', event.target.value)}
            className={`${inputBaseClass} pl-14`}
            required
          />
        </div>
      </div>

      <div className="space-y-2 lg:col-span-3">
        <label className={labelClass}>Cost Price</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Rs.
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={item.costPrice}
            onChange={(event) => onChange('costPrice', event.target.value)}
            className={`${inputBaseClass} pl-14`}
            placeholder="Auto-filled from product"
            required
          />
        </div>
      </div>
    </div>

    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {[
        ['Line Total Sale', formatPrice(item.lineTotalSale || 0), 'text-white'],
        ['Line Total Cost', formatPrice(item.lineTotalCost || 0), 'text-slate-200'],
        ['Line Profit', formatPrice(item.lineProfit || 0), item.lineProfit >= 0 ? 'text-emerald-300' : 'text-red-300'],
      ].map(([label, value, tone]) => (
        <div
          key={label}
          className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] px-4 py-3"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
            {label}
          </p>
          <p className={`mt-2 text-sm font-black ${tone}`}>{value}</p>
        </div>
      ))}
    </div>

    {item.error ? (
      <div className="mt-4 inline-flex items-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-200">
        <AlertCircle size={14} className="mt-0.5 shrink-0" />
        <span>{item.error}</span>
      </div>
    ) : null}
  </div>
);

export default OfflineSaleItemCard;
