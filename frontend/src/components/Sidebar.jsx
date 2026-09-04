import React from 'react';
import { 
  LayoutDashboard, 
  Database,
  Package,
  DollarSign,
  Users,
  TrendingDown,
  Bot, 
  Settings
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, pendingReviewsCount = 0 }) {
  const navItems = [
    {
      id: 'dashboard',
      label: '🏠 Home',
      icon: LayoutDashboard,
      desc: 'Sales, Profit & Shop Overview'
    },
    {
      id: 'datahub',
      label: '📤 Add / Upload Bills',
      icon: Database,
      desc: 'Upload Excel, Bills & Bank CSV'
    },
    {
      id: 'products',
      label: '🛒 Products & Stock',
      icon: Package,
      desc: 'Product Catalog & Stock Status'
    },
    {
      id: 'sales',
      label: '💰 Sales',
      icon: DollarSign,
      desc: 'Record Sales & Daily Bills'
    },
    {
      id: 'receivables',
      label: '👥 Customers / Udhaar',
      icon: Users,
      desc: 'Track Customer Payments & Dues'
    },
    {
      id: 'expenses',
      label: '💸 Expenses',
      icon: TrendingDown,
      desc: 'Record Shop Expenses & Rent'
    },
    {
      id: 'advisor',
      label: '🤖 Ask AI Advisor',
      icon: Bot,
      desc: 'Ask About Sales, Profit & Dues'
    },
    {
      id: 'settings',
      label: '⚙️ Shop Details',
      icon: Settings,
      desc: 'Shop Name, Currency & Profile'
    }
  ];

  return (
    <aside className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-4 py-2">
      {/* Navigation Links */}
      <nav className="flex flex-col gap-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || 
            (activeTab === 'dataentry' && (item.id === 'sales' || item.id === 'products' || item.id === 'expenses' || item.id === 'receivables'));

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`group flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-black transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-teal-500/25 to-teal-500/10 text-white border-2 border-teal-500/50 shadow-lg shadow-teal-950/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className={`p-2.5 rounded-xl transition-colors ${isActive ? 'bg-teal-500 text-slate-950 font-black shadow-md' : 'bg-slate-900 text-slate-400 group-hover:text-slate-200 border border-slate-800'}`}>
                  <Icon className="w-5 h-5 flex-shrink-0" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-black text-slate-100 leading-tight">{item.label}</div>
                  <div className="text-xs text-slate-400 font-medium mt-0.5">{item.desc}</div>
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Easy Workflow Guide Box */}
      <div className="mt-auto p-4.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-2">
        <div className="font-extrabold text-teal-400 text-xs uppercase tracking-wider">
          Quick Shop Flow:
        </div>
        <div className="text-xs text-slate-300 space-y-1.5 font-medium">
          <div>1. 🛒 Save Products once</div>
          <div>2. 💰 Record Daily Sales</div>
          <div>3. 👥 Track Customer Udhaar</div>
          <div>4. 💸 Record Shop Expenses</div>
          <div>5. 📊 See Actual Net Profit</div>
        </div>
      </div>
    </aside>
  );
}
