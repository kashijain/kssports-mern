import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Search, Trash2, FileSpreadsheet, Sparkles, Filter, RefreshCw, MessageSquare, BarChart3, Users, ArrowLeft, Clock, ShoppingBag, Landmark } from 'lucide-react';
import api from '../../api/axios';

const STATUS_OPTIONS = ['All', 'New', 'Contacted', 'Converted', 'Closed'];

const AIInquiriesSection = () => {
  const [activeTab, setActiveTab] = useState('inquiries'); // 'inquiries' | 'analytics'
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [exporting, setExporting] = useState(false);

  // Conversation Modal state
  const [selectedInquiryForChat, setSelectedInquiryForChat] = useState(null);

  // Analytics state
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

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

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const { data } = await api.get('/chatbot/analytics');
      setAnalytics(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch chatbot analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'inquiries') {
      fetchInquiries();
    } else {
      fetchAnalytics();
    }
  }, [status, activeTab]);

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchInquiries();
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.put(`/chatbot/inquiries/${id}`, { status: newStatus });
      toast.success(`Inquiry status updated to ${newStatus}`);
      if (activeTab === 'inquiries') {
        fetchInquiries();
      }
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

  // Render SVG Area Line Chart for Lead Trends
  const renderTrendChart = (leadTrends = []) => {
    if (leadTrends.length === 0) return <div className="text-slate-500 text-sm py-12 text-center">No trend data available.</div>;

    const maxCount = Math.max(...leadTrends.map(t => t.count), 4);
    const height = 140;
    const width = 450;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    const stepX = chartWidth / (leadTrends.length - 1 || 1);

    const points = leadTrends.map((t, idx) => {
      const x = paddingLeft + idx * stepX;
      const y = paddingTop + chartHeight - (t.count / maxCount) * chartHeight;
      return { x, y, label: t.label, count: t.count };
    });

    const pathD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = points.length > 0 
      ? `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
      : '';

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        {/* Horizontal Grid lines */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = paddingTop + ratio * chartHeight;
          const val = Math.round(maxCount * (1 - ratio));
          return (
            <g key={idx} className="opacity-20">
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="rgba(255,255,255,0.4)" strokeWidth={1} strokeDasharray="4 4" />
              <text x={paddingLeft - 8} y={y + 4} textAnchor="end" className="text-[10px] font-bold fill-slate-400 font-mono">{val}</text>
            </g>
          );
        })}

        {/* Shaded Area */}
        {areaD && <path d={areaD} fill="url(#leadsAreaGrad)" opacity={0.15} />}

        {/* Path Line */}
        {pathD && <path d={pathD} fill="none" stroke="#EF4444" strokeWidth={2.5} />}

        {/* Plot points & dates */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r={4} fill="#EF4444" className="hover:r-5 transition-all cursor-pointer" />
            <text x={p.x} y={height - 8} textAnchor="middle" className="text-[9px] font-bold fill-slate-500">{p.label}</text>
            {/* Count bubble above dot */}
            <text x={p.x} y={p.y - 8} textAnchor="middle" className="text-[9px] font-bold fill-red-400 font-mono">{p.count}</text>
          </g>
        ))}

        <defs>
          <linearGradient id="leadsAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  return (
    <div className="space-y-8">
      {/* Console Tab switcher & Header */}
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
              AI Sales & Support Portal
            </h3>
            <p className="text-sm text-slate-400">
              Manage captured sales inquiries, view complete chat histories, and analyze automated conversion funnel trends.
            </p>
          </div>

          <div className="flex bg-[#0b0e14] border border-white/10 rounded-2xl p-1 shrink-0">
            <button
              onClick={() => setActiveTab('inquiries')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === 'inquiries' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare size={14} />
              Inquiries List
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === 'analytics' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 size={14} />
              Analytics Dashboard
            </button>
          </div>
        </div>

        {activeTab === 'inquiries' && (
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                placeholder="Search by customer name, phone, or product interest... (Press Enter)"
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

            <div className="flex gap-2">
              <button
                onClick={handleExport}
                disabled={exporting || inquiries.length === 0}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-200 hover:border-white/20 hover:bg-white/[0.06] transition-all disabled:opacity-50"
              >
                <FileSpreadsheet size={16} />
                {exporting ? 'Exporting...' : 'Export'}
              </button>
              <button
                onClick={fetchInquiries}
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:text-white transition-all"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* VIEW 1: INQUIRIES LIST TABLE */}
      {activeTab === 'inquiries' && (
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d]/95 shadow-[0_28px_80px_-44px_rgba(0,0,0,0.95)] backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500 border-b border-white/10">
                  <th className="px-6 py-5 md:px-8">Customer Name</th>
                  <th className="px-6 py-5">Contact Info</th>
                  <th className="px-6 py-5">Interest & Budget</th>
                  <th className="px-6 py-5 text-center">Status</th>
                  <th className="px-6 py-5 text-right md:px-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-sm text-slate-500">
                      Loading inquiries...
                    </td>
                  </tr>
                ) : inquiries.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-sm text-slate-500">
                      No customer inquiries logged.
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
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedInquiryForChat(inq)}
                            className="px-4 py-2 bg-primary-600/10 border border-primary-500/20 rounded-xl text-xs font-bold text-primary-300 hover:bg-primary-600 hover:text-white transition-all flex items-center gap-1.5"
                          >
                            <MessageSquare size={13} />
                            View Chat
                          </button>
                          <button
                            onClick={() => handleDelete(inq._id)}
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl border border-white/10 transition-all"
                            title="Delete inquiry"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* VIEW 2: ANALYTICS DASHBOARD */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {analyticsLoading || !analytics ? (
            <div className="rounded-[2rem] border border-white/10 bg-[#10151d]/95 p-16 text-center text-slate-400">
              Loading analytics details...
            </div>
          ) : (
            <>
              {/* Metrics Row */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {[
                  { label: 'Total Conversations', value: analytics.metrics.totalConversations, icon: MessageSquare, accent: 'text-primary-300', tone: 'bg-primary-500/15' },
                  { label: 'Leads Generated', value: analytics.metrics.totalLeads, icon: Users, accent: 'text-emerald-300', tone: 'bg-emerald-500/15' },
                  { label: 'Conversion Rate', value: analytics.metrics.conversionRate, icon: Landmark, accent: 'text-sky-300', tone: 'bg-sky-500/15' },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d]/95 p-6 shadow-[0_26px_70px_-42px_rgba(0,0,0,0.95)]">
                      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-primary-600/5 blur-2xl"></div>
                      <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${item.tone} ${item.accent}`}>
                        <Icon size={20} />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                      <p className="mt-3 text-3xl font-black text-white">{item.value}</p>
                    </div>
                  );
                })}
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Custom SVG Line Chart */}
                <div className="rounded-[2rem] border border-white/10 bg-[#10151d]/95 p-6 shadow-md md:p-7">
                  <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-primary-300">Funnel Performance</p>
                  <h4 className="mt-2 text-lg font-black text-white uppercase tracking-tight mb-6">7-Day Lead Capture Trend</h4>
                  
                  <div className="bg-[#0b0e14] rounded-2xl p-4 border border-white/5">
                    {renderTrendChart(analytics.leadTrends)}
                  </div>
                </div>

                {/* Progress bars for top search categories & products */}
                <div className="rounded-[2rem] border border-white/10 bg-[#10151d]/95 p-6 shadow-md md:p-7 space-y-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-primary-300">Demanded Equipment</p>
                    <h4 className="mt-2 text-lg font-black text-white uppercase tracking-tight mb-4">Top Lead Product Focus</h4>
                    <div className="space-y-3">
                      {analytics.topSearchedProducts.map((p, idx) => {
                        const totalCounts = analytics.topSearchedProducts.reduce((sum, item) => sum + item.count, 0) || 1;
                        const pct = Math.round((p.count / totalCounts) * 100);
                        return (
                          <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 flex items-center justify-between gap-4">
                            <div className="min-w-0 flex-grow">
                              <p className="text-sm font-bold text-white truncate">{p.name}</p>
                              <div className="mt-2 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-primary-600 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-black text-white">{p.count}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase">{pct}%</p>
                            </div>
                          </div>
                        );
                      })}
                      {analytics.topSearchedProducts.length === 0 && (
                        <p className="text-sm text-slate-500 py-6 text-center">No catalog searches registered yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Most asked question categories */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-primary-300">Common Intents</p>
                    <h4 className="mt-2 text-lg font-black text-white uppercase tracking-tight mb-4">Most Queried FAQs</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {analytics.mostAskedQuestions.map((q, idx) => (
                        <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                          <p className="text-xs text-slate-400 font-medium truncate">{q.category}</p>
                          <p className="mt-1.5 text-lg font-black text-white font-mono">{q.count} <span className="text-[10px] text-slate-500 font-normal">hits</span></p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* CONVERSATION HISTORY TIMELINE MODAL */}
      <AnimatePresence>
        {selectedInquiryForChat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedInquiryForChat(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-lg overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#0f131b] shadow-[0_32px_80px_rgba(0,0,0,0.95)] flex flex-col max-h-[550px]"
            >
              {/* Top design beam */}
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary-600 via-red-500 to-primary-600"></div>

              {/* Modal Header */}
              <div className="p-6 border-b border-white/10 flex justify-between items-start gap-4">
                <div>
                  <h4 className="text-lg font-black text-white uppercase tracking-tight">
                    Chat Transcript: {selectedInquiryForChat.customerName}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <Clock size={12} className="text-slate-500" />
                    Captured on {new Date(selectedInquiryForChat.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedInquiryForChat(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Lead Details Block */}
              <div className="bg-white/[0.02] px-6 py-3 border-b border-white/5 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider block">Phone Contact</span>
                  <span className="font-semibold text-white mt-0.5 block">{selectedInquiryForChat.phoneNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider block">Product & Budget</span>
                  <span className="font-semibold text-primary-300 mt-0.5 block uppercase">
                    {selectedInquiryForChat.interestedProduct} (₹{selectedInquiryForChat.budget})
                  </span>
                </div>
              </div>

              {/* Scrollable Conversation area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-black/15 min-h-[250px]">
                {selectedInquiryForChat.conversation && selectedInquiryForChat.conversation.length > 0 ? (
                  selectedInquiryForChat.conversation.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-[1.2rem] px-3.5 py-2.5 text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-primary-600 text-white rounded-tr-none shadow-sm'
                            : 'bg-white/[0.04] text-slate-200 border border-white/5 rounded-tl-none'
                        }`}
                      >
                        <p style={{ whiteSpace: 'pre-line' }}>{msg.message}</p>
                        <span className="block text-[8px] text-slate-400 text-right mt-1 font-mono">
                          {new Date(msg.timestamp || selectedInquiryForChat.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-500 text-xs space-y-2">
                    <AlertCircle size={20} className="mx-auto text-slate-600" />
                    <p>No message timeline transcript captured for this lead.</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-black/30 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setSelectedInquiryForChat(null)}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-xs font-bold text-slate-200 hover:bg-white/[0.08] transition-all"
                >
                  Close History
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIInquiriesSection;
