import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  DollarSign, 
  Zap, 
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Send
} from 'lucide-react';
import AiCfoChat from '../components/AiCfoChat';
import { formatINR } from '../utils/formatters';

export default function AiAdvisorView({ 
  dashboardData, 
  onWhyClick, 
  onStatusChange, 
  activeWhyQuestion 
}) {
  const [actions, setActions] = useState([]);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'actions' or 'memo'

  const summary = dashboardData?.summary || {};
  const healthScore = dashboardData?.health_score || {};
  const leaks = dashboardData?.profit_leaks_preview || [];

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    try {
      const res = await fetch('/api/actions');
      if (res.ok) {
        const data = await res.json();
        setActions(data.actions || []);
      }
    } catch (e) {
      console.error("Failed to load actions", e);
    }
  };

  const handleActionStatusToggle = async (leakId, newStatus) => {
    try {
      const res = await fetch(`/api/actions/${leakId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setActions(prev => prev.map(a => a.target_leak_id === leakId ? { ...a, status: newStatus } : a));
        if (onStatusChange) onStatusChange(leakId, newStatus);
      }
    } catch (e) {
      console.error("Status update error", e);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>Intelligent Financial Advisory Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            AI CFO Business Advisor
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Your conversational CFO copilot. Ask why profit changed, explore remediation options, or review your data-backed prioritized action roadmap.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'chat'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI CFO Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('actions')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'actions'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Action Roadmap ({actions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('memo')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'memo'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Executive Memo</span>
          </button>
        </div>
      </div>

      {/* 1. Chat Tab */}
      {activeTab === 'chat' && (
        <AiCfoChat
          initialQuery={activeWhyQuestion}
          onQuickPromptSelect={(q) => onWhyClick(null, q)}
        />
      )}

      {/* 2. Action Roadmap Tab */}
      {activeTab === 'actions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Prioritized CFO Action Plan
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Ranked by Quantified Financial Gain
              </span>
            </h2>
            <span className="text-xs text-slate-400">
              Click status pills to track execution progress
            </span>
          </div>

          <div className="space-y-3">
            {actions.map((act, idx) => (
              <div 
                key={act.action_id || idx}
                className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-emerald-500/30"
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl mt-0.5 ${act.severity === 'HIGH' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}`}>
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {act.category}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        • {act.timeframe}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-100">
                      {act.title}
                    </h3>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 self-end md:self-center">
                  {act.monthly_gain > 0 && (
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Estimated Monthly Gain</div>
                      <div className="text-sm font-extrabold text-emerald-400">
                        +{formatINR(act.monthly_gain)}/mo
                      </div>
                    </div>
                  )}

                  {/* Status Toggle */}
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    {['Pending', 'In Progress', 'Resolved'].map((st) => (
                      <button
                        key={st}
                        onClick={() => handleActionStatusToggle(act.target_leak_id, st)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded transition-all ${
                          act.status === st
                            ? st === 'Resolved'
                              ? 'bg-emerald-500 text-slate-950 font-bold'
                              : st === 'In Progress'
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-slate-700 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Executive Memo Tab */}
      {activeTab === 'memo' && (
        <div className="glass-panel p-8 rounded-2xl border border-slate-800 max-w-4xl mx-auto shadow-2xl bg-[#0F172A] space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                CONFIDENTIAL CFO BRIEFING
              </span>
              <h2 className="text-xl font-extrabold text-white mt-1">
                Executive Financial & Profit Intelligence Memo
              </h2>
            </div>
            <div className="text-right text-xs text-slate-400">
              <div>Date: {new Date().toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
              <div className="font-semibold text-slate-300">{dashboardData?.profile?.business_name}</div>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-200 leading-relaxed">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-emerald-400">
              1. Executive Summary & Health Diagnostic
            </h3>
            <p>
              The business achieved total revenue of <strong>{formatINR(summary.total_revenue)}</strong> across the audited 6-month period, generating a net profit of <strong>{formatINR(summary.net_profit)}</strong> (<strong>{summary.net_profit_margin_pct}% net profit margin</strong>). 
              The composite <strong>Business Health Score stands at {healthScore.overall_score}/100 ({healthScore.status_label})</strong>.
            </p>

            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-emerald-400 pt-2">
              2. Primary Financial Bleeds & Constraints
            </h3>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-300">
              <li>
                <strong>Supplier Pricing Spike</strong>: Wholesale purchase price on core microcontrollers increased by +22.6% without retail repricing, bleeding approx. <strong>{formatINR(64400)}/month</strong>.
              </li>
              <li>
                <strong>Logistics Overhead Explosion</strong>: Expedited freight expenses jumped +69.4% MoM, eating approx. <strong>{formatINR(43000)}/month</strong> in excess operating spend.
              </li>
              <li>
                <strong>Stalled Debtor Working Capital</strong>: <strong>{formatINR(summary.overdue_receivables)}</strong> remains stalled in overdue accounts receivable, with two commercial contractors exceeding 60-100 days overdue.
              </li>
            </ul>

            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-emerald-400 pt-2">
              3. Strategic CFO Recommendations
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 pl-2 text-slate-300">
              <li>Institute a +12% price correction on microcontroller SKUs to protect gross margin floor at 25%.</li>
              <li>Enforce immediate stop-supply on accounts past 45 days overdue and offer a 2% settlement discount.</li>
              <li>Liquidate ₹1,64,500 in dead lighting inventory via bundled promotional kits.</li>
            </ol>
          </div>

          <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Generated deterministically by AI CFO Platform</span>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
            >
              Print / Save PDF Memo
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

