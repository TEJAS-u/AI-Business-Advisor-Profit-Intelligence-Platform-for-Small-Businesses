"""
Data Normalization & Smart Field Mapping Service
Maps heterogeneous column names, normalizes date formats, cleans currencies/numbers,
and standardizes entity strings.
"""

import re
import datetime
from typing import Dict, Any, List, Optional, Tuple
import pandas as pd


# Comprehensive Field Mapping Synonyms
FIELD_MAPPINGS = {
    "customer_name": [
        "customer name", "customer", "client name", "client", "buyer name", "buyer",
        "party name", "party", "billed to", "account name", "customer_name", "client_name",
        "customer/vendor", "debtor", "sold to"
    ],
    "supplier_name": [
        "supplier name", "supplier", "vendor name", "vendor", "seller name", "seller",
        "paid to", "merchant", "creditor", "vendor_name", "supplier_name"
    ],
    "product_name": [
        "product name", "product", "item name", "item", "description", "particulars",
        "sku description", "product_name", "item_name", "sku", "service name", "service"
    ],
    "quantity": [
        "quantity", "qty", "units", "volume", "nos", "count", "pieces", "qty sold",
        "units sold", "quantity_sold"
    ],
    "unit_price": [
        "unit price", "selling price", "retail price", "rate", "mrp", "price per unit",
        "unit_price", "selling_rate", "sales price"
    ],
    "unit_cost": [
        "unit cost", "cost price", "purchase price", "buying rate", "cost per unit",
        "unit_cost", "purchase_rate", "cogs per unit", "cost"
    ],
    "amount": [
        "amount", "total amount", "total", "invoice value", "net amount", "grand total",
        "value", "transaction amount", "total_amount", "revenue", "bill amount", "price",
        "total revenue", "total_revenue"
    ],
    "date": [
        "date", "sale date", "invoice date", "bill date", "transaction date", "txn date",
        "expense date", "payment date", "sale_date", "created date", "dated"
    ],
    "due_date": [
        "due date", "payment due date", "due_date", "expiry date", "maturity date"
    ],
    "invoice_num": [
        "invoice number", "invoice no", "invoice #", "inv no", "inv #", "bill no",
        "bill #", "voucher no", "voucher #", "ref #", "reference no", "invoice_num",
        "invoice_no", "inv_id"
    ],
    "category": [
        "category", "item category", "department", "type", "expense category",
        "product category", "group", "head", "account"
    ],
    "phone": [
        "phone", "mobile", "contact", "telephone", "phone number", "mobile number",
        "contact number", "cell"
    ],
    "email": [
        "email", "email address", "e-mail", "mail"
    ],
    "description": [
        "description", "notes", "remarks", "narration", "memo", "details"
    ],
    "txn_type": [
        "type", "txn type", "transaction type", "cr/dr", "credit/debit", "d/c"
    ]
}


class DataNormalizer:
    def __init__(self):
        pass

    def map_columns(self, raw_record: Dict[str, Any]) -> Dict[str, Any]:
        """Maps diverse raw column names into normalized internal schema fields."""
        normalized = {}
        unmapped = {}

        for raw_col, val in raw_record.items():
            if raw_col.startswith("_"):
                normalized[raw_col] = val
                continue

            cleaned_col = str(raw_col).lower().strip().replace(
                "_", " ").replace("-", " ")
            matched_field = None

            for canon_field, synonyms in FIELD_MAPPINGS.items():
                if cleaned_col in synonyms:
                    matched_field = canon_field
                    break
                # Substring check
                if any(syn == cleaned_col for syn in synonyms):
                    matched_field = canon_field
                    break

            if matched_field:
                # If field not already set or was empty, set it
                if matched_field not in normalized or not normalized[matched_field]:
                    normalized[matched_field] = val
            else:
                unmapped[raw_col] = val

        # Retain unmapped attributes in _raw_extra
        normalized["_unmapped"] = unmapped
        return normalized

    def normalize_record(self, raw_record: Dict[str, Any], domain: str) -> Dict[str, Any]:
        """Normalizes fields: dates, numbers, currencies, strings."""
        mapped = self.map_columns(raw_record)

        # 1. Normalize Date
        raw_date = mapped.get("date") or mapped.get(
            "invoice_date") or mapped.get("sale_date")
        normalized_date = self.normalize_date(raw_date)

        # 2. Normalize Currency & Numbers
        amount = self.normalize_number(mapped.get("amount"))
        qty = self.normalize_number(mapped.get("quantity"), default=1.0)
        unit_price = self.normalize_number(mapped.get("unit_price"))
        unit_cost = self.normalize_number(mapped.get("unit_cost"))

        # Calculate revenue/cost if missing
        if unit_price > 0 and amount == 0 and qty > 0:
            amount = unit_price * qty
        elif amount > 0 and unit_price == 0 and qty > 0:
            unit_price = amount / qty

        # 3. Text Normalization
        customer_name = self.clean_text(mapped.get(
            "customer_name") or mapped.get("party_name"))
        supplier_name = self.clean_text(mapped.get(
            "supplier_name") or mapped.get("vendor_name"))
        product_name = self.clean_text(mapped.get(
            "product_name") or mapped.get("description"))
        category = self.clean_text(mapped.get("category"), default="General")
        invoice_num = str(mapped.get("invoice_num") or "").strip()

        return {
            "source_file": mapped.get("source_file") or mapped.get("_source_file") or raw_record.get("source_file") or "unknown_file",
            "source_row": mapped.get("_row_index", 1),
            "detected_domain": domain,
            "date": normalized_date,
            "invoice_num": invoice_num,
            "customer_name": customer_name,
            "supplier_name": supplier_name,
            "product_name": product_name,
            "category": category,
            "quantity": int(qty) if qty.is_integer() else qty,
            "unit_price": round(unit_price, 2),
            "unit_cost": round(unit_cost, 2),
            "amount": round(amount, 2),
            "phone": str(mapped.get("phone", "")).strip(),
            "email": str(mapped.get("email", "")).strip().lower(),
            "description": str(mapped.get("description", "")).strip(),
            "_raw": raw_record
        }

    def normalize_date(self, val: Any) -> str:
        """Parses various date formats into standard ISO YYYY-MM-DD."""
        if not val or pd.isna(val):
            return datetime.date.today().isoformat()

        if isinstance(val, (datetime.date, datetime.datetime)):
            return val.strftime("%Y-%m-%d")

        s = str(val).strip()
        if not s:
            return datetime.date.today().isoformat()

        # Try pandas to_datetime
        try:
            parsed = pd.to_datetime(s, dayfirst=True, errors='coerce')
            if pd.notna(parsed):
                return parsed.strftime("%Y-%m-%d")
        except Exception:
            pass

        # Regex heuristics
        # 1. YYYY-MM-DD or YYYY/MM/DD
        m1 = re.search(r'(\d{4})[/\-\.](\d{1,2})[/\-\.](\d{1,2})', s)
        if m1:
            y, m, d = m1.groups()
            return f"{int(y):04d}-{int(m):02d}-{int(d):02d}"

        # 2. DD-MM-YYYY or DD/MM/YYYY
        m2 = re.search(r'(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{4})', s)
        if m2:
            d, m, y = m2.groups()
            return f"{int(y):04d}-{int(m):02d}-{int(d):02d}"

        return datetime.date.today().isoformat()

    def normalize_number(self, val: Any, default: float = 0.0) -> float:
        """Converts formatted strings with currency symbols and commas to clean float."""
        if val is None or pd.isna(val) or val == "":
            return default

        if isinstance(val, (int, float)):
            return float(val)

        s = str(val).strip()
        # Handle parentheses for negative: (500) -> -500
        is_negative = False
        if s.startswith("(") and s.endswith(")"):
            is_negative = True
            s = s[1:-1]
        elif s.startswith("-"):
            is_negative = True
            s = s[1:]

        # Remove currency symbols and formatting commas
        s_clean = re.sub(r'[^\d\.]', '', s)
        try:
            num = float(s_clean) if s_clean else default
            return -num if is_negative else num
        except Exception:
            return default

    def clean_text(self, val: Any, default: str = "") -> str:
        """Cleans whitespace, collapses double spaces, and strips characters."""
        if val is None or pd.isna(val):
            return default
        s = str(val).strip()
        # Collapse multiple spaces
        s = re.sub(r'\s+', ' ', s)
        return s if s else default
