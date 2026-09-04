import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { formatCompactINR, formatINR, formatPct } from '../utils/formatters';

const PIE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#14B8A6'];

export function RevenueTrendChart({ trends }) {
  if (!trends || trends.length === 0) return null;

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100">Revenue, Expense & Profit Trend</h3>
          <p className="text-xs text-slate-400">Monthly progression (Past 6 Months)</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Revenue</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Expenses</span>
          </div>
          <div className="flex items-center gap-1.5 text-teal-300">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
            <span>Net Profit</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
              </linearGradient>
              <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0}/>
              </linearGradient>
              <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey="month" stroke="#64748B" tick={{ fontSize: 11 }} />
            <YAxis stroke="#64748B" tickFormatter={formatCompactINR} tick={{ fontSize: 11 }} />
            <Tooltip 
              formatter={(value) => [formatINR(value), '']}
              contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
            />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#revGrad)" />
            <Area type="monotone" dataKey="total_expenses" name="Total Expenses" stroke="#F43F5E" strokeWidth={2} fillOpacity={1} fill="url(#expGrad)" />
            <Area type="monotone" dataKey="net_profit" name="Net Profit" stroke="#06B6D4" strokeWidth={2} fillOpacity={1} fill="url(#profitGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ProductProfitabilityChart({ products }) {
  if (!products || !products.product_ranking) return null;

  const data = products.product_ranking.map(p => ({
    name: p.product_name.length > 20 ? p.product_name.substring(0, 18) + '...' : p.product_name,
    profit: p.gross_profit,
    revenue: p.total_revenue,
    margin_pct: p.margin_pct
  }));

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100">Product Profitability Breakdown</h3>
          <p className="text-xs text-slate-400">Gross profit contribution per product line</p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey="name" stroke="#64748B" angle={-15} textAnchor="end" tick={{ fontSize: 10 }} />
            <YAxis stroke="#64748B" tickFormatter={formatCompactINR} tick={{ fontSize: 11 }} />
            <Tooltip 
              formatter={(value, name) => [name === 'profit' ? formatINR(value) : formatINR(value), name === 'profit' ? 'Gross Profit' : 'Revenue']}
              contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
            />
            <Bar dataKey="profit" name="Gross Profit" fill="#10B981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ExpenseDonutChart({ breakdown }) {
  if (!breakdown || breakdown.length === 0) return null;

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-slate-100">OpEx Cost Distribution</h3>
        <p className="text-xs text-slate-400">Operating overhead by category</p>
      </div>

      <div className="h-56 w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={breakdown}
              dataKey="amount"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
            >
              {breakdown.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [formatINR(value), 'Amount']}
              contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend list */}
      <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-800 text-[11px]">
        {breakdown.slice(0, 4).map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
            <span className="text-slate-400 truncate">{item.category}:</span>
            <span className="font-semibold text-slate-200">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReceivablesAgingChart({ receivables }) {
  if (!receivables || !receivables.aging_buckets) return null;

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100">Receivables Aging & Credit Risk</h3>
          <p className="text-xs text-slate-400">Outstanding amounts by days overdue</p>
        </div>
        <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
          {receivables.overdue_pct}% Overdue
        </span>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={receivables.aging_buckets} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey="bucket" stroke="#64748B" tick={{ fontSize: 10 }} />
            <YAxis stroke="#64748B" tickFormatter={formatCompactINR} tick={{ fontSize: 11 }} />
            <Tooltip 
              formatter={(value) => [formatINR(value), 'Pending Amount']}
              contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
            />
            <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
              {receivables.aging_buckets.map((entry, index) => {
                const color = index === 0 ? '#10B981' : index === 1 ? '#F59E0B' : '#F43F5E';
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

