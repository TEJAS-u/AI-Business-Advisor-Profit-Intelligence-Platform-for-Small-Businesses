import React from 'react';
import { 
  AlertTriangle, 
  TrendingDown, 
  HelpCircle, 
  Sparkles, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  ShieldAlert,
  Zap
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function ProfitLeakCard({ leak, onWhyClick, onStatusChange }) {
  if (!leak) return null;

  const severityStyles = {
    HIGH: {
      border: 'border-rose-500/40 bg-gradient-to-br from-rose-950/20 via-slate-900/60 to-slate-900/80',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      iconColor: 'text-rose-400',
      impactBg: 'bg-rose-500/10 text-rose-300 border-rose-500/30'
    },
    MEDIUM: {
      border: 'border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-slate-900/60 to-slate-900/80',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      iconColor: 'text-amber-400',
      impactBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30'
    },
    LOW: {
      border: 'border-blue-500/30 bg-gradient-to-br from-blue-950/20 via-slate-900/60 to-slate-900/80',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      iconColor: 'text-blue-400',
      impactBg: 'bg-blue-500/10 text-blue-300 border-blue-500/30'
    }
  }[leak.severity] || {
    border: 'border-slate-800 bg-slate-900',
    badge: 'bg-slate-800 text-slate-300',
    iconColor: 'text-slate-400',
    impactBg: 'bg-slate-800 text-slate-300 border-slate-700'
  };

  const status = leak.action_status || 'Pending';

  return (
    <div className={`p-6 rounded-2xl border transition-all duration-200 shadow-xl ${severityStyles.border} flex flex-col justify-between group`}>
      
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${severityStyles.badge}`}>
              {leak.severity} SEVERITY LEAK
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {leak.category}
            </span>
          </div>

          {/* Interactive Why Button */}
          <button
            onClick={() => onWhyClick(leak.id, `Why did this profit leak occur: ${leak.title}?`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs font-semibold transition-all active:scale-95 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Why?</span>
          </button>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-100 mb-2 leading-snug">
          {leak.title}
        </h3>

        {/* Financial Impact Banner */}
        <div className={`p-3 rounded-xl border flex items-center justify-between my-3 ${severityStyles.impactBg}`}>
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold opacity-80">
              Estimated Financial Impact
            </div>
            <div className="text-xl font-black tracking-tight mt-0.5">
              {leak.estimated_impact_monthly > 0 ? (
                <>
                  {formatINR(leak.estimated_impact_monthly)}
                  <span className="text-xs font-normal opacity-80 ml-1">/ month</span>
                </>
              ) : (
                <>
                  {formatINR(leak.estimated_impact_total)}
                  <span className="text-xs font-normal opacity-80 ml-1">at risk</span>
                </>
              )}
            </div>
          </div>
          {leak.estimated_impact_total > 0 && leak.estimated_impact_monthly > 0 && (
            <div className="text-right text-xs opacity-90 hidden sm:block">
              <span className="font-semibold">{formatINR(leak.estimated_impact_total)}</span>
              <div className="text-[10px]">Annualized Bleed</div>
            </div>
          )}
        </div>

        {/* Problem Statement */}
        <div className="my-3 text-xs leading-relaxed">
          <span className="font-bold text-rose-400 uppercase tracking-wider text-[11px] block mb-1">
            PROBLEM
          </span>
          <p className="text-slate-200 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
            {leak.problem}
          </p>
        </div>

        {/* Reason / Root Cause */}
        <div className="my-3 text-xs leading-relaxed">
          <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px] block mb-1">
            REASON & ROOT CAUSE
          </span>
          <p className="text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
            {leak.reason}
          </p>
        </div>

        {/* Recommendation */}
        <div className="my-3 text-xs leading-relaxed">
          <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] block mb-1 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            RECOMMENDED ACTION
          </span>
          <p className="text-emerald-100 bg-emerald-950/30 p-3 rounded-lg border border-emerald-500/20 font-medium">
            {leak.recommended_action}
          </p>
        </div>
      </div>

      {/* Footer: Action Execution Status */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-slate-400">Action Remediation Status:</span>
        <div className="flex items-center gap-1.5">
          {['Pending', 'In Progress', 'Resolved'].map((st) => (
            <button
              key={st}
              onClick={() => onStatusChange && onStatusChange(leak.id, st)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                status === st
                  ? st === 'Resolved'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : st === 'In Progress'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-700 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}

