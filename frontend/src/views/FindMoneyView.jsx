import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Clock,
  Package,
  DollarSign,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function FindMoneyView({ onNavigateTab, onOpenReminder }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFindMoney();
  }, []);

  const fetchFindMoney = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/find-my-money');
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!data) return null;

  return (
    <div className="space-y-7 animate-in fade-in duration-300">

      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
            <Search className="w-4 h-4 text-blue-400" />
            <span>Capital Optimization Radar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Where Did My Money Go?
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Algorithmic audit pinpointing trapped capital in delayed receivables, stagnant warehouse inventory, unabsorbed supplier unit costs, and unused subscriptions.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950/90 border border-blue-500/30 flex flex-col items-center justify-center min-w-[200px] shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Trapped Capital</span>
          <span className="text-3xl font-black text-blue-400 mt-1">
            {data.total_opportunity_formatted}
          </span>
          <span className="text-xs font-bold text-blue-300 mt-0.5">
            4 Actionable Recovery Areas
          </span>
        </div>
      </div>

      {/* CFO Priority Box */}
      <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3.5">
        <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 flex-shrink-0 mt-0.5">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-0.5">
            CFO Recovery Strategy:
          </span>
          <p className="text-xs font-bold text-slate-200 leading-relaxed">
            {data.top_priority_advice}
          </p>
        </div>
      </div>

      {/* Trapped Capital Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.items?.map((item) => (
          <div
            key={item.priority}
            className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-slate-700 flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-xs">
                    #{item.priority}
                  </span>
                  <span className="text-xs font-bold text-slate-200">{item.category}</span>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {item.priority_label}
                </span>
              </div>

              <div className="text-2xl font-black text-rose-400 my-2">
                {item.amount_formatted}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs">
              <span className="text-[11px] text-emerald-400 font-semibold">{item.action}</span>
              {item.priority === 1 ? (
                <button
                  onClick={onOpenReminder}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs whitespace-nowrap active:scale-95 shadow-sm"
                >
                  Send Notice
                </button>
              ) : (
                <button
                  onClick={() => onNavigateTab('actions')}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs whitespace-nowrap"
                >
                  Resolve
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

