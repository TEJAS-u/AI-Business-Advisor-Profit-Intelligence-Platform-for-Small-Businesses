"""
Dynamic Profit Leak Radar for Consolidated Business Datasets
Automatically scans consolidated SSOT transactions, products, expenses, and debtor ledger.
Returns quantified leaks:
- PROBLEM
- WHY IT HAPPENED
- FINANCIAL IMPACT
- URGENCY
- RECOMMENDED ACTION
"""

from typing import Dict, Any, List
import pandas as pd
from analytics_engine import sanitize_for_json
from database import get_db

class UserProfitLeakRadar:
    def __init__(self, user_id: int, metrics: Dict[str, Any], profile: Dict[str, Any]):
        self.user_id = user_id
        self.metrics = metrics
        self.profile = profile
        self.curr = profile.get("currency", "₹")

    def detect_all_leaks(self) -> List[Dict[str, Any]]:
        leaks = []
        conn = get_db()
        
        # Load from unified tables first
        df_rec = pd.read_sql_query("SELECT * FROM unified_invoices WHERE user_id = ?", conn, params=(self.user_id,))
        df_sales = pd.read_sql_query("SELECT * FROM unified_sales WHERE user_id = ?", conn, params=(self.user_id,))
        df_exp = pd.read_sql_query("SELECT * FROM unified_expenses WHERE user_id = ?", conn, params=(self.user_id,))
        df_inv = pd.read_sql_query("SELECT * FROM unified_inventory WHERE user_id = ?", conn, params=(self.user_id,))

        # Fallback to manual tables if unified is empty
        if df_rec.empty:
            df_rec = pd.read_sql_query("SELECT * FROM receivables WHERE user_id = ?", conn, params=(self.user_id,))
        if df_sales.empty:
            df_sales = pd.read_sql_query("SELECT * FROM sales WHERE user_id = ?", conn, params=(self.user_id,))
        if df_exp.empty:
            df_exp = pd.read_sql_query("SELECT * FROM expenses WHERE user_id = ?", conn, params=(self.user_id,))
        
        est_row = conn.execute("SELECT * FROM estimates WHERE user_id = ?", (self.user_id,)).fetchone()
        est = dict(est_row) if est_row else None
        conn.close()

        summary = self.metrics.get("summary", {})
        rev = float(summary.get("total_revenue", 0.0))

        # 1. Overdue Customer Receivables Leak
        overdue_amt = 0.0
        stalled_customer = "Key Customer Accounts"
        if not df_rec.empty:
            if "balance_due" in df_rec.columns:
                overdue_df = df_rec[df_rec["status"] != "PAID"]
                if not overdue_df.empty:
                    overdue_amt = float(overdue_df["balance_due"].sum())
                    top_debtor = overdue_df.sort_values(by="balance_due", ascending=False).iloc[0]
                    stalled_customer = str(top_debtor.get("party_name") or "Key Customer")
            elif "pending_amount" in df_rec.columns:
                overdue_df = df_rec[df_rec["days_overdue"] > 30]
                if not overdue_df.empty:
                    overdue_amt = float(overdue_df["pending_amount"].sum())
                    top_debtor = overdue_df.sort_values(by="pending_amount", ascending=False).iloc[0]
                    stalled_customer = str(top_debtor["customer_name"])
        elif est and float(est.get("overdue_receivables", 0)) > 0:
            overdue_amt = float(est["overdue_receivables"])

        if overdue_amt > 0:
            leaks.append({
                "id": "LEAK-REC-01",
                "category": "Overdue Customer Debt",
                "title": f"Stalled Customer Debt: {stalled_customer}",
                "problem": f"{self.curr}{overdue_amt:,.0f} in customer payments is overdue beyond agreed terms.",
                "why_it_happened": "Credit was extended without automated overdue enforcement or stop-supply checkpoints.",
                "financial_impact": f"{self.curr}{overdue_amt:,.0f} cash recovery",
                "financial_impact_num": overdue_amt,
                "impact_type": "Capital At Immediate Risk",
                "urgency": "HIGH",
                "confidence": "98%",
                "recommended_action": f"Issue formal payment notice, offer 2% quick settlement cash discount, and place stop-supply on {stalled_customer}."
            })

        # 2. Low-Margin Product Leak
        if not df_sales.empty and "unit_price" in df_sales.columns and "unit_cost" in df_sales.columns:
            df_sales_valid = df_sales[df_sales["unit_price"] > 0].copy()
            if not df_sales_valid.empty:
                df_sales_valid["margin_pct"] = ((df_sales_valid["unit_price"] - df_sales_valid["unit_cost"]) / df_sales_valid["unit_price"]) * 100
                low_prods = df_sales_valid[df_sales_valid["margin_pct"] < 12.0]
                if not low_prods.empty:
                    low_p = low_prods.sort_values(by="margin_pct", ascending=True).iloc[0]
                    p_name = str(low_p["product_name"])
                    m_pct = float(low_p["margin_pct"])
                    cost = float(low_p["unit_cost"])
                    price = float(low_p["unit_price"])
                    lost_margin_est = (cost * 0.20) * 30
                    
                    leaks.append({
                        "id": "LEAK-PRD-01",
                        "category": "Low-Margin Products",
                        "title": f"Razor-Thin Margins on '{p_name}' ({m_pct:.1f}%)",
                        "problem": f"'{p_name}' generates only {m_pct:.1f}% margin (Cost: {self.curr}{cost:,.0f} vs Price: {self.curr}{price:,.0f}).",
                        "why_it_happened": "Purchase costs rose or item was priced below target 20%+ gross margin threshold.",
                        "financial_impact": f"{self.curr}{lost_margin_est:,.0f}/month lost margin",
                        "financial_impact_num": lost_margin_est,
                        "impact_type": "Margin Compression",
                        "urgency": "HIGH",
                        "confidence": "92%",
                        "recommended_action": f"Reprice '{p_name}' to at least {self.curr}{round(cost * 1.25, 0):,.0f} to protect operating profit."
                    })

        # 3. High Operating Overhead / Expenses Leak
        opex_amt = float(summary.get("total_opex", 0.0))
        if rev > 0 and opex_amt > 0:
            opex_ratio = opex_amt / rev
            if opex_ratio > 0.25:
                excess_opex = opex_amt * 0.15
                leaks.append({
                    "id": "LEAK-EXP-01",
                    "category": "High Overhead Expenses",
                    "title": f"Operating Overhead Consuming {(opex_ratio*100):.1f}% of Revenue",
                    "problem": f"Monthly expenses ({self.curr}{opex_amt:,.0f}) are high relative to top-line turnover ({self.curr}{rev:,.0f}).",
                    "why_it_happened": "Fixed costs (rent, utilities, logistics, staff) require volume scaling or overhead pruning.",
                    "financial_impact": f"{self.curr}{excess_opex:,.0f}/month potential savings",
                    "financial_impact_num": excess_opex,
                    "impact_type": "Recurring Overhead Bleed",
                    "urgency": "MEDIUM",
                    "confidence": "90%",
                    "recommended_action": "Audit recurring utility bills, transport routes, and negotiate supplier bulk freight terms."
                })

        # 4. Default Guidance Leak if user has zero data
        if not leaks and not self.metrics.get("has_data", False):
            leaks.append({
                "id": "LEAK-GUIDE-01",
                "category": "Getting Started",
                "title": "Upload Business Data to Scan for Leaks",
                "problem": "No consolidated transactions or estimates found in your account.",
                "why_it_happened": "Your account has no uploaded files or recorded transactions.",
                "financial_impact": "Full Profit Scan Pending",
                "financial_impact_num": 0,
                "impact_type": "Opportunity",
                "urgency": "LOW",
                "confidence": "100%",
                "recommended_action": "Go to 'Business Data Hub' and upload your Sales, Expenses, and Invoices to activate AI Leak Scanner."
            })

        return sanitize_for_json(leaks)
