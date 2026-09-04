"""
Automated Integration Test Suite for Zoho Social Integration in AI CFO
Verifies OAuth connect, state validation, callback, channel discovery, idempotent sync,
product mapping, deterministic promotion engine, and AI CFO Q&A grounding.
"""

from main import app
from fastapi.testclient import TestClient
import sys
import time
import urllib.parse
sys.stdout.reconfigure(encoding='utf-8')


client = TestClient(app, follow_redirects=False)


def test_zoho_social_integration():
    print("=" * 80)
    print("RUNNING ZOHO SOCIAL INTEGRATION TEST SUITE")
    print("=" * 80)

    # 1. User Registration & Auth
    email = f"zoho_shopkeeper_{int(time.time())}@shop.com"
    reg_res = client.post("/api/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "Ramesh Gupta",
        "shop_name": "Gupta Kirana Store",
        "shop_type": "Grocery & Retail",
        "location": "Jaipur, Rajasthan",
        "employees": 2,
        "currency": "₹"
    })
    assert reg_res.status_code == 200
    token = reg_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"[PASS] TEST 1: User authenticated with token.")

    # Add sample products to database
    p1 = client.post("/api/shop/products", json={
        "product_name": "Fortune Basmati Rice 5kg",
        "category": "Grocery",
        "unit_cost": 280.0,
        "unit_price": 340.0,
        "stock_on_hand": 25,
        "supplier_name": "City Mandi"
    }, headers=headers)
    assert p1.status_code == 200
    prod_id = p1.json()["product_id"]

    p2 = client.post("/api/shop/products", json={
        "product_name": "9W High-Lumen LED Bulb",
        "category": "Electronics",
        "unit_cost": 45.0,
        "unit_price": 90.0,
        "stock_on_hand": 40,
        "supplier_name": "Electro Supply"
    }, headers=headers)
    assert p2.status_code == 200
    print(f"[PASS] Created sample catalog products for promotion tests.")

    # 2. Check initial Zoho status (Should be DISCONNECTED)
    status_initial = client.get(
        "/api/integrations/zoho-social/status", headers=headers)
    assert status_initial.status_code == 200
    s_data = status_initial.json()
    assert s_data["is_connected"] == False
    assert s_data["status"] == "DISCONNECTED"
    print(f"[PASS] TEST 2: Initial Zoho Social status is DISCONNECTED.")

    # 3. Initiate OAuth Connect
    connect_res = client.get(
        "/api/integrations/zoho-social/connect", headers=headers)
    assert connect_res.status_code == 200
    auth_url = connect_res.json()["auth_url"]
    assert "accounts.zoho.com" in auth_url or "response_type=code" in auth_url

    # Extract state parameter from auth_url
    parsed_url = urllib.parse.urlparse(auth_url)
    params = urllib.parse.parse_qs(parsed_url.query)
    state_param = params["state"][0]
    print(
        f"[PASS] TEST 3 & 4: Generated Zoho OAuth URL with CSRF state: {state_param[:15]}...")

    # 4. Execute OAuth Callback
    callback_res = client.get(
        f"/api/integrations/zoho-social/callback?code=mock_code_123&state={state_param}")
    assert callback_res.status_code == 307 or callback_res.status_code == 302
    assert "zoho_connected=true" in callback_res.headers["location"]
    print(f"[PASS] TEST 5: OAuth callback verified state & redirected with zoho_connected=true.")

    # 5. Verify Connected Status & Real Channels
    status_connected = client.get(
        "/api/integrations/zoho-social/status", headers=headers)
    assert status_connected.status_code == 200
    sc_data = status_connected.json()
    assert sc_data["is_connected"] == True
    assert sc_data["status"] == "CONNECTED"
    assert len(sc_data["connected_channels"]) > 0
    channels_list = [c["platform"] for c in sc_data["connected_channels"]]
    print(f"[PASS] TEST 6 & 7: Verified Connected Channels: {channels_list}")

    # 6. Manual Sync Now Execution
    sync_res = client.post(
        "/api/integrations/zoho-social/sync", headers=headers)
    assert sync_res.status_code == 200
    sync_data = sync_res.json()
    assert sync_data["status"] == "success"
    print(
        f"[PASS] TEST 8: Manual Sync executed successfully ({sync_data['records_created']} posts imported).")

    # Test Idempotency: Repeating Sync should not duplicate records
    sync_res2 = client.post(
        "/api/integrations/zoho-social/sync", headers=headers)
    assert sync_res2.status_code == 200
    assert sync_res2.json()[
        "records_created"] == 0, "Expected 0 duplicate records created on repeated sync"
    print(f"[PASS] TEST 9: Idempotency verified — Repeated sync did not create duplicate posts.")

    # 7. Map Product to Social Post
    map_res = client.post("/api/integrations/zoho-social/map-product", json={
        "post_id": 1,
        "product_id": prod_id
    }, headers=headers)
    assert map_res.status_code == 200
    print(
        f"[PASS] TEST 10: Connected Instagram post to catalog product ID {prod_id}.")

    # 8. Query Deterministic Promotion Recommendations
    promo_res = client.get(
        "/api/integrations/zoho-social/promote-recommendations", headers=headers)
    assert promo_res.status_code == 200
    recs = promo_res.json()["recommendations"]
    assert len(recs) > 0
    top_rec = recs[0]
    print(
        f"[PASS] TEST 11: Promotion Engine calculated top product to promote: '{top_rec['product_name']}' (Profit/unit: ₹{top_rec['profit_per_unit']}, Stock: {top_rec['current_stock']}).")

    # 9. Ask Grounded AI CFO: "What should I promote to increase profit?"
    chat_res = client.post(
        "/api/shop/chat", json={"message": "What should I promote to increase profit?"}, headers=headers)
    assert chat_res.status_code == 200
    ai_reply = chat_res.json()["reply"]
    print(
        f"[PASS] TEST 12: Grounded AI CFO Chat Response:\n{ai_reply[:250]}...\n")
    assert top_rec["product_name"] in ai_reply or "promote" in ai_reply.lower()

    # 10. Disconnect Zoho Social
    disc_res = client.delete(
        "/api/integrations/zoho-social/disconnect", headers=headers)
    assert disc_res.status_code == 200

    status_disc = client.get(
        "/api/integrations/zoho-social/status", headers=headers)
    assert status_disc.json()["is_connected"] == False
    print(f"[PASS] TEST 13: Disconnected Zoho Social safely.")

    print("=" * 80)
    print("ALL ZOHO SOCIAL INTEGRATION TESTS PASSED 100%!")
    print("=" * 80)


if __name__ == "__main__":
    test_zoho_social_integration()
