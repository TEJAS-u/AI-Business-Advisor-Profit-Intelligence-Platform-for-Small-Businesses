"""
Analytics Engine for AI CFO Platform
Deterministic financial calculations based on the Unified Consolidated Dataset (SSOT),
with fallback to manual entries or quick estimates if no files have been uploaded.
"""

import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Any, List, Optional
from database import get_db


def sanitize_for_json(obj: Any) -> Any:
    """Recursively converts numpy/pandas/sqlite types to standard Python primitives."""
    if isinstance(obj, dict):
        return {str(k): sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_for_json(v) for v in obj]
    elif isinstance(obj, (np.integer, np.int64, np.int32)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32)):
        return float(obj)
    elif isinstance(obj, (np.bool_, bool)):
        return bool(obj)
    elif isinstance(obj, (np.ndarray, pd.Series)):
        return sanitize_for_json(obj.tolist())
    elif isinstance(obj, pd.Timestamp):
        return str(obj)
    elif pd.isna(obj):
        return None
    return obj


class UserAnalyticsEngine:
    def __init__(self, user_id: int):
        self.user_id = user_id
        self._load_user_data()

    def _load_user_data(self):
        conn = get_db()

        # Load user profile
        user_row = conn.execute(
            "SELECT * FROM users WHERE id = ?", (self.user_id,)).fetchone()
        self.profile = dict(user_row) if user_row else {
            "business_name": "My Shop",
            "shop_name": "My Shop",
            "shop_type": "Retail & Wholesale",
            "location": "India",
            "employees": 1,
            "currency": "₹"
        }
        if "password_hash" in self.profile:
            del self.profile["password_hash"]

        # 1. Primary: Load Unified Consolidated Tables (Single Source of Truth)
        self.df_unified_sales = pd.read_sql_query(
            "SELECT * FROM unified_sales WHERE user_id = ?", conn, params=(self.user_id,))
        self.df_unified_expenses = pd.read_sql_query(
            "SELECT * FROM unified_expenses WHERE user_id = ?", conn, params=(self.user_id,))
        self.df_unified_invoices = pd.read_sql_query(
            "SELECT * FROM unified_invoices WHERE user_id = ?", conn, params=(self.user_id,))
        self.df_unified_inventory = pd.read_sql_query(
            "SELECT * FROM unified_inventory WHERE user_id = ?", conn, params=(self.user_id,))
        self.df_unified_transactions = pd.read_sql_query(
            "SELECT * FROM unified_transactions WHERE user_id = ?", conn, params=(self.user_id,))

        # 2. Secondary Fallbacks (Manual entries & estimates)
        self.df_manual_sales = pd.read_sql_query(
            "SELECT * FROM sales WHERE user_id = ?", conn, params=(self.user_id,))
        self.df_manual_expenses = pd.read_sql_query(
            "SELECT * FROM expenses WHERE user_id = ?", conn, params=(self.user_id,))
        self.df_manual_products = pd.read_sql_query(
            "SELECT * FROM products WHERE user_id = ?", conn, params=(self.user_id,))
        self.df_manual_receivables = pd.read_sql_query(
            "SELECT * FROM receivables WHERE user_id = ?", conn, params=(self.user_id,))

        est_row = conn.execute(
            "SELECT * FROM estimates WHERE user_id = ?", (self.user_id,)).fetchone()
        self.estimate = dict(est_row) if est_row else None

        conn.close()

    def compute_all_metrics(self) -> Dict[str, Any]:
        has_unified_sales = not self.df_unified_sales.empty
        has_unified_expenses = not self.df_unified_expenses.empty
        has_manual_sales = not self.df_manual_sales.empty
        has_manual_expenses = not self.df_manual_expenses.empty
        has_manual_products = not self.df_manual_products.empty
        has_manual_receivables = not self.df_manual_receivables.empty
        has_estimate = self.estimate is not None

        # Mode 1: Unified Consolidated SSOT (Highest priority & accuracy)
        if has_unified_sales or has_unified_expenses:
            return self._compute_from_unified_ssot()

        # Mode 2: Manual Entries Mode
        elif has_manual_sales or has_manual_expenses or has_manual_products or has_manual_receivables:
            return self._compute_from_manual_records()

        # Mode 3: Quick Estimate Mode
        elif has_estimate:
            return self._compute_from_estimate()

        # Mode 4: Zero Data State
        else:
            return self._compute_empty_state()

    def _compute_from_unified_ssot(self) -> Dict[str, Any]:
        sales_df = self.df_unified_sales
        expenses_df = self.df_unified_expenses
        invoices_df = self.df_unified_invoices
        inventory_df = self.df_unified_inventory
        txns_df = self.df_unified_transactions

        total_revenue = float(sales_df["total_revenue"].sum()) if not sales_df.empty and "total_revenue" in sales_df.columns else 0.0
        total_cogs = float(sales_df["cogs"].sum()) if not sales_df.empty and "cogs" in sales_df.columns else 0.0
        gross_profit = total_revenue - total_cogs
        gross_margin_pct = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0.0

        total_opex = float(expenses_df["amount"].sum()) if not expenses_df.empty and "amount" in expenses_df.columns else 0.0
        total_expenses = total_cogs + total_opex
        net_profit = total_revenue - total_expenses
        net_profit_margin_pct = (net_profit / total_revenue * 100) if total_revenue > 0 else 0.0

        # Outstanding Receivables from Invoices
        total_outstanding = float(invoices_df["balance_due"].sum()) if not invoices_df.empty and "balance_due" in invoices_df.columns else 0.0
        overdue_df = invoices_df[invoices_df["status"] == "OVERDUE"] if not invoices_df.empty and "status" in invoices_df.columns else invoices_df
        total_overdue = float(overdue_df["balance_due"].sum()) if not overdue_df.empty else 0.0

        # Stock calculations
        total_stock_val = 0.0
        low_stock_cnt = 0
        out_of_stock_cnt = 0
        in_stock_cnt = 0
        total_prod_cnt = len(inventory_df)

        if not inventory_df.empty:
            if "current_stock" in inventory_df.columns and "unit_cost" in inventory_df.columns:
                total_stock_val = float((inventory_df["current_stock"] * inventory_df["unit_cost"]).sum())
            if "current_stock" in inventory_df.columns:
                out_of_stock_cnt = int((inventory_df["current_stock"] == 0).sum())
                low_stock_cnt = int(((inventory_df["current_stock"] > 0) & (inventory_df["current_stock"] <= 5)).sum())
                in_stock_cnt = int((inventory_df["current_stock"] > 5).sum())

        # Today's Sales
        today_str = datetime.now().strftime("%Y-%m-%d")
        today_sales = 0.0
        if not sales_df.empty and "sale_date" in sales_df.columns:
            today_df = sales_df[sales_df["sale_date"] == today_str]
            if not today_df.empty and "total_revenue" in today_df.columns:
                today_sales = float(today_df["total_revenue"].sum())

        # Lineage Sources
        source_files = set()
        for df in [sales_df, expenses_df, invoices_df, inventory_df, txns_df]:
            if not df.empty and "source_file" in df.columns:
                source_files.update(df["source_file"].dropna().unique())

        product_analytics = self._compute_unified_products(sales_df, inventory_df)
        monthly_trends = self._compute_unified_trends(sales_df, expenses_df)

        # Build dynamic attention items
        attention_items = self._build_attention_items(
            out_of_stock_cnt, low_stock_cnt, total_overdue, gross_profit, total_opex, product_analytics
        )

        # Instagram Social Signals context for AI reasoning
        conn = get_db()
        ig_rows = conn.execute(
            "SELECT * FROM social_activity WHERE user_id = ? AND network = 'instagram'", (self.user_id,)
        ).fetchall()
        conn.close()

        ig_signals = {
            "connected_profile": "ai_cfo_",
            "posts_count": len(ig_rows),
            "reach": sum(r["reach"] for r in ig_rows if r["reach"] is not None) if any(r["reach"] is not None for r in ig_rows) else None,
            "engagement": sum(r["engagement"] for r in ig_rows if r["engagement"] is not None) if any(r["engagement"] is not None for r in ig_rows) else None,
            "notice": "Instagram analytics availability depends on Zoho Social API access."
        }

        return sanitize_for_json({
            "mode": "UNIFIED_CONSOLIDATED_SSOT",
            "has_data": True,
            "source_files": list(source_files),
            "summary": {
                "total_revenue": round(total_revenue, 2),
                "total_cogs": round(total_cogs, 2),
                "gross_profit": round(gross_profit, 2),
                "gross_margin_pct": round(gross_margin_pct, 2),
                "total_opex": round(total_opex, 2),
                "total_expenses": round(total_expenses, 2),
                "net_profit": round(net_profit, 2),
                "net_profit_margin_pct": round(net_profit_margin_pct, 2),
                "outstanding_receivables": round(total_outstanding, 2),
                "overdue_receivables": round(total_overdue, 2),
                "total_stock_value": round(total_stock_val, 2),
                "total_products_count": total_prod_cnt,
                "low_stock_count": low_stock_cnt,
                "out_of_stock_count": out_of_stock_cnt,
                "in_stock_count": in_stock_cnt,
                "today_sales": round(today_sales, 2),
                "top_product": product_analytics["top_product"],
                "lowest_margin_product": product_analytics["lowest_margin_product"]
            },
            "attention_items": attention_items,
            "monthly_trends": monthly_trends,
            "product_analytics": product_analytics,
            "social_signals": ig_signals
        })

    def _compute_from_manual_records(self) -> Dict[str, Any]:
        sales_df = self.df_manual_sales
        expenses_df = self.df_manual_expenses
        products_df = self.df_manual_products
        receivables_df = self.df_manual_receivables

        total_revenue = float(sales_df["revenue"].sum()) if not sales_df.empty and "revenue" in sales_df.columns else 0.0
        total_cogs = float(sales_df["cogs"].sum()) if not sales_df.empty and "cogs" in sales_df.columns else 0.0
        gross_profit = total_revenue - total_cogs
        gross_margin_pct = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0.0

        total_opex = float(expenses_df["amount"].sum()) if not expenses_df.empty and "amount" in expenses_df.columns else 0.0
        total_expenses = total_cogs + total_opex
        net_profit = total_revenue - total_expenses
        net_profit_margin_pct = (net_profit / total_revenue * 100) if total_revenue > 0 else 0.0

        total_outstanding = float(receivables_df["pending_amount"].sum()) if not receivables_df.empty and "pending_amount" in receivables_df.columns else 0.0
        overdue_df = receivables_df[receivables_df["days_overdue"] > 0] if not receivables_df.empty and "days_overdue" in receivables_df.columns else pd.DataFrame()
        total_overdue = float(overdue_df["pending_amount"].sum()) if not overdue_df.empty else 0.0

        # Stock calculations from manual products
        total_stock_val = 0.0
        low_stock_cnt = 0
        out_of_stock_cnt = 0
        in_stock_cnt = 0
        total_prod_cnt = len(products_df)

        if not products_df.empty:
            if "stock_on_hand" in products_df.columns and "unit_cost" in products_df.columns:
                total_stock_val = float((products_df["stock_on_hand"] * products_df["unit_cost"]).sum())
            if "stock_on_hand" in products_df.columns:
                out_of_stock_cnt = int((products_df["stock_on_hand"] == 0).sum())
                low_stock_cnt = int(((products_df["stock_on_hand"] > 0) & (products_df["stock_on_hand"] <= 5)).sum())
                in_stock_cnt = int((products_df["stock_on_hand"] > 5).sum())

        # Today's Sales
        today_str = datetime.now().strftime("%Y-%m-%d")
        today_sales = 0.0
        if not sales_df.empty and "sale_date" in sales_df.columns:
            today_df = sales_df[sales_df["sale_date"] == today_str]
            if not today_df.empty and "revenue" in today_df.columns:
                today_sales = float(today_df["revenue"].sum())

        product_analytics = self._compute_manual_products(sales_df, products_df)
        monthly_trends = self._compute_manual_trends(sales_df, expenses_df)

        # Dynamic Attention Items
        attention_items = self._build_attention_items(
            out_of_stock_cnt, low_stock_cnt, total_overdue, gross_profit, total_opex, product_analytics
        )

        return sanitize_for_json({
            "mode": "MANUAL_DATA",
            "has_data": True,
            "source_files": ["Manual Bookkeeper"],
            "summary": {
                "total_revenue": round(total_revenue, 2),
                "total_cogs": round(total_cogs, 2),
                "gross_profit": round(gross_profit, 2),
                "gross_margin_pct": round(gross_margin_pct, 2),
                "total_opex": round(total_opex, 2),
                "total_expenses": round(total_expenses, 2),
                "net_profit": round(net_profit, 2),
                "net_profit_margin_pct": round(net_profit_margin_pct, 2),
                "outstanding_receivables": round(total_outstanding, 2),
                "overdue_receivables": round(total_overdue, 2),
                "total_stock_value": round(total_stock_val, 2),
                "total_products_count": total_prod_cnt,
                "low_stock_count": low_stock_cnt,
                "out_of_stock_count": out_of_stock_cnt,
                "in_stock_count": in_stock_cnt,
                "today_sales": round(today_sales, 2),
                "top_product": product_analytics["top_product"],
                "lowest_margin_product": product_analytics["lowest_margin_product"]
            },
            "attention_items": attention_items,
            "monthly_trends": monthly_trends,
            "product_analytics": product_analytics
        })

    def _compute_from_estimate(self) -> Dict[str, Any]:
        est = self.estimate
        monthly_rev = float(est.get("monthly_revenue", 0.0))
        margin_pct = float(est.get("margin_pct", 25.0))
        gross_profit = monthly_rev * (margin_pct / 100.0)
        cogs = monthly_rev - gross_profit

        rent = float(est.get("rent", 0.0))
        salaries = float(est.get("salaries", 0.0))
        utilities = float(est.get("utilities", 0.0))
        transport = float(est.get("transport", 0.0))
        marketing = float(est.get("marketing", 0.0))
        other_opex = float(est.get("other_opex", 0.0))
        total_opex = rent + salaries + utilities + transport + marketing + other_opex

        total_expenses = cogs + total_opex
        net_profit = monthly_rev - total_expenses
        net_profit_margin_pct = (net_profit / monthly_rev * 100) if monthly_rev > 0 else 0.0

        total_outstanding = float(est.get("total_receivables", 0.0))
        total_overdue = float(est.get("overdue_receivables", 0.0))

        trends = [
            {"month": "Month -2", "revenue": round(monthly_rev * 0.95, 2), "total_expenses": round(total_expenses * 0.96, 2), "net_profit": round(net_profit * 0.92, 2)},
            {"month": "Month -1", "revenue": round(monthly_rev * 0.98, 2), "total_expenses": round(total_expenses * 0.99, 2), "net_profit": round(net_profit * 0.96, 2)},
            {"month": "Current Month", "revenue": round(monthly_rev, 2), "total_expenses": round(total_expenses, 2), "net_profit": round(net_profit, 2)}
        ]

        attention_items = []
        if total_overdue > 0:
            attention_items.append({
                "type": "warning",
                "icon": "Clock",
                "title": f"Overdue Customer Dues: {self.profile.get('currency', '₹')}{total_overdue:,.0f}",
                "text": "Uncollected customer debt is reducing liquid cash."
            })
        if total_opex > gross_profit:
            attention_items.append({
                "type": "danger",
                "icon": "TrendingDown",
                "title": "Overhead Exceeds Gross Profit",
                "text": "Operating expenses (Rent/Staff) are higher than gross profit."
            })

        return sanitize_for_json({
            "mode": "ESTIMATE_DATA",
            "has_data": True,
            "source_files": ["60-Second Setup Estimator"],
            "summary": {
                "total_revenue": round(monthly_rev, 2),
                "total_cogs": round(cogs, 2),
                "gross_profit": round(gross_profit, 2),
                "gross_margin_pct": round(margin_pct, 2),
                "total_opex": round(total_opex, 2),
                "total_expenses": round(total_expenses, 2),
                "net_profit": round(net_profit, 2),
                "net_profit_margin_pct": round(net_profit_margin_pct, 2),
                "outstanding_receivables": round(total_outstanding, 2),
                "overdue_receivables": round(total_overdue, 2),
                "total_stock_value": 0.0,
                "total_products_count": 0,
                "low_stock_count": 0,
                "out_of_stock_count": 0,
                "in_stock_count": 0,
                "today_sales": 0.0,
                "top_product": {"name": "Primary Shop Catalog", "revenue": monthly_rev, "profit": gross_profit, "margin_pct": margin_pct},
                "lowest_margin_product": {"name": "Average Baseline", "revenue": monthly_rev, "margin_pct": margin_pct, "cost": cogs, "price": monthly_rev}
            },
            "attention_items": attention_items,
            "monthly_trends": trends,
            "product_analytics": {
                "top_product": {"name": "Primary Shop Line", "revenue": monthly_rev, "profit": gross_profit, "margin_pct": margin_pct},
                "lowest_margin_product": {"name": "Average Line", "revenue": monthly_rev, "margin_pct": margin_pct, "cost": cogs, "price": monthly_rev},
                "product_ranking": []
            }
        })

    def _compute_empty_state(self) -> Dict[str, Any]:
        return sanitize_for_json({
            "mode": "EMPTY_STATE",
            "has_data": False,
            "source_files": [],
            "summary": {
                "total_revenue": 0.0,
                "total_cogs": 0.0,
                "gross_profit": 0.0,
                "gross_margin_pct": 0.0,
                "total_opex": 0.0,
                "total_expenses": 0.0,
                "net_profit": 0.0,
                "net_profit_margin_pct": 0.0,
                "outstanding_receivables": 0.0,
                "overdue_receivables": 0.0,
                "total_stock_value": 0.0,
                "total_products_count": 0,
                "low_stock_count": 0,
                "out_of_stock_count": 0,
                "in_stock_count": 0,
                "today_sales": 0.0,
                "top_product": None,
                "lowest_margin_product": None
            },
            "attention_items": [],
            "monthly_trends": [],
            "product_analytics": {"top_product": None, "lowest_margin_product": None, "product_ranking": []}
        })

    def _build_attention_items(self, out_cnt: int, low_cnt: int, overdue_amt: float, gross_prof: float, opex: float, prod_analytics: Dict[str, Any]) -> List[Dict[str, Any]]:
        items = []
        curr = self.profile.get("currency", "₹")

        if out_cnt > 0:
            items.append({
                "type": "danger",
                "icon": "AlertTriangle",
                "title": f"{out_cnt} Product(s) Out of Stock (0 units)",
                "text": "Restock these items immediately to avoid lost sales."
            })
        if low_cnt > 0:
            items.append({
                "type": "warning",
                "icon": "Package",
                "title": f"{low_cnt} Product(s) Low on Stock (<= 5 units left)",
                "text": "Check your inventory catalog and place reorders."
            })
        if overdue_amt > 0:
            items.append({
                "type": "warning",
                "icon": "Clock",
                "title": f"{curr}{overdue_amt:,.0f} Customer Udhaar Pending",
                "text": "Send quick payment reminders to recover cash."
            })
        if prod_analytics.get("lowest_margin_product"):
            low_p = prod_analytics["lowest_margin_product"]
            if low_p.get("margin_pct", 100) < 15.0:
                items.append({
                    "type": "info",
                    "icon": "TrendingDown",
                    "title": f"Low Margin on '{low_p['name']}' ({low_p['margin_pct']}%)",
                    "text": "Consider repricing by 5-10% to protect store profit."
                })
        if opex > gross_prof and gross_prof > 0:
            items.append({
                "type": "danger",
                "icon": "TrendingDown",
                "title": "Shop Operating Overhead is Higher Than Gross Profit",
                "text": "Fixed costs (Rent/Staff/Power) are eating into store earnings."
            })

        return items

    def _compute_unified_products(self, sales_df: pd.DataFrame, inventory_df: pd.DataFrame) -> Dict[str, Any]:
        if sales_df.empty and inventory_df.empty:
            return {"top_product": None, "lowest_margin_product": None, "product_ranking": []}

        if not sales_df.empty:
            df = sales_df.copy()
            if "total_revenue" not in df.columns and "revenue" in df.columns:
                df["total_revenue"] = df["revenue"]

            grouped = df.groupby("product_name").agg(
                total_revenue=("total_revenue", "sum"),
                total_profit=("profit", "sum"),
                units_sold=("quantity", "sum"),
                avg_cost=("unit_cost", "mean"),
                avg_price=("unit_price", "mean")
            ).reset_index()
            grouped["margin_pct"] = np.where(grouped["total_revenue"] > 0, (
                grouped["total_profit"] / grouped["total_revenue"]) * 100, 0.0)

            sorted_by_profit = grouped.sort_values(
                by="total_profit", ascending=False)
            top_row = sorted_by_profit.iloc[0] if not sorted_by_profit.empty else None

            sorted_by_margin = grouped.sort_values(
                by="margin_pct", ascending=True)
            low_row = sorted_by_margin.iloc[0] if not sorted_by_margin.empty else None

            ranking = []
            for _, r in sorted_by_profit.iterrows():
                ranking.append({
                    "product_name": str(r["product_name"]),
                    "total_revenue": round(float(r["total_revenue"]), 2),
                    "total_profit": round(float(r["total_profit"]), 2),
                    "units_sold": int(r["units_sold"]),
                    "margin_pct": round(float(r["margin_pct"]), 2),
                    "avg_price": round(float(r["avg_price"]), 2),
                    "avg_cost": round(float(r["avg_cost"]), 2)
                })

            return {
                "top_product": {
                    "name": str(top_row["product_name"]),
                    "revenue": round(float(top_row["total_revenue"]), 2),
                    "profit": round(float(top_row["total_profit"]), 2),
                    "margin_pct": round(float(top_row["margin_pct"]), 2)
                } if top_row is not None else None,
                "lowest_margin_product": {
                    "name": str(low_row["product_name"]),
                    "revenue": round(float(low_row["total_revenue"]), 2),
                    "margin_pct": round(float(low_row["margin_pct"]), 2),
                    "cost": round(float(low_row["avg_cost"]), 2),
                    "price": round(float(low_row["avg_price"]), 2)
                } if low_row is not None else None,
                "product_ranking": ranking
            }
        else:
            return {"top_product": None, "lowest_margin_product": None, "product_ranking": []}

    def _compute_unified_trends(self, sales_df: pd.DataFrame, expenses_df: pd.DataFrame) -> List[Dict[str, Any]]:
        if sales_df.empty:
            return []

        df = sales_df.copy()
        if "total_revenue" not in df.columns and "revenue" in df.columns:
            df["total_revenue"] = df["revenue"]

        sales_grp = df.groupby("sale_date").agg(
            revenue=("total_revenue", "sum"),
            cogs=("cogs", "sum"),
            gross_profit=("profit", "sum")
        ).reset_index()

        trends = []
        for _, r in sales_grp.head(12).iterrows():
            trends.append({
                "month": str(r["sale_date"]),
                "revenue": round(float(r["revenue"]), 2),
                "cogs": round(float(r["cogs"]), 2),
                "total_expenses": round(float(r["cogs"]), 2),
                "net_profit": round(float(r["gross_profit"]), 2),
                "profit_margin_pct": round((float(r["gross_profit"]) / float(r["revenue"]) * 100) if float(r["revenue"]) > 0 else 0, 2)
            })
        return trends

    def _compute_manual_products(self, sales_df: pd.DataFrame, products_df: pd.DataFrame) -> Dict[str, Any]:
        return self._compute_unified_products(sales_df, products_df)

    def _compute_manual_trends(self, sales_df: pd.DataFrame, expenses_df: pd.DataFrame) -> List[Dict[str, Any]]:
        return self._compute_unified_trends(sales_df, expenses_df)
