import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  DollarSign,
  Activity,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { formatINR, formatCompactINR } from '../utils/formatters';

export default function RunwayView() {
  const [runwayData, setRunwayData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRunway();
  }, []);

  const fetchRunway = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/runway');
      if (res.ok) {
        setRunwayData(await res.json());
      }
    } catch (e) {
      console.error("Runway fetch error", e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!runwayData) return null;

  const getRiskBadge = (level) => {
    if (level === 'LOW RISK') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (level === 'MODERATE STRESS') return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
            <Activity className="w-4 h-4 text-amber-400" />
            <span>Working Capital & Liquidity Forecasting Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Cashflow Runway & Early Warning
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Dynamic 30/60/90-day cashflow trajectory modeling based on receivables collection lag and monthly operating burn rate.
          </p>
        </div>

        {/* Stress Index Badge */}
        <div className={`p-4 rounded-xl border flex flex-col items-end justify-center min-w-[200px] ${getRiskBadge(runwayData.risk_level)}`}>
          <span className="text-[10px] font-bold uppercase tracking-wider">
            Working Capital Stress Index
          </span>
          <span className="text-2xl font-black mt-0.5">
            {runwayData.stress_index} <span className="text-xs font-normal opacity-80">/ 100</span>
          </span>
          <span className="text-[11px] font-bold uppercase mt-1">
            {runwayData.risk_level}
          </span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Estimated Cash Reserves */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Liquid Cash Reserves</span>
          </div>
          <div className="text-2xl font-extrabold text-white my-2">
            {formatINR(runwayData.estimated_cash_reserves)}
          </div>
          <div className="text-[11px] text-slate-400">
            ~1.25x Monthly OpEx buffer
          </div>
        </div>

        {/* Monthly Burn Rate */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <TrendingDown className="w-4 h-4 text-rose-400" />
            <span>Monthly Operating Burn</span>
          </div>
          <div className="text-2xl font-extrabold text-rose-400 my-2">
            {formatINR(runwayData.monthly_burn_rate)}
          </div>
          <div className="text-[11px] text-slate-400">
            Avg expenses / 30-day cycle
          </div>
        </div>

        {/* Monthly Inflow */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Monthly Cash Inflow</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 my-2">
            {formatINR(runwayData.monthly_inflow_rate)}
          </div>
          <div className="text-[11px] text-slate-400">
            Collections from sales
          </div>
        </div>

        {/* Operating Runway Days */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Operating Runway</span>
          </div>
          <div className="text-2xl font-extrabold text-amber-400 my-2">
            {runwayData.runway_days} Days
          </div>
          <div className="text-[11px] text-slate-400">
            Zero new sales survival buffer
          </div>
        </div>

      </div>

      {/* Cashflow Projection Chart */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">90-Day Cashflow Projection Scenarios</h3>
            <p className="text-xs text-slate-400">Comparing Base, Stressed (Collection Delays), and Optimized (Debt Collected) trajectories</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Base Trend</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Stressed (Delays)</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Optimized (Recovery)</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={runwayData.forecast_chart_data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="period" stroke="#64748B" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748B" tickFormatter={formatCompactINR} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value) => [formatINR(value), '']}
                contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
              />
              <Line type="monotone" dataKey="base" name="Base Trend" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="stressed" name="Stressed Trend" stroke="#F43F5E" strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="optimized" name="Optimized Trend" stroke="#10B981" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Early Warning Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {runwayData.early_warnings?.map((warn, i) => (
          <div key={i} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3.5">
            <div className={`p-2.5 rounded-xl ${warn.severity === 'HIGH' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {warn.type} WARNING
                </span>
                <h4 className="text-xs font-bold text-slate-100">{warn.title}</h4>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{warn.message}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

