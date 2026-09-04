"""
Diagnostic Test against https://social.zoho.in using live OAuth access token.
"""

import sqlite3
import os
import requests
from integrations.zoho_social.oauth import refresh_access_token, get_client_id, get_client_secret

def run_test():
    db_path = "ai_cfo.db"
    if not os.path.exists(db_path):
        print("[Error] ai_cfo.db not found.")
        return

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT * FROM social_connections WHERE provider = 'zoho_social' AND connection_status = 'CONNECTED'").fetchone()
    
    if not row:
        print("[Warning] No active CONNECTED record found.")
        conn.close()
        return

    access_token = row["access_token"]
    refresh_tok = row["refresh_token"]

    # Attempt to refresh token server-side if refresh_token available
    if refresh_tok and get_client_id() and get_client_secret():
        try:
            ref_data = refresh_access_token(refresh_tok)
            if "access_token" in ref_data:
                access_token = ref_data["access_token"]
                print("[Diagnostic] Refreshed access token successfully.")
        except Exception as e:
            print(f"[Token Refresh Note]: {e}")

    api_domain = "https://social.zoho.in"
    portal_id_header = "410999000000012009"

    headers = {
        "Authorization": f"Zoho-oauthtoken {access_token}",
        "Content-Type": "application/json",
        "portal_id": portal_id_header
    }

    print("=" * 70)
    print("ZOHO SOCIAL API DIAGNOSTIC: https://social.zoho.in")
    print("=" * 70)

    # 1. Portals
    url_portals = f"{api_domain}/social/v2/socialportals"
    print(f"\n[TEST 1: PORTALS] GET {url_portals}")
    print(f"Header portal_id: {portal_id_header}")
    print("Authorization   : Zoho-oauthtoken [REDACTED]")

    real_portal_id = portal_id_header
    real_brand_id = None

    try:
        res = requests.get(url_portals, headers=headers, timeout=10)
        print(f"Final URL       : {res.url}")
        print(f"HTTP Status     : {res.status_code}")
        print(f"Content-Type    : {res.headers.get('content-type', 'N/A')}")
        print(f"Safe Response   : {res.text[:500]}")

        if res.status_code == 200 and "json" in res.headers.get('content-type', '').lower():
            data = res.json()
            portals = data if isinstance(data, list) else data.get("socialportals", data.get("portals", [data]))
            print(f"Parsed Portal Count: {len(portals) if isinstance(portals, list) else 1}")
            if isinstance(portals, list) and len(portals) > 0 and isinstance(portals[0], dict):
                p_item = portals[0]
                real_portal_id = str(p_item.get("portal_id", p_item.get("id", portal_id_header)))
                p_name = p_item.get("portal_name", p_item.get("name", "N/A"))
                print(f"Discovered Portal ID  : {real_portal_id}")
                print(f"Discovered Portal Name: {p_name}")
    except Exception as e:
        print(f"[TEST 1 Error] {e}")

    # 2. Brands
    url_brands = f"{api_domain}/social/v2/socialbrands"
    brand_headers = {
        "Authorization": f"Zoho-oauthtoken {access_token}",
        "Content-Type": "application/json",
        "portal_id": real_portal_id
    }
    print(f"\n[TEST 2: BRANDS] GET {url_brands}")
    print(f"Header portal_id: {real_portal_id}")
    try:
        res_b = requests.get(url_brands, headers=brand_headers, timeout=10)
        print(f"Final URL       : {res_b.url}")
        print(f"HTTP Status     : {res_b.status_code}")
        print(f"Content-Type    : {res_b.headers.get('content-type', 'N/A')}")
        print(f"Safe Response   : {res_b.text[:500]}")

        if res_b.status_code == 200 and "json" in res_b.headers.get('content-type', '').lower():
            b_data = res_b.json()
            brands = b_data if isinstance(b_data, list) else b_data.get("socialbrands", b_data.get("brands", [b_data]))
            print(f"Parsed Brand Count: {len(brands) if isinstance(brands, list) else 1}")
            if isinstance(brands, list) and len(brands) > 0 and isinstance(brands[0], dict):
                b_item = brands[0]
                real_brand_id = str(b_item.get("brand_id", b_item.get("id", "")))
                b_name = b_item.get("brand_name", b_item.get("name", "N/A"))
                print(f"Discovered Brand ID  : {real_brand_id}")
                print(f"Discovered Brand Name: {b_name}")
    except Exception as e:
        print(f"[TEST 2 Error] {e}")

    # 3. Channels
    if real_brand_id:
        url_channels = f"{api_domain}/social/v2/channels"
        channel_headers = {
            "Authorization": f"Zoho-oauthtoken {access_token}",
            "Content-Type": "application/json",
            "portal_id": real_portal_id,
            "brand_id": real_brand_id
        }
        print(f"\n[TEST 3: CHANNELS] GET {url_channels}")
        print(f"Header portal_id: {real_portal_id}")
        print(f"Header brand_id : {real_brand_id}")
        try:
            res_c = requests.get(url_channels, headers=channel_headers, timeout=10)
            print(f"Final URL       : {res_c.url}")
            print(f"HTTP Status     : {res_c.status_code}")
            print(f"Content-Type    : {res_c.headers.get('content-type', 'N/A')}")
            print(f"Safe Response   : {res_c.text[:500]}")

            if res_c.status_code == 200 and "json" in res_c.headers.get('content-type', '').lower():
                c_data = res_c.json()
                channels = c_data if isinstance(c_data, list) else c_data.get("channels", c_data.get("networks", [c_data]))
                print(f"Parsed Channels Count: {len(channels) if isinstance(channels, list) else 1}")
                if isinstance(channels, list):
                    for ch in channels:
                        if isinstance(ch, dict):
                            print(f" -> Connected Channel: {ch.get('network', ch.get('platform', 'N/A'))} | Name: {ch.get('channel_name', ch.get('account_name', 'N/A'))} | ID: {ch.get('channel_id', ch.get('id', 'N/A'))}")
        except Exception as e:
            print(f"[TEST 3 Error] {e}")

    print("=" * 70)

if __name__ == "__main__":
    run_test()

