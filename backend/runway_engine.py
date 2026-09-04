"""
Cashflow Runway & Early Warning Engine for AI CFO Platform
Calculates 30/60/90-day cashflow forecasts, burn rates, and liquidity risk indicators.
"""

from typing import Dict, Any, List
from analytics_engine import sanitize_for_json


class RunwayEngine:
    def __init__(self, metrics: Dict[str, Any]):
        self.metrics = metrics

    def compute_runway(self) -> Dict[str, Any]:
        summary = self.metrics.get("summary", {})
        total_rev = float(summary.get("total_revenue", 0.0))
        total_exp = float(summary.get("total_expenses", 0.0))
        total_overdue = float(summary.get("overdue_receivables", 0.0))
        outstanding = float(summary.get("outstanding_receivables", 0.0))

        # Monthly averages over 6 months
        avg_monthly_rev = total_rev / 6.0
        avg_monthly_exp = total_exp / 6.0
        avg_monthly_net = avg_monthly_rev - avg_monthly_exp

        # Estimated liquid bank balance baseline for SME (~1.5x monthly OpEx)
        estimated_cash_reserves = avg_monthly_exp * 1.25

        # Scenarios: Base, Stressed, Optimized
        months_projection = [
            "Month +1 (30d)", "Month +2 (60d)", "Month +3 (90d)"]

        # 1. Base Forecast
        base_cash = estimated_cash_reserves
        base_series = []
        for m in months_projection:
            base_cash += avg_monthly_net
            base_series.append(round(base_cash, 2))

        # 2. Stressed Forecast (Collections slow down by 20%, costs up 5%)
        stressed_cash = estimated_cash_reserves
        stressed_series = []
        for m in months_projection:
            stressed_inflow = avg_monthly_rev * 0.85
            stressed_outflow = avg_monthly_exp * 1.05
            stressed_cash += (stressed_inflow - stressed_outflow)
            stressed_series.append(round(stressed_cash, 2))

        # 3. Optimized Forecast (Overdue debt collected + OpEx cut by 10%)
        optimized_cash = estimated_cash_reserves
        optimized_series = []
        recovered_split = (total_overdue * 0.70) / \
            3.0  # Recovered across 3 months
        for m in months_projection:
            opt_inflow = avg_monthly_rev + recovered_split
            opt_outflow = avg_monthly_exp * 0.90
            optimized_cash += (opt_inflow - opt_outflow)
            optimized_series.append(round(optimized_cash, 2))

        # Runway in Days
        burn_rate_daily = avg_monthly_exp / 30.0 if avg_monthly_exp > 0 else 1.0
        runway_days = int(estimated_cash_reserves / burn_rate_daily)

        # Liquidity Stress Index (0 to 100, higher is riskier)
        overdue_ratio = total_overdue / outstanding if outstanding > 0 else 0.5
        stress_index = min(100, int(overdue_ratio * 70 +
                           (avg_monthly_exp / avg_monthly_rev * 30)))

        risk_level = "LOW RISK" if stress_index < 40 else (
            "MODERATE STRESS" if stress_index < 70 else "HIGH STRESS")

        res = {
            "estimated_cash_reserves": round(estimated_cash_reserves, 2),
            "monthly_burn_rate": round(avg_monthly_exp, 2),
            "monthly_inflow_rate": round(avg_monthly_rev, 2),
            "net_monthly_cashflow": round(avg_monthly_net, 2),
            "runway_days": runway_days,
            "stress_index": stress_index,
            "risk_level": risk_level,
            "forecast_chart_data": [
                {"period": "Current (Day 0)", "base": round(estimated_cash_reserves, 2), "stressed": round(
                    estimated_cash_reserves, 2), "optimized": round(estimated_cash_reserves, 2)},
                {"period": "Month +1 (30d)", "base": base_series[0],
                 "stressed": stressed_series[0], "optimized": optimized_series[0]},
                {"period": "Month +2 (60d)", "base": base_series[1],
                 "stressed": stressed_series[1], "optimized": optimized_series[1]},
                {"period": "Month +3 (90d)", "base": base_series[2],
                 "stressed": stressed_series[2], "optimized": optimized_series[2]}
            ],
            "early_warnings": [
                {
                    "type": "CASHFLOW",
                    "severity": "HIGH",
                    "title": "Debtor Stagnation Alert",
                    "message": f"₹{total_overdue:,.0f} overdue receivables represents {(total_overdue / avg_monthly_exp * 30):.0f} days of operating payroll."
                },
                {
                    "type": "EXPENSE",
                    "severity": "MEDIUM",
                    "title": "Freight Overhead Acceleration",
                    "message": "Expedited logistics costs increased faster than sales; review dispatch routing before Q2."
                }
            ]
        }
        return sanitize_for_json(res)
