import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeIndianRupee,
  BarChart3,
  CalendarDays,
  ChevronDown,
  Download,
  FileSpreadsheet,
  PackageCheck,
  ReceiptIndianRupee,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import api from '../../api/axios';
import { formatPrice } from '../../utils/price';

const getToday = () => new Date().toISOString().slice(0, 10);
const getWeekStart = () => {
  const date = new Date();
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
};
const getMonthStart = () => {
  const date = new Date();
  date.setDate(1);
  return date.toISOString().slice(0, 10);
};

const emptySummary = {
  totalOfflineSale: 0,
  totalOnlineSale: 0,
  totalSalesAmount: 0,
  totalSalesProfit: 0,
  totalRepairIncome: 0,
  totalRepairCost: 0,
  totalRepairProfit: 0,
  totalExpenses: 0,
  netProfit: 0,
  noSaleDaysCount: 0,
  holidayDaysCount: 0,
  combinedTotalSale: 0,
  combinedTotalCost: 0,
  combinedTotalProfit: 0,
  totalTransactions: 0,
  totalQuantitySold: 0,
};

const SalesReportSection = () => {
  const [filters, setFilters] = useState({ from: getMonthStart(), to: getToday() });
  const [report, setReport] = useState({ summary: emptySummary, dailyBreakdown: [] });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const loadReport = async (activeFilters = filters) => {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (activeFilters.from) params.set('from', activeFilters.from);
      if (activeFilters.to) params.set('to', activeFilters.to);
      const { data } = await api.get(`/admin-reports/sales-report?${params.toString()}`);
      setReport({
        summary: data.summary || emptySummary,
        dailyBreakdown: data.dailyBreakdown || [],
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load sales report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(filters);
    // Run initial report load only once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyQuickFilter = (type) => {
    const nextFilters =
      type === 'today'
        ? { from: getToday(), to: getToday() }
        : type === 'week'
          ? { from: getWeekStart(), to: getToday() }
          : { from: getMonthStart(), to: getToday() };

    setFilters(nextFilters);
    loadReport(nextFilters);
  };

  const applyRange = () => {
    loadReport(filters);
  };

  const getActiveQuickFilter = () => {
    if (filters.from === getToday() && filters.to === getToday()) return 'today';
    if (filters.from === getWeekStart() && filters.to === getToday()) return 'week';
    if (filters.from === getMonthStart() && filters.to === getToday()) return 'month';
    return '';
  };

  const downloadExcel = async () => {
    setExporting(true);

    try {
      const res = await api.get('/admin/export-sales', {
        params: {
          fromDate: filters.from,
          toDate: filters.to,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sales-report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to download sales report');
    } finally {
      setExporting(false);
    }
  };

  const downloadCsv = () => {
    const headers = ['Date', 'Offline Sale', 'Online Sale', 'Repair Income', 'Total Sale', 'Total Profit', 'Status'];
    const lines = report.dailyBreakdown.map((day) => [
      day.date,
      day.offlineSale || 0,
      day.onlineSale || 0,
      day.repairIncome || 0,
      day.totalSale || 0,
      day.totalProfit || 0,
      day.status || (day.totalSale > 0 ? '-' : 'No Sale'),
    ]);
    const csv = [headers, ...lines]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const url = window.URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sales-report.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const printReport = () => window.print();

  const activeQuickFilter = getActiveQuickFilter();
  const summarySections = [
    {
      title: 'Sales',
      cards: [
        { label: 'Total Sales', value: formatPrice(report.summary.totalSalesAmount || 0), icon: ReceiptIndianRupee, color: 'text-emerald-300', trend: 'up' },
        { label: 'Offline Sales', value: formatPrice(report.summary.totalOfflineSale || 0), icon: BadgeIndianRupee, color: 'text-primary-200', trend: 'up' },
        { label: 'Online Sales', value: formatPrice(report.summary.totalOnlineSale || 0), icon: BarChart3, color: 'text-sky-300', trend: 'up' },
      ],
    },
    {
      title: 'Profit',
      cards: [
        { label: 'Total Profit', value: formatPrice(report.summary.totalSalesProfit || 0), icon: TrendingUp, color: 'text-emerald-300', trend: report.summary.totalSalesProfit >= 0 ? 'up' : 'down' },
        { label: 'Repair Profit', value: formatPrice(report.summary.totalRepairProfit || 0), icon: Wallet, color: 'text-amber-200', trend: report.summary.totalRepairProfit >= 0 ? 'up' : 'down' },
        { label: 'Net Profit', value: formatPrice(report.summary.netProfit || 0), icon: BadgeIndianRupee, color: report.summary.netProfit >= 0 ? 'text-emerald-300' : 'text-rose-300', trend: report.summary.netProfit >= 0 ? 'up' : 'down' },
      ],
    },
    {
      title: 'Operations',
      cards: [
        { label: 'Orders', value: report.summary.totalTransactions || 0, icon: PackageCheck, color: 'text-white', trend: 'up' },
        { label: 'Quantity Sold', value: report.summary.totalQuantitySold || 0, icon: PackageCheck, color: 'text-white', trend: 'up' },
        { label: 'No Sale Days', value: report.summary.noSaleDaysCount || 0, icon: CalendarDays, color: 'text-rose-300', trend: report.summary.noSaleDaysCount > 0 ? 'down' : 'up' },
      ],
    },
  ];

  const heroKpis = [
    { label: 'Total Sales', value: formatPrice(report.summary.totalSalesAmount || 0), icon: ReceiptIndianRupee, glow: 'from-emerald-500/15 to-white/[0.04]', valueClass: 'text-emerald-200' },
    { label: 'Net Profit', value: formatPrice(report.summary.netProfit || 0), icon: TrendingUp, glow: 'from-primary-500/15 to-white/[0.04]', valueClass: report.summary.netProfit >= 0 ? 'text-white' : 'text-rose-200' },
    { label: 'Total Expenses', value: formatPrice(report.summary.totalExpenses || 0), icon: Wallet, glow: 'from-amber-500/15 to-white/[0.04]', valueClass: 'text-amber-100' },
  ];

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d]/95 p-6 shadow-[0_28px_80px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl md:p-8">
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.2),transparent_40%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_32%)]" />
        <div className="relative space-y-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-300">Performance Analytics</p>
            <h3 className="mt-3 text-3xl font-black uppercase tracking-tight text-white md:text-4xl">Sales Report</h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Combine offline sales history and paid online orders into one premium date-wise report.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {heroKpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={kpi.label}
                  className={`rounded-[1.8rem] border border-white/10 bg-gradient-to-br ${kpi.glow} p-6 shadow-[0_24px_70px_-40px_rgba(0,0,0,0.9)]`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">{kpi.label}</p>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.05] text-primary-200">
                      <Icon size={18} />
                    </div>
                  </div>
                  <p className={`mt-5 text-4xl font-black tracking-tight md:text-5xl ${kpi.valueClass}`}>{kpi.value}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">From Date</label>
            <input
              type="date"
              value={filters.from}
              onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">To Date</label>
            <input
              type="date"
              value={filters.to}
              onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40"
            />
          </div>
          <div className="md:col-span-2 xl:col-span-1 flex flex-wrap items-end gap-3">
            {[
              ['today', 'Today'],
              ['week', 'This Week'],
              ['month', 'This Month'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyQuickFilter(key)}
                className={`rounded-2xl border px-5 py-3 text-sm font-bold transition-all ${
                  activeQuickFilter === key
                    ? 'border-primary-500/30 bg-primary-500/15 text-white shadow-[0_16px_32px_-22px_rgba(220,38,38,0.75)]'
                    : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.06]'
                }`}
              >
                {label}
              </button>
            ))}
            <button type="button" onClick={applyRange} className="rounded-2xl bg-primary-600 px-6 py-3 text-sm font-black text-white shadow-[0_18px_40px_-20px_rgba(220,38,38,0.75)] transition-all hover:bg-primary-700">Apply</button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu((current) => !current)}
                disabled={exporting}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-slate-200 transition-all hover:bg-white/[0.06] disabled:opacity-60"
              >
                <Download size={16} />
                {exporting ? 'Exporting...' : 'Export'}
                <ChevronDown size={16} />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-[calc(100%+0.75rem)] z-20 w-40 overflow-hidden rounded-2xl border border-white/10 bg-[#10151d] shadow-[0_22px_70px_-35px_rgba(0,0,0,1)]">
                  {[
                    ['Excel', downloadExcel],
                    ['CSV', downloadCsv],
                    ['PDF', printReport],
                  ].map(([label, action]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        setShowExportMenu(false);
                        action();
                      }}
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-slate-200 transition-all hover:bg-white/[0.06]"
                    >
                      <FileSpreadsheet size={15} className="text-primary-300" />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8">
        {summarySections.map((group) => (
          <div key={group.title} className="space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-300">{group.title}</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {group.cards.map((card) => {
                const Icon = card.icon;
                const TrendIcon = card.trend === 'down' ? ArrowDownRight : ArrowUpRight;
                return (
                  <div key={card.label} className="rounded-[1.75rem] border border-white/10 bg-[#10151d]/95 p-6 shadow-[0_24px_70px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">{card.label}</p>
                        <p className={`mt-4 text-4xl font-black tracking-tight ${card.color}`}>{card.value}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.04] text-slate-200">
                          <Icon size={18} />
                        </div>
                        <TrendIcon size={18} className={card.trend === 'down' ? 'text-rose-300' : 'text-emerald-300'} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d]/95 shadow-[0_28px_80px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl">
        <div className="border-b border-white/10 p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-300">Daily Ledger</p>
          <h3 className="mt-2 text-2xl font-black text-white">Date-wise Breakdown</h3>
        </div>
        <div className="max-h-[640px] overflow-auto">
          <table className="min-w-[980px] w-full border-collapse text-left">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-white/10 bg-[#0d1118]/95 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400 backdrop-blur-xl">
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5 text-center">Offline Sale</th>
                <th className="px-6 py-5 text-center">Online Sale</th>
                <th className="px-6 py-5 text-center">Repair Income</th>
                <th className="px-6 py-5 text-center">Total Sale</th>
                <th className="px-6 py-5 text-center">Total Profit</th>
                <th className="px-6 py-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {!loading && report.dailyBreakdown.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-sm text-slate-500">
                    No report data found for the selected range.
                  </td>
                </tr>
              )}
              {report.dailyBreakdown.map((day, index) => (
                <tr
                  key={day.date}
                  className={`border-b border-white/5 transition-colors hover:bg-white/[0.05] ${
                    index % 2 === 0 ? 'bg-white/[0.015]' : 'bg-transparent'
                  }`}
                >
                  <td className="px-6 py-5 text-sm font-semibold text-white">{day.date}</td>
                  <td className="px-6 py-5 text-center text-sm text-slate-300">{formatPrice(day.offlineSale)}</td>
                  <td className="px-6 py-5 text-center text-sm text-slate-300">{formatPrice(day.onlineSale)}</td>
                  <td className="px-6 py-5 text-center text-sm text-slate-300">{formatPrice(day.repairIncome)}</td>
                  <td className="px-6 py-5 text-center text-sm font-black text-white">{formatPrice(day.totalSale)}</td>
                  <td className={`px-6 py-5 text-center text-sm font-black ${Number(day.totalProfit || 0) >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {formatPrice(day.totalProfit)}
                  </td>
                  <td className="px-6 py-5 text-center text-sm text-slate-300">{day.status || (day.totalSale > 0 ? '-' : 'No Sale')}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 bg-[#0d1118]/95 backdrop-blur-xl">
              <tr className="border-t border-white/10 text-sm font-black text-white">
                <td className="px-6 py-5">Total</td>
                <td className="px-6 py-5 text-center">{formatPrice(report.summary.totalOfflineSale || 0)}</td>
                <td className="px-6 py-5 text-center">{formatPrice(report.summary.totalOnlineSale || 0)}</td>
                <td className="px-6 py-5 text-center">{formatPrice(report.summary.totalRepairIncome || 0)}</td>
                <td className="px-6 py-5 text-center text-amber-100">{formatPrice(report.summary.totalSalesAmount || 0)}</td>
                <td className={`px-6 py-5 text-center ${Number(report.summary.totalSalesProfit || 0) >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {formatPrice(report.summary.totalSalesProfit || 0)}
                </td>
                <td className="px-6 py-5 text-center text-slate-400">{loading ? 'Loading...' : `${report.dailyBreakdown.length} Days`}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
};

export default SalesReportSection;
