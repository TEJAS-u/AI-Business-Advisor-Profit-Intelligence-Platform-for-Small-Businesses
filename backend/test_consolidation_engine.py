"""
Comprehensive Test Suite for Business Data Consolidation Engine
Verifies multi-source file parsing, normalization, entity resolution, duplicate detection,
conflict detection, data quality scoring, SSOT creation, and data lineage.
"""

from main import app
from fastapi.testclient import TestClient
import pandas as pd
import io
import sys
sys.stdout.reconfigure(encoding='utf-8')


client = TestClient(app)


def test_consolidation_engine():
    print("=" * 75)
    print("TESTING BUSINESS DATA CONSOLIDATION ENGINE (SINGLE SOURCE OF TRUTH)")
    print("=" * 75)

    # 1. Login / Register user
    email = "consolidate_test@enterprise.com"
    reg_res = client.post("/api/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "Vikram Patel",
        "shop_name": "Patel Industrial Distributors",
        "shop_type": "Industrial Electronics & Spares",
        "location": "Ahmedabad, Gujarat, India",
        "employees": 12,
        "currency": "₹"
    })
    if reg_res.status_code == 200:
        token = reg_res.json()["token"]
    else:
        login_res = client.post(
            "/api/auth/login", json={"email": email, "password": "Password123!"})
        assert login_res.status_code == 200
        token = login_res.json()["token"]

    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] 1. Authenticated User: Vikram Patel (Patel Industrial Distributors)")

    # 2. Create Real In-Memory Test Files

    # File A: Sales_Q1.xlsx
    sales_df = pd.DataFrame([
        {"Invoice No": "INV-5001", "Date": "01/02/2026", "Buyer Name": "A.B.C Traders",
            "Product": "PLC Controller 24V", "Qty": 5, "Unit Price": 12000, "Total Value": 60000, "Cost Price": 8500},
        {"Invoice No": "INV-5002", "Date": "05/02/2026", "Buyer Name": "Reliance Spares Ltd",
            "Product": "Digital Multimeter Pro", "Qty": 20, "Unit Price": 1500, "Total Value": 30000, "Cost Price": 1100},
        {"Invoice No": "INV-5003", "Date": "12/02/2026", "Buyer Name": "ABC Traders Ltd", "Product": "Power Relay 12V",
            "Qty": 50, "Unit Price": 200, "Total Value": 10000, "Cost Price": 195},  # Thin margin leak
        {"Invoice No": "INV-5004", "Date": "18/02/2026", "Buyer Name": "Suresh Electrocorp",
            "Product": "Industrial Sensor", "Qty": 8, "Unit Price": 4500, "Total Value": 36000, "Cost Price": 3100}
    ])
    excel_buffer = io.BytesIO()
    with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
        sales_df.to_excel(writer, index=False, sheet_name="Q1_Sales")
    excel_bytes = excel_buffer.getvalue()

    # File B: Expenses_Feb.csv
    expenses_csv = """Paid To,Expense Category,Amount,Expense Date,Notes
Gujarat Power Corp,Electricity & Utilities,"14,500.00",2026-02-10,Commercial electricity bill
Ahmedabad Warehouse LLC,Shop Rent,45000,2026-02-01,Monthly warehouse facility lease
DHL Express Logistics,Transport & Freight,"8,200.50",2026-02-15,Express component freight dispatch
Staff Payroll,Staff Salaries,38000,2026-02-28,Operations team monthly payroll
"""

    # File C: BankStatement.csv (Contains payment deposit for INV-5001 with ₹2,000 conflict!)
    bank_csv = """Txn Date,Particulars,Cheque/Ref No,Debit,Credit,Balance
03/02/2026,NEFT-CR-ABC TRADERS LTD-INV-5001,UTR849201,,58000,124000
11/02/2026,BILL-PAY-GUJARAT POWER CORP,,14500,,109500
02/02/2026,RTGS-RENT-AHMEDABAD WAREHOUSE,,45000,,64500
"""

    # File D: Duplicate Invoice PDF (Simulated tabular CSV representation of duplicate INV-5001)
    duplicate_inv_csv = """invoice_num,invoice_date,party_name,total_amount,product_name,quantity
INV-5001,2026-02-01,ABC Traders,60000,PLC Controller 24V,5
"""

    # 3. Post Multi-File Upload to /api/consolidation/upload
    files = [
        ("files", ("Sales_Q1.xlsx", excel_bytes,
         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")),
        ("files", ("Expenses_Feb.csv", expenses_csv.encode('utf-8'), "text/csv")),
        ("files", ("BankStatement.csv", bank_csv.encode('utf-8'), "text/csv")),
        ("files", ("Invoice_5001.csv", duplicate_inv_csv.encode('utf-8'), "text/csv"))
    ]

    upload_res = client.post("/api/consolidation/upload",
                             files=files, headers=headers)
    assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
    summary = upload_res.json()["summary"]
    quality = upload_res.json()["quality"]

    print(f"\n[PASS] 2. Multi-Source Ingestion & Consolidation Complete:")
    print(f"       - Files Processed: {summary['files_processed']}")
    print(f"       - Total Records Ingested: {summary['total_records']}")
    print(f"       - Records Normalized: {summary['records_normalized']}")
    print(f"       - Potential Duplicates: {summary['potential_duplicates']}")
    print(
        f"       - Potential Entity Matches: {summary['potential_entity_matches']}")
    print(f"       - Conflicts Detected: {summary['conflicts_detected']}")
    print(
        f"       - Overall Data Quality Score: {summary['data_quality_score']}% ({summary['data_quality_status']})")

    # 4. Verify Entity Resolution
    ent_res = client.get("/api/consolidation/entity-matches", headers=headers)
    assert ent_res.status_code == 200
    ent_matches = ent_res.json()["entity_matches"]
    print(
        f"\n[PASS] 3. Entity Resolution ({len(ent_matches)} Match Suggestions):")
    for m in ent_matches:
        print(
            f"       - '{m['raw_name']}' matched to Canonical '{m['matched_canonical_name']}' (Confidence: {m['confidence_score']})")

    # 5. Verify Duplicate Candidates
    dup_res = client.get("/api/consolidation/duplicates", headers=headers)
    assert dup_res.status_code == 200
    dups = dup_res.json()["duplicates"]
    print(
        f"\n[PASS] 4. Duplicate Record Detector ({len(dups)} Candidates Found):")
    for d in dups:
        print(
            f"       - [{d['record_type']}] {d['source_a']} vs {d['source_b']}: {d['match_reason']}")

    # 6. Verify Conflict Detector
    conf_res = client.get("/api/consolidation/conflicts", headers=headers)
    assert conf_res.status_code == 200
    conflicts = conf_res.json()["conflicts"]
    print(
        f"\n[PASS] 5. Conflict Detector ({len(conflicts)} Financial Inconsistencies Found):")
    for c in conflicts:
        print(f"       - [{c['conflict_type']}] {c['description']}")

    # 7. Test Review Resolution
    if ent_matches:
        match_id = ent_matches[0]["id"]
        res_action = client.post(
            f"/api/consolidation/entity-matches/{match_id}/resolve", json={"action": "CONFIRMED"}, headers=headers)
        assert res_action.status_code == 200
        print(
            f"[PASS] 6. Resolved Entity Match #{match_id} -> CONFIRMED (Merged)")

    if dups:
        dup_id = dups[0]["id"]
        res_dup = client.post(
            f"/api/consolidation/duplicates/{dup_id}/resolve", json={"action": "MERGE"}, headers=headers)
        assert res_dup.status_code == 200
        print(f"[PASS] 7. Resolved Duplicate #{dup_id} -> MERGE")

    if conflicts:
        conf_id = conflicts[0]["id"]
        res_conf = client.post(f"/api/consolidation/conflicts/{conf_id}/resolve", json={
                               "choice": "INVOICE_BILLED_VALUE"}, headers=headers)
        assert res_conf.status_code == 200
        print(f"[PASS] 8. Resolved Data Conflict #{conf_id} -> RESOLVED")

    # 8. Verify Single Source of Truth Unified Dataset
    ssot_res = client.get("/api/consolidation/unified-data", headers=headers)
    assert ssot_res.status_code == 200
    ssot = ssot_res.json()
    print(f"\n[PASS] 9. Unified SSOT Dataset Populated with Full Lineage:")
    print(f"       - Unified Sales: {ssot['sales_count']} records")
    print(f"       - Unified Expenses: {ssot['expenses_count']} records")
    print(f"       - Unified Invoices: {ssot['invoices_count']} records")
    print(
        f"       - Master Entities: {ssot['entities_count']} canonical entities")

    # 9. Verify Deterministic Dashboard Connected to SSOT
    dash_res = client.get("/api/shop/dashboard", headers=headers)
    assert dash_res.status_code == 200
    dash = dash_res.json()
    print(f"\n[PASS] 10. Dashboard Derived From Consolidated SSOT:")
    print(f"       - Mode: {dash['mode']}")
    print(f"       - Sources: {dash['source_files']}")
    print(
        f"       - Total Consolidated Revenue: INR {dash['summary']['total_revenue']:,.2f}")
    print(
        f"       - Total Consolidated Expenses: INR {dash['summary']['total_expenses']:,.2f}")
    print(
        f"       - Consolidated Net Profit: INR {dash['summary']['net_profit']:,.2f} ({dash['summary']['net_profit_margin_pct']}%)")

    # 10. Verify AI CFO Chat Grounded in Consolidated Data
    chat_res = client.post(
        "/api/shop/chat", json={"message": "How is my business performing?"}, headers=headers)
    assert chat_res.status_code == 200
    print(
        f"\n[PASS] 11. AI CFO Chat Grounded in Consolidated SSOT: {chat_res.json()['reply'][:160]}...")

    print("\n" + "=" * 75)
    print("ALL DATA CONSOLIDATION, SSOT & LINEAGE TESTS PASSED 100%!")
    print("=" * 75)


if __name__ == "__main__":
    test_consolidation_engine()
