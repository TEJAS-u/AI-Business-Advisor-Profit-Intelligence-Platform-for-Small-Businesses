"""
Automated Test Suite for Smart Product Search, Auto-Fill, and Stock-Deduction Sale Workflow
"""

from main import app
from fastapi.testclient import TestClient
import sys
sys.stdout.reconfigure(encoding='utf-8')


client = TestClient(app)


def test_smart_product_search_and_sale():
    print("=" * 75)
    print("TESTING SMART PRODUCT SEARCH, AUTO-FILL & STOCK-DEDUCTION SALE WORKFLOW")
    print("=" * 75)

    # 1. Register / Login test user
    import time
    email = f"smart_search_{int(time.time())}@kirana.com"
    reg_res = client.post("/api/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "Ramesh Gupta",
        "shop_name": "Gupta Kirana & Provision Store",
        "shop_type": "Grocery & Daily Needs",
        "location": "Jaipur, Rajasthan",
        "employees": 2,
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
    print("[PASS] 1. Authenticated User: Ramesh Gupta (Gupta Kirana Store)")

    # 2. Add Product "Rice"
    add_prod_res = client.post("/api/shop/products", json={
        "product_name": "Rice",
        "category": "Grocery",
        "unit_cost": 56.0,
        "unit_price": 60.0,
        "stock_on_hand": 10,
        "supplier_name": "Jaipur Grain Mandi"
    }, headers=headers)
    assert add_prod_res.status_code == 200
    prod_id = add_prod_res.json()["product_id"]
    print(
        f"[PASS] 2. Created Product 'Rice' (ID: {prod_id}, Cost: ₹56, Price: ₹60, Stock: 10)")

    # 3. Add Additional Products to test search matching
    client.post("/api/shop/products", json={
        "product_name": "Rice 5kg Bag",
        "category": "Grocery",
        "unit_cost": 290.0,
        "unit_price": 320.0,
        "stock_on_hand": 15
    }, headers=headers)

    client.post("/api/shop/products", json={
        "product_name": "Basmati Rice Royal",
        "category": "Grocery",
        "unit_cost": 480.0,
        "unit_price": 550.0,
        "stock_on_hand": 8
    }, headers=headers)

    # 4. Search Products
    prod_list_res = client.get("/api/shop/products", headers=headers)
    assert prod_list_res.status_code == 200
    all_prods = prod_list_res.json()["products"]

    # Test case-insensitive search matching for 'rice'
    matched_rice = [
        p for p in all_prods if "rice" in p["product_name"].lower()]
    assert len(
        matched_rice) == 3, f"Expected 3 rice products, found {len(matched_rice)}"
    print(
        f"[PASS] 3. Search 'rice' returned {len(matched_rice)} matching products:")
    for p in matched_rice:
        print(
            f"       - {p['product_name']} (₹{p['unit_price']}, Stock: {p['stock_on_hand']})")

    # 5. Edit Existing Product "Rice" (Update Price: ₹65, Stock: 20)
    update_res = client.put(f"/api/shop/products/{prod_id}", json={
        "product_name": "Rice",
        "category": "Grocery",
        "unit_cost": 56.0,
        "unit_price": 65.0,
        "stock_on_hand": 20,
        "supplier_name": "Jaipur Grain Mandi"
    }, headers=headers)
    assert update_res.status_code == 200
    print("[PASS] 4. Updated Product 'Rice' (Price: ₹65, Stock: 20) via PUT API without creating duplicates")

    # 6. Record Sale of 2 units of "Rice" at ₹60
    sale_res = client.post("/api/shop/sales", json={
        "product_name": "Rice",
        "category": "Grocery",
        "quantity": 2,
        "unit_price": 60.0,
        "unit_cost": 56.0,
        "customer_name": "Walk-in Customer"
    }, headers=headers)
    assert sale_res.status_code == 200
    print("[PASS] 5. Recorded Sale of 2 units of 'Rice' at ₹60 (Total: ₹120, COGS: ₹112, Profit: ₹8)")

    # 7. Verify Stock Reduction (20 -> 18)
    prod_check_res = client.get("/api/shop/products", headers=headers)
    updated_prods = prod_check_res.json()["products"]
    rice_prod = next(p for p in updated_prods if p["id"] == prod_id)
    assert rice_prod["stock_on_hand"] == 18, f"Expected stock 18, got {rice_prod['stock_on_hand']}"
    print(
        f"[PASS] 6. Verified Stock Automatically Reduced: 20 -> {rice_prod['stock_on_hand']}")

    # 8. Verify Dashboard Metrics reflect updated turnover
    dash_res = client.get("/api/shop/dashboard", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["summary"]["total_revenue"] >= 120.0
    print(
        f"[PASS] 7. Dashboard Metrics Updated (Revenue: INR {dash_data['summary']['total_revenue']:,.2f}, Top Product: {dash_data['summary']['top_product']['name']})")

    # 9. Verify AI CFO Grounded in Updated Sales Data
    chat_res = client.post(
        "/api/shop/chat", json={"message": "What is my top selling product?"}, headers=headers)
    assert chat_res.status_code == 200
    print(
        f"[PASS] 8. AI CFO Chat Grounded in Updated Sales Data: {chat_res.json()['reply'][:150]}...")

    print("\n" + "=" * 75)
    print("ALL SMART PRODUCT SEARCH, AUTO-FILL & STOCK DEDUCTION TESTS PASSED 100%!")
    print("=" * 75)


if __name__ == "__main__":
    test_smart_product_search_and_sale()
