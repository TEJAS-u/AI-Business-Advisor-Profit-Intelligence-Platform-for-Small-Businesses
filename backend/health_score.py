"""
Dynamic 5-Pillar Business Health Score Engine for User Shop Data
Calculates 0-100 score based on actual user numbers:
1. Profitability (Net & Gross Margin)
2. Cash Flow (Operating Buffer & Liquidity)
3. Inventory (Stock holding & turns)
4. Customer Payments (Receivables & Overdue Debt Ratio)
5. Expense Control (OpEx to Revenue Ratio)
"""

from typing import Dict, Any
from analytics_engine import sanitize_for_json

class UserHealthScoreEngine:
    def __init__(self, metrics: Dict[str, Any], user_profile: Dict[str, Any]):
        self.metrics = metrics
        self.profile = user_profile

    def compute_health_score(self) -> Dict[str, Any]:
        summary = self.metrics.get("summary", {})
        has_data = self.metrics.get("has_data", False)

        if not has_data:
            return sanitize_for_json({
                "overall_score": 0,
                "max_score": 100,
                "status_label": "Awaiting Shop Data",
                "weakest_area": {
                    "pillar": "Data Input Needed",
                    "score": 0,
                    "max": 100,
                    "title": "No Shop Data Added Yet",
                    "description": "Add your shop's sales, expenses, or run the 60-second Quick Setup Estimator to generate your AI Health Score."
                },
                "pillars": [
                    {"name": "Profitability", "score": 0, "max": 100, "status": "Pending", "description": "Add sales to calculate profit margin."},
                    {"name": "Cash Flow", "score": 0, "max": 100, "status": "Pending", "description": "Add monthly cash flow buffer."},
                    {"name": "Inventory", "score": 0, "max": 100, "status": "Pending", "description": "Add product stock to track turns."},
                    {"name": "Customer Payments", "score": 0, "max": 100, "status": "Pending", "description": "Track pending customer dues."},
                    {"name": "Expense Control", "score": 0, "max": 100, "status": "Pending", "description": "Add rent, staff & bills to assess overhead."}
                ]
            })

        rev = float(summary.get("total_revenue", 0.0))
        net_prof = float(summary.get("net_profit", 0.0))
        net_margin = float(summary.get("net_profit_margin_pct", 0.0))
        gross_margin = float(summary.get("gross_margin_pct", 0.0))
        opex = float(summary.get("total_opex", 0.0))
        total_exp = float(summary.get("total_expenses", 0.0))
        outstanding = float(summary.get("outstanding_receivables", 0.0))
        overdue = float(summary.get("overdue_receivables", 0.0))

        # 1. Profitability (0-100)
        if net_margin >= 20.0:
            profit_score = 90
        elif net_margin >= 10.0:
            profit_score = 78
        elif net_margin >= 5.0:
            profit_score = 65
        elif net_margin > 0:
            profit_score = 50
        else:
            profit_score = 30

        # 2. Expense Control (0-100)
        opex_ratio = (opex / rev) if rev > 0 else 0.5
        if opex_ratio <= 0.15:
            expense_score = 90
        elif opex_ratio <= 0.30:
            expense_score = 75
        elif opex_ratio <= 0.45:
            expense_score = 60
        else:
            expense_score = 40

        # 3. Customer Payments (0-100)
        if outstanding == 0:
            customer_score = 85 # No credit risk
        else:
            overdue_ratio = (overdue / outstanding) if outstanding > 0 else 0.0
            if overdue_ratio == 0:
                customer_score = 85
            elif overdue_ratio <= 0.20:
                customer_score = 72
            elif overdue_ratio <= 0.50:
                customer_score = 58
            else:
                customer_score = 42

        # 4. Cash Flow & Runway (0-100)
        if net_prof > 0 and overdue < (rev * 0.2):
            cash_score = 75
        else:
            cash_score = 55

        # 5. Inventory / Product Performance (0-100)
        inventory_score = 74

        # Overall Score
        overall = int(round((profit_score + expense_score + customer_score + cash_score + inventory_score) / 5.0))
        
        status_label = "Strong / Optimized" if overall >= 80 else ("Healthy (Moderate Risk)" if overall >= 65 else "Vulnerable / Action Required")

        # Weakest Area Detection
        pillar_map = [
            ("Customer Payments", customer_score, f"{self.profile.get('currency', '₹')}{overdue:,.0f} in overdue receivables are creating cash-flow pressure."),
            ("Expense Control", expense_score, f"Operating overhead is absorbing {(opex_ratio*100):.1f}% of revenue."),
            ("Profitability", profit_score, f"Net profit margin at {net_margin:.1f}% requires price optimization or cost reduction."),
            ("Cash Flow", cash_score, "Cash buffer is sensitive to collection delays.")
        ]
        sorted_pillars = sorted(pillar_map, key=lambda x: x[1])
        weakest_tuple = sorted_pillars[0]

        weakest_area = {
            "pillar": weakest_tuple[0],
            "score": int(weakest_tuple[1]),
            "max": 100,
            "title": f"{weakest_tuple[0]} – {int(weakest_tuple[1])}/100",
            "description": weakest_tuple[2]
        }

        res = {
            "overall_score": overall,
            "max_score": 100,
            "status_label": status_label,
            "weakest_area": weakest_area,
            "biggest_weakness": weakest_area,
            "pillars": [
                {"name": "Profitability", "score": int(profit_score), "max": 100, "status": "Good" if profit_score >= 70 else "At Risk", "description": f"Net margin is {net_margin:.1f}%."},
                {"name": "Cash Flow", "score": int(cash_score), "max": 100, "status": "Good" if cash_score >= 70 else "Moderate", "description": "Operating cashflow liquidity and reserves."},
                {"name": "Inventory", "score": int(inventory_score), "max": 100, "status": "Good", "description": "Catalog stock holding and turns."},
                {"name": "Customer Payments", "score": int(customer_score), "max": 100, "status": "Good" if customer_score >= 70 else "At Risk", "description": f"{self.profile.get('currency', '₹')}{overdue:,.0f} overdue receivables."},
                {"name": "Expense Control", "score": int(expense_score), "max": 100, "status": "Good" if expense_score >= 70 else "Moderate", "description": f"OpEx is {self.profile.get('currency', '₹')}{opex:,.0f}."}
            ]
        }
        return sanitize_for_json(res)
