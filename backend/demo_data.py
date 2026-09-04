"""
Demo Data Generator for AI CFO Platform
Generates authentic business data for:
"ABC Electronics" – Bangalore, Karnataka, India
(Consumer Electronics & Commercial Electrical Distributor, 18 Employees)
"""

import pandas as pd
import numpy as np

def get_demo_business_profile():
    return {
        "business_name": "ABC Electronics",
        "business_type": "Consumer Electronics & Electrical Distributor",
        "location": "Bangalore, Karnataka, India",
        "employees": 18,
        "currency_symbol": "₹",
        "currency_code": "INR"
    }

def generate_demo_datasets():
    # 1. Product Catalog (12 realistic SKUs)
    # Includes Supplier B with 18% cost spike, slow-moving ballasts, low-margin cables
    products_data = [
        {
            "product_id": "PRD-01",
            "product_name": "Solar Hybrid Inverter 2kVA",
            "category": "Power Systems",
            "unit_cost": 14000,
            "unit_price": 21000,
            "margin_pct": 33.33,
            "supplier_id": "SUP-01",
            "supplier_name": "SunPower Tech India"
        },
        {
            "product_id": "PRD-02",
            "product_name": "Industrial Microcontroller Core-X",
            "category": "Semiconductors",
            "unit_cost": 2950, # Rose by 18% from 2500 (+₹450/unit) -> ₹18,400/mo bleed on ~41 units/mo!
            "unit_price": 3400, # Price barely adjusted from 3350, margin compressed from 25.4% to 13.2%
            "margin_pct": 13.24,
            "supplier_id": "SUP-02",
            "supplier_name": "Supplier B (Pacific Semiconductors)"
        },
        {
            "product_id": "PRD-03",
            "product_name": "Commercial LED High-Bay 100W",
            "category": "Lighting",
            "unit_cost": 1800,
            "unit_price": 2700,
            "margin_pct": 33.33,
            "supplier_id": "SUP-03",
            "supplier_name": "LumiCore Optics"
        },
        {
            "product_id": "PRD-04",
            "product_name": "Pure Copper Flexible Wire (90m Roll)",
            "category": "Wiring",
            "unit_cost": 3200,
            "unit_price": 4100,
            "margin_pct": 21.95,
            "supplier_id": "SUP-04",
            "supplier_name": "Bharat Cable Works"
        },
        {
            "product_id": "PRD-05",
            "product_name": "Braided USB-C Fast Charging Cable (Pack of 5)",
            "category": "Accessories",
            "unit_cost": 410,
            "unit_price": 430, # Low-margin 4.65% commodity
            "margin_pct": 4.65,
            "supplier_id": "SUP-05",
            "supplier_name": "Zenith Accessories"
        },
        {
            "product_id": "PRD-06",
            "product_name": "Legacy T8 Electronic Ballast 36W (Discontinued)",
            "category": "Lighting",
            "unit_cost": 280,
            "unit_price": 420,
            "margin_pct": 33.33,
            "supplier_id": "SUP-03",
            "supplier_name": "LumiCore Optics"
        },
        {
            "product_id": "PRD-07",
            "product_name": "Digital Multimeter Pro-900",
            "category": "Testing Equipment",
            "unit_cost": 1200,
            "unit_price": 1850,
            "margin_pct": 35.14,
            "supplier_id": "SUP-02",
            "supplier_name": "Supplier B (Pacific Semiconductors)"
        },
        {
            "product_id": "PRD-08",
            "product_name": "Heavy Duty Voltage Stabilizer 5kVA",
            "category": "Power Systems",
            "unit_cost": 6500,
            "unit_price": 9200,
            "margin_pct": 29.35,
            "supplier_id": "SUP-01",
            "supplier_name": "SunPower Tech India"
        }
    ]
    df_products = pd.DataFrame(products_data)

    # 2. Suppliers
    suppliers_data = [
        {"supplier_id": "SUP-01", "supplier_name": "SunPower Tech India", "city": "Pune", "payment_terms": "Net 30"},
        {"supplier_id": "SUP-02", "supplier_name": "Supplier B (Pacific Semiconductors)", "city": "Mumbai", "payment_terms": "Net 15"},
        {"supplier_id": "SUP-03", "supplier_name": "LumiCore Optics", "city": "Ahmedabad", "payment_terms": "Net 30"},
        {"supplier_id": "SUP-04", "supplier_name": "Bharat Cable Works", "city": "Chennai", "payment_terms": "Net 45"},
        {"supplier_id": "SUP-05", "supplier_name": "Zenith Accessories", "city": "Delhi", "payment_terms": "Net 30"}
    ]
    df_suppliers = pd.DataFrame(suppliers_data)

    # 3. Customers
    customers_data = [
        {"customer_id": "CUST-01", "customer_name": "Sri Venkateshwara Electricals", "city": "Bangalore", "credit_limit": 500000},
        {"customer_id": "CUST-02", "customer_name": "Metro Hardware Hub", "city": "Mysore", "credit_limit": 400000},
        {"customer_id": "CUST-03", "customer_name": "Deccan Infra & Contractors", "city": "Hubli", "credit_limit": 600000},
        {"customer_id": "CUST-04", "customer_name": "Karnataka Industrial Automation", "city": "Bangalore", "credit_limit": 500000},
        {"customer_id": "CUST-05", "customer_name": "Bright Lights Retailers", "city": "Mangalore", "credit_limit": 300000}
    ]
    df_customers = pd.DataFrame(customers_data)

    # 4. Monthly Sales (Past 6 Months: Oct, Nov, Dec, Jan, Feb, Mar)
    # Revenue grows +7% in recent month, expenses grow +19%
    months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"]
    
    monthly_sales_qty = {
        "Oct": {"PRD-01": 25, "PRD-02": 40, "PRD-03": 80, "PRD-04": 60, "PRD-05": 150, "PRD-06": 4, "PRD-07": 20, "PRD-08": 10},
        "Nov": {"PRD-01": 28, "PRD-02": 40, "PRD-03": 85, "PRD-04": 62, "PRD-05": 160, "PRD-06": 3, "PRD-07": 22, "PRD-08": 11},
        "Dec": {"PRD-01": 30, "PRD-02": 42, "PRD-03": 90, "PRD-04": 65, "PRD-05": 170, "PRD-06": 2, "PRD-07": 25, "PRD-08": 12},
        "Jan": {"PRD-01": 29, "PRD-02": 40, "PRD-03": 88, "PRD-04": 64, "PRD-05": 165, "PRD-06": 1, "PRD-07": 24, "PRD-08": 12},
        "Feb": {"PRD-01": 31, "PRD-02": 41, "PRD-03": 92, "PRD-04": 68, "PRD-05": 175, "PRD-06": 1, "PRD-07": 26, "PRD-08": 14},
        "Mar": {"PRD-01": 33, "PRD-02": 41, "PRD-03": 96, "PRD-04": 72, "PRD-05": 190, "PRD-06": 0, "PRD-07": 28, "PRD-08": 15},
    }

    # Microcontroller cost history: Was 2500 in Oct-Dec, jumped 18% to 2950 in Jan-Mar (Leak: ₹450 x 41 = ₹18,450/mo!)
    cost_map = {
        "PRD-01": {"Oct": 14000, "Nov": 14000, "Dec": 14000, "Jan": 14000, "Feb": 14000, "Mar": 14000},
        "PRD-02": {"Oct": 2500, "Nov": 2500, "Dec": 2500, "Jan": 2900, "Feb": 2950, "Mar": 2950}, # 18% increase
        "PRD-03": {"Oct": 1800, "Nov": 1800, "Dec": 1800, "Jan": 1800, "Feb": 1800, "Mar": 1800},
        "PRD-04": {"Oct": 3200, "Nov": 3200, "Dec": 3200, "Jan": 3200, "Feb": 3200, "Mar": 3200},
        "PRD-05": {"Oct": 410, "Nov": 410, "Dec": 410, "Jan": 410, "Feb": 410, "Mar": 410},
        "PRD-06": {"Oct": 280, "Nov": 280, "Dec": 280, "Jan": 280, "Feb": 280, "Mar": 280},
        "PRD-07": {"Oct": 1200, "Nov": 1200, "Dec": 1200, "Jan": 1200, "Feb": 1200, "Mar": 1200},
        "PRD-08": {"Oct": 6500, "Nov": 6500, "Dec": 6500, "Jan": 6500, "Feb": 6500, "Mar": 6500}
    }

    prod_meta = {p["product_id"]: p for p in products_data}
    c_ids = [c["customer_id"] for c in customers_data]

    sales_rows = []
    inv_id = 1000

    for m_idx, m in enumerate(months):
        date_str = f"2026-{(m_idx+1):02d}-15"
        for pid, qty in monthly_sales_qty[m].items():
            if qty == 0:
                continue
            unit_cost = cost_map[pid][m]
            unit_price = prod_meta[pid]["unit_price"]
            
            inv_id += 1
            rev = qty * unit_price
            cogs = qty * unit_cost
            profit = rev - cogs

            sales_rows.append({
                "invoice_id": f"INV-{inv_id}",
                "date": date_str,
                "month": m,
                "customer_id": c_ids[inv_id % len(c_ids)],
                "product_id": pid,
                "product_name": prod_meta[pid]["product_name"],
                "category": prod_meta[pid]["category"],
                "quantity": qty,
                "unit_cost": unit_cost,
                "unit_price": unit_price,
                "revenue": rev,
                "cogs": cogs,
                "profit": profit
            })

    df_sales = pd.DataFrame(sales_rows)

    # 5. Expenses Log (Including unnecessary recurring software subscription of ₹5,300/mo)
    monthly_opex = {
        "Oct": {"Salaries & Wages": 140000, "Rent & Facilities": 45000, "Logistics & Freight": 28000, "Marketing & Ads": 18000, "Utilities & Admin": 14000, "Recurring SaaS Subscriptions": 5300},
        "Nov": {"Salaries & Wages": 140000, "Rent & Facilities": 45000, "Logistics & Freight": 29000, "Marketing & Ads": 19000, "Utilities & Admin": 14000, "Recurring SaaS Subscriptions": 5300},
        "Dec": {"Salaries & Wages": 145000, "Rent & Facilities": 45000, "Logistics & Freight": 32000, "Marketing & Ads": 22000, "Utilities & Admin": 15000, "Recurring SaaS Subscriptions": 5300},
        "Jan": {"Salaries & Wages": 145000, "Rent & Facilities": 45000, "Logistics & Freight": 38000, "Marketing & Ads": 26000, "Utilities & Admin": 15000, "Recurring SaaS Subscriptions": 5300},
        "Feb": {"Salaries & Wages": 150000, "Rent & Facilities": 45000, "Logistics & Freight": 44000, "Marketing & Ads": 32000, "Utilities & Admin": 16000, "Recurring SaaS Subscriptions": 5300},
        "Mar": {"Salaries & Wages": 150000, "Rent & Facilities": 45000, "Logistics & Freight": 52000, "Marketing & Ads": 38000, "Utilities & Admin": 16000, "Recurring SaaS Subscriptions": 5300},
    }

    expenses_rows = []
    exp_id = 500
    for m_idx, m in enumerate(months):
        date_str = f"2026-{(m_idx+1):02d}-20"
        for cat, amt in monthly_opex[m].items():
            exp_id += 1
            expenses_rows.append({
                "expense_id": f"EXP-{exp_id}",
                "date": date_str,
                "month": m,
                "category": cat,
                "amount": amt,
                "vendor": f"{cat.split()[0]} Services",
                "description": f"Monthly payment for {cat}"
            })

    df_expenses = pd.DataFrame(expenses_rows)

    # 6. Inventory Data (PRD-06 legacy ballasts: ₹48,000 slow-moving inventory at 195 days)
    inventory_data = [
        {"product_id": "PRD-01", "product_name": "Solar Hybrid Inverter 2kVA", "stock_on_hand": 18, "unit_cost": 14000, "total_value": 252000, "days_in_stock": 20},
        {"product_id": "PRD-02", "product_name": "Industrial Microcontroller Core-X", "stock_on_hand": 35, "unit_cost": 2950, "total_value": 103250, "days_in_stock": 25},
        {"product_id": "PRD-03", "product_name": "Commercial LED High-Bay 100W", "stock_on_hand": 65, "unit_cost": 1800, "total_value": 117000, "days_in_stock": 21},
        {"product_id": "PRD-04", "product_name": "Pure Copper Flexible Wire (90m Roll)", "stock_on_hand": 45, "unit_cost": 3200, "total_value": 144000, "days_in_stock": 19},
        {"product_id": "PRD-05", "product_name": "Braided USB-C Fast Charging Cable", "stock_on_hand": 280, "unit_cost": 410, "total_value": 114800, "days_in_stock": 44},
        {"product_id": "PRD-06", "product_name": "Legacy T8 Electronic Ballast 36W", "stock_on_hand": 171, "unit_cost": 280, "total_value": 48000, "days_in_stock": 195}, # ₹48,000 slow inventory!
        {"product_id": "PRD-07", "product_name": "Digital Multimeter Pro-900", "stock_on_hand": 30, "unit_cost": 1200, "total_value": 36000, "days_in_stock": 28},
        {"product_id": "PRD-08", "product_name": "Heavy Duty Voltage Stabilizer 5kVA", "stock_on_hand": 12, "unit_cost": 6500, "total_value": 78000, "days_in_stock": 22},
    ]
    df_inventory = pd.DataFrame(inventory_data)

    # 7. Receivables / Customer Payments (Overdue receivables: ₹92,000 from Sri Venkateshwara Electricals)
    receivables_data = [
        {"invoice_id": "INV-1022", "customer_name": "Sri Venkateshwara Electricals", "invoice_date": "2026-01-10", "due_date": "2026-02-10", "total_amount": 92000, "pending_amount": 92000, "days_overdue": 75},
        {"invoice_id": "INV-1054", "customer_name": "Metro Hardware Hub", "invoice_date": "2026-02-05", "due_date": "2026-03-05", "total_amount": 135000, "pending_amount": 45000, "days_overdue": 25},
        {"invoice_id": "INV-1088", "customer_name": "Deccan Infra & Contractors", "invoice_date": "2026-03-01", "due_date": "2026-03-31", "total_amount": 180000, "pending_amount": 90000, "days_overdue": 0},
        {"invoice_id": "INV-1110", "customer_name": "Karnataka Industrial Automation", "invoice_date": "2026-03-15", "due_date": "2026-04-15", "total_amount": 210000, "pending_amount": 210000, "days_overdue": 0}
    ]
    df_receivables = pd.DataFrame(receivables_data)

    return {
        "sales": df_sales,
        "expenses": df_expenses,
        "products": df_products,
        "suppliers": df_suppliers,
        "customers": df_customers,
        "inventory": df_inventory,
        "receivables": df_receivables
    }
