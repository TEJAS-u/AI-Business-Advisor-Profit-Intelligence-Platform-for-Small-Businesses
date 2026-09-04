import React from 'react';
import { 
  X, 
  Sparkles, 
  TrendingDown, 
  TrendingUp, 
  ArrowRight, 
  ShieldCheck, 
  HelpCircle,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function WhyEngineModal({ isOpen, onClose, whyData, isLoading, onAskCfo }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0F172A] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">AI Why Engine</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Deterministic Attribution
                </span>
              </div>
              <p className="text-xs text-slate-400">Exact root cause decomposition backed 100% by verified business data</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200 text-sm">
          
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Sparkles className="w-8 h-8 text-emerald-400 animate-spin" />
              <div className="text-sm font-semibold text-slate-300">Computing financial causal drivers...</div>
            </div>
          ) : whyData ? (
            <>
              {/* Question / Title */}
              <div>
                <h4 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-2">
                  {whyData.title}
                </h4>
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 text-sm leading-relaxed font-medium">
                  {whyData.summary}
                </div>
              </div>

              {/* Attribution Factors / Waterfall */}
              {whyData.waterfall_factors && whyData.waterfall_factors.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                    Deterministic Financial Factor Attribution
                  </h5>
                  <div className="space-y-2">
                    {whyData.waterfall_factors.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg ${item.direction === 'positive' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                            {item.direction === 'positive' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-200 text-xs">{item.factor}</div>
                            <div className="text-[11px] text-slate-400">{item.detail}</div>
                          </div>
                        </div>
                        <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-md ${item.direction === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                          {item.impact_pct}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Drivers Breakdown */}
              {whyData.key_drivers && whyData.key_drivers.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Key Root Causes
                  </h5>
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2 text-xs text-slate-300">
                    {whyData.key_drivers.map((drv, i) => (
                      <div key={i} className="leading-relaxed">
                        {drv}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CFO Recommendation */}
              {whyData.cfo_recommendation && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 border border-emerald-500/30">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                    <Lightbulb className="w-4 h-4" />
                    <span>CFO Recommended Next Step</span>
                  </div>
                  <p className="text-xs text-slate-200 font-medium leading-relaxed">
                    {whyData.cfo_recommendation}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">
              No causal details found.
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Powered by Deterministic Analytics Engine & AI CFO
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                if (onAskCfo) onAskCfo(whyData?.title || "Explain this in chat");
              }}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md"
            >
              <span>Ask AI CFO in Chat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

