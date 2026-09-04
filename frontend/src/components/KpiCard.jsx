import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  HelpCircle, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { formatINR, formatCompactINR } from '../utils/formatters';

export default function KpiCard({ 
  title, 
  value, 
  subValue, 
  changePct, 
  icon: Icon, 
  color = "emerald", 
  onWhyClick, 
  whyTargetId,
  badgeText,
  isCurrency = true 
}) {
  const isPositive = changePct !== undefined ? changePct >= 0 : true;

  const colorStyles = {
    emerald: {
      border: 'hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      valueColor: 'text-emerald-400'
    },
    blue: {
      border: 'hover:border-blue-500/40',
      iconBg: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      valueColor: 'text-blue-400'
    },
    amber: {
      border: 'hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      valueColor: 'text-amber-400'
    },
    rose: {
      border: 'hover:border-rose-500/40',
      iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      valueColor: 'text-rose-400'
    },
    purple: {
      border: 'hover:border-purple-500/40',
      iconBg: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
      valueColor: 'text-purple-400'
    }
  }[color] || {
    border: 'hover:border-emerald-500/40',
    iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    valueColor: 'text-emerald-400'
  };

  return (
    <div className={`glass-panel p-5 rounded-2xl border border-slate-800/80 transition-all duration-200 ${colorStyles.border} flex flex-col justify-between relative group`}>
      
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className={`p-2 rounded-xl ${colorStyles.iconBg}`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {title}
          </span>
        </div>

        {/* Why Button Trigger */}
        {onWhyClick && (
          <button
            onClick={() => onWhyClick(whyTargetId, `Why did ${title} change?`)}
            className="opacity-80 group-hover:opacity-100 p-1.5 rounded-lg bg-slate-800/80 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-slate-400 hover:text-emerald-300 text-xs font-medium flex items-center gap-1 transition-all"
            title={`Ask AI CFO Why for ${title}`}
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] hidden sm:inline">Why?</span>
          </button>
        )}
      </div>

      {/* Main Metric Value */}
      <div className="mb-2">
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {typeof value === 'number' ? (isCurrency ? formatINR(value) : value.toLocaleString('en-IN')) : value}
        </div>
      </div>

      {/* Footer / Subvalue / Trend */}
      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60 mt-1">
        <div className="text-slate-400 text-[11px] truncate max-w-[180px]">
          {subValue}
        </div>

        {badgeText && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">
            {badgeText}
          </span>
        )}

        {changePct !== undefined && (
          <div className={`flex items-center gap-0.5 font-bold text-[11px] ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            <span>{Math.abs(changePct).toFixed(1)}% MoM</span>
          </div>
        )}
      </div>

    </div>
  );
}

