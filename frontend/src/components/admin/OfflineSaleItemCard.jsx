import { AlertCircle, Trash2 } from 'lucide-react';
import { formatPrice } from '../../utils/price';

const inputBaseClass =
  'h-12 w-full rounded-2xl border border-white/10 bg-[#0b1118]/70 px-4 text-sm font-semibold text-white outline-none transition-all placeholder:text-slate-600 focus:border-primary-500/50 focus:bg-[#0e141d] focus:shadow-[0_0_0_4px_rgba(220,38,38,0.08)]';

const mobileLabelClass =
  'text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 xl:hidden';

const totalCellClass =
  'flex h-12 items-center justify-end rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm font-black';

const OfflineSaleItemCard = ({
  item,
  index,
  products,
  canRemove,
  onChange,
  onRemove,
}) => (
  <div
    className={`rounded-[1.5rem] border border-white/10 p-4 transition-all hover:bg-white/[0.05] ${
      index % 2 === 0 ? 'bg-white/[0.025]' : 'bg-white/[0.04]'
    }`}
  >
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(260px,2fr)_90px_120px_120px_130px_130px_120px_56px] xl:items-end">
      <div className="min-w-0 space-y-2">
        <label className={mobileLabelClass}>Product</label>
        <select
          value={item.productId}
          onChange={(event) => onChange('productId', event.target.value)}
          className={`${inputBaseClass} truncate`}
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
        <p className="truncate text-xs font-semibold text-slate-500">
          #{index + 1} {item.productName || 'Select Product'} | Stock: {item.availableStock ?? 0}
        </p>
      </div>

      <div className="space-y-2">
        <label className={mobileLabelClass}>Qty</label>
        <input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(event) => onChange('quantity', event.target.value)}
          className={inputBaseClass}
          required
        />
      </div>

      <div className="space-y-2">
        <label className={mobileLabelClass}>Sale</label>
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

      <div className="space-y-2">
        <label className={mobileLabelClass}>Cost</label>
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
            placeholder="Auto-filled"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className={mobileLabelClass}>Total Sale</label>
        <div className={`${totalCellClass} text-white`}>
          {formatPrice(item.lineTotalSale || 0)}
        </div>
      </div>

      <div className="space-y-2">
        <label className={mobileLabelClass}>Total Cost</label>
        <div className={`${totalCellClass} text-slate-200`}>
          {formatPrice(item.lineTotalCost || 0)}
        </div>
      </div>

      <div className="space-y-2">
        <label className={mobileLabelClass}>Profit</label>
        <div
          className={`${totalCellClass} ${
            item.lineProfit >= 0 ? 'text-emerald-300' : 'text-red-300'
          }`}
        >
          {formatPrice(item.lineProfit || 0)}
        </div>
      </div>

      <div className="space-y-2">
        <label className={mobileLabelClass}>Action</label>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-200 transition-all hover:border-red-500/30 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Remove item ${index + 1}`}
          title="Remove item"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>

    {item.error ? (
      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs font-semibold leading-5 text-amber-200">
        <AlertCircle size={14} className="mt-0.5 shrink-0" />
        <span>{item.error}</span>
      </div>
    ) : null}
  </div>
);

export default OfflineSaleItemCard;
