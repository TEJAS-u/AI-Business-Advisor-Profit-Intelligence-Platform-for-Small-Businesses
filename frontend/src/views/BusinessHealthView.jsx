import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Package,
  DollarSign,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function BusinessHealthView({ healthScore, onWhyClick, onNavigateTab }) {
  const health = healthScore || {};
  const pillars = health.pillars || [];
  const weakest = health.weakest_area || {};

  return (
    <div className="space-y-7 animate-in fade-in duration-300">

      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>5-Pillar Enterprise Diagnostics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            AI Business Health Score
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Holistic diagnostic score evaluating Profitability, Cash Flow, Inventory Velocity, Customer Debtor Collections, and Expense Control.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950/90 border border-emerald-500/30 flex flex-col items-center justify-center min-w-[200px] shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Business Health</span>
          <span className="text-4xl font-black text-emerald-400 mt-1">
            {health.overall_score || 72}<span className="text-xs text-slate-400 font-normal"> / 100</span>
          </span>
          <span className="text-xs font-bold text-emerald-300 mt-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
            {health.status_label || "Healthy (Moderate Risk)"}
          </span>
        </div>
      </div>

      {/* Weakest Area Alert Box */}
      {weakest.title && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/40 shadow-xl flex items-start gap-4">
          <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 block mb-1">
              Primary Drag on Business Health: {weakest.title}
            </span>
            <p className="text-sm font-bold text-white leading-relaxed">
              "{weakest.description}"
            </p>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Collecting overdue invoices directly improves the Customer Payments pillar score and releases cash into working capital.
            </p>

            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => onNavigateTab('actions')}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all active:scale-95 shadow-md"
              >
                Execute Payment Recovery
              </button>
              <button
                onClick={() => onWhyClick(null, "Why is Customer Payments the weakest area?")}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
              >
                Why did this happen?
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5 Pillars Deep Dive Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          5-Pillar Score Breakdown:
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pillars.map((p, idx) => (
            <div key={idx} className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200">{p.name}</span>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-md ${p.score >= 75 ? 'bg-emerald-500/15 text-emerald-300' : p.score >= 65 ? 'bg-blue-500/15 text-blue-300' : 'bg-rose-500/20 text-rose-300 font-black'
                    }`}>
                    {p.score}/100
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full ${p.score >= 75 ? 'bg-emerald-500' : p.score >= 65 ? 'bg-blue-500' : 'bg-rose-500'}`}
                    style={{ width: `${p.score}%` }}
                  />
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {p.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Status: <strong className="text-slate-300">{p.status}</strong></span>
                <button
                  onClick={() => onWhyClick(null, `Why is ${p.name} score ${p.score}/100?`)}
                  className="font-bold text-emerald-400 hover:text-emerald-300"
                >
                  Why?
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

