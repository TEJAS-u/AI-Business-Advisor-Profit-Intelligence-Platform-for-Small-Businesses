import React, { useState, useEffect } from 'react';
import { 
  Database, 
  DollarSign, 
  TrendingDown, 
  FileText, 
  Package, 
  Building2, 
  Users, 
  Layers, 
  ExternalLink,
  Search,
  Filter,
  ShieldCheck
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function UnifiedDataView({ token, onInspectLineage }) {
  const [activeTab, setActiveTab] = useState('sales');
  const [data, setData] = useState({
    sales: [],
    expenses: [],
    invoices: [],
    inventory: [],
    transactions: [],
    entities: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const headers = {
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    loadUnifiedData();
  }, [token]);

  const loadUnifiedData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/consolidation/unified-data', { headers });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSales = data.sales.filter(s => 
    s.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.invoice_num?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExpenses = data.expenses.filter(e => 
    e.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInvoices = data.invoices.filter(i => 
    i.invoice_num?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.party_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-teal-950/50 via-slate-900 to-slate-900 border-2 border-teal-500/30 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-teal-400 mb-1">
            <Database className="w-4 h-4 text-teal-400" />
            <span>Step 3: All in One Place</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            My Combined Shop Data
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-1 max-w-2xl leading-relaxed">
            All your sales, expense bills, and customer records organized together. Click the source tag on any row to see which bill it came from.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/90 border-2 border-teal-500/30 flex items-center gap-3 self-start md:self-center">
          <ShieldCheck className="w-6 h-6 text-teal-400 flex-shrink-0" />
          <div>
            <span className="font-extrabold text-white text-sm block">100% Verified Data</span>
            <span className="text-xs text-slate-300">Linked to your uploaded bills</span>
          </div>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 p-2.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('sales')}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-black transition-all whitespace-nowrap ${
              activeTab === 'sales' ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/30' : 'text-slate-300 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Sales ({data.sales.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-black transition-all whitespace-nowrap ${
              activeTab === 'expenses' ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/30' : 'text-slate-300 hover:text-white'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            <span>Expenses ({data.expenses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-black transition-all whitespace-nowrap ${
              activeTab === 'invoices' ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/30' : 'text-slate-300 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Invoices ({data.invoices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('entities')}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-black transition-all whitespace-nowrap ${
              activeTab === 'entities' ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/30' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customers & Suppliers ({data.entities.length})</span>
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search customer, item or bill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border-2 border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* 1. SALES TABLE */}
      {activeTab === 'sales' && (
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border-2 border-slate-800 space-y-4 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 text-xs font-extrabold uppercase">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Bill / Inv #</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Product Name</th>
                  <th className="pb-3">Qty</th>
                  <th className="pb-3">Sale Total</th>
                  <th className="pb-3">Profit</th>
                  <th className="pb-3 text-right">Bill Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-900/50">
                    <td className="py-3.5 text-slate-300 font-mono text-xs">{s.sale_date}</td>
                    <td className="py-3.5 font-bold text-slate-200">{s.invoice_num || "-"}</td>
                    <td className="py-3.5 font-bold text-white">{s.customer_name}</td>
                    <td className="py-3.5 text-slate-200">{s.product_name}</td>
                    <td className="py-3.5 text-slate-300 font-bold">{s.quantity}</td>
                    <td className="py-3.5 font-black text-emerald-400 text-base">{formatINR(s.total_revenue)}</td>
                    <td className="py-3.5 font-extrabold text-teal-300">{formatINR(s.profit)}</td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => onInspectLineage && onInspectLineage(s)}
                        className="px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-200 text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <span>From: {s.source_file} : R{s.source_row}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSales.length === 0 && (
              <div className="py-10 text-center text-sm text-slate-400">No sales records found.</div>
            )}
          </div>
        </div>
      )}

      {/* 2. EXPENSES TABLE */}
      {activeTab === 'expenses' && (
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border-2 border-slate-800 space-y-4 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 text-xs font-extrabold uppercase">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Expense Head</th>
                  <th className="pb-3">Paid To / Vendor</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Notes</th>
                  <th className="pb-3 text-right">Bill Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredExpenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-900/50">
                    <td className="py-3.5 text-slate-300 font-mono text-xs">{e.expense_date}</td>
                    <td className="py-3.5 font-black text-white">{e.category}</td>
                    <td className="py-3.5 text-slate-200 font-medium">{e.vendor_name || "-"}</td>
                    <td className="py-3.5 font-black text-rose-400 text-base">{formatINR(e.amount)}</td>
                    <td className="py-3.5 text-slate-300">{e.description || "-"}</td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => onInspectLineage && onInspectLineage(e)}
                        className="px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-200 text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <span>From: {e.source_file} : R{e.source_row}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredExpenses.length === 0 && (
              <div className="py-10 text-center text-sm text-slate-400">No expense records found.</div>
            )}
          </div>
        </div>
      )}

      {/* 3. INVOICES TABLE */}
      {activeTab === 'invoices' && (
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border-2 border-slate-800 space-y-4 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 text-xs font-extrabold uppercase">
                  <th className="pb-3">Bill #</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Customer / Party</th>
                  <th className="pb-3">Bill Total</th>
                  <th className="pb-3">Pending Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Bill Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredInvoices.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-900/50">
                    <td className="py-3.5 font-bold text-white">{i.invoice_num}</td>
                    <td className="py-3.5 text-slate-300 font-mono text-xs">{i.invoice_date}</td>
                    <td className="py-3.5 text-slate-100 font-bold">{i.party_name}</td>
                    <td className="py-3.5 font-bold text-slate-200">{formatINR(i.total_amount)}</td>
                    <td className="py-3.5 font-black text-amber-400 text-base">{formatINR(i.balance_due)}</td>
                    <td className="py-3.5">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {i.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => onInspectLineage && onInspectLineage(i)}
                        className="px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-200 text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <span>From: {i.source_file} : R{i.source_row}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredInvoices.length === 0 && (
              <div className="py-10 text-center text-sm text-slate-400">No invoices found.</div>
            )}
          </div>
        </div>
      )}

      {/* 4. CUSTOMERS & SUPPLIERS DIRECTORY */}
      {activeTab === 'entities' && (
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border-2 border-slate-800 space-y-4 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 text-xs font-extrabold uppercase">
                  <th className="pb-3">Customer / Supplier Name</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Combined Names & Aliases</th>
                  <th className="pb-3">Phone / Contact</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.entities.map((ent) => {
                  const aliases = JSON.parse(ent.aliases_json || "[]");
                  return (
                    <tr key={ent.id} className="hover:bg-slate-900/50">
                      <td className="py-3.5 font-black text-white text-base">{ent.canonical_name}</td>
                      <td className="py-3.5">
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          {ent.entity_type}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-300">
                        {aliases.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {aliases.map((a, i) => (
                              <span key={i} className="px-2.5 py-0.5 rounded-lg bg-slate-950 text-slate-300 border border-slate-700 text-xs font-medium">
                                {a}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500">1 Name</span>
                        )}
                      </td>
                      <td className="py-3.5 text-slate-300 font-mono text-xs">{ent.contact_phone || ent.contact_email || "-"}</td>
                      <td className="py-3.5 text-right">
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          ✓ Combined
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {data.entities.length === 0 && (
              <div className="py-10 text-center text-sm text-slate-400">No customer records added yet.</div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
