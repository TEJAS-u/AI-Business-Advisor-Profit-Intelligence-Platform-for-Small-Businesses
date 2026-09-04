"""
Business Decision Memory Engine for AI CFO Platform
Advanced Feature: Decision -> Outcome -> Learning
Stores past strategic decisions, compares Before vs After financial metrics,
and derives persistent business learnings for future AI recommendations.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
from analytics_engine import sanitize_for_json


class BusinessMemoryStore:
    def __init__(self):
        # Preloaded historical decisions demonstrating the learning feedback loop
        self.decisions = [
            {
                "id": "DEC-001",
                "title": "Increase Solar Hybrid Inverter Price by 8%",
                "date": "2025-11-15",
                "category": "Pricing Strategy",
                "reason": "Passing through international battery component freight inflation.",
                "expected_outcome": "Expand gross margin from 28% to 33% without losing contractor volume.",
                "before_metrics": {
                    "price": "₹19,500",
                    "gross_margin": "28.2%",
                    "monthly_units": 26
                },
                "after_metrics": {
                    "price": "₹21,000",
                    "gross_margin": "33.3%",
                    "monthly_units": 33
                },
                "result_status": "POSITIVE",
                "ai_learning": "Commercial contractors accepted the 8% price increase without volume loss due to high warranty reputation. High pricing power confirmed for power equipment.",
                "confidence_score": "96%"
            },
            {
                "id": "DEC-002",
                "title": "Extended 60-Day Credit to Dealer Network",
                "date": "2025-12-01",
                "category": "Credit Policy",
                "reason": "Attempting to boost wholesale market share in Mysore region.",
                "expected_outcome": "+15% sales volume expansion.",
                "before_metrics": {
                    "overdue_receivables": "₹25,000",
                    "days_sales_outstanding": "22 Days"
                },
                "after_metrics": {
                    "overdue_receivables": "₹92,000",
                    "days_sales_outstanding": "68 Days"
                },
                "result_status": "NEGATIVE (RISK DETECTED)",
                "ai_learning": "Lenient credit terms resulted in ₹92,000 overdue debt and working capital strain rather than incremental repeat orders. Strict Net-30 terms with 2% cash discount recommended going forward.",
                "confidence_score": "94%"
            },
            {
                "id": "DEC-003",
                "title": "Consolidate Logistics into Bi-Weekly Shipments",
                "date": "2026-02-10",
                "category": "Expense Optimization",
                "reason": "Eliminating daily expedited ad-hoc freight courier costs.",
                "expected_outcome": "Reduce monthly logistics overhead by ₹12,000/month.",
                "before_metrics": {
                    "monthly_freight": "₹52,000"
                },
                "after_metrics": {
                    "monthly_freight": "₹38,000"
                },
                "result_status": "IN PROGRESS / POSITIVE TREND",
                "ai_learning": "Consolidated route planning reduced freight overhead by ~₹14,000 without increasing delivery complaint tickets.",
                "confidence_score": "91%"
            }
        ]

    def get_all_decisions(self) -> List[Dict[str, Any]]:
        return sanitize_for_json(self.decisions)

    def add_decision(self, title: str, category: str, reason: str, expected_outcome: str) -> Dict[str, Any]:
        new_dec = {
            "id": f"DEC-{len(self.decisions) + 1:03d}",
            "title": title,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "category": category,
            "reason": reason,
            "expected_outcome": expected_outcome,
            "before_metrics": {
                "health_score": "72/100",
                "net_margin": "8.03%"
            },
            "after_metrics": {
                "status": "Monitoring in progress (Evaluating 30-day window)"
            },
            "result_status": "ACTIVE / EVALUATING",
            "ai_learning": "AI CFO will track actual sales and expense transactions against baseline to calculate ROI.",
            "confidence_score": "Pending"
        }
        self.decisions.insert(0, new_dec)
        return sanitize_for_json(new_dec)
