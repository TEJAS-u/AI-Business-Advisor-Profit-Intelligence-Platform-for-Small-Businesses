import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  RefreshCw, 
  Lightbulb
} from 'lucide-react';

function FormattedMessage({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 leading-relaxed text-xs sm:text-sm">
      {lines.map((line, idx) => {
        if (line.startsWith('### ')) {
          return <h4 key={idx} className="text-sm sm:text-base font-black text-white mt-2 mb-1">{line.replace('### ', '')}</h4>;
        } else if (line.startsWith('## ')) {
          return <h3 key={idx} className="text-base sm:text-lg font-black text-white mt-2 mb-1">{line.replace('## ', '')}</h3>;
        } else if (line.startsWith('- ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-teal-400 font-black">•</span>
              <span dangerouslySetInnerHTML={{ __html: formatBold(line.replace('- ', '')) }} />
            </div>
          );
        } else if (line.match(/^\d+\.\s/)) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2 font-medium">
              <span className="text-teal-400 font-black">{line.match(/^\d+\./)[0]}</span>
              <span dangerouslySetInnerHTML={{ __html: formatBold(line.replace(/^\d+\.\s/, '')) }} />
            </div>
          );
        } else if (line.trim() === '') {
          return <div key={idx} className="h-1" />;
        } else {
          return <p key={idx} dangerouslySetInnerHTML={{ __html: formatBold(line) }} />;
        }
      })}
    </div>
  );
}

function formatBold(str) {
  return str.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
}

export default function AiCfoView({ token, dashboardData, onWhyClick, initialQuestion }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: `### 🤖 Namaste! I am your AI Shop Advisor\n\nAsk me anything about your sales, actual profit, stock on hand, or customer Udhaar.\n\nClick any of the suggested questions below or type your own:`
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestedChips = [
    "How much did I sell?",
    "How much profit did I make?",
    "Who has Udhaar?",
    "Which product gives me more profit?",
    "Which product is low in stock?",
    "Why is my profit low?"
  ];

  useEffect(() => {
    if (initialQuestion) {
      sendMessage(initialQuestion);
    }
  }, [initialQuestion]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = { id: Date.now().toString(), role: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/shop/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: query })
      });
      const data = await res.json();
      const botMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.reply || 'I checked your shop data but could not produce a response.'
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', text: '⚠️ Connection issue with AI Advisor. Please try again.' }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[550px] glass-panel rounded-3xl border-2 border-slate-800 overflow-hidden shadow-2xl animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 text-slate-950 font-black shadow-md">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white">🤖 ASK YOUR SHOP ADVISOR</h2>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                Live Verified Data
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">Ask about your sales, profit, stock or Udhaar.</p>
          </div>
        </div>

        <button
          onClick={() => setMessages([messages[0]])}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors text-xs font-bold flex items-center gap-1.5 border border-slate-700"
          title="Reset conversation"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear Chat</span>
        </button>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 max-w-3xl ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 text-xs font-black ${
                m.role === 'user'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-slate-800 text-teal-400 border border-slate-700'
              }`}
            >
              {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>

            <div
              className={`p-4 sm:p-5 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-teal-600 text-white rounded-tr-none font-medium'
                  : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none'
              }`}
            >
              <FormattedMessage text={m.text} />
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 max-w-xl">
            <div className="w-9 h-9 rounded-2xl bg-slate-800 text-teal-400 border border-slate-700 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 text-xs sm:text-sm flex items-center gap-2 font-medium">
              <Sparkles className="w-4 h-4 text-teal-400 animate-spin" />
              <span>AI Shop Advisor is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="px-4 sm:px-6 py-3 bg-slate-900/80 border-t border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-extrabold uppercase tracking-wider flex-shrink-0">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <span>Tap to Ask:</span>
        </div>
        {suggestedChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => sendMessage(chip)}
            className="text-xs font-bold bg-slate-800 hover:bg-teal-500/20 text-slate-200 hover:text-teal-300 px-3.5 py-2 rounded-xl border border-slate-700 hover:border-teal-500/40 whitespace-nowrap transition-colors flex-shrink-0"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Type your question (e.g. 'How much did I sell?')"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-slate-950 border-2 border-slate-700 rounded-2xl px-4 py-3 text-sm text-white font-semibold placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="p-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black transition-all disabled:opacity-40 active:scale-95 shadow-md shadow-teal-950/40"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

    </div>
  );
}
