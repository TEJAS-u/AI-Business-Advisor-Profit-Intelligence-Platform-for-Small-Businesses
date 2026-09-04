import React from 'react';
import { 
  ShieldCheck, 
  AlertCircle, 
  HelpCircle, 
  CheckCircle2, 
  ChevronRight, 
  Sparkles,
  TrendingDown,
  Percent,
  DollarSign,
  Package
} from 'lucide-react';

export default function HealthScoreGauge({ healthScore, onWhyClick }) {
  if (!healthScore) return null;

  const score = healthScore.overall_score || 0;
  const statusLabel = healthScore.status_label || "Analyzing";
  const pillars = healthScore.pillars || [];
  const biggestWeakness = healthScore.biggest_weakness;
  const primaryStrength = healthScore.primary_strength;

  // Semicircle gauge stroke parameters
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference * 0.75;

  const getScoreColor = (s) => {
    if (s >= 80) return { stroke: '#10B981', text: 'text-emerald-400', badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' };
    if (s >= 65) return { stroke: '#F59E0B', text: 'text-amber-400', badge: 'bg-amber-500/10 border-amber-500/30 text-amber-400' };
    return { stroke: '#F43F5E', text: 'text-rose-400', badge: 'bg-rose-500/10 border-rose-500/30 text-rose-400' };
  };

  const theme = getScoreColor(score);

  const getPillarIcon = (name) => {
    switch (name) {
      case 'Profitability': return Percent;
      case 'Expense Control': return TrendingDown;
      case 'Cash & Receivables': return DollarSign;
      case 'Inventory Efficiency': return Package;
      default: return ShieldCheck;
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 relative overflow-hidden shadow-xl bg-[#0F172A]/70">
      
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Business Health Score
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-semibold ${theme.badge}`}>
                {statusLabel}
              </span>
            </h2>
            <p className="text-xs text-slate-400">Deterministic Multi-Factor Diagnostic (0–100)</p>
          </div>
        </div>

        <button
          onClick={() => onWhyClick && onWhyClick(null, "Why is my Business Health Score at this level?")}
          className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-lg transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Why this score?</span>
        </button>
      </div>

      {/* Main Score + Pillars Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Circular Gauge Display */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-135" viewBox="0 0 160 160">
              {/* Background circle track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
                strokeLinecap="round"
              />
              {/* Animated value circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke={theme.stroke}
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className={`text-4xl font-extrabold tracking-tight ${theme.text}`}>
                {score}
              </span>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                out of 100
              </span>
            </div>
          </div>

          <div className="mt-2 text-center">
            <div className="text-xs font-semibold text-slate-300">
              Composite Financial Health
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Target benchmark: &gt; 80/100
            </div>
          </div>
        </div>

        {/* 4 Pillars Breakdown */}
        <div className="lg:col-span-8 flex flex-col gap-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pillars.map((p, idx) => {
              const Icon = getPillarIcon(p.name);
              const isHealthy = p.score >= 18;
              return (
                <div key={idx} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-200">{p.name}</span>
                    </div>
                    <span className={`text-xs font-bold ${isHealthy ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {p.score} <span className="text-[10px] text-slate-500 font-normal">/ 25</span>
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${isHealthy ? 'bg-emerald-500' : p.score >= 12 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${(p.score / 25) * 100}%` }}
                    />
                  </div>

                  <div className="text-[10px] text-slate-400 truncate">
                    {p.deductions?.length > 0 ? p.deductions[0] : 'Performing within target range'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Highlight Biggest Weakness Card */}
          {biggestWeakness && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 mt-0.5 flex-shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-300 uppercase tracking-wide">
                    Biggest Weakness Detected ({biggestWeakness.pillar})
                  </span>
                  <span className="text-[11px] font-semibold text-rose-400">
                    {biggestWeakness.score} / {biggestWeakness.max} pts
                  </span>
                </div>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                  {biggestWeakness.description}
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

