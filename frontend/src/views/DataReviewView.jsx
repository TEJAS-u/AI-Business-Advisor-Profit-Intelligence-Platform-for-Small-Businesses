import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Users, 
  Copy, 
  Zap, 
  ArrowRight, 
  FileText, 
  ShieldCheck,
  RefreshCw,
  Layers,
  HelpCircle,
  Check,
  X
} from 'lucide-react';

export default function DataReviewView({ token, onReviewResolved }) {
  const [activeTab, setActiveTab] = useState('entities'); // 'entities' | 'duplicates' | 'conflicts'
  const [entityMatches, setEntityMatches] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    loadAllReviews();
  }, [token]);

  const loadAllReviews = async () => {
    setIsLoading(true);
    try {
      const [entRes, dupRes, confRes] = await Promise.all([
        fetch('/api/consolidation/entity-matches', { headers }),
        fetch('/api/consolidation/duplicates', { headers }),
        fetch('/api/consolidation/conflicts', { headers })
      ]);
      if (entRes.ok) setEntityMatches((await entRes.json()).entity_matches || []);
      if (dupRes.ok) setDuplicates((await dupRes.json()).duplicates || []);
      if (confRes.ok) setConflicts((await confRes.json()).conflicts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveEntity = async (id, action) => {
    try {
      const res = await fetch(`/api/consolidation/entity-matches/${id}/resolve`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        setMsg({ type: 'success', text: action === 'CONFIRMED' ? 'Names combined successfully!' : 'Kept as separate customer.' });
        setTimeout(() => setMsg(null), 3000);
        loadAllReviews();
        if (onReviewResolved) onReviewResolved();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveDuplicate = async (id, action) => {
    try {
      const res = await fetch(`/api/consolidation/duplicates/${id}/resolve`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        setMsg({ type: 'success', text: action === 'MERGE' ? 'Duplicate bills merged into 1 clean record.' : 'Both records kept.' });
        setTimeout(() => setMsg(null), 3000);
        loadAllReviews();
        if (onReviewResolved) onReviewResolved();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveConflict = async (id, choice) => {
    try {
      const res = await fetch(`/api/consolidation/conflicts/${id}/resolve`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ choice })
      });
      if (res.ok) {
        setMsg({ type: 'success', text: 'Difference resolved.' });
        setTimeout(() => setMsg(null), 3000);
        loadAllReviews();
        if (onReviewResolved) onReviewResolved();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const pendingEntities = entityMatches.filter(e => e.status === 'PENDING');
  const pendingDuplicates = duplicates.filter(d => d.status === 'PENDING');
  const pendingConflicts = conflicts.filter(c => c.status === 'PENDING');

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-slate-900 border-2 border-amber-500/40 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-amber-400 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Step 2: Check & Confirm Differences</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Check & Match Differences
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Quickly confirm whether similar customer names are the same person and remove duplicate bills.
          </p>
        </div>

        {msg && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-emerald-500/25 border border-emerald-500/50 text-emerald-200 text-sm font-black animate-in fade-in shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{msg.text}</span>
          </div>
        )}
      </div>

      {/* 3 Large Accessible Sub-Tabs */}
      <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800 flex-wrap">
        <button
          onClick={() => setActiveTab('entities')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black transition-all ${
            activeTab === 'entities' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30' : 'text-slate-300 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Customer Name Matches ({pendingEntities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('duplicates')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black transition-all ${
            activeTab === 'duplicates' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30' : 'text-slate-300 hover:text-white'
          }`}
        >
          <Copy className="w-4 h-4" />
          <span>Duplicate Bills ({pendingDuplicates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('conflicts')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black transition-all ${
            activeTab === 'conflicts' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30' : 'text-slate-300 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Amount Differences ({pendingConflicts.length})</span>
        </button>
      </div>

      {/* 1. ENTITY MATCHES TAB */}
      {activeTab === 'entities' && (
        <div className="space-y-4">
          <div className="text-xs sm:text-sm text-slate-400 px-1">
            Is the name on the left the same customer as on the right? Click <strong>"Yes, Combine"</strong> to merge their accounts.
          </div>

          {entityMatches.map((m) => (
            <div 
              key={m.id}
              className={`glass-panel p-6 rounded-3xl border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                m.status === 'PENDING' ? 'border-purple-500/50 bg-slate-900 shadow-xl' : 'border-slate-800 opacity-60'
              }`}
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-black uppercase px-3 py-1 rounded-lg bg-purple-500/25 text-purple-300 border border-purple-500/40">
                    {m.entity_type} Name Match
                  </span>
                  <span className="text-slate-400">Source: <strong className="text-slate-200">{m.source_file}</strong></span>
                  <span className="text-emerald-400 font-extrabold">Similarity: {(m.confidence_score * 100).toFixed(0)}%</span>
                </div>

                <div className="flex items-center gap-3 pt-2 text-base sm:text-lg flex-wrap">
                  <div className="font-extrabold text-rose-300 bg-rose-950/40 border border-rose-500/30 px-3.5 py-1.5 rounded-xl">
                    "{m.raw_name}"
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <div className="font-black text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl">
                    "{m.matched_canonical_name}"
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
                  AI noticed these two names look like the same person/shop.
                </p>
              </div>

              {m.status === 'PENDING' ? (
                <div className="flex items-center gap-3 self-end md:self-center">
                  <button
                    onClick={() => handleResolveEntity(m.id, 'CONFIRMED')}
                    className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-950/60 active:scale-95 flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>✅ Yes, Same Person (Combine)</span>
                  </button>
                  <button
                    onClick={() => handleResolveEntity(m.id, 'REJECTED')}
                    className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition-colors"
                  >
                    ❌ No, Keep Separate
                  </button>
                </div>
              ) : (
                <span className="text-sm font-black text-slate-300 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800">
                  Status: {m.status}
                </span>
              )}
            </div>
          ))}

          {entityMatches.length === 0 && (
            <div className="glass-panel p-12 rounded-3xl border-2 border-slate-800 text-center text-sm text-slate-400">
              ✓ No customer name conflicts found. All customer and supplier names are clean.
            </div>
          )}
        </div>
      )}

      {/* 2. DUPLICATES TAB */}
      {activeTab === 'duplicates' && (
        <div className="space-y-4">
          <div className="text-xs sm:text-sm text-slate-400 px-1">
            AI found these bills appearing more than once. Click <strong>"Combine / Keep 1 Copy"</strong> to avoid double-counting sales.
          </div>

          {duplicates.map((d) => (
            <div 
              key={d.id}
              className={`glass-panel p-6 rounded-3xl border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                d.status === 'PENDING' ? 'border-amber-500/50 bg-slate-900 shadow-xl' : 'border-slate-800 opacity-60'
              }`}
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-black uppercase px-3 py-1 rounded-lg bg-amber-500/25 text-amber-300 border border-amber-500/40">
                    {d.record_type} Duplicate
                  </span>
                  <span className="text-emerald-400 font-extrabold">Confidence: {(d.confidence_score * 100).toFixed(0)}%</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs sm:text-sm">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-xs">Appears in File A:</span>
                    <span className="text-slate-100 font-bold">{d.record_a_source}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-xs">Appears in File B:</span>
                    <span className="text-slate-100 font-bold">{d.record_b_source}</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 font-bold pt-1">
                  <strong>Why flagged:</strong> {d.match_reason}
                </p>
              </div>

              {d.status === 'PENDING' ? (
                <div className="flex items-center gap-2.5 self-end md:self-center">
                  <button
                    onClick={() => handleResolveDuplicate(d.id, 'MERGE')}
                    className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl active:scale-95"
                  >
                    ✅ Combine (Keep 1 Copy)
                  </button>
                  <button
                    onClick={() => handleResolveDuplicate(d.id, 'KEPT_BOTH')}
                    className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm"
                  >
                    Keep Both Copies
                  </button>
                </div>
              ) : (
                <span className="text-sm font-black text-slate-300 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800">
                  Status: {d.status}
                </span>
              )}
            </div>
          ))}

          {duplicates.length === 0 && (
            <div className="glass-panel p-12 rounded-3xl border-2 border-slate-800 text-center text-sm text-slate-400">
              ✓ No duplicate bills detected.
            </div>
          )}
        </div>
      )}

      {/* 3. CONFLICTS TAB */}
      {activeTab === 'conflicts' && (
        <div className="space-y-4">
          <div className="text-xs sm:text-sm text-slate-400 px-1">
            Differences between billed amount and bank deposit receipt:
          </div>

          {conflicts.map((c) => (
            <div 
              key={c.id}
              className={`glass-panel p-6 rounded-3xl border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                c.status === 'PENDING' ? 'border-rose-500/50 bg-slate-900 shadow-xl' : 'border-slate-800 opacity-60'
              }`}
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-black uppercase px-3 py-1 rounded-lg bg-rose-500/25 text-rose-300 border border-rose-500/40">
                    Amount Difference
                  </span>
                  <span className="text-slate-200 font-bold">Party: {c.entity_name}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs sm:text-sm">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-xs">{c.source_a}:</span>
                    <span className="text-emerald-400 font-black text-base">{c.value_a}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-xs">{c.source_b}:</span>
                    <span className="text-rose-400 font-black text-base">{c.value_b}</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-amber-300 font-bold pt-1 leading-relaxed">
                  {c.description}
                </p>
              </div>

              {c.status === 'PENDING' ? (
                <div className="flex items-center gap-2.5 self-end md:self-center">
                  <button
                    onClick={() => handleResolveConflict(c.id, 'SOURCE_A')}
                    className="px-4 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-sm shadow-xl active:scale-95"
                  >
                    Accept {c.value_a}
                  </button>
                  <button
                    onClick={() => handleResolveConflict(c.id, 'SOURCE_B')}
                    className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm"
                  >
                    Accept {c.value_b}
                  </button>
                </div>
              ) : (
                <span className="text-sm font-black text-slate-300 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800">
                  Status: {c.status}
                </span>
              )}
            </div>
          ))}

          {conflicts.length === 0 && (
            <div className="glass-panel p-12 rounded-3xl border-2 border-slate-800 text-center text-sm text-slate-400">
              ✓ No amount discrepancies detected between invoices and bank deposits.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
