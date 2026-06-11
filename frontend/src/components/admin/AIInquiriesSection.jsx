import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Search, Trash2, FileSpreadsheet, Sparkles, Filter, RefreshCw } from 'lucide-react';
import api from '../../api/axios';

const STATUS_OPTIONS = ['All', 'New', 'Contacted', 'Converted', 'Closed'];

const AIInquiriesSection = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [exporting, setExporting] = useState(false);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const activeStatus = status === 'All' ? '' : status;
      const { data } = await api.get(`/chatbot/inquiries`, {
        params: {
          search,
          status: activeStatus,
        },
      });
      setInquiries(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch customer inquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [status]);

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchInquiries();
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.put(`/chatbot/inquiries/${id}`, { status: newStatus });
      toast.success(`Inquiry status updated to ${newStatus}`);
      fetchInquiries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this inquiry permanently?')) {
      return;
    }

    try {
      await api.delete(`/chatbot/inquiries/${id}`);
      toast.success('Inquiry deleted successfully');
      fetchInquiries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete inquiry');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const activeStatus = status === 'All' ? '' : status;
      const response = await api.get('/chatbot/inquiries/export', {
        params: { search, status: activeStatus },
        responseType: 'blob',
      });

      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.setAttribute('download', 'ai-customer-inquiries.xlsx');
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      toast.success('Spreadsheet exported successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to export inquiries');
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadgeClass = (s) => {
    const base = 'inline-flex rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] ';
    switch (s) {
      case 'New':
        return base + 'border-amber-500/20 bg-amber-500/10 text-amber-300';
      case 'Contacted':
        return base + 'border-purple-500/20 bg-purple-500/10 text-purple-300';
      case 'Converted':
        return base + 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
      case 'Closed':
        return base + 'border-slate-500/20 bg-slate-500/10 text-slate-400';
      default:
        return base + 'border-slate-500/20 bg-slate-500/10 text-slate-300';
    }
  };

  return (
    <div className="space-y-8">
      {/* Search and Filter Panel */}
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d]/95 p-6 shadow-[0_28px_80px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl md:p-8">
        <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-primary-600/10 blur-3xl"></div>
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-primary-400" />
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-300">
                AI Assistant Console
              </p>
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-white">
              AI Support & Sales Leads
            </h3>
            <p className="text-sm text-slate-400">
              Manage inquiries, follow up on buying interest, and export reports of captured customer leads.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExport}
              disabled={exporting || inquiries.length === 0}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-200 hover:border-white/20 hover:bg-white/[0.06] transition-all disabled:opacity-50"
            >
              <FileSpreadsheet size={16} />
              {exporting ? 'Exporting...' : 'Export Excel'}
            </button>
            <button
              onClick={fetchInquiries}
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:text-white transition-all"
              title="Refresh Inquiries"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Input cluster */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              placeholder="Search by customer name, phone, or interested product... (Press Enter)"
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.03] pl-11 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-500 shrink-0" />
            <div className="flex flex-wrap gap-1 bg-white/[0.02] border border-white/10 rounded-2xl p-1">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setStatus(opt)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    status === opt
                      ? 'bg-primary-600 text-white shadow-[0_12px_24px_-10px_rgba(220,38,38,0.4)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Leads Table */}
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d]/95 shadow-[0_28px_80px_-44px_rgba(0,0,0,0.95)] backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500 border-b border-white/10">
                <th className="px-6 py-5 md:px-8">Customer Name</th>
                <th className="px-6 py-5">Contact Info</th>
                <th className="px-6 py-5">Interest & Budget</th>
                <th className="px-6 py-5">Inquiry Message</th>
                <th className="px-6 py-5 text-center">Status</th>
                <th className="px-6 py-5 text-right md:px-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-sm text-slate-500">
                    Loading inquiries...
                  </td>
                </tr>
              ) : inquiries.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-sm text-slate-500">
                    No customer inquiries found matching details.
                  </td>
                </tr>
              ) : (
                inquiries.map((inq) => (
                  <tr key={inq._id} className="text-sm text-slate-300 hover:bg-white/[0.01]">
                    <td className="px-6 py-5 md:px-8">
                      <p className="font-bold text-white">{inq.customerName}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(inq.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-semibold text-white">{inq.phoneNumber}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="bg-white/[0.04] text-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-white/5 uppercase tracking-wider">
                        {inq.interestedProduct}
                      </span>
                      <p className="mt-2 text-xs text-slate-500">
                        Budget: <span className="font-semibold text-slate-300">{inq.budget || 'N/A'}</span>
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="max-w-[280px] break-words text-slate-300 line-clamp-2" title={inq.inquiryMessage}>
                        {inq.inquiryMessage}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="inline-flex flex-col gap-1 items-center">
                        <span className={getStatusBadgeClass(inq.status)}>{inq.status}</span>
                        <select
                          value={inq.status}
                          onChange={(e) => handleStatusUpdate(inq._id, e.target.value)}
                          className="mt-1.5 text-xs bg-[#151b24] border border-white/10 rounded-lg px-2 py-1 text-slate-300 outline-none hover:border-white/20 focus:border-primary-500/40"
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Converted">Converted</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right md:px-8">
                      <button
                        onClick={() => handleDelete(inq._id)}
                        className="p-3 text-slate-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl border border-white/10 transition-all shadow-sm"
                        title="Delete inquiry"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AIInquiriesSection;
