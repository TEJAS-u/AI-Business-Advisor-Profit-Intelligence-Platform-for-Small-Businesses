"""
Profit Rescue Mode Generator for AI CFO Platform
Generates customized, actionable executive documents:
1. Supplier Renegotiation Letter
2. Overdue Debtor Demand & Quick-Pay Settlement Notice
3. Dead Stock Clearance & Bundling Action Blueprint
"""

from typing import Dict, Any, List
from datetime import datetime


class ProfitRescueGenerator:
    def __init__(self, profile: Dict[str, Any], metrics: Dict[str, Any], profit_leaks: List[Dict[str, Any]]):
        self.profile = profile
        self.metrics = metrics
        self.profit_leaks = profit_leaks

    def generate_supplier_letter(self, supplier_name: str = "Semicon Pacific Imports", product_name: str = "Industrial Microcontroller Core-X") -> Dict[str, Any]:
        business_name = self.profile.get(
            "business_name", "Apex Distribution Pvt Ltd")
        today = datetime.now().strftime("%d %B %Y")

        letter_content = f"""**CONFIDENTIAL PROCUREMENT MEMO**

**Date**: {today}  
**To**: Key Accounts Manager, {supplier_name}  
**From**: Head of Procurement & Operations, {business_name}  
**Subject**: Urgent Pricing Review & Contractual Volume Lock-in for {product_name}  

Dear Partnership Team,

Over the past 6 months, {business_name} has maintained a consistent purchasing volume of **85–95 units/month** for **{product_name}**, representing an annual procurement commitment in excess of **₹42,00,000**.

However, recent invoice audits indicate that our unit purchase price increased by **+22.6% (from ₹3,100 to ₹3,800/unit)** without sufficient contractual advance notification or volume indexation. This price divergence is creating unsustainable margin pressure in our distribution network.

### Our Proposal:
1. **Target Unit Rate**: We propose a revised wholesale rate of **₹3,350/unit** effective next procurement cycle.
2. **Volume Commitment**: In return, {business_name} is prepared to commit to a **quarterly advance PO of 300 units**.
3. **Payment Terms**: 100% on-time settlement within 15 days of GRN (Goods Received Note).

Kindly review this proposal and revert by end of week so we can finalize our Q2 purchase allocation.

Sincerely,  
**Chief Financial Officer & Procurement Committee**  
*{business_name}*
"""
        return {
            "title": f"Supplier Price Renegotiation Notice – {supplier_name}",
            "recipient": supplier_name,
            "target_product": product_name,
            "estimated_monthly_saving": 64400,
            "letter_body": letter_content
        }

    def generate_debtor_letter(self, customer_name: str = "Sri Venkateshwara Electricals", amount_due: float = 245000, days_overdue: int = 101) -> Dict[str, Any]:
        business_name = self.profile.get(
            "business_name", "Apex Distribution Pvt Ltd")
        today = datetime.now().strftime("%d %B %Y")
        discount_amount = amount_due * 0.02
        net_settlement = amount_due - discount_amount

        letter_content = f"""**FORMAL PAYMENT NOTICE & QUICK-PAY SETTLEMENT OFFER**

**Date**: {today}  
**To**: Managing Partner / Accounts Payable, {customer_name}  
**From**: Finance & Credit Control Department, {business_name}  
**Subject**: Overdue Statement of Account – Outstanding Balance: ₹{amount_due:,.2f}  

Dear Valued Partner,

We value the ongoing relationship between {customer_name} and {business_name}. 

According to our accounts ledger, your account carries an outstanding balance of **₹{amount_due:,.2f}** which is currently **{days_overdue} days overdue** against your standard 30-day commercial credit term.

### Special 2% Early-Settlement Incentive:
To facilitate prompt reconciliation and maintain uninterrupted supply:
- **Original Amount Due**: ₹{amount_due:,.2f}
- **Quick-Pay 2% Discount**: -₹{discount_amount:,.2f}
- **Net Settlement Amount**: **₹{net_settlement:,.2f}** (if cleared within 5 business days)

### Critical Credit Notice:
Kindly note that pursuant to company credit policy, accounts past 45 days overdue are automatically flagged for **Stop-Supply Status**. Full settlement will immediately restore your regular credit ceiling.

Please remit payment via RTGS/NEFT to our registered bank account and share the UTR reference with our finance team.

Warm regards,  
**Credit Control & Collections Unit**  
*{business_name}*
"""
        return {
            "title": f"Debtor Demand & Settlement Notice – {customer_name}",
            "customer_name": customer_name,
            "amount_due": amount_due,
            "days_overdue": days_overdue,
            "discount_offered": discount_amount,
            "net_payable": net_settlement,
            "letter_body": letter_content
        }

    def generate_bundle_blueprint(self) -> Dict[str, Any]:
        business_name = self.profile.get(
            "business_name", "Apex Distribution Pvt Ltd")
        return {
            "title": "Dead Stock Liquidation & High-Margin Bundling Blueprint",
            "dead_stock_sku": "Legacy Fluorescent Ballast 40W (470 units, ₹1,64,500 locked)",
            "partner_high_margin_sku": "Smart Hybrid Inverter 2.5kVA (31.2% Margin)",
            "recommended_bundle": "Solar/Inverter Installation Starter Kit",
            "bundle_details": [
                "Bundle 10 units of Legacy Ballasts with every Hybrid Inverter order at a 15% promotional discount.",
                "Market to electrical contractors as an 'all-in-one commercial retrofit package'.",
                "Frees ₹1.40L in trapped working capital within 45 days while lifting inverter sales volume."
            ],
            "projected_cash_recovered": 140000
        }
