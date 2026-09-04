import React, { useState, useEffect } from 'react';
import {
  X,
  LifeBuoy,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Zap,
  ShieldCheck,
  TrendingUp,
  FileText
} from 'lucide-react';

export default function RescueModal({ isOpen, onClose, onOpenReminder, onNavigateTab }) {
  const [rescueData, setRescueData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchRescue();
    }
  }, [isOpen]);

  const fetchRescue = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/rescue-my-profit');
      if (res.ok) setRescueData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0C1220] border border-rose-500/40 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-950/50 animate-pulse">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">Profit Rescue Mode</h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  Full Business Scan
                </span>
              </div>
              <p className="text-xs text-slate-400">Autonomous Profit Recovery & Turnaround Prioritization</p>
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
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-rose-400 animate-spin" />
            <div className="text-xs font-semibold text-slate-300">
              Scanning sales, purchase orders, debtor aging, and operating overhead...
            </div>
          </div>
        ) : rescueData ? (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">

            {/* Top CFO Strategy Recommendation */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/40 to-slate-900 border border-rose-500/30 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 flex-shrink-0 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block mb-0.5">
                  Top Recommended Priority (Impact + Urgency + Confidence):
                </span>
                <p className="text-xs font-black text-white leading-relaxed">
                  "{rescueData.cfo_recommendation}"
                </p>
              </div>
            </div>

            {/* 5 Detected Opportunities */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>{rescueData.headline}</span>
                <span className="text-slate-500 font-normal">Ranked by ROI Priority</span>
              </div>

              {rescueData.opportunities?.map((opp) => (
                <div
                  key={opp.rank}
                  className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                      #{opp.rank}
                    </span>
                    <div>
                      <div className="font-extrabold text-slate-100">{opp.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{opp.rationale}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Potential Value</div>
                      <div className="text-xs font-black text-emerald-400">{opp.potential_saving}</div>
                    </div>

                    {opp.rank === 2 ? (
                      <button
                        onClick={() => {
                          onClose();
                          if (onOpenReminder) onOpenReminder();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm active:scale-95 whitespace-nowrap"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Send Notice</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          onClose();
                          if (onNavigateTab) onNavigateTab('actions');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] active:scale-95 whitespace-nowrap"
                      >
                        Execute
                      </button>
                    )}
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

