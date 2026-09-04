import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  DollarSign,
  Clock,
  Package,
  CreditCard
} from 'lucide-react';

export default function FindMoneyModal({ isOpen, onClose, onNavigateTab }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchFindMoney();
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0B101D] border border-blue-500/40 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Where Did My Money Go?</h3>
              <p className="text-xs text-slate-400">Trapped Capital Audit & Unlocked Opportunity Scanner</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-14 flex flex-col items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-blue-400 animate-spin" />
            <div className="text-xs font-semibold text-slate-300">
              Auditing receivables, warehouse inventory, component unit costs, and recurring invoices...
            </div>
          </div>
        ) : data ? (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">

            {/* Total Opportunity Banner */}
            <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block mb-0.5">
                  Total Money at Risk / Opportunity:
                </span>
                <div className="text-2xl font-black text-white">
                  {data.total_opportunity_formatted}
                </div>
              </div>
              <div className="text-right text-xs text-slate-400">
                <span>{data.items?.length} Key Leak Vectors</span>
              </div>
            </div>

            {/* CFO Priority Advice */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed font-medium">
              <strong className="text-emerald-400 font-bold block mb-1">CFO Priority Recommendation:</strong>
              {data.top_priority_advice}
            </div>

            {/* Breakdown List */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Detailed Trapped Capital Breakdown:
              </span>

              {data.items?.map((item) => (
                <div
                  key={item.priority}
                  className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-800 text-slate-300 flex-shrink-0 mt-0.5">
                      {item.priority === 1 && <Clock className="w-4 h-4 text-rose-400" />}
                      {item.priority === 2 && <Package className="w-4 h-4 text-amber-400" />}
                      {item.priority === 3 && <DollarSign className="w-4 h-4 text-teal-400" />}
                      {item.priority === 4 && <CreditCard className="w-4 h-4 text-purple-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-100">{item.category}</span>
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-slate-800 text-slate-400">
                          {item.priority_label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right font-black text-rose-300 text-sm">
                      {item.amount_formatted}
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        if (onNavigateTab) onNavigateTab('actions');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px]"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
}

