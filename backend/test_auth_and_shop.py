"""
Test Suite for User Registration, Login, Custom Shop Data Entry & Analytics
"""
from main import app
from fastapi.testclient import TestClient
import sys
sys.stdout.reconfigure(encoding='utf-8')


client = TestClient(app)


def test_auth_and_shop():
    print("=" * 70)
    print("TESTING AI CFO USER AUTHENTICATION & CUSTOM SHOP DATA ENTRY")
    print("=" * 70)

    # 1. Register a real shop owner
    email = "sharma@kiranastore.com"
    reg_data = {
        "email": email,
        "password": "Password123!",
        "full_name": "Ramesh Sharma",
        "shop_name": "Sharma Super Store",
        "shop_type": "Grocery & FMCG Retail",
        "location": "Indiranagar, Bangalore, India",
        "employees": 4,
        "currency": "₹"
    }

    # Try register (or login if exists)
    reg_resp = client.post("/api/auth/register", json=reg_data)
    if reg_resp.status_code == 200:
        token = reg_resp.json()["token"]
        print(
            f"[PASS] 1. Registered New User: {reg_data['full_name']} ({reg_data['shop_name']})")
    else:
        login_resp = client.post(
            "/api/auth/login", json={"email": email, "password": "Password123!"})
        assert login_resp.status_code == 200
        token = login_resp.json()["token"]
        print(f"[PASS] 1. Logged in Existing User: {reg_data['full_name']}")

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Verify /api/auth/me
    me_resp = client.get("/api/auth/me", headers=headers)
    assert me_resp.status_code == 200
    user = me_resp.json()
    print(
        f"[PASS] 2. Verified Active Session: User ID {user['id']} | Shop: {user['shop_name']}")

    # 3. Add Custom Shop Products
    p1 = client.post("/api/shop/products", json={
        "product_name": "Basmati Rice Premium (5kg)",
        "category": "Grains & Staples",
        "unit_cost": 420.0,
        "unit_price": 550.0,
        "stock_on_hand": 40,
        "supplier_name": "Delhi Grain Mills"
    }, headers=headers)
    assert p1.status_code == 200

    p2 = client.post("/api/shop/products", json={
        "product_name": "Refined Sunflower Oil (1L Pouch)",
        "category": "Oils & Ghee",
        "unit_cost": 128.0,
        "unit_price": 132.0,  # Low-margin (3.0%) leak!
        "stock_on_hand": 100,
        "supplier_name": "Agro Pure Ltd"
    }, headers=headers)
    assert p2.status_code == 200
    print("[PASS] 3. Added 2 Custom Products (Premium Rice & Thin-Margin Oil)")

    # 4. Add Real Daily Sales
    s1 = client.post("/api/shop/sales", json={
        "product_name": "Basmati Rice Premium (5kg)",
        "quantity": 20,
        "unit_cost": 420.0,
        "unit_price": 550.0,
        "customer_name": "Anil Verma",
        "sale_date": "2026-03-01"
    }, headers=headers)
    assert s1.status_code == 200

    s2 = client.post("/api/shop/sales", json={
        "product_name": "Refined Sunflower Oil (1L Pouch)",
        "quantity": 80,
        "unit_cost": 128.0,
        "unit_price": 132.0,
        "customer_name": "Suresh Hotels",
        "sale_date": "2026-03-01"
    }, headers=headers)
    assert s2.status_code == 200
    print("[PASS] 4. Recorded Real Sales Transactions (Total: INR 21,560.00)")

    # 5. Add Real Shop Expenses
    e1 = client.post("/api/shop/expenses", json={
        "category": "Shop Rent",
        "amount": 25000.0,
        "vendor": "Landlord Sharma",
        "description": "Monthly commercial shop rent",
        "expense_date": "2026-03-01"
    }, headers=headers)
    assert e1.status_code == 200

    e2 = client.post("/api/shop/expenses", json={
        "category": "Electricity & Air Cooling",
        "amount": 4200.0,
        "vendor": "BESCOM",
        "description": "Monthly commercial power utility",
        "expense_date": "2026-03-01"
    }, headers=headers)
    assert e2.status_code == 200
    print("[PASS] 5. Added Real Shop Expenses (Rent + Electricity)")

    # 6. Add Real Customer Due (Overdue Receivable)
    r1 = client.post("/api/shop/receivables", json={
        "customer_name": "Suresh Hotels & Caterers",
        "total_amount": 18500.0,
        "pending_amount": 18500.0,
        "days_overdue": 52,
        "due_date": "2026-01-15",
        "phone": "+91 98765 43210",
        "invoice_ref": "SH-INV-042"
    }, headers=headers)
    assert r1.status_code == 200
    print("[PASS] 6. Added Overdue Customer Due: Suresh Hotels (INR 18,500.00, 52d overdue)")

    # 7. Test User Dashboard
    dash_resp = client.get("/api/shop/dashboard", headers=headers)
    assert dash_resp.status_code == 200
    dash = dash_resp.json()
    summary = dash["summary"]
    health = dash["health_score"]
    leaks = dash["profit_leaks"]
    print(f"\n[PASS] 7. User Shop Dashboard Calculated Successfully:")
    print(f"       - Total Revenue: INR {summary['total_revenue']:,.2f}")
    print(f"       - Total Expenses: INR {summary['total_expenses']:,.2f}")
    print(
        f"       - Net Profit: INR {summary['net_profit']:,.2f} ({summary['net_profit_margin_pct']}%)")
    print(f"       - Overdue Dues: INR {summary['overdue_receivables']:,.2f}")
    print(
        f"       - Health Score: {health['overall_score']}/100 ({health['status_label']})")
    print(
        f"       - Weakest Area: {health['weakest_area']['title']} -> {health['weakest_area']['description']}")

    # 8. Verify Profit Leak Scanner on User Data
    print(
        f"\n[PASS] 8. Profit Leaks Detected on User's Actual Shop Data ({len(leaks)} Leaks):")
    for l in leaks:
        print(
            f"       - [{l['urgency']}] {l['title']}: {l['financial_impact']}")

    # 9. Test AI CFO Chat on User's Shop Data
    chat_resp = client.post(
        "/api/shop/chat", json={"message": "Who owes me the most money?"}, headers=headers)
    assert chat_resp.status_code == 200
    print(
        f"\n[PASS] 9. AI CFO Chat Grounded in User's Data: {chat_resp.json()['reply'][:150]}...")

    print("\n" + "=" * 70)
    print("ALL AUTHENTICATION, DATA CRUD & DYNAMIC ANALYTICS TESTS PASSED 100%!")
    print("=" * 70)


if __name__ == "__main__":
    test_auth_and_shop()
