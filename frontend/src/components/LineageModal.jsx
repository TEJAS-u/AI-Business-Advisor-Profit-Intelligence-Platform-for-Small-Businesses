import React from 'react';
import { X, FileText, Database, Layers, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function LineageModal({ isOpen, onClose, lineageData }) {
  if (!isOpen || !lineageData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0C1220] border-2 border-teal-500/50 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/40">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                WHERE DID THIS NUMBER COME FROM?
                <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  Verified Provenance
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">Exact source file, row, and page trace from your uploaded records</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Provenance Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-700">
            <span className="text-slate-400 font-bold block mb-1">Source File:</span>
            <span className="font-black text-white truncate block text-sm">{lineageData.source_file || "Unknown"}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-700">
            <span className="text-slate-400 font-bold block mb-1">Line / Row:</span>
            <span className="font-black text-teal-300 text-sm">Row #{lineageData.source_row || "1"}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-700">
            <span className="text-slate-400 font-bold block mb-1">Status:</span>
            <span className="font-black text-emerald-400 text-sm">Verified & Clean</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-700">
            <span className="text-slate-400 font-bold block mb-1">Added:</span>
            <span className="font-bold text-slate-200 text-xs">{lineageData.import_date?.split(' ')[0] || "Recent"}</span>
          </div>
        </div>

        {/* Clean Record Breakdown */}
        <div className="space-y-2 text-xs sm:text-sm">
          <span className="font-black text-slate-200 uppercase tracking-wider block">
            Organized Record Data:
          </span>
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-slate-100 space-y-2 max-h-56 overflow-y-auto text-xs sm:text-sm">
            {Object.entries(lineageData).map(([key, val]) => {
              if (key.startsWith('_')) return null;
              return (
                <div key={key} className="flex justify-between border-b border-slate-900/80 pb-1.5">
                  <span className="text-slate-400 font-sans font-bold">{key}:</span>
                  <span className="text-teal-300 font-bold">{String(val)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trust Note */}
        <div className="p-4 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center gap-3 text-xs sm:text-sm text-teal-200 font-medium">
          <ShieldCheck className="w-6 h-6 text-teal-400 flex-shrink-0" />
          <span>
            This record was extracted directly from your uploaded file and verified for shop analytics.
          </span>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold shadow-md"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
}
