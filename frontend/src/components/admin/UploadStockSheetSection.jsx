import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const UploadStockSheetSection = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      toast.error('Please choose a stock sheet first');
      return;
    }

    const formData = new FormData();
    formData.append('stockSheet', file);
    setUploading(true);

    try {
      const { data } = await api.post('/admin-inventory/upload-stock-sheet', formData);
      setResult(data);
      toast.success(data.message || 'Stock sheet uploaded');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to upload stock sheet';
      setResult(null);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="panel-premium p-6 md:p-8 space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Upload Stock Sheet</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Import products and stock safely using an Excel or CSV file.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Stock Sheet File
          </label>
          <input
            type="file"
            accept=".xlsx,.csv"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Expected columns: Product Name, Category, Price, Stock, Description, Features, Image URL
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uploading}
            className="btn-primary px-8 shadow-lg shadow-primary-600/20 disabled:opacity-60"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </form>

      {result && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 dark:bg-emerald-900/10 dark:border-emerald-900/30 px-4 py-3">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{result.message}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              ['Total Processed', result.totalProductsProcessed ?? 0],
              ['Created', result.created ?? 0],
              ['Updated', result.updated ?? 0],
            ].map(([label, value]) => (
              <div
                key={label}
                className="metric-card rounded-2xl p-4"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{value}</p>
              </div>
            ))}
          </div>

          {Array.isArray(result.errors) && result.errors.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 dark:bg-amber-900/10 dark:border-amber-900/30 p-4">
              <p className="text-sm font-bold text-amber-700 dark:text-amber-300 mb-3">
                Skipped Rows
              </p>
              <div className="space-y-2">
                {result.errors.map((item) => (
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
  );
};

export default UploadStockSheetSection;
