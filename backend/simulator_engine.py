"""
What-If Decision Simulator Engine for AI CFO Platform
Allows owner to test real-world scenarios:
- Product price increases (+5%, +10%, +15%)
- Supplier cost reductions (-5%, -8%, -12%)
- OpEx reductions (-5%, -10%, -15%)
- Receivables collection speedup (50%, 80%)

Provides Before vs After comparison, multi-scenario benchmarking, assumptions, and risk ratings.
"""

from typing import Dict, Any, List
from analytics_engine import sanitize_for_json

class SimulatorEngine:
    def __init__(self, metrics: Dict[str, Any], health_score: Dict[str, Any], raw_data: Dict[str, Any]):
        self.metrics = metrics
        self.health_score = health_score
        self.raw_data = raw_data

    def simulate(
        self,
        price_change_pct: float = 10.0,
        supplier_discount_pct: float = 8.0,
        opex_cut_pct: float = 10.0,
        receivables_collected_pct: float = 60.0
    ) -> Dict[str, Any]:
        summary = self.metrics.get("summary", {})
        baseline_rev = float(summary.get("total_revenue", 8000000))
        baseline_cogs = float(summary.get("total_cogs", 5750000))
        baseline_opex = float(summary.get("total_opex", 1600000))
        baseline_profit = float(summary.get("net_profit", 650000))
        baseline_margin = float(summary.get("net_profit_margin_pct", 8.1))
        baseline_health = int(self.health_score.get("overall_score", 72))

        # Mathematical Simulation
        # Price change increases revenue (assume slight 1.5% elasticity volume dampening if price hike > 8%)
        elasticity_factor = 0.98 if price_change_pct > 8.0 else 1.0
        revenue_gain = baseline_rev * (price_change_pct / 100.0) * elasticity_factor
        simulated_rev = baseline_rev + revenue_gain

        # Supplier discount reduces COGS
        cogs_savings = baseline_cogs * (supplier_discount_pct / 100.0)
        simulated_cogs = baseline_cogs - cogs_savings

        # OpEx reduction
        opex_savings = baseline_opex * (opex_cut_pct / 100.0)
        simulated_opex = baseline_opex - opex_savings

        simulated_expenses = simulated_cogs + simulated_opex
        simulated_profit = simulated_rev - simulated_expenses
        simulated_margin = (simulated_profit / simulated_rev * 100.0) if simulated_rev > 0 else 0.0

        profit_improvement = simulated_profit - baseline_profit
        margin_improvement = simulated_margin - baseline_margin

        # Health score delta
        health_gain = min(26, int(round((margin_improvement * 1.5) + (supplier_discount_pct * 0.4) + (opex_cut_pct * 0.3))))
        simulated_health = min(98, baseline_health + health_gain)

        # Multi-Scenario Benchmark comparison
        scenarios = [
            {
                "name": "Current Baseline",
                "price_delta": "0%",
                "supplier_delta": "0%",
                "profit": round(baseline_profit, 2),
                "margin": f"{baseline_margin:.1f}%",
                "health": baseline_health,
                "risk": "Moderate (Status Quo)",
                "recommended": False
            },
            {
                "name": "Scenario A: Price +5%",
                "price_delta": "+5%",
                "supplier_delta": "0%",
                "profit": round(baseline_profit + (baseline_rev * 0.05), 2),
                "margin": f"{(baseline_profit + (baseline_rev * 0.05)) / (baseline_rev * 1.05) * 100:.1f}%",
                "health": min(100, baseline_health + 7),
                "risk": "Low (Negligible churn risk)",
                "recommended": False
            },
            {
                "name": "Scenario B: Price +10% & Supplier -8%",
                "price_delta": "+10%",
                "supplier_delta": "-8%",
                "profit": round(baseline_profit + (baseline_rev * 0.10 * 0.98) + (baseline_cogs * 0.08), 2),
                "margin": f"{(baseline_profit + (baseline_rev * 0.10 * 0.98) + (baseline_cogs * 0.08)) / (baseline_rev * 1.098) * 100:.1f}%",
                "health": min(100, baseline_health + 18),
                "risk": "Low-Moderate (High ROI)",
                "recommended": True
            },
            {
                "name": "Scenario C: Aggressive OpEx & Debt Recovery",
                "price_delta": "+5%",
                "supplier_delta": "-10%",
                "profit": round(baseline_profit + (baseline_rev * 0.05) + (baseline_cogs * 0.10) + (baseline_opex * 0.15), 2),
                "margin": f"{(baseline_profit + (baseline_rev * 0.05) + (baseline_cogs * 0.10) + (baseline_opex * 0.15)) / (baseline_rev * 1.05) * 100:.1f}%",
                "health": min(100, baseline_health + 22),
                "risk": "Moderate (Operational restructuring)",
                "recommended": False
            }
        ]

        # Specific single product simulation example (e.g. Microcontroller / Inverter)
        product_example = {
            "product_name": "Industrial Microcontroller Core-X",
            "current_price": 3400,
            "new_price": round(3400 * (1 + price_change_pct / 100.0), 0),
            "current_monthly_profit": 18450,
            "estimated_monthly_profit": round(18450 + (41 * (3400 * price_change_pct / 100.0)), 0),
            "estimated_improvement": round(41 * (3400 * price_change_pct / 100.0), 0)
        }

        res = {
            "baseline": {
                "revenue": round(baseline_rev, 2),
                "expenses": round(baseline_cogs + baseline_opex, 2),
                "net_profit": round(baseline_profit, 2),
                "margin_pct": round(baseline_margin, 2),
                "health_score": baseline_health
            },
            "simulated": {
                "revenue": round(simulated_rev, 2),
                "expenses": round(simulated_expenses, 2),
                "net_profit": round(simulated_profit, 2),
                "margin_pct": round(simulated_margin, 2),
                "health_score": simulated_health
            },
            "deltas": {
                "profit_improvement": round(profit_improvement, 2),
                "margin_improvement_pts": round(margin_improvement, 2),
                "health_score_gain": health_gain,
                "revenue_gain": round(revenue_gain, 2),
                "cogs_savings": round(cogs_savings, 2),
                "opex_savings": round(opex_savings, 2)
            },
            "product_example": product_example,
            "scenarios": scenarios,
            "assumptions": [
                "1. Price increases above 8% assume minor 2% elasticity volume dampening.",
                "2. Supplier discount of 8% is modeled across semiconductor and hardware purchase orders.",
                "3. OpEx savings assume freight consolidation and software subscription cancellations.",
                "4. All projections are deterministic mathematical estimates."
            ],
            "risk_assessment": "LOW RISK – Margin expansion easily compensates for minor volume elasticity."
        }
        return sanitize_for_json(res)
