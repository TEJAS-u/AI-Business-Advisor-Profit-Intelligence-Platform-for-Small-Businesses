"""
Test script for Phase 2 Endpoints (What-If Simulator, Profit Rescue Mode, Runway Engine)
"""
from main import app
from fastapi.testclient import TestClient
import sys
sys.stdout.reconfigure(encoding='utf-8')


client = TestClient(app)


def test_phase2():
    print("Testing /api/simulate (What-If Scenario Simulator) ...")
    r = client.post("/api/simulate", json={
        "price_hike_pct": 10.0,
        "supplier_discount_pct": 12.0,
        "receivables_collected_pct": 50.0,
        "opex_cut_pct": 15.0
    })
    assert r.status_code == 200
    sim = r.json()
    print(
        f"Simulated Profit Gain: INR {sim['deltas']['total_profit_gain']:,.2f}")
    print(
        f"Health Score Gain: +{sim['deltas']['health_score_gain']} pts (from {sim['baseline']['health_score']} to {sim['simulated']['health_score']})")

    print("\nTesting /api/rescue/supplier-letter ...")
    r = client.get("/api/rescue/supplier-letter")
    assert r.status_code == 200
    letter = r.json()
    print("Supplier Letter Title:", letter["title"])
    print("Estimated Monthly Saving: INR", letter["estimated_monthly_saving"])

    print("\nTesting /api/rescue/debtor-letter ...")
    r = client.get("/api/rescue/debtor-letter")
    assert r.status_code == 200
    d_letter = r.json()
    print("Debtor Letter Title:", d_letter["title"])
    print("Amount Due: INR", d_letter["amount_due"])

    print("\nTesting /api/rescue/bundle-strategy ...")
    r = client.get("/api/rescue/bundle-strategy")
    assert r.status_code == 200
    bundle = r.json()
    print("Bundle Strategy Title:", bundle["title"])
    print("Cash Recovered Projection: INR", bundle["projected_cash_recovered"])

    print("\nTesting /api/runway (Cashflow Runway & Early Warning) ...")
    r = client.get("/api/runway")
    assert r.status_code == 200
    runway = r.json()
    print(
        f"Runway Days: {runway['runway_days']} days | Stress Index: {runway['stress_index']}/100 ({runway['risk_level']})")
    print(
        f"Monthly Inflow: INR {runway['monthly_inflow_rate']:,.2f} | Burn: INR {runway['monthly_burn_rate']:,.2f}")

    print("\n>>> ALL PHASE 2 BACKEND TESTS PASSED SUCCESSFULLY! <<<")


if __name__ == "__main__":
    test_phase2()
