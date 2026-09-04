import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  RefreshCw, 
  Database 
} from 'lucide-react';

export default function DataUploadView({ onLoadDemo, isDemoLoading, onUploadSuccess }) {
  const [selectedType, setSelectedType] = useState('sales');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileTypes = [
    { id: 'sales', name: 'Sales Transactions', desc: 'Invoices, quantities, unit cost, price, revenue' },
    { id: 'expenses', name: 'Operating Expenses', desc: 'Salaries, rent, freight, marketing, utilities' },
    { id: 'products', name: 'Product Catalog', desc: 'SKUs, categories, unit cost, retail price, margins' },
    { id: 'customers', name: 'Customer Accounts', desc: 'Dealers, contractors, credit limits' },
    { id: 'inventory', name: 'Inventory & Stock', desc: 'Stock on hand, unit cost, days in stock' },
    { id: 'receivables', name: 'Accounts Receivable', desc: 'Due dates, pending amounts, days overdue' },
  ];

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append('file_type', selectedType);
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");

      setStatus({ type: 'success', msg: data.message || `Successfully processed ${selectedType} dataset.` });
      setFile(null);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadSample = (type) => {
    window.open(`/api/sample-csv/${type}`, '_blank');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/30 via-slate-900 to-slate-900 border border-blue-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
            <Database className="w-4 h-4 text-blue-400" />
            <span>Data Ingestion Pipeline</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Data Upload & CSV/Excel Ingestion
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Upload CSV or Excel files containing sales, expenses, product lists, inventory, and receivables for deterministic backend processing.
          </p>
        </div>

        {/* 1-Click Demo Data Button */}
        <button
          onClick={onLoadDemo}
          disabled={isDemoLoading}
          className="flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-4 py-3 rounded-xl transition-all shadow-lg shadow-emerald-950/40 active:scale-95 disabled:opacity-50 whitespace-nowrap"
        >
          <RefreshCw className={`w-4 h-4 ${isDemoLoading ? 'animate-spin' : ''}`} />
          <span>{isDemoLoading ? 'Ingesting Data...' : 'Load Realistic Demo Data (1-Click)'}</span>
        </button>
      </div>

      {/* Upload Box + Sample Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Upload Form */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-emerald-400" />
            Upload File (.csv or .xlsx)
          </h2>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-2 block">
              1. Select Data Domain:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {fileTypes.map((ft) => (
                <button
                  key={ft.id}
                  type="button"
                  onClick={() => setSelectedType(ft.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedType === ft.id
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-100">{ft.name}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{ft.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-2 block">
                2. Choose CSV/Excel file:
              </label>
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl cursor-pointer bg-slate-950/40 hover:bg-slate-900/40 transition-all group">
                <FileSpreadsheet className="w-8 h-8 text-slate-500 group-hover:text-emerald-400 transition-colors mb-2" />
                <span className="text-xs font-semibold text-slate-200">
                  {file ? file.name : "Click to select or drag file here"}
                </span>
                <span className="text-[11px] text-slate-500 mt-1">Supports CSV, XLSX, XLS</span>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>

            {status && (
              <div className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
                status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                {status.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{status.msg}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => handleDownloadSample(selectedType)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download {selectedType} sample CSV</span>
              </button>

              <button
                type="submit"
                disabled={!file || isUploading}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-md active:scale-95"
              >
                {isUploading ? 'Processing in Python...' : 'Upload & Process Data'}
              </button>
            </div>
          </form>
        </div>

        {/* Download Sample CSV Templates */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <Download className="w-4 h-4 text-emerald-400" />
              Download Sample CSV Templates
            </h3>
            <p className="text-xs text-slate-400">
              Download standard schemas preloaded with realistic Indian SME numbers:
            </p>
          </div>

          <div className="space-y-2">
            {fileTypes.map((ft) => (
              <div key={ft.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold text-slate-200">{ft.name}</span>
                </div>
                <button
                  onClick={() => handleDownloadSample(ft.id)}
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20"
                >
                  Download
                </button>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
            <strong>Backend Analytics Note:</strong> All math is computed strictly deterministically with Python/Pandas. No numbers are invented or calculated by LLMs.
          </div>
        </div>

      </div>

    </div>
  );
}
