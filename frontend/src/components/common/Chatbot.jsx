import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, Sparkles, Phone, MapPin, ShoppingBag, RotateCcw } from 'lucide-react';
import api from '../../api/axios';

const QUICK_FAQS = [
  { label: '📍 Shop Location', query: 'Where is your shop located?' },
  { label: '📞 Contact Details', query: 'What are your contact details?' },
  { label: '🏏 Best Beginner Bat', query: 'Which bat is best for beginners?' },
  { label: '📦 Return Policy', query: 'What is your return policy?' },
  { label: '🛒 How to place order', query: 'How do I place an order?' },
  { label: '🚚 Delivery Areas', query: 'Do you deliver across India?' },
];

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hello! Welcome to K.S. Sports. I'm your AI Support & Sales Assistant. How can I help you today?\n\nYou can ask about our location, contact info, beginner bat recommendations, shipping policy, or express purchase interest!",
      time: new Date(),
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [leadState, setLeadState] = useState('none');
  const [leadData, setLeadData] = useState({});

  const messagesEndRef = useRef(null);

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

    // Append User message
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      time: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const response = await api.post('/chatbot/message', {
        message: query,
        leadState,
        leadData,
      });

      const { reply, nextLeadState, leadData: nextLeadData } = response.data;

      // Add a small artificial delay for realistic bot interaction
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: reply,
            time: new Date(),
          },
        ]);

        if (nextLeadState) {
          setLeadState(nextLeadState);
        }
        if (nextLeadData) {
          setLeadData(nextLeadData);
        }
      }, 700);

    } catch (error) {
      console.error('Chatbot API error:', error);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'bot',
          text: 'Oops! I had trouble connecting to the store server. Please try again in a moment or contact our team directly.',
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

  return (
    <div className="relative">
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Toggle AI Chatbot"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-red-500 text-white shadow-lg shadow-red-500/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-200"
      >
        {isOpen ? <X size={20} /> : <Bot size={22} className="animate-pulse" />}
      </button>

      {/* Chat Window Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed bottom-24 right-6 z-50 flex h-[500px] w-[350px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#0f131b]/98 text-white shadow-[0_28px_80px_-24px_rgba(0,0,0,0.95)] backdrop-blur-xl md:w-[380px]"
          >
            {/* Header */}
            <div className="relative flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-primary-950/40 to-[#0c0f15]/20 px-5 py-4">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-600 via-red-500 to-primary-600"></div>
              
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600/20 text-primary-400">
                  <Bot size={20} />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0f131b]"></span>
                </div>
                <div>
                  <p className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                    KS AI Assistant
                    <Sparkles size={12} className="text-primary-400" />
                  </p>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Support & Sales</p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Conversation Flow Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-[1.35rem] px-4 py-3 text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-primary-600 text-white rounded-tr-none shadow-[0_12px_24px_-10px_rgba(220,38,38,0.3)]'
                        : 'bg-white/[0.04] text-slate-200 border border-white/5 rounded-tl-none'
                    }`}
                    style={{ whiteSpace: 'pre-line' }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/[0.04] border border-white/5 rounded-[1.35rem] rounded-tl-none px-4 py-3 text-slate-400 text-sm">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* FAQ Chips suggestions wrapper (Visible when lead generation is not active) */}
            {leadState === 'none' && !isTyping && (
              <div className="border-t border-white/5 px-4 py-3 bg-white/[0.01]">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Frequently Asked Questions</p>
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
                    : 'Ask anything or buy a product...'
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
