import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Sparkles,
  Zap,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

export default function ActionPlanView({ onOpenReminder, onNavigateTab }) {
  const [actions, setActions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/action-plan');
      if (res.ok) {
        const data = await res.json();
        setActions(data.actions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (actId, newStatus) => {
    try {
      await fetch(`/api/action-plan/${actId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchActions();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-300">

      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
            <CheckSquare className="w-4 h-4 text-blue-400" />
            <span>Insight to Execution Pipeline</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Today's AI Action Plan
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Prioritized operational checklist converting financial leak diagnostics into concrete execution steps with quantified financial impact.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/80 border border-blue-500/30 flex flex-col items-end justify-center min-w-[180px]">
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Active Tasks</span>
          <span className="text-2xl font-black text-white mt-0.5">{actions.length} Actions</span>
          <span className="text-[11px] text-slate-400">Ranked by Confidence & ROI</span>
        </div>
      </div>

      {/* Action Plan List */}
      <div className="space-y-4">
        {actions.map((act) => (
          <div
            key={act.id}
            className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
          >
            {/* Left Info */}
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center text-xs">
                  #{act.priority}
                </span>
                <h3 className="text-sm font-extrabold text-white">
                  {act.title}
                </h3>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${act.urgency === 'HIGH' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                  {act.urgency} Urgency
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  Confidence: <strong className="text-emerald-400">{act.confidence}</strong>
                </span>
              </div>

              {/* WHY & IMPACT */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs pt-1">
                <div className="md:col-span-8 p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-slate-300 leading-relaxed">
                  <strong className="text-slate-200 block mb-0.5">Why:</strong>
                  {act.why}
                </div>
                <div className="md:col-span-4 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 flex flex-col justify-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-400">Expected Impact:</span>
                  <span className="text-sm font-black mt-0.5">{act.expected_impact}</span>
                </div>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-end lg:self-center">

              {/* Action Generator trigger */}
              {act.action_type === 'Generate Reminder' && (
                <button
                  onClick={onOpenReminder}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 whitespace-nowrap"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Generate Payment Notice</span>
                </button>
              )}

              {/* Status Selector */}
              <select
                value={act.status || 'Pending'}
                onChange={(e) => handleStatusChange(act.id, e.target.value)}
                className={`text-xs font-bold px-3 py-2 rounded-xl border appearance-none cursor-pointer focus:outline-none transition-colors ${act.status === 'Completed'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : act.status === 'In Progress'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-900 text-slate-300 border-slate-700'
                  }`}
              >
                <option value="Pending">Status: Pending</option>
                <option value="In Progress">Status: In Progress</option>
                <option value="Completed">Status: Completed</option>
              </select>

            </div>

          </div>
        ))}
      </div>

    </div>
  );
}

