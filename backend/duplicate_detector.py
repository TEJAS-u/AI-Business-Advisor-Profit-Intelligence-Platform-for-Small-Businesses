"""
Cross-Source Duplicate Record Detection Service
Identifies potential duplicate sales, expenses, invoices, and bank transactions
across disparate uploaded files.
"""

import json
from typing import Dict, Any, List, Optional, Tuple
from database import get_db


class DuplicateDetector:
    def __init__(self, user_id: int):
        self.user_id = user_id

    def scan_for_duplicates(self, record_type: str, new_records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Scans a batch of newly normalized records against each other and existing records.
        Records candidates in the `duplicate_candidates` table for user review.
        """
        duplicates_found = []
        conn = get_db()
        cursor = conn.cursor()

        # Compare records in the current batch
        for i in range(len(new_records)):
            for j in range(i + 1, len(new_records)):
                rec_a = new_records[i]
                rec_b = new_records[j]

                # Check if from different source files or different rows
                is_duplicate, reason, confidence = self._compare_records(
                    record_type, rec_a, rec_b)
                if is_duplicate:
                    # Save to database
                    cursor.execute("""
                    INSERT INTO duplicate_candidates (
                        user_id, record_type, record_a_id, record_a_source,
                        record_b_id, record_b_source, record_data_json,
                        match_reason, confidence_score, status
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
                    """, (
                        self.user_id,
                        record_type,
                        rec_a.get("id") or rec_a.get("source_row", 0),
                        f"{rec_a.get('source_file')}:Row {rec_a.get('source_row', 0)}",
                        rec_b.get("id") or rec_b.get("source_row", 0),
                        f"{rec_b.get('source_file')}:Row {rec_b.get('source_row', 0)}",
                        json.dumps({"record_a": rec_a, "record_b": rec_b}),
                        reason,
                        confidence
                    ))
                    duplicates_found.append({
                        "record_type": record_type,
                        "source_a": f"{rec_a.get('source_file')}:Row {rec_a.get('source_row', 0)}",
                        "source_b": f"{rec_b.get('source_file')}:Row {rec_b.get('source_row', 0)}",
                        "match_reason": reason,
                        "confidence_score": confidence
                    })

        conn.commit()
        conn.close()
        return duplicates_found

    def _compare_records(self, record_type: str, a: Dict[str, Any], b: Dict[str, Any]) -> Tuple[bool, str, float]:
        """Compares two records based on key deterministic and fuzzy fields."""
        # 1. Invoice Number Match (Highest confidence)
        inv_a = str(a.get("invoice_num") or "").strip()
        inv_b = str(b.get("invoice_num") or "").strip()

        amt_a = float(a.get("amount") or a.get("total_revenue") or 0.0)
        amt_b = float(b.get("amount") or b.get("total_revenue") or 0.0)

        date_a = str(a.get("date") or a.get("sale_date")
                     or a.get("expense_date") or "").strip()
        date_b = str(b.get("date") or b.get("sale_date")
                     or b.get("expense_date") or "").strip()

        party_a = (a.get("customer_name") or a.get("supplier_name")
                   or a.get("party_name") or "").lower().strip()
        party_b = (b.get("customer_name") or b.get("supplier_name")
                   or b.get("party_name") or "").lower().strip()

        if inv_a and inv_b and inv_a == inv_b:
            if amt_a > 0 and amt_a == amt_b:
                return True, f"Exact Invoice #{inv_a} match with identical amount (₹{amt_a:,.2f})", 0.98
            elif date_a and date_a == date_b:
                return True, f"Exact Invoice #{inv_a} match on same date ({date_a})", 0.92
            else:
                return True, f"Matching Invoice Reference #{inv_a}", 0.85

        # 2. Date + Party + Amount Match (Cross-file duplication)
        if amt_a > 0 and amt_a == amt_b and date_a and date_a == date_b and party_a and party_b:
            if party_a == party_b:
                return True, f"Identical transaction of ₹{amt_a:,.2f} for '{party_a}' on {date_a}", 0.95
            elif party_a in party_b or party_b in party_a:
                return True, f"Matching amount (₹{amt_a:,.2f}) on {date_a} with similar party names", 0.88

        # 3. Product Sale Match
        prod_a = (a.get("product_name") or "").lower().strip()
        prod_b = (b.get("product_name") or "").lower().strip()
        qty_a = int(a.get("quantity") or 1)
        qty_b = int(b.get("quantity") or 1)

        if prod_a and prod_b and prod_a == prod_b and qty_a == qty_b and amt_a == amt_b and date_a == date_b:
            return True, f"Identical product sale: {qty_a}x '{prod_a}' for ₹{amt_a:,.2f} on {date_a}", 0.96

        return False, "", 0.0
