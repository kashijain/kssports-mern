import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { formatPrice } from '../../utils/price';

const repairTypes = ['Binding', 'Handle', 'Full Repair'];

const getToday = () => new Date().toISOString().slice(0, 10);

const createEmptyForm = () => ({
  date: getToday(),
  customerName: '',
  repairType: 'Binding',
  charge: '',
  cost: '',
  notes: '',
});

const emptySummary = {
  totalRepairIncome: 0,
  totalRepairCost: 0,
  totalRepairProfit: 0,
};

const BatRepairSection = () => {
  const [repairs, setRepairs] = useState([]);
  const [summary, setSummary] = useState(emptySummary);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(createEmptyForm());

  const profit = useMemo(
    () => (Number(form.charge) || 0) - (Number(form.cost) || 0),
    [form.charge, form.cost]
  );

  const loadRepairs = async () => {
    setLoading(true);

    try {
      const { data } = await api.get('/bat-repairs');
      setRepairs(data.repairs || []);
      setSummary(data.summary || emptySummary);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load bat repairs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepairs();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/bat-repairs', {
        date: form.date,
        customerName: form.customerName,
        repairType: form.repairType,
        charge: Number(form.charge),
        cost: Number(form.cost),
        notes: form.notes,
      });
      toast.success('Bat repair saved');
      setForm(createEmptyForm());
      await loadRepairs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save bat repair');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (repairId) => {
    if (!window.confirm('Delete this bat repair entry?')) {
      return;
    }

    try {
      await api.delete(`/bat-repairs/${repairId}`);
      toast.success('Bat repair deleted');
      await loadRepairs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete bat repair');
    }
  };

  return (
    <div className="space-y-8">
      <section className="panel-premium p-6 md:p-8 space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Bat Repair</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Record bat repair services separately from product sales.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Customer Name</label>
            <input
              type="text"
              value={form.customerName}
              onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))}
              className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"
              placeholder="Optional customer name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Repair Type</label>
            <select
              value={form.repairType}
              onChange={(event) => setForm((current) => ({ ...current, repairType: event.target.value }))}
              className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"
              required
            >
              {repairTypes.map((repairType) => (
                <option key={repairType} value={repairType}>
                  {repairType}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Charge Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.charge}
              onChange={(event) => setForm((current) => ({ ...current, charge: event.target.value }))}
              className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Cost Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.cost}
              onChange={(event) => setForm((current) => ({ ...current, cost: event.target.value }))}
              className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"
              required
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

          <div className="md:col-span-2 xl:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary px-8 shadow-lg shadow-primary-600/20 disabled:opacity-60"
            >
              {submitting ? 'Saving...' : 'Save Bat Repair'}
            </button>
          </div>
        </form>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          ['Total Repair Income', formatPrice(summary.totalRepairIncome || 0)],
          ['Total Repair Cost', formatPrice(summary.totalRepairCost || 0)],
          ['Total Repair Profit', formatPrice(summary.totalRepairProfit || 0)],
        ].map(([label, value]) => (
          <div key={label} className="metric-card">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">{label}</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{value}</p>
          </div>
        ))}
      </section>

      <section className="table-shell">
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-dark-border">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Bat Repair Entries</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table-premium">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-dark-bg/80 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                <th className="px-6 py-5 border-b">Date</th>
                <th className="px-6 py-5 border-b">Repair Type</th>
                <th className="px-6 py-5 border-b text-center">Charge</th>
                <th className="px-6 py-5 border-b text-center">Cost</th>
                <th className="px-6 py-5 border-b text-center">Profit</th>
                <th className="px-6 py-5 border-b">Notes</th>
                <th className="px-6 py-5 border-b text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {!loading && repairs.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                    No bat repairs recorded yet.
                  </td>
                </tr>
              )}
              {repairs.map((repair) => (
                <tr key={repair._id} className="hover:bg-slate-50/60 dark:hover:bg-dark-bg/50">
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{repair.date?.slice(0, 10)}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{repair.repairType}</td>
                  <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300">{formatPrice(repair.charge)}</td>
                  <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300">{formatPrice(repair.cost)}</td>
                  <td className="px-6 py-4 text-center font-semibold text-emerald-700 dark:text-emerald-300">{formatPrice(repair.profit)}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{repair.notes || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(repair._id)}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-dark-border text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                    >
                      Delete
                    </button>
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

export default BatRepairSection;
