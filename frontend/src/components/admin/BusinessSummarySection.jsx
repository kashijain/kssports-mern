import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
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

  return (
    <div className="space-y-8">
      <section className="bg-white dark:bg-dark-card rounded-3xl shadow-sm border border-slate-100 dark:border-dark-border p-6 md:p-8 space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Business Summary</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            View sales, repair income, expenses, and working-day status in one range summary.
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

          <div className="md:col-span-2 flex items-end justify-start md:justify-end">
            <button
              type="button"
              onClick={() => loadSummary(filters)}
              disabled={loading}
              className="px-5 py-3 rounded-xl font-bold text-sm text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-60"
            >
              {loading ? 'Loading...' : 'Apply'}
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          ['Total Sales Amount', formatPrice(summary.totalSalesAmount || 0)],
          ['Total Sales Profit', formatPrice(summary.totalSalesProfit || 0)],
          ['Bat Repair Income', formatPrice(summary.totalRepairIncome || 0)],
          ['Bat Repair Profit', formatPrice(summary.totalRepairProfit || 0)],
          ['Total Expenses', formatPrice(summary.totalExpenses || 0)],
          ['Net Profit', formatPrice(summary.netProfit || 0)],
          ['No Sale Days Count', summary.noSaleDaysCount || 0],
          ['Holiday Days Count', summary.holidayDaysCount || 0],
        ].map(([label, value]) => (
          <div key={label} className="bg-white dark:bg-dark-card p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-dark-border">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">{label}</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{value}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default BusinessSummarySection;
