import React, { useState, useEffect } from 'react';
import {
  Zap,
  Sparkles,
  Calculator,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  ShieldCheck
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function ShopEstimateView({ token, onEstimateSaved, onNavigateTab }) {
  const [revenue, setRevenue] = useState(250000);
  const [marginPct, setMarginPct] = useState(25);
  const [rent, setRent] = useState(25000);
  const [salaries, setSalaries] = useState(20000);
  const [utilities, setUtilities] = useState(4000);
  const [transport, setTransport] = useState(3500);
  const [marketing, setMarketing] = useState(2000);
  const [otherOpex, setOtherOpex] = useState(1500);
  const [receivables, setReceivables] = useState(30000);
  const [overdue, setOverdue] = useState(12000);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    fetchExistingEstimate();
  }, [token]);

  const fetchExistingEstimate = async () => {
    try {
      const res = await fetch('/api/shop/estimate', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.estimate) {
          const e = data.estimate;
          setRevenue(e.monthly_revenue || 250000);
          setMarginPct(e.margin_pct || 25);
          setRent(e.rent || 0);
          setSalaries(e.salaries || 0);
          setUtilities(e.utilities || 0);
          setTransport(e.transport || 0);
          setMarketing(e.marketing || 0);
          setOtherOpex(e.other_opex || 0);
          setReceivables(e.total_receivables || 0);
          setOverdue(e.overdue_receivables || 0);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Live Calculations
  const grossProfit = revenue * (marginPct / 100);
  const cogs = revenue - grossProfit;
  const totalOpex = Number(rent) + Number(salaries) + Number(utilities) + Number(transport) + Number(marketing) + Number(otherOpex);
  const totalExpenses = cogs + totalOpex;
  const netProfit = revenue - totalExpenses;
  const netMargin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : 0;

  const handleSaveEstimate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setIsSaved(false);

    try {
      const res = await fetch('/api/shop/estimate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          monthly_revenue: Number(revenue),
          margin_pct: Number(marginPct),
          rent: Number(rent),
          salaries: Number(salaries),
          utilities: Number(utilities),
          transport: Number(transport),
          marketing: Number(marketing),
          other_opex: Number(otherOpex),
          total_receivables: Number(receivables),
          overdue_receivables: Number(overdue)
        })
      });
      if (res.ok) {
        setIsSaved(true);
        if (onEstimateSaved) onEstimateSaved();
        setTimeout(() => {
          setIsSaved(false);
          if (onNavigateTab) onNavigateTab('dashboard');
        }, 1200);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-300 max-w-5xl">

      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>60-Second Setup Wizard</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Quick Shop Estimator
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Enter your rough monthly turnover, average margin, overhead bills, and customer dues to generate an instant AI CFO diagnosis without entering individual receipts.
          </p>
        </div>

        {isSaved && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Diagnosis generated! Redirecting...</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Estimator Inputs Form */}
        <form onSubmit={handleSaveEstimate} className="lg:col-span-8 glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 text-xs">

          {/* Section 1: Revenue & Margin */}
          <div>
            <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              1. Sales Turnover & Gross Margin
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Estimated Monthly Sales / Turnover (₹):</label>
                <input
                  type="number"
                  required
                  value={revenue}
                  onChange={(e) => setRevenue(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Average Product Margin (%):</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={marginPct}
                  onChange={(e) => setMarginPct(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Operating Overhead */}
          <div className="pt-2 border-t border-slate-800">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-rose-400" />
              2. Monthly Operating Overhead (OpEx)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Shop Rent (₹):</label>
                <input
                  type="number"
                  value={rent}
                  onChange={(e) => setRent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Staff Salaries (₹):</label>
                <input
                  type="number"
                  value={salaries}
                  onChange={(e) => setSalaries(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Electricity/Power (₹):</label>
                <input
                  type="number"
                  value={utilities}
                  onChange={(e) => setUtilities(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Transport/Freight (₹):</label>
                <input
                  type="number"
                  value={transport}
                  onChange={(e) => setTransport(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Marketing/Ads (₹):</label>
                <input
                  type="number"
                  value={marketing}
                  onChange={(e) => setMarketing(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Other Misc OpEx (₹):</label>
                <input
                  type="number"
                  value={otherOpex}
                  onChange={(e) => setOtherOpex(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Customer Dues / Receivables */}
          <div className="pt-2 border-t border-slate-800">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400" />
              3. Customer Credit & Overdue Debts
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Total Customer Dues (Udhaar) (₹):</label>
                <input
                  type="number"
                  value={receivables}
                  onChange={(e) => setReceivables(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Amount Overdue &gt;30 Days (₹):</label>
                <input
                  type="number"
                  value={overdue}
                  onChange={(e) => setOverdue(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-950/40 transition-all active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoading ? 'Recalculating Diagnostics...' : 'Generate Instant AI CFO Diagnosis'}</span>
            </button>
          </div>

        </form>

        {/* Live Calculation Preview Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-6 rounded-2xl border border-amber-500/30 bg-[#0C1220] shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              Live Financial Projection
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Monthly Turnover:</span>
                <strong className="text-white">{formatINR(revenue)}</strong>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Estimated COGS:</span>
                <span>{formatINR(cogs)}</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Total Operating Overhead:</span>
                <span className="text-rose-400">{formatINR(totalOpex)}</span>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-200">Estimated Net Profit:</span>
                <span className={`text-base font-black ${netProfit > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatINR(netProfit)}
                </span>
              </div>

              <div className="flex justify-between text-xs text-slate-400 pt-1">
                <span>Net Profit Margin:</span>
                <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">{netMargin}%</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-300 leading-relaxed font-medium">
              💡 <strong>AI Tip:</strong> Once saved, you can immediately chat with your AI CFO, test what-if price simulations, and view your 5-pillar health score.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

