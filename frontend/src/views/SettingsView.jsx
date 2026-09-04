import React, { useState } from 'react';
import { Settings, Building2, Save, MapPin, Users, CheckCircle2, User } from 'lucide-react';

export default function SettingsView({ user, token, onUpdateProfile }) {
  const [shopName, setShopName] = useState(user?.shop_name || 'My Shop');
  const [shopType, setShopType] = useState(user?.shop_type || 'Retail & Wholesale');
  const [location, setLocation] = useState(user?.location || 'India');
  const [employees, setEmployees] = useState(user?.employees || 2);
  const [currency, setCurrency] = useState(user?.currency || '₹');
  const [isSaved, setIsSaved] = useState(false);

  return (
    <div className="space-y-7 animate-in fade-in duration-300 max-w-4xl">
      
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-[#0F172A] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
            <Settings className="w-4 h-4 text-emerald-400" />
            <span>Shop Account & Configuration</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Shop Settings
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Manage your shop identity, business category, operating currency, and team size.
          </p>
        </div>
      </div>

      {/* Account Info Box */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-400" />
          Registered Account
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-500 font-semibold block mb-0.5">Owner Name:</span>
            <span className="text-sm font-bold text-white">{user?.full_name || "Shop Owner"}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-500 font-semibold block mb-0.5">Login Email:</span>
            <span className="text-sm font-bold text-white">{user?.email || "owner@myshop.com"}</span>
          </div>
        </div>
      </div>

      {/* Shop Profile Box */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-400" />
          Shop Entity Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-500 font-semibold block mb-0.5">Shop / Business Name:</span>
            <span className="text-sm font-bold text-white">{user?.shop_name || "My Shop"}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-500 font-semibold block mb-0.5">Operating Sector:</span>
            <span className="text-sm font-bold text-white">{user?.shop_type || "Retail & Wholesale"}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-500 font-semibold block mb-0.5">Location / City:</span>
            <span className="text-sm font-bold text-white">{user?.location || "India"}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-500 font-semibold block mb-0.5">Base Currency:</span>
            <span className="text-sm font-bold text-emerald-400">{user?.currency || "₹"}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
