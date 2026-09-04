import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  Plus,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  History,
  ShieldCheck
} from 'lucide-react';

export default function BusinessMemoryView() {
  const [decisions, setDecisions] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Pricing Strategy');
  const [newReason, setNewReason] = useState('');
  const [newOutcome, setNewOutcome] = useState('');

  useEffect(() => {
    fetchDecisions();
  }, []);

  const fetchDecisions = async () => {
    try {
      const res = await fetch('/api/business-memory');
      if (res.ok) {
        const data = await res.json();
        setDecisions(data.decisions || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddDecision = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch('/api/business-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          reason: newReason,
          expected_outcome: newOutcome
        })
      });
      if (res.ok) {
        setNewTitle('');
        setNewReason('');
        setNewOutcome('');
        setIsAdding(false);
        fetchDecisions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-300">

      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">
            <Brain className="w-4 h-4 text-purple-400" />
            <span>Closed-Loop Decision Journal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Business Memory & Learning
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Tracks historical management decisions, measures Before vs After financial outcomes, and extracts persistent learnings for future recommendations.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md active:scale-95 whitespace-nowrap self-start md:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Decision</span>
        </button>
      </div>

      {/* Record Decision Form Modal / Panel */}
      {isAdding && (
        <form onSubmit={handleAddDecision} className="glass-panel p-6 rounded-2xl border border-purple-500/40 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Record Management Decision to Memory</h3>
            <button type="button" onClick={() => setIsAdding(false)} className="text-xs text-slate-400 hover:text-white">Cancel</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Decision Title:</label>
              <input
                type="text"
                required
                placeholder="e.g. Increase Product A price by 10%"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Decision Category:</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="Pricing Strategy">Pricing Strategy</option>
                <option value="Supplier Negotiation">Supplier Negotiation</option>
                <option value="Credit & Debt Policy">Credit & Debt Policy</option>
                <option value="Expense Optimization">Expense Optimization</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Strategic Rationale / Reason:</label>
              <input
                type="text"
                required
                placeholder="Why was this decision made?"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Expected Financial Outcome:</label>
              <input
                type="text"
                required
                placeholder="e.g. Expand gross margin from 18% to 24%"
                value={newOutcome}
                onChange={(e) => setNewOutcome(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md active:scale-95">
              Save Decision to AI Memory
            </button>
          </div>
        </form>
      )}

      {/* Decision Journal Feed */}
      <div className="space-y-4">
        {decisions.map((dec) => (
          <div key={dec.id} className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-slate-700 space-y-4">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {dec.category}
                </span>
                <h3 className="text-sm font-extrabold text-white">{dec.title}</h3>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-500 font-medium">Date: {dec.date}</span>
                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md ${dec.result_status.includes('POSITIVE')
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : dec.result_status.includes('NEGATIVE')
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                  Result: {dec.result_status}
                </span>
              </div>
            </div>

            {/* Before vs After Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Baseline (Before Decision):
                </span>
                <div className="flex flex-wrap gap-3 font-semibold text-slate-200">
                  {Object.entries(dec.before_metrics || {}).map(([k, v]) => (
                    <span key={k} className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-[11px]">
                      {k.replace('_', ' ')}: <strong className="text-white">{v}</strong>
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                  Measured Outcome (After Period):
                </span>
                <div className="flex flex-wrap gap-3 font-semibold text-slate-200">
                  {Object.entries(dec.after_metrics || {}).map(([k, v]) => (
                    <span key={k} className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-[11px]">
                      {k.replace('_', ' ')}: <strong className="text-emerald-300">{v}</strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Learning Synthesis */}
            <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-200 leading-relaxed font-medium">
              <strong className="text-purple-400 font-bold block mb-0.5">🧠 AI Learning & Feedback Loop:</strong>
              "{dec.ai_learning}"
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}

