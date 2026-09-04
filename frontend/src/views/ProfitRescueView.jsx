import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  FileText,
  Send,
  Copy,
  Check,
  Download,
  Sparkles,
  DollarSign,
  Package,
  Users,
  Printer,
  ChevronRight,
  Zap
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function ProfitRescueView({ dashboardData }) {
  const [activeDoc, setActiveDoc] = useState('supplier'); // 'supplier' | 'debtor' | 'bundle'
  const [supplierData, setSupplierData] = useState(null);
  const [debtorData, setDebtorData] = useState(null);
  const [bundleData, setBundleData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const [sRes, dRes, bRes] = await Promise.all([
        fetch('/api/rescue/supplier-letter'),
        fetch('/api/rescue/debtor-letter'),
        fetch('/api/rescue/bundle-strategy')
      ]);
      if (sRes.ok) setSupplierData(await sRes.json());
      if (dRes.ok) setDebtorData(await dRes.json());
      if (bRes.ok) setBundleData(await bRes.json());
    } catch (e) {
      console.error("Rescue documents error", e);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeContent = activeDoc === 'supplier'
    ? supplierData?.letter_body
    : activeDoc === 'debtor'
      ? debtorData?.letter_body
      : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 border border-teal-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-400 mb-1">
            <Zap className="w-4 h-4 text-teal-400" />
            <span>Autonomous 1-Click Margin Recovery Toolkit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Profit Rescue Mode
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Instantly generate legally structured supplier negotiation notices, debtor demand letters with settlement incentives, and dead stock liquidation plans.
          </p>
        </div>

        {/* Quick Tabs */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex-wrap">
          <button
            onClick={() => setActiveDoc('supplier')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${activeDoc === 'supplier'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Supplier Letter (+₹64.4k/mo)</span>
          </button>

          <button
            onClick={() => setActiveDoc('debtor')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${activeDoc === 'debtor'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Debtor Demand (₹2.45L)</span>
          </button>

          <button
            onClick={() => setActiveDoc('bundle')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${activeDoc === 'bundle'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Dead Stock Bundle (₹1.4L)</span>
          </button>
        </div>
      </div>

      {/* Main Document Viewer */}
      {activeDoc === 'bundle' ? (
        <div className="glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                STRATEGIC CLEARANCE BLUEPRINT
              </span>
              <h2 className="text-xl font-bold text-white mt-1">
                {bundleData?.title}
              </h2>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Projected Cash Recovery</div>
              <div className="text-xl font-extrabold text-emerald-400">
                +{formatINR(bundleData?.projected_cash_recovered)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <span className="text-xs font-bold uppercase text-rose-400">Trapped Inventory SKU</span>
              <h4 className="text-sm font-extrabold text-white mt-1">{bundleData?.dead_stock_sku}</h4>
              <p className="text-xs text-slate-300 mt-1">Currently holding 210 days without sell-through.</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-xs font-bold uppercase text-emerald-400">Partner High-Margin Anchor SKU</span>
              <h4 className="text-sm font-extrabold text-white mt-1">{bundleData?.partner_high_margin_sku}</h4>
              <p className="text-xs text-slate-300 mt-1">Generates 31.2% gross profit and steady contractor demand.</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Execution Strategy Steps:
            </h4>
            <div className="space-y-2">
              {bundleData?.bundle_details?.map((step, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3 text-xs text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6 max-w-4xl mx-auto">

          {/* Document Header Controls */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-wrap gap-4">
            <div>
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                {activeDoc === 'supplier' ? 'PROCUREMENT RECOVERY NOTICE' : 'LEGAL DEMAND NOTICE'}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                {activeDoc === 'supplier' ? supplierData?.title : debtorData?.title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(activeContent || "")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all active:scale-95"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Notice</span>
              </button>
            </div>
          </div>

          {/* Letter Body Preview */}
          <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-slate-200 font-mono whitespace-pre-wrap leading-relaxed shadow-inner">
            {activeContent}
          </div>

          {/* Impact Banner */}
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>
                {activeDoc === 'supplier'
                  ? 'Projected financial recovery: +₹64,400/month recurring savings'
                  : 'Projected cashflow recovery: +₹2,40,100 immediate cash settlement'}
              </span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

