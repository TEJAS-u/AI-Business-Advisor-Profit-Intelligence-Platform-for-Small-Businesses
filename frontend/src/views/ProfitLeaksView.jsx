import React from 'react';
import { 
  Radar, 
  AlertTriangle, 
  Sparkles, 
  Zap, 
  ShieldAlert, 
  ArrowRight,
  TrendingDown
} from 'lucide-react';

export default function ProfitLeaksView({ leaksData, onWhyClick }) {
  const leaks = leaksData || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400 mb-1">
            <Radar className="w-4 h-4 text-rose-400" />
            <span>Main Unique Feature of AI CFO Platform</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Profit Leak Radar
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Automatically scans your raw transaction data and detects hidden profit leaks, unabsorbed supplier price spikes, overdue debtor risks, and dead capital.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/80 border border-rose-500/30 flex flex-col items-end justify-center min-w-[180px]">
          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Active Profit Leaks</span>
          <span className="text-2xl font-black text-white mt-0.5">{leaks.length} Detected</span>
          <span className="text-[11px] text-slate-400 mt-0.5">Scanned from Data</span>
        </div>
      </div>

      {/* Leaks Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {leaks.map((leak) => (
          <div 
            key={leak.id}
            className="glass-panel p-6 rounded-2xl border border-rose-500/30 bg-gradient-to-br from-slate-900/90 to-slate-950/90 shadow-xl flex flex-col justify-between space-y-4"
          >
            {/* Header */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {leak.category}
                </span>
                
                {/* Interactive Why Button */}
                <button
                  onClick={() => onWhyClick(leak.id, `Why did this profit leak occur: ${leak.title}?`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all active:scale-95 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Why?</span>
                </button>
              </div>

              <h3 className="text-base font-extrabold text-white leading-snug">
                {leak.title}
              </h3>

              {/* PROBLEM */}
              <div className="my-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block mb-1">
                  PROBLEM:
                </span>
                <p className="text-xs font-semibold text-slate-200 bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                  {leak.problem}
                </p>
              </div>

              {/* FINANCIAL IMPACT */}
              <div className="my-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                  ESTIMATED FINANCIAL IMPACT:
                </span>
                <div className="text-lg font-black text-amber-300 bg-amber-950/20 p-3 rounded-lg border border-amber-500/30">
                  {leak.financial_impact}
                </div>
              </div>

              {/* REASON */}
              <div className="my-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1">
                  REASON:
                </span>
                <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  {leak.reason}
                </p>
              </div>

              {/* RECOMMENDED ACTION */}
              <div className="my-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  RECOMMENDED ACTION:
                </span>
                <p className="text-xs text-emerald-200 bg-emerald-950/30 p-3 rounded-lg border border-emerald-500/30 font-medium">
                  {leak.recommended_action}
                </p>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
