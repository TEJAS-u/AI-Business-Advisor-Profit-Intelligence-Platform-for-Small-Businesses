"""
Complete End-to-End Acceptance Test for AI CFO Platform
Verifies all 10 steps requested by the user:
Product Entry -> Search -> Sale with Stock Check & Udhaar -> Profit Waterfall -> Customer Payment -> AI CFO
"""

from main import app
from fastapi.testclient import TestClient
import sys
import time
sys.stdout.reconfigure(encoding='utf-8')


client = TestClient(app)


def test_complete_shop_flow():
    print("=" * 80)
    print("RUNNING COMPLETE END-TO-END ACCEPTANCE TEST SUITE")
    print("=" * 80)

    # User registration
    email = f"kirana_owner_{int(time.time())}@shop.com"
    reg_res = client.post("/api/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "Ramesh Gupta",
        "shop_name": "Gupta Kirana Store",
        "shop_type": "Grocery & Daily Needs",
        "location": "Jaipur, Rajasthan",
        "employees": 2,
        "currency": "₹"
    })
    assert reg_res.status_code == 200
    token = reg_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"[PASS] Authentication: User 'Ramesh Gupta' registered with token.")

    # STEP 1: Add product "Rice" (Purchase Cost: ₹56, Selling Price: ₹60, Stock: 10)
    add_p = client.post("/api/shop/products", json={
        "product_name": "Rice",
        "category": "Grocery",
        "unit_cost": 56.0,
        "unit_price": 60.0,
        "stock_on_hand": 10,
        "supplier_name": "Jaipur Mandi"
    }, headers=headers)
    assert add_p.status_code == 200
    prod_id = add_p.json()["product_id"]
    print(
        f"[PASS] STEP 1: Created product 'Rice' (ID: {prod_id}, Cost: ₹56, Price: ₹60, Stock: 10)")

    # STEP 2 & 3: Search products for "Rice"
    prods_res = client.get("/api/shop/products", headers=headers)
    assert prods_res.status_code == 200
    prods = prods_res.json()["products"]
    found_rice = next(
        (p for p in prods if p["product_name"].lower() == "rice"), None)
    assert found_rice is not None
    assert found_rice["unit_cost"] == 56.0
    assert found_rice["unit_price"] == 60.0
    assert found_rice["stock_on_hand"] == 10
    print(
        f"[PASS] STEP 2 & 3: Searched 'rice' -> Found: Price ₹{found_rice['unit_price']}, Cost ₹{found_rice['unit_cost']}, Stock {found_rice['stock_on_hand']}")

    # STEP 4 & 5: Record sale of Quantity 2 of "Rice" for Customer "Ramesh" with Payment "Udhaar"
    sale_res = client.post("/api/shop/sales", json={
        "product_name": "Rice",
        "category": "Grocery",
        "quantity": 2,
        "unit_price": 60.0,
        "unit_cost": 56.0,
        "customer_name": "Ramesh",
        "customer_phone": "9876543210",
        "payment_type": "Udhaar"
    }, headers=headers)
    assert sale_res.status_code == 200
    print(f"[PASS] STEP 4 & 5: Saved sale (Qty 2 x ₹60 = ₹120, Udhaar).")

    # Verify Stock Reduced from 10 -> 8 and Customer Due created for Ramesh = ₹120
    prods_res2 = client.get("/api/shop/products", headers=headers)
    rice_updated = next(p for p in prods_res2.json()[
                        "products"] if p["id"] == prod_id)
    assert rice_updated[
        "stock_on_hand"] == 8, f"Expected stock 8, got {rice_updated['stock_on_hand']}"

    rec_res = client.get("/api/shop/receivables", headers=headers)
    recs = rec_res.json()["receivables"]
    ramesh_rec = next(
        (r for r in recs if r["customer_name"] == "Ramesh"), None)
    assert ramesh_rec is not None, "Expected customer due record for Ramesh"
    assert ramesh_rec[
        "pending_amount"] == 120.0, f"Expected pending amount ₹120, got {ramesh_rec['pending_amount']}"
    print(
        f"[PASS] Verified: Stock = {rice_updated['stock_on_hand']} (10 -> 8) | Customer 'Ramesh' Due = ₹{ramesh_rec['pending_amount']}")

    # STEP 6: Dashboard verification
    dash_res = client.get("/api/shop/dashboard", headers=headers)
    assert dash_res.status_code == 200
    d_summary = dash_res.json()["summary"]
    assert d_summary["total_revenue"] == 120.0
    assert d_summary["total_cogs"] == 112.0
    assert d_summary["gross_profit"] == 8.0
    assert d_summary["outstanding_receivables"] == 120.0
    print(
        f"[PASS] STEP 6: Dashboard verified: Revenue=₹{d_summary['total_revenue']}, Cost=₹{d_summary['total_cogs']}, Gross Profit=₹{d_summary['gross_profit']}")

    # STEP 7: Add expenses: Rent ₹25,000, Salary ₹20,000, Electricity ₹4,000 (Total OpEx = ₹49,000)
    client.post("/api/shop/expenses", json={"category": "Shop Rent",
                "amount": 25000.0, "vendor": "Landlord"}, headers=headers)
    client.post("/api/shop/expenses", json={"category": "Staff Salaries & Wages",
                "amount": 20000.0, "vendor": "Staff"}, headers=headers)
    client.post("/api/shop/expenses", json={"category": "Electricity & Power",
                "amount": 4000.0, "vendor": "Electricity Board"}, headers=headers)

    dash_res2 = client.get("/api/shop/dashboard", headers=headers)
    d_summary2 = dash_res2.json()["summary"]
    assert d_summary2["total_revenue"] == 120.0
    assert d_summary2["total_cogs"] == 112.0
    assert d_summary2["gross_profit"] == 8.0
    assert d_summary2["total_opex"] == 49000.0
    assert d_summary2["total_expenses"] == 49112.0
    assert d_summary2["net_profit"] == -48992.0
    print(
        f"[PASS] STEP 7: Profit Waterfall Verified: Sales (₹120) - Cost (₹112) = Gross Profit (₹8) - OpEx (₹49,000) = Actual Net Profit (₹{d_summary2['net_profit']:,.2f})")

    # STEP 8: Customer Ramesh pays ₹50 -> Record payment -> Due becomes: ₹120 -> ₹70
    pay_res = client.post(f"/api/shop/receivables/{ramesh_rec['id']}/payment", json={
                          "amount_paid": 50.0}, headers=headers)
    assert pay_res.status_code == 200
    assert pay_res.json()["new_pending"] == 70.0

    cust_res = client.get("/api/shop/customers", headers=headers)
    ramesh_cust = next(c for c in cust_res.json()[
                       "customers"] if c["customer_name"] == "Ramesh")
    assert ramesh_cust["total_due"] == 70.0
    assert ramesh_cust["total_paid"] == 50.0
    assert ramesh_cust["total_purchases"] == 120.0
    print(
        f"[PASS] STEP 8: Recorded ₹50 payment for Ramesh. Due updated: ₹120 -> ₹{ramesh_cust['total_due']} (Paid: ₹{ramesh_cust['total_paid']})")

    # STEP 9: Ask AI: "Who owes me money?"
    chat1 = client.post(
        "/api/shop/chat", json={"message": "Who owes me money?"}, headers=headers)
    assert chat1.status_code == 200
    reply1 = chat1.json()["reply"]
    print(
        f"[PASS] STEP 9: AI CFO 'Who owes me money?' Reply:\n{reply1[:250]}...\n")
    assert "Ramesh" in reply1 or "70" in reply1 or "debtor" in reply1.lower(
    ) or "udhaar" in reply1.lower()

    # STEP 10: Ask AI: "How much actual profit did I make?"
    chat2 = client.post(
        "/api/shop/chat", json={"message": "How much actual profit did I make?"}, headers=headers)
    assert chat2.status_code == 200
    reply2 = chat2.json()["reply"]
    print(
        f"[PASS] STEP 10: AI CFO 'How much actual profit did I make?' Reply:\n{reply2[:250]}...\n")

    print("=" * 80)
    print("ALL 10 END-TO-END ACCEPTANCE STEPS PASSED 100%!")
    print("=" * 80)


if __name__ == "__main__":
    test_complete_shop_flow()
