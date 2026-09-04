import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Package, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  UploadCloud,
  Calculator,
  Plus,
  Users,
  Bot
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function DashboardView({ 
  dashboardData, 
  onWhyClick, 
  onNavigateTab
}) {
  if (!dashboardData) return null;

  const summary = dashboardData.summary || {};
  const health = dashboardData.health_score || {};
  const attentionItems = dashboardData.attention_items || [];
  const user = dashboardData.profile || {};

  // Financial calculations with shopkeeper terms
  const sales = Number(summary.total_revenue || 0);
  const productCost = Number(summary.total_cogs || 0);
  const grossProfit = Number(summary.gross_profit || (sales - productCost));
  const shopExpenses = Number(summary.total_opex || 0);
  const actualProfit = Number(summary.net_profit || (grossProfit - shopExpenses));
  const profitMarginPct = summary.net_profit_margin_pct || 0;
  const stockValue = Number(summary.total_stock_value || 0);
  const udhaarAmount = Number(summary.outstanding_receivables || 0);
  const overdueUdhaar = Number(summary.overdue_receivables || 0);

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      
      {/* 1. Welcome Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-teal-950/60 via-slate-900 to-slate-900 border-2 border-teal-500/30 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-2xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-teal-400">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>AI Shop Assistant for {user.shop_name || "Your Shop"}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            👋 Welcome to your Shop Assistant
          </h1>
          <p className="text-sm sm:text-base text-slate-300 font-medium max-w-2xl leading-relaxed">
            Keep your sales, stock, expenses and customer Udhaar in one place. Know your actual profit clearly.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => onNavigateTab('sales')}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-base font-black transition-all shadow-xl shadow-teal-950/60 ring-2 ring-teal-400/40 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>+ ADD SALE</span>
          </button>

          <button
            onClick={() => onNavigateTab('advisor')}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 hover:border-teal-500/40 text-slate-100 text-sm font-extrabold transition-all active:scale-95"
          >
            <Bot className="w-5 h-5 text-teal-400" />
            <span>Ask AI Advisor</span>
          </button>
        </div>
      </div>

      {/* 2. 5 STEP-BY-STEP VISUAL WORKFLOW CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            <span>🚀 Simple 5 Steps to Manage Your Shop</span>
          </h2>
          <span className="text-xs text-teal-400 font-extrabold uppercase tracking-wider">Follow In Order</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          
          {/* STEP 1: Add Business Data */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border-2 border-slate-800 hover:border-teal-500/40 transition-all space-y-3 flex flex-col justify-between shadow-lg">
            <div className="space-y-1.5">
              <span className="inline-block px-2.5 py-0.5 rounded-lg bg-teal-500/20 text-teal-300 text-xs font-black uppercase">
                STEP 1
              </span>
              <h3 className="font-extrabold text-white text-base">
                📤 ADD YOUR BUSINESS DATA
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Upload your bills or enter your records.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('datahub')}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-teal-500/20 text-teal-300 font-extrabold text-xs border border-slate-700 hover:border-teal-500/40 transition-all flex items-center justify-center gap-1.5"
            >
              <span>[ Add / Upload ]</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* STEP 2: Add Products */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border-2 border-slate-800 hover:border-teal-500/40 transition-all space-y-3 flex flex-col justify-between shadow-lg">
            <div className="space-y-1.5">
              <span className="inline-block px-2.5 py-0.5 rounded-lg bg-teal-500/20 text-teal-300 text-xs font-black uppercase">
                STEP 2
              </span>
              <h3 className="font-extrabold text-white text-base">
                🛒 ADD PRODUCTS
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Save your products once. Use them again when selling.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('products')}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-teal-500/20 text-teal-300 font-extrabold text-xs border border-slate-700 hover:border-teal-500/40 transition-all flex items-center justify-center gap-1.5"
            >
              <span>[ Products ]</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* STEP 3: Record a Sale */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border-2 border-slate-800 hover:border-teal-500/40 transition-all space-y-3 flex flex-col justify-between shadow-lg">
            <div className="space-y-1.5">
              <span className="inline-block px-2.5 py-0.5 rounded-lg bg-teal-500/20 text-teal-300 text-xs font-black uppercase">
                STEP 3
              </span>
              <h3 className="font-extrabold text-white text-base">
                💰 RECORD A SALE
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Select the product, enter quantity and save.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('sales')}
              className="w-full py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <span>[ Add Sale ]</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* STEP 4: Check Customer Udhaar */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border-2 border-slate-800 hover:border-amber-500/40 transition-all space-y-3 flex flex-col justify-between shadow-lg">
            <div className="space-y-1.5">
              <span className="inline-block px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-black uppercase">
                STEP 4
              </span>
              <h3 className="font-extrabold text-white text-base">
                👥 CHECK CUSTOMER UDHAR
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                See who has to pay you and record payments.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('receivables')}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-amber-500/20 text-amber-300 font-extrabold text-xs border border-slate-700 hover:border-amber-500/40 transition-all flex items-center justify-center gap-1.5"
            >
              <span>[ Customers ]</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* STEP 5: See Your Profit */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-emerald-950/40 to-slate-900 border-2 border-emerald-500/50 space-y-3 flex flex-col justify-between shadow-lg">
            <div className="space-y-1.5">
              <span className="inline-block px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase">
                STEP 5
              </span>
              <h3 className="font-extrabold text-white text-base">
                📊 SEE YOUR PROFIT
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                See sales, expenses and your actual profit.
              </p>
            </div>
            <button
              onClick={() => {
                const el = document.getElementById('profit-waterfall-card');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <span>[ View Profit ]</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* 3. THE 5 MAIN SHOP QUESTIONS DASHBOARD CARDS */}
      <div className="space-y-3">
        <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
          <span>📊 Your Shop Numbers Today</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Question 1: How much did I sell? */}
          <div className="glass-panel p-5 rounded-2xl border-2 border-slate-800 hover:border-teal-500/40 transition-all bg-slate-900/90 space-y-3 flex flex-col justify-between shadow-xl">
            <div>
              <div className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                1. 💰 Total Sales
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1.5">
                {formatINR(sales)}
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-1">Total revenue collected</div>
            </div>
            <button
              onClick={() => onNavigateTab('sales')}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-teal-500/20 text-teal-300 font-bold text-xs border border-slate-700 transition-all"
            >
              + Record Sale
            </button>
          </div>

          {/* Question 2: How much profit did I make? */}
          <div className="glass-panel p-5 rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-b from-emerald-950/40 to-slate-900 space-y-3 flex flex-col justify-between shadow-xl">
            <div>
              <div className="text-xs font-extrabold uppercase text-emerald-300 tracking-wider">
                2. 📈 Actual Profit
              </div>
              <div className={`text-2xl sm:text-3xl font-black mt-1.5 ${actualProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatINR(actualProfit)}
              </div>
              <div className="text-[11px] font-bold text-slate-300 mt-1">
                Net Margin: {profitMarginPct}%
              </div>
            </div>
            <div className="text-[11px] font-extrabold text-emerald-300 bg-emerald-500/15 py-1.5 px-2 rounded-lg text-center border border-emerald-500/30">
              In Your Pocket ✅
            </div>
          </div>

          {/* Question 3: What stock do I have? */}
          <div className="glass-panel p-5 rounded-2xl border-2 border-slate-800 hover:border-teal-500/40 transition-all bg-slate-900/90 space-y-3 flex flex-col justify-between shadow-xl">
            <div>
              <div className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                3. 📦 Total Stock Value
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1.5">
                {formatINR(stockValue)}
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-1">
                {summary.total_products_count || 0} Products ({summary.low_stock_count || 0} Low)
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('products')}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-teal-500/20 text-teal-300 font-bold text-xs border border-slate-700 transition-all"
            >
              + Add Product
            </button>
          </div>

          {/* Question 4: Who has Udhaar? */}
          <div className="glass-panel p-5 rounded-2xl border-2 border-slate-800 hover:border-amber-500/40 transition-all bg-slate-900/90 space-y-3 flex flex-col justify-between shadow-xl">
            <div>
              <div className="text-xs font-extrabold uppercase text-amber-300 tracking-wider">
                4. 👥 Customer Udhaar
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1.5">
                {formatINR(udhaarAmount)}
              </div>
              <div className="text-[11px] text-rose-300 font-bold mt-1">
                ⚠️ {formatINR(overdueUdhaar)} overdue
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('receivables')}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-amber-500/20 text-amber-300 font-bold text-xs border border-slate-700 transition-all"
            >
              [ VIEW UDHAR ]
            </button>
          </div>

          {/* Question 5: How much did I spend? */}
          <div className="glass-panel p-5 rounded-2xl border-2 border-slate-800 hover:border-rose-500/40 transition-all bg-slate-900/90 space-y-3 flex flex-col justify-between shadow-xl">
            <div>
              <div className="text-xs font-extrabold uppercase text-rose-300 tracking-wider">
                5. 💸 Shop Expenses
              </div>
              <div className="text-2xl sm:text-3xl font-black text-rose-400 mt-1.5">
                {formatINR(shopExpenses)}
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-1">Rent, Staff, Power & Bills</div>
            </div>
            <button
              onClick={() => onNavigateTab('expenses')}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-300 font-bold text-xs border border-slate-700 transition-all"
            >
              + Add Expense
            </button>
          </div>

        </div>
      </div>

      {/* 4. CLEAR PROFIT CALCULATION WATERFALL CARD */}
      <div id="profit-waterfall-card" className="glass-panel p-6 sm:p-7 rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-br from-slate-950 via-[#0C1220] to-[#0C1220] shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                How Actual Profit Is Calculated
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-bold">
                Formula: Actual Profit = Sales - Product Cost - Shop Expenses
              </p>
            </div>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            Automatic Shop Math
          </span>
        </div>

        {/* 5-Step Formula Calculation Row */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-1">
          
          {/* 1. Sales */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 space-y-1">
            <span className="text-xs font-extrabold uppercase text-slate-400">1. Total Sales</span>
            <div className="text-xl sm:text-2xl font-black text-white">{formatINR(sales)}</div>
            <div className="text-[11px] text-slate-400 font-medium">Customer bills</div>
          </div>

          {/* Minus: Product Cost */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 space-y-1 relative">
            <div className="hidden sm:block absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-800 border border-slate-600 text-slate-300 font-black text-xs text-center leading-6">
              -
            </div>
            <span className="text-xs font-extrabold uppercase text-rose-300">2. Product Cost</span>
            <div className="text-xl sm:text-2xl font-black text-rose-400">{formatINR(productCost)}</div>
            <div className="text-[11px] text-slate-400 font-medium">Purchase cost of items</div>
          </div>

          {/* Equals: Gross Profit */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 space-y-1 relative">
            <div className="hidden sm:block absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-800 border border-slate-600 text-slate-300 font-black text-xs text-center leading-6">
              =
            </div>
            <span className="text-xs font-extrabold uppercase text-teal-300">3. Gross Profit</span>
            <div className="text-xl sm:text-2xl font-black text-teal-300">{formatINR(grossProfit)}</div>
            <div className="text-[11px] text-slate-400 font-medium">Sales minus Product Cost</div>
          </div>

          {/* Minus: Shop Expenses */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 space-y-1 relative">
            <div className="hidden sm:block absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-800 border border-slate-600 text-slate-300 font-black text-xs text-center leading-6">
              -
            </div>
            <span className="text-xs font-extrabold uppercase text-amber-300">4. Shop Expenses</span>
            <div className="text-xl sm:text-2xl font-black text-amber-400">{formatINR(shopExpenses)}</div>
            <div className="text-[11px] text-slate-400 font-medium">Rent + Staff + Power</div>
          </div>

          {/* Equals: ACTUAL PROFIT */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/90 to-slate-900 border-2 border-emerald-500 space-y-1 relative shadow-lg">
            <div className="hidden sm:block absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-emerald-600 text-slate-950 font-black text-xs text-center leading-6 shadow-md">
              =
            </div>
            <span className="text-xs font-extrabold uppercase text-emerald-300">5. Actual Profit</span>
            <div className={`text-xl sm:text-2xl font-black ${actualProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatINR(actualProfit)}
            </div>
            <div className="text-[11px] font-bold text-white">Actual Net Profit</div>
          </div>

        </div>
      </div>

      {/* 5. ⚠️ What Needs Attention Today Section */}
      {attentionItems.length > 0 && (
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border-2 border-amber-500/40 bg-[#0C1220] shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>⚠️ What Needs Attention Today?</span>
            </h3>
            <span className="text-xs text-amber-400 font-bold uppercase">Real Shop Alerts</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {attentionItems.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-900 border border-slate-700/80 space-y-1.5 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="font-extrabold text-white text-sm flex items-center gap-2">
                    {item.type === 'danger' && <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0" />}
                    {item.type === 'warning' && <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />}
                    {item.type === 'info' && <span className="w-2.5 h-2.5 rounded-full bg-teal-400 flex-shrink-0" />}
                    <span>{item.title}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
