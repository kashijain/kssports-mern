import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Activity,
  CalendarRange,
  ChartColumn,
  CircleDollarSign,
  ReceiptIndianRupee,
  Wallet,
} from 'lucide-react';
import api from '../../api/axios';
import { formatPrice } from '../../utils/price';

const getToday = () => new Date().toISOString().slice(0, 10);
const getMonthStart = () => {
  const date = new Date();
  date.setDate(1);
  return date.toISOString().slice(0, 10);
};

const emptySummary = {
  totalSalesAmount: 0,
  totalSalesProfit: 0,
  totalRepairIncome: 0,
  totalRepairProfit: 0,
  totalExpenses: 0,
  netProfit: 0,
  noSaleDaysCount: 0,
  holidayDaysCount: 0,
};

const BusinessSummarySection = () => {
  const [filters, setFilters] = useState({ from: getMonthStart(), to: getToday() });
  const [summary, setSummary] = useState(emptySummary);
  const [loading, setLoading] = useState(false);

  const loadSummary = async (activeFilters) => {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (activeFilters.from) params.set('from', activeFilters.from);
      if (activeFilters.to) params.set('to', activeFilters.to);
      const { data } = await api.get(`/admin-reports/business-summary?${params.toString()}`);
      setSummary(data.summary || emptySummary);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load business summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary({ from: getMonthStart(), to: getToday() });
  }, []);

  const totalRevenue = (summary.totalSalesAmount || 0) + (summary.totalRepairIncome || 0);
  const totalProfit = (summary.totalSalesProfit || 0) + (summary.totalRepairProfit || 0);
  const activeDays = Math.max(0, 30 - (summary.noSaleDaysCount || 0) - (summary.holidayDaysCount || 0));

  const kpiCards = [
    {
      label: 'Total Revenue',
      value: formatPrice(totalRevenue),
      note: 'Sales plus repair income',
      icon: CircleDollarSign,
      tone: 'text-emerald-300 bg-emerald-500/15',
    },
    {
      label: 'Net Profit',
      value: formatPrice(summary.netProfit || 0),
      note: 'After expenses',
      icon: Wallet,
      tone: 'text-primary-300 bg-primary-500/15',
    },
    {
      label: 'Sales Profit',
      value: formatPrice(summary.totalSalesProfit || 0),
      note: 'Product selling contribution',
      icon: ChartColumn,
      tone: 'text-sky-300 bg-sky-500/15',
    },
    {
      label: 'Expense Snapshot',
      value: formatPrice(summary.totalExpenses || 0),
      note: 'Tracked operating expense',
      icon: ReceiptIndianRupee,
      tone: 'text-amber-300 bg-amber-500/15',
    },
  ];

  const channelRows = [
    {
      label: 'Product Sales',
      value: summary.totalSalesAmount || 0,
      profit: summary.totalSalesProfit || 0,
      tone: 'from-primary-500 to-rose-400',
    },
    {
      label: 'Bat Repair',
      value: summary.totalRepairIncome || 0,
      profit: summary.totalRepairProfit || 0,
      tone: 'from-sky-400 to-cyan-300',
    },
    {
      label: 'Expenses',
      value: summary.totalExpenses || 0,
      profit: -(summary.totalExpenses || 0),
      tone: 'from-amber-400 to-orange-300',
    },
  ];

  const maxChannelValue = Math.max(...channelRows.map((item) => Math.abs(item.value)), 1);
  const productivityRatio = totalRevenue > 0 ? Math.min((totalProfit / totalRevenue) * 100, 100) : 0;
  const activeDaysRatio =
    activeDays + (summary.noSaleDaysCount || 0) + (summary.holidayDaysCount || 0) > 0
      ? (activeDays /
          (activeDays + (summary.noSaleDaysCount || 0) + (summary.holidayDaysCount || 0))) *
        100
      : 0;

  const healthCards = useMemo(
    () => [
      {
        label: 'Sales vs Repairs',
        value: `${Math.round(
          totalRevenue > 0 ? ((summary.totalSalesAmount || 0) / totalRevenue) * 100 : 0
        )}%`,
        note: 'Revenue led by product sales',
      },
      {
        label: 'Active Days',
        value: `${activeDays} days`,
        note: `${summary.noSaleDaysCount || 0} no-sale and ${summary.holidayDaysCount || 0} holiday days`,
      },
      {
        label: 'Profit Health',
        value: `${Math.round(productivityRatio)}%`,
        note: 'Profit generated from total revenue',
      },
    ],
    [
      activeDays,
      productivityRatio,
      summary.holidayDaysCount,
      summary.noSaleDaysCount,
      summary.totalSalesAmount,
      totalRevenue,
    ]
  );

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d]/95 p-6 shadow-[0_28px_80px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl md:p-8">
        <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.18),transparent_52%)]"></div>
        <div className="relative space-y-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-300">
                K.S. Sports Analytics
              </p>
              <h3 className="mt-3 text-3xl font-black uppercase tracking-tight text-white md:text-4xl">
                Business Summary
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                Review sales, repair income, expenses, and operating-day performance in one
                premium summary view.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
                Selected Range
              </p>
              <p className="mt-2 text-lg font-black text-white">
                {filters.from || 'Start'} to {filters.to || 'End'}
              </p>
              <p className="mt-1 text-sm text-slate-400">Use the date controls below to refresh.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#151b24] p-5 shadow-[0_22px_60px_-36px_rgba(0,0,0,0.95)]"
                >
                  <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-white/5 blur-3xl"></div>
                  <div
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${card.tone}`}
                  >
                    <Icon size={20} />
                  </div>
                  <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
                    {card.label}
                  </p>
                  <p className="mt-3 text-3xl font-black tracking-tight text-white">
                    {card.value}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">{card.note}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d]/95 p-6 shadow-[0_28px_80px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-300">
              Range Filters
            </p>
            <h4 className="mt-2 text-2xl font-black tracking-tight text-white">
              Performance Window
            </h4>
          </div>
          <button
            type="button"
            onClick={() => loadSummary(filters)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-[0_18px_40px_-22px_rgba(220,38,38,0.75)] transition-all hover:bg-primary-700 disabled:opacity-60"
          >
            <CalendarRange size={16} />
            {loading ? 'Loading...' : 'Apply Range'}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
              From Date
            </label>
            <input
              type="date"
              value={filters.from}
              onChange={(event) =>
                setFilters((current) => ({ ...current, from: event.target.value }))
              }
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
              To Date
            </label>
            <input
              type="date"
              value={filters.to}
              onChange={(event) =>
                setFilters((current) => ({ ...current, to: event.target.value }))
              }
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d]/95 p-6 shadow-[0_28px_80px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-300">
                Revenue Mix
              </p>
              <h4 className="mt-2 text-2xl font-black tracking-tight text-white">
                Performance Distribution
              </h4>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Revenue vs expense blocks
            </div>
          </div>

          <div className="mt-8 space-y-6">
            {channelRows.map((item) => (
              <div key={item.label} className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-white">{item.label}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                      {item.label === 'Expenses'
                        ? 'Cost impact'
                        : `Profit ${formatPrice(item.profit)}`}
                    </p>
                  </div>
                  <p className="text-lg font-black text-white">{formatPrice(item.value)}</p>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${item.tone}`}
                    style={{ width: `${Math.max((Math.abs(item.value) / maxChannelValue) * 100, 8)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {healthCards.map((card) => (
              <div
                key={card.label}
                className="rounded-[1.5rem] border border-white/10 bg-[#151b24] p-5"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  {card.label}
                </p>
                <p className="mt-3 text-2xl font-black text-white">{card.value}</p>
                <p className="mt-2 text-sm text-slate-400">{card.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d]/95 p-6 shadow-[0_28px_80px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-300">
              Net Position
            </p>
            <h4 className="mt-2 text-2xl font-black tracking-tight text-white">
              Margin Snapshot
            </h4>

            <div className="mt-8 flex items-center justify-center">
              <div className="relative flex h-44 w-44 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                <div
                  className="absolute inset-4 rounded-full"
                  style={{
                    background: `conic-gradient(rgb(220 38 38) ${Math.max(
                      productivityRatio,
                      2
                    )}%, rgba(255,255,255,0.06) 0)`,
                  }}
                ></div>
                <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-[#10151d]">
                  <div className="text-center">
                    <p className="text-3xl font-black text-white">
                      {Math.round(productivityRatio)}%
                    </p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                      Profit Ratio
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-between rounded-[1.3rem] border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="text-sm text-slate-400">Revenue</span>
                <span className="text-sm font-bold text-white">{formatPrice(totalRevenue)}</span>
              </div>
              <div className="flex items-center justify-between rounded-[1.3rem] border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="text-sm text-slate-400">Net Profit</span>
                <span className="text-sm font-bold text-white">{formatPrice(summary.netProfit || 0)}</span>
              </div>
              <div className="flex items-center justify-between rounded-[1.3rem] border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="text-sm text-slate-400">Expenses</span>
                <span className="text-sm font-bold text-white">{formatPrice(summary.totalExpenses || 0)}</span>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d]/95 p-6 shadow-[0_28px_80px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-300">
              Operating Health
            </p>
            <h4 className="mt-2 text-2xl font-black tracking-tight text-white">
              Working Day Summary
            </h4>

            <div className="mt-6 space-y-5">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-white">Active Business Days</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                      Estimated productive days in range
                    </p>
                  </div>
                  <p className="text-2xl font-black text-white">{activeDays}</p>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 to-rose-400"
                    style={{ width: `${Math.max(activeDaysRatio, 6)}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                    No Sale Days
                  </p>
                  <p className="mt-3 text-2xl font-black text-amber-300">
                    {summary.noSaleDaysCount || 0}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                    Holiday Days
                  </p>
                  <p className="mt-3 text-2xl font-black text-sky-300">
                    {summary.holidayDaysCount || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-primary-500/20 bg-gradient-to-r from-primary-600/10 via-[#151b24] to-[#151b24] p-6 shadow-[0_26px_70px_-42px_rgba(0,0,0,0.95)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-[0_18px_38px_-20px_rgba(220,38,38,0.8)]">
              <Activity size={22} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-300">
                Summary Alert
              </p>
              <h4 className="mt-2 text-2xl font-black tracking-tight text-white">
                Profit health check
              </h4>
              <p className="mt-2 text-sm text-slate-400">
                Net profit is currently {formatPrice(summary.netProfit || 0)} with total expenses at{' '}
                {formatPrice(summary.totalExpenses || 0)} in the selected business window.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:w-auto">
            <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.06] px-4 py-3 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Repair Profit
              </p>
              <p className="mt-2 text-lg font-black text-white">
                {formatPrice(summary.totalRepairProfit || 0)}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.06] px-4 py-3 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Sales Profit
              </p>
              <p className="mt-2 text-lg font-black text-white">
                {formatPrice(summary.totalSalesProfit || 0)}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BusinessSummarySection;
