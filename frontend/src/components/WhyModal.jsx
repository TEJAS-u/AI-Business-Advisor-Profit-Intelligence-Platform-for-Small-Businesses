import React from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Zap,
  ShieldCheck,
  TrendingDown
} from 'lucide-react';

export default function WhyModal({ isOpen, onClose, whyData, isLoading, onAskCfo }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0F172A] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">AI "Why?" Engine</h3>
              <p className="text-xs text-slate-400">Deterministic Root-Cause Analysis</p>
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
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-emerald-400 animate-spin" />
            <div className="text-xs font-semibold text-slate-300">
              Attributing mathematical root causes...
            </div>
          </div>
        ) : whyData ? (
          <div className="space-y-4">

            {/* Title & Core Explanation */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <h4 className="text-sm font-bold text-emerald-400 mb-2">{whyData.title}</h4>
              <p className="text-xs text-slate-200 leading-relaxed font-medium whitespace-pre-wrap">
                {whyData.explanation}
              </p>
            </div>

            {/* Breakdown Items if any */}
            {whyData.breakdown && whyData.breakdown.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Contributing Factors:
                </span>
                {whyData.breakdown.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                    {item}
                  </div>
                ))}
              </div>
            )}

            {/* Recommended Action */}
            {whyData.action && (
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-200">
                  <strong className="block font-bold mb-0.5">Recommended Next Action:</strong>
                  {whyData.action}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  onClose();
                  if (onAskCfo) onAskCfo(whyData.title);
                }}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5"
              >
                <span>Discuss with AI CFO</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
}

