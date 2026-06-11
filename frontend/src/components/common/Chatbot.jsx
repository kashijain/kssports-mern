import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Sparkles, Phone, MessageSquare, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { getPrimaryProductImage } from '../../utils/media';

const QUICK_FAQS = [
  { label: '📍 Location', query: 'Where is your shop located?' },
  { label: '🚚 Delivery & COD', query: 'What are the delivery charges and COD options?' },
  { label: '🏏 Best Beginner Bat', query: 'Which bat is best for beginners?' },
  { label: '🛡️ Return Policy', query: 'What is your return policy?' },
  { label: '📞 Contact Details', query: 'What are your contact details?' },
  { label: '🛒 Place Order', query: 'How do I place an order?' },
];

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hello! Welcome to K.S. Sports. I'm your AI Sales & Support Assistant. How can I help you today?\n\nYou can search our product catalog directly (e.g., 'SS bats under 3000'), ask about delivery settings, or tell me 'I want to buy a cricket bat' to get in touch with our team!",
      time: new Date(),
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [leadState, setLeadState] = useState('none');
  const [leadData, setLeadData] = useState({});
  const [showWAHandoff, setShowWAHandoff] = useState(false);
  const [lastLeadInfo, setLastLeadInfo] = useState(null);

  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputVal.trim();
    if (!query) return;

    if (!textToSend) {
      setInputVal('');
    }

    const time = new Date();
    // Append User message
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      time,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // Map conversation history transcript to send to server
      const chatHistory = messages.map((m) => ({
        sender: m.sender,
        message: m.text,
        timestamp: m.time,
      }));

      const response = await api.post('/chatbot/message', {
        message: query,
        leadState,
        leadData,
        conversation: chatHistory,
      });

      const { reply, nextLeadState, leadData: nextLeadData, products, inquirySaved } = response.data;

      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: reply,
            products,
            time: new Date(),
          },
        ]);

        if (nextLeadState) {
          setLeadState(nextLeadState);
        }
        if (nextLeadData) {
          setLeadData(nextLeadData);
        }

        if (inquirySaved) {
          // Lead successfully captured! Display WhatsApp handoff button
          setLastLeadInfo({
            name: leadData.customerName || 'Customer',
            product: leadData.interestedProduct || 'Sports gear',
            budget: nextLeadData?.budget || leadData.budget || 'N/A',
          });
          setShowWAHandoff(true);
        }
      }, 800);

    } catch (error) {
      console.error('Chatbot messaging error:', error);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'bot',
          text: error.response?.status === 429
            ? 'Too many messages sent. Please wait a minute before querying again.'
            : 'Oops! I had trouble connecting to the store server. Please try again or reach us directly.',
          time: new Date(),
        },
      ]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const triggerWhatsAppHandoff = () => {
    if (!lastLeadInfo) return;
    const phone = '917082252531'; // Store WhatsApp contact
    const text = `Hi! I just submitted an inquiry on the K.S. Sports chatbot.\n\n*Name:* ${lastLeadInfo.name}\n*Interested in:* ${lastLeadInfo.product}\n*Budget:* ${lastLeadInfo.budget}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const triggerDirectWhatsAppCTA = () => {
    const phone = '917082252531';
    window.open(`https://wa.me/${phone}?text=Hi!%20I%20have%20a%20question%20about%20your%20sports%20products.`, '_blank');
  };

  return (
    <div className="relative">
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Toggle AI Chatbot"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#11151d] border border-white/10 text-white shadow-lg shadow-red-500/20 hover:-translate-y-0.5 hover:border-red-500/40 transition-all duration-200"
      >
        {isOpen ? <X size={20} /> : <Bot size={22} className="animate-pulse text-red-500" />}
      </button>

      {/* Chat Window Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed bottom-24 right-6 z-50 flex h-[520px] w-[355px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#0f131b]/98 text-white shadow-[0_28px_80px_-24px_rgba(0,0,0,0.95)] backdrop-blur-xl md:w-[390px]"
          >
            {/* Header */}
            <div className="relative flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-primary-950/40 to-[#0c0f15]/20 px-5 py-4">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-600 via-red-500 to-primary-600 animate-gradient-xy"></div>
              
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600/20 text-primary-400">
                  <Bot size={20} />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0f131b]"></span>
                </div>
                <div>
                  <p className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                    KS Sales Assistant
                    <Sparkles size={12} className="text-primary-400" />
                  </p>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Intelligent Agent</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Floating WhatsApp CTA */}
                <button
                  onClick={triggerDirectWhatsAppCTA}
                  title="Direct WhatsApp Chat"
                  className="rounded-lg p-1.5 bg-green-600/10 text-green-400 border border-green-500/20 hover:bg-green-600/20 transition-all flex items-center justify-center"
                >
                  <Phone size={14} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Conversation Flow Area */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
              {messages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-[1.35rem] px-4 py-3 text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-primary-600 text-white rounded-tr-none shadow-[0_12px_24px_-10px_rgba(220,38,38,0.3)]'
                          : 'bg-white/[0.04] text-slate-200 border border-white/5 rounded-tl-none'
                      }`}
                      style={{ whiteSpace: 'pre-line' }}
                    >
                      {msg.text}
                      <span className="block text-[9px] text-slate-400 text-right mt-1.5">
                        {formatTime(msg.time)}
                      </span>
                    </div>
                  </div>

                  {/* Render inline product cards if attached to bot response */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto py-2 px-1 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
                      {msg.products.map((product) => (
                        <div
                          key={product._id}
                          className="flex-shrink-0 w-[200px] rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-3 shadow-md hover:border-white/20 transition-all"
                        >
                          <img
                            src={getPrimaryProductImage(product)}
                            alt={product.name}
                            className="h-28 w-full rounded-xl object-cover mb-2 border border-white/5"
                            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=400&q=80'; }}
                          />
                          <p className="truncate text-xs font-bold text-white mb-0.5">{product.name}</p>
                          <p className="text-[10px] text-slate-400 mb-2">{product.brand}</p>
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <span className="text-xs font-black text-primary-300">₹{product.price}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${product.countInStock > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                              {product.countInStock > 0 ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              navigate(`/product/${product._id}`);
                            }}
                            className="w-full rounded-xl bg-white/[0.05] py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-primary-600 transition-all border border-white/5"
                          >
                            View Product
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing and product skeletons indicator */}
              {isTyping && (
                <div className="space-y-3">
                  <div className="flex justify-start">
                    <div className="bg-white/[0.04] border border-white/5 rounded-[1.35rem] rounded-tl-none px-4 py-3 text-slate-400 text-sm">
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
                      </span>
                    </div>
                  </div>

                  {/* Skeletons block */}
                  <div className="flex gap-3 overflow-x-auto py-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex-shrink-0 w-[200px] rounded-[1.5rem] border border-white/5 bg-white/[0.01] p-3 animate-pulse">
                        <div className="h-28 bg-white/5 rounded-xl mb-3"></div>
                        <div className="h-3 bg-white/10 rounded w-4/5 mb-2"></div>
                        <div className="h-3 bg-white/5 rounded w-2/5 mb-3"></div>
                        <div className="flex justify-between items-center">
                          <div className="h-4 bg-white/10 rounded w-1/4"></div>
                          <div className="h-4 bg-white/5 rounded w-1/3"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* WhatsApp handoff overlay trigger */}
            {showWAHandoff && (
              <div className="bg-green-950/15 border-t border-b border-green-500/20 px-4 py-3 text-center space-y-2.5">
                <div className="flex justify-center items-center gap-2 text-green-400 text-xs font-semibold">
                  <MessageSquare size={14} />
                  <span>Connect directly on WhatsApp</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Start a chat on WhatsApp with our sales desk to coordinate invoice billing and delivery dispatch!
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={triggerWhatsAppHandoff}
                    className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-green-600/10 uppercase tracking-wider"
                  >
                    Chat on WhatsApp
                  </button>
                  <button
                    onClick={() => setShowWAHandoff(false)}
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Quick reply suggestion FAQ Chips */}
            {leadState === 'none' && !isTyping && (
              <div className="border-t border-white/5 px-4 py-3 bg-white/[0.01]">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Popular Questions</p>
                <div className="flex flex-wrap gap-1.5 max-h-[76px] overflow-y-auto">
                  {QUICK_FAQS.map((faq) => (
                    <button
                      key={faq.label}
                      onClick={() => handleSendMessage(faq.query)}
                      className="rounded-full bg-white/[0.03] border border-white/5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-white/[0.08] hover:text-white transition-all"
                    >
                      {faq.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form Box */}
            <div className="border-t border-white/10 bg-[#0b0e14] p-3.5 flex items-center gap-2">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  leadState === 'awaiting_name'
                    ? 'Type your name...'
                    : leadState === 'awaiting_phone'
                    ? 'Type your phone number...'
                    : leadState === 'awaiting_product'
                    ? 'Type the product name...'
                    : leadState === 'awaiting_budget'
                    ? "Type budget or 'skip'..."
                    : 'Search gear or ask a question...'
                }
                className="h-11 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-primary-500/40"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputVal.trim()}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chatbot;
