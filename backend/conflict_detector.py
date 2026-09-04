"""
Cross-Source Data Conflict Detection Service
Detects financial discrepancies between invoices, sales ledgers, and bank statements.
"""

from typing import Dict, Any, List, Optional
from database import get_db


class ConflictDetector:
    def __init__(self, user_id: int):
        self.user_id = user_id

    def reconcile_invoices_vs_bank(
        self,
        invoices: List[Dict[str, Any]],
        bank_txns: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Reconciles sales invoices against bank payment deposits to detect payment discrepancies.
        """
        conflicts = []
        conn = get_db()
        cursor = conn.cursor()

        for inv in invoices:
            inv_num = str(inv.get("invoice_num") or "").strip()
            inv_amt = float(inv.get("amount")
                            or inv.get("total_amount") or 0.0)
            party = (inv.get("customer_name") or inv.get(
                "party_name") or "").lower().strip()

            if not inv_amt:
                continue

            # Look for matching bank credit transaction
            for txn in bank_txns:
                txn_type = str(txn.get("txn_type") or "").upper()
                txn_amt = float(txn.get("amount") or 0.0)
                txn_desc = (txn.get("description") or txn.get(
                    "party_name") or "").lower()

                # If bank credit mentions invoice # or customer name
                is_related = False
                if inv_num and inv_num.lower() in txn_desc:
                    is_related = True
                elif party and len(party) > 3 and party in txn_desc:
                    is_related = True

                if is_related and txn_amt > 0:
                    diff = abs(inv_amt - txn_amt)
                    # Difference detected (e.g. TDS, deduction, partial)
                    if 0 < diff <= (inv_amt * 0.25):
                        desc = f"Invoice #{inv_num} billed for ₹{inv_amt:,.2f}, but Bank Statement shows deposit of ₹{txn_amt:,.2f} (Difference: ₹{diff:,.2f})"

                        cursor.execute("""
                        INSERT INTO data_conflicts (
                            user_id, conflict_type, entity_name,
                            source_a, value_a, source_b, value_b,
                            difference, description, status
                        )
                        VALUES (?, 'INVOICE_VS_PAYMENT', ?, ?, ?, ?, ?, ?, ?, 'PENDING')
                        """, (
                            self.user_id,
                            party or inv_num,
                            f"{inv.get('source_file')}:Row {inv.get('source_row', 0)}",
                            f"₹{inv_amt:,.2f}",
                            f"{txn.get('source_file')}:Row {txn.get('source_row', 0)}",
                            f"₹{txn_amt:,.2f}",
                            diff,
                            desc
                        ))
                        conflicts.append({
                            "conflict_type": "INVOICE_VS_PAYMENT",
                            "entity": party or inv_num,
                            "source_a": f"{inv.get('source_file')}:Row {inv.get('source_row', 0)}",
                            "value_a": f"₹{inv_amt:,.2f}",
                            "source_b": f"{txn.get('source_file')}:Row {txn.get('source_row', 0)}",
                            "value_b": f"₹{txn_amt:,.2f}",
                            "difference": diff,
                            "description": desc
                        })

        conn.commit()
        conn.close()
        return conflicts
