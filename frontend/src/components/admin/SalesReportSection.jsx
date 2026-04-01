import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
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

  return (
    <div className="space-y-8">
      <section className="bg-white dark:bg-dark-card rounded-3xl shadow-sm border border-slate-100 dark:border-dark-border p-6 md:p-8 space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Sales Report</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Combine offline sales history and paid online orders into one date-wise report.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">From Date</label>
            <input
              type="date"
              value={filters.from}
              onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
              className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">To Date</label>
            <input
              type="date"
              value={filters.to}
              onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
              className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div className="md:col-span-2 flex flex-wrap items-end gap-3">
            <button type="button" onClick={() => applyQuickFilter('today')} className="px-5 py-3 rounded-xl font-bold text-sm border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-bg">Today</button>
            <button type="button" onClick={() => applyQuickFilter('week')} className="px-5 py-3 rounded-xl font-bold text-sm border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-bg">This Week</button>
            <button type="button" onClick={() => applyQuickFilter('month')} className="px-5 py-3 rounded-xl font-bold text-sm border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-bg">This Month</button>
            <button type="button" onClick={applyRange} className="px-5 py-3 rounded-xl font-bold text-sm text-white bg-primary-600 hover:bg-primary-700">Apply</button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          ['Total Sales Amount', formatPrice(report.summary.totalSalesAmount || 0)],
          ['Total Sales Profit', formatPrice(report.summary.totalSalesProfit || 0)],
          ['Total Offline Sale', formatPrice(report.summary.totalOfflineSale || 0)],
          ['Total Online Sale', formatPrice(report.summary.totalOnlineSale || 0)],
          ['Total Repair Income', formatPrice(report.summary.totalRepairIncome || 0)],
          ['Total Repair Profit', formatPrice(report.summary.totalRepairProfit || 0)],
          ['Total Expenses', formatPrice(report.summary.totalExpenses || 0)],
          ['Net Profit', formatPrice(report.summary.netProfit || 0)],
          ['No Sale Days Count', report.summary.noSaleDaysCount || 0],
          ['Holiday Days Count', report.summary.holidayDaysCount || 0],
          ['Combined Total Sale', formatPrice(report.summary.combinedTotalSale || 0)],
          ['Combined Total Cost', formatPrice(report.summary.combinedTotalCost || 0)],
          ['Combined Total Profit', formatPrice(report.summary.combinedTotalProfit || 0)],
          ['Total Orders / Transactions', report.summary.totalTransactions || 0],
          ['Total Quantity Sold', report.summary.totalQuantitySold || 0],
        ].map(([label, value]) => (
          <div key={label} className="bg-white dark:bg-dark-card p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-dark-border">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">{label}</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{value}</p>
          </div>
        ))}
      </section>

      <section className="bg-white dark:bg-dark-card rounded-3xl shadow-sm border border-slate-100 dark:border-dark-border overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-dark-border">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Date-wise Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-dark-bg/80 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                <th className="px-6 py-5 border-b">Date</th>
                <th className="px-6 py-5 border-b text-center">Offline Sale</th>
                <th className="px-6 py-5 border-b text-center">Online Sale</th>
                <th className="px-6 py-5 border-b text-center">Repair Income</th>
                <th className="px-6 py-5 border-b text-center">Total Sale</th>
                <th className="px-6 py-5 border-b text-center">Total Profit</th>
                <th className="px-6 py-5 border-b text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {!loading && report.dailyBreakdown.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                    No report data found for the selected range.
                  </td>
                </tr>
              )}
              {report.dailyBreakdown.map((day) => (
                <tr key={day.date} className="hover:bg-slate-50/60 dark:hover:bg-dark-bg/50">
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{day.date}</td>
                  <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300">{formatPrice(day.offlineSale)}</td>
                  <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300">{formatPrice(day.onlineSale)}</td>
                  <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300">{formatPrice(day.repairIncome)}</td>
                  <td className="px-6 py-4 text-center font-semibold text-slate-900 dark:text-white">{formatPrice(day.totalSale)}</td>
                  <td className="px-6 py-4 text-center font-semibold text-emerald-700 dark:text-emerald-300">{formatPrice(day.totalProfit)}</td>
                  <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300">{day.status || (day.totalSale > 0 ? '-' : 'No Sale')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default SalesReportSection;
