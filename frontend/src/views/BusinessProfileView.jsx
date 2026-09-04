import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Users, 
  Briefcase, 
  DollarSign, 
  Save, 
  CheckCircle2, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function BusinessProfileView({ profile, onUpdateProfile }) {
  const [formData, setFormData] = useState({
    business_name: profile?.business_name || '',
    business_type: profile?.business_type || '',
    location: profile?.location || '',
    employees: profile?.employees || 10,
    annual_turnover_target: profile?.annual_turnover_target || 10000000,
    currency_symbol: profile?.currency_symbol || '₹',
    currency_code: profile?.currency_code || 'INR'
  });
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setIsSaved(false);

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsSaved(true);
        if (onUpdateProfile) onUpdateProfile(formData);
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (err) {
      console.error("Profile save error", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-[#0F172A] border border-slate-800 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Business Profile & Operating Context</h1>
            <p className="text-xs text-slate-400 mt-0.5">Defines SME industry parameters, currency, and turnover targets</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl bg-[#0F172A]/80">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Business Name */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-2">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              Business / Entity Name
            </label>
            <input
              type="text"
              required
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              placeholder="e.g. Apex Distribution Pvt Ltd"
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all"
            />
          </div>

          {/* Business Type & Location Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-2">
                <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                Business Type / Industry
              </label>
              <input
                type="text"
                required
                value={formData.business_type}
                onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                placeholder="e.g. Electronics & Electricals Wholesaler"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                Headquarters / Location
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Bangalore, Karnataka, India"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all"
              />
            </div>
          </div>

          {/* Employees & Annual Target Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-2">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                Number of Employees
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.employees}
                onChange={(e) => setFormData({ ...formData, employees: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-2">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Annual Turnover Target (INR ₹)
              </label>
              <input
                type="number"
                min="100000"
                value={formData.annual_turnover_target}
                onChange={(e) => setFormData({ ...formData, annual_turnover_target: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Formatted: {formatINR(formData.annual_turnover_target)}
              </span>
            </div>
          </div>

          {/* Saved Notification */}
          {isSaved && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Business profile updated and financial thresholds recomputed successfully.</span>
            </div>
          )}

          {/* Save Button */}
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-950/40 active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Business Profile'}</span>
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}

