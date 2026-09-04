import React from 'react';
import { 
  TrendingUp, 
  Building2, 
  User, 
  LogOut, 
  ShieldCheck, 
  Sun
} from 'lucide-react';

export default function Header({ 
  user,
  healthScore, 
  onLogout,
  onOpenDailyBrief
}) {
  const score = healthScore?.overall_score ?? 0;

  return (
    <header className="sticky top-0 z-30 w-full bg-[#070B14]/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3.5 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        
        {/* Logo & Shopkeeper Tagline */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-400 via-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-500/25 ring-2 ring-teal-400/30 flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-slate-950 font-black" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-black text-2xl tracking-tight text-white flex items-center gap-2">
                AI CFO
                <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  Shop Assistant
                </span>
              </span>
            </div>
            <p className="text-sm text-slate-300 font-medium">
              Keep sales, stock, expenses & Udhaar in one place. <strong className="text-teal-400 font-bold">Know your actual profit.</strong>
            </p>
          </div>
        </div>

        {/* Action Controls & User Badge */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          
          {/* Daily Morning Brief Button */}
          <button
            onClick={onOpenDailyBrief}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-sm font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95"
            title="Open Morning Business Briefing"
          >
            <Sun className="w-4 h-4 text-amber-400" />
            <span>Daily Brief</span>
          </button>

          {/* Shop Health Score Pill */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-teal-500/40 bg-teal-500/15 text-teal-300 text-sm font-black shadow-inner">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Health: {score}/100</span>
          </div>

          {/* User Shop Greeting Badge */}
          <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-700 px-3.5 py-2 rounded-xl text-sm">
            <Building2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
            <div>
              <div className="font-bold text-white leading-tight">
                {user?.shop_name || "My Shop"}
              </div>
              <div className="text-xs text-slate-400 leading-tight">
                Namaste, {user?.full_name || "Shopkeeper"} 👋
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}
