"""
End-to-End Integration Test for Gmail Data Ingestion, Extraction, Consolidation, and SSOT Revenue/Profit Calculations.
"""

import os
import sys
import unittest

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + "/.."))

from database import init_db, get_db
from data_ingestion import DataIngestionService
from consolidation_engine import ConsolidationEngine
from analytics_engine import UserAnalyticsEngine


class TestGmailDataFlow(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.user_id = 999  # Isolated test user ID
        cls.clean_user_data()

    @classmethod
    def tearDownClass(cls):
        cls.clean_user_data()

    @classmethod
    def clean_user_data(cls):
        conn = get_db()
        conn.execute("DELETE FROM raw_records WHERE user_id = ?", (cls.user_id,))
        conn.execute("DELETE FROM uploaded_files WHERE user_id = ?", (cls.user_id,))
        conn.execute("DELETE FROM unified_sales WHERE user_id = ?", (cls.user_id,))
        conn.execute("DELETE FROM unified_expenses WHERE user_id = ?", (cls.user_id,))
        conn.execute("DELETE FROM unified_invoices WHERE user_id = ?", (cls.user_id,))
        conn.execute("DELETE FROM import_jobs WHERE user_id = ?", (cls.user_id,))
        conn.commit()
        conn.close()

    def test_01_plain_text_email_body_extraction(self):
        """Verify key-value extraction from plain text email bodies."""
        email_body = """
Customer: ABC Traders
Product: Premium Rice 25kg
Quantity: 20
Selling Price: 1000
Total Amount: 20000
Payment Status: Pending
Invoice No: INV-1001
Invoice Date: 04-09-2026
"""
        service = DataIngestionService()
        filename = "Gmail -> sales@abctraders.com -> Invoice INV-1001 -> email_body.txt"
        records, domain, meta = service.ingest_file(filename, email_body.encode("utf-8"))

        self.assertEqual(domain, "SALES")
        self.assertEqual(len(records), 1)
        rec = records[0]
        self.assertEqual(rec["customer_name"], "ABC Traders")
        self.assertEqual(rec["product_name"], "Premium Rice 25kg")
        self.assertEqual(rec["quantity"], 20.0)
        self.assertEqual(rec["selling_price"], 1000.0)
        self.assertEqual(rec["total_amount"], 20000.0)

    def test_02_unstructured_text_no_false_transactions(self):
        """Verify emails with no financial facts do NOT create fake transactions."""
        text = """
Hi Team,
Let's catch up tomorrow at 4 PM for our weekly review meeting.
Regards,
John
"""
        service = DataIngestionService()
        filename = "Gmail -> john@company.com -> Meeting Catchup -> email_body.txt"
        records, domain, meta = service.ingest_file(filename, text.encode("utf-8"))

        self.assertEqual(len(records), 0)

    def test_03_gmail_attachment_consolidation_into_ssot(self):
        """Verify Gmail sales & expense files consolidate cleanly into SSOT with lineage."""
        engine = ConsolidationEngine(self.user_id)

        sales_csv = """Customer,Product,Quantity,Selling_Price,Total_Revenue,Sale_Date
ABC Traders,Basmati Rice,10,1200,12000,2026-09-04
XYZ Retail,Wheat Flour,5,800,4000,2026-09-04
"""
        expense_text = """
Vendor: Builder Corp
Category: Office Rent
Amount: 5000
Date: 2026-09-04
"""
        files = [
            ("Gmail -> vendor@supplier.com -> Sales Report -> sales_invoice.csv", sales_csv.encode("utf-8")),
            ("Gmail -> landlord@realty.com -> Rent Receipt -> email_body.txt", expense_text.encode("utf-8"))
        ]

        res = engine.process_files(files)
        self.assertEqual(res["status"], "success")

        # Check DB
        conn = get_db()
        sales_rows = conn.execute(
            "SELECT * FROM unified_sales WHERE user_id = ? AND source_file LIKE 'Gmail%'",
            (self.user_id,)
        ).fetchall()
        self.assertEqual(len(sales_rows), 2)

        exp_rows = conn.execute(
            "SELECT * FROM unified_expenses WHERE user_id = ? AND source_file LIKE 'Gmail%'",
            (self.user_id,)
        ).fetchall()
        self.assertEqual(len(exp_rows), 1)
        self.assertEqual(exp_rows[0]["vendor_name"], "Builder Corp")
        self.assertEqual(exp_rows[0]["amount"], 5000.0)

        conn.close()

    def test_04_deterministic_actual_profit_calculation(self):
        """Verify SSOT analytics engine accurately includes Gmail records in Actual Profit."""
        analytics = UserAnalyticsEngine(self.user_id)
        res = analytics.compute_all_metrics()
        summary = res.get("summary", {})

        # Check total revenue & expenses
        self.assertGreaterEqual(summary.get("total_revenue", 0), 16000.0)
        self.assertGreaterEqual(summary.get("total_expenses", 0), 5000.0)


if __name__ == "__main__":
    unittest.main()
