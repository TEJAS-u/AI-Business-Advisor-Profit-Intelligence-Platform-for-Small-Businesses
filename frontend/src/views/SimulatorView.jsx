import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight, 
  RotateCcw,
  Percent,
  DollarSign,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function SimulatorView({ token, dashboardData }) {
  const [priceChange, setPriceChange] = useState(10);
  const [supplierDiscount, setSupplierDiscount] = useState(8);
  const [opexCut, setOpexCut] = useState(10);
  const [debtRecovery, setDebtRecovery] = useState(60);

  const [simResult, setSimResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    runSim();
  }, [priceChange, supplierDiscount, opexCut, debtRecovery, token]);

  const runSim = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/shop/simulate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          price_change_pct: Number(priceChange),
          supplier_discount_pct: Number(supplierDiscount),
          opex_cut_pct: Number(opexCut),
          receivables_collected_pct: Number(debtRecovery)
        })
      });
      if (res.ok) {
        setSimResult(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPriceChange(0);
    setSupplierDiscount(0);
    setOpexCut(0);
    setDebtRecovery(0);
  };

  const baseline = simResult?.baseline || {};
  const simulated = simResult?.simulated || {};
  const delta = simResult?.delta || {};

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 border border-teal-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-400 mb-1">
            <Sliders className="w-4 h-4 text-teal-400" />
            <span>Interactive Decision Engine</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            What-If Business Simulator
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Simulate the bottom-line impact of price changes, supplier renegotiations, overhead pruning, and customer debt recovery before executing.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors self-start md:self-center"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Sliders</span>
        </button>
      </div>

      {/* Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Sliders */}
        <div className="lg:col-span-6 glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
            Decision Levers
          </h3>

          {/* Lever 1: Price Change */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between font-bold text-slate-200">
              <span>Price Adjustment:</span>
              <span className="text-emerald-400 font-black">{priceChange > 0 ? `+${priceChange}%` : `${priceChange}%`}</span>
            </div>
            <input
              type="range"
              min="-10"
              max="25"
              step="1"
              value={priceChange}
              onChange={(e) => setPriceChange(e.target.value)}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>-10% Discount</span>
              <span>Baseline (0%)</span>
              <span>+25% Markup</span>
            </div>
          </div>

          {/* Lever 2: Supplier Discount */}
          <div className="space-y-2 text-xs pt-2 border-t border-slate-800/80">
            <div className="flex justify-between font-bold text-slate-200">
              <span>Supplier COGS Discount:</span>
              <span className="text-teal-400 font-black">-{supplierDiscount}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={supplierDiscount}
              onChange={(e) => setSupplierDiscount(e.target.value)}
              className="w-full accent-teal-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0% (Current)</span>
              <span>-10% Bulk PO</span>
              <span>-20% Tier 1 Contract</span>
            </div>
          </div>

          {/* Lever 3: OpEx Cut */}
          <div className="space-y-2 text-xs pt-2 border-t border-slate-800/80">
            <div className="flex justify-between font-bold text-slate-200">
              <span>Operating Overhead (OpEx) Cut:</span>
              <span className="text-blue-400 font-black">-{opexCut}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="1"
              value={opexCut}
              onChange={(e) => setOpexCut(e.target.value)}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0% (Current)</span>
              <span>-10% Prune Bills</span>
              <span>-25% Lean Store</span>
            </div>
          </div>

          {/* Lever 4: Debt Recovery */}
          <div className="space-y-2 text-xs pt-2 border-t border-slate-800/80">
            <div className="flex justify-between font-bold text-slate-200">
              <span>Customer Overdue Dues Recovery:</span>
              <span className="text-amber-400 font-black">{debtRecovery}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={debtRecovery}
              onChange={(e) => setDebtRecovery(e.target.value)}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0% Uncollected</span>
              <span>50% Target</span>
              <span>100% Full Liquidation</span>
            </div>
          </div>
        </div>

        {/* Right Column: Projected Impact */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel p-6 rounded-2xl border border-teal-500/30 bg-[#0C1220] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 block">
                  Projected Bottom-Line Outcome:
                </span>
                <div className="text-2xl font-black text-white mt-0.5">
                  {formatINR(simulated.net_profit || 0)}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-semibold block">Profit Lift:</span>
                <span className="text-sm font-black text-emerald-400">
                  +{formatINR(delta.net_profit_delta || 0)}
                </span>
              </div>
            </div>

            {/* Comparison Metrics */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 font-semibold block mb-0.5">Projected Net Margin:</span>
                <span className="text-lg font-black text-white">{simulated.net_profit_margin_pct || 0}%</span>
                <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">
                  +{delta.margin_delta_pct || 0}% expansion
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 font-semibold block mb-0.5">Projected Health Score:</span>
                <span className="text-lg font-black text-emerald-400">{simulated.projected_health_score || 0}/100</span>
                <span className="text-[10px] text-teal-300 font-bold block mt-0.5">
                  +{delta.health_score_delta || 0} points
                </span>
              </div>
            </div>

            {/* Cash Injected from Debt Collection */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs flex justify-between items-center text-amber-200">
              <span>Liquid Cash from Debt Collections:</span>
              <span className="font-black text-amber-300">{formatINR(simulated.cash_collected_from_debt || 0)}</span>
            </div>

            {/* AI Strategic Assessment */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed font-medium">
              <strong className="text-teal-400 font-bold block mb-1">🧠 AI Decision Assessment:</strong>
              This simulated strategy delivers an estimated <strong>+{formatINR(delta.net_profit_delta || 0)}</strong> in annual profitability, expanding store margin by <strong>{delta.margin_delta_pct}%</strong> with zero downside to customer demand.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
