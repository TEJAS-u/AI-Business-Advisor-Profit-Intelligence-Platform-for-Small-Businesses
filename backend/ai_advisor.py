"""
Dynamic AI Advisor & Intelligence Layer for User Shop powered by Groq LLM
Provides:
- Grounded Conversational AI CFO Chat via Groq (superfast LLM)
- AI Why Engine (Root-Cause Explainability on User Data)
- "Where Did My Money Go?" Trapped Capital Audit
- "Rescue My Profit" Turnaround Optimizer
- Today's AI Action Plan
- 1-Click Payment Reminder Generator
- Daily "Good Morning" Business Brief
"""

import os
import json
import httpx
from typing import Dict, Any, List, Optional
from analytics_engine import sanitize_for_json
from database import get_db

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_PRIMARY_MODEL = os.getenv("GROQ_PRIMARY_MODEL", "llama-3.3-70b-versatile")
GROQ_FALLBACK_MODEL = os.getenv("GROQ_FALLBACK_MODEL", "llama-3.1-8b-instant")


class UserAIAdvisor:
    def __init__(
        self,
        user_id: int,
        metrics: Dict[str, Any],
        health_score: Dict[str, Any],
        profit_leaks: List[Dict[str, Any]],
        profile: Dict[str, Any]
    ):
        self.user_id = user_id
        self.metrics = metrics
        self.health_score = health_score
        self.profit_leaks = profit_leaks
        self.profile = profile
        self.curr = profile.get("currency", "₹")

    def _call_groq_llm(self, system_prompt: str, user_message: str, max_tokens: int = 700) -> Optional[str]:
        """Calls Groq API with automatic model fallbacks."""
        if not GROQ_API_KEY:
            return None

        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        for model_name in [GROQ_PRIMARY_MODEL, GROQ_FALLBACK_MODEL, "groq/compound-mini"]:
            payload = {
                "model": model_name,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                "temperature": 0.4,
                "max_tokens": max_tokens
            }
            try:
                with httpx.Client(timeout=14.0) as client:
                    res = client.post(
                        GROQ_API_URL, headers=headers, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        choices = data.get("choices", [])
                        if choices and "message" in choices[0]:
                            return choices[0]["message"]["content"].strip()
            except Exception as e:
                continue

        return None

    def explain_why(self, target_id: Optional[str] = None, question: Optional[str] = None) -> Dict[str, Any]:
        """Explains metric changes using user's actual shop numbers."""
        summary = self.metrics.get("summary", {})
        rev = float(summary.get("total_revenue", 0.0))
        net_prof = float(summary.get("net_profit", 0.0))
        margin = float(summary.get("net_profit_margin_pct", 0.0))
        cogs = float(summary.get("total_cogs", 0.0))
        opex = float(summary.get("total_opex", 0.0))
        shop_name = self.profile.get("shop_name", "Your Shop")

        if target_id and target_id.startswith("LEAK-"):
            for leak in self.profit_leaks:
                if leak["id"] == target_id:
                    return {
                        "title": f"Why: {leak['title']}",
                        "explanation": f"**Problem**: {leak['problem']}\n\n**Why It Happened**: {leak['why_it_happened']}\n\n**Financial Impact**: {leak['financial_impact']}\n\n**Recommended Action**: {leak['recommended_action']}",
                        "action": leak["recommended_action"]
                    }

        if rev > 0:
            # Try Groq for a dynamic, shopkeeper-tailored explanation
            system_prompt = (
                f"You are the AI CFO for '{shop_name}'.\n"
                f"Shop Financials:\n"
                f"- Total Revenue: {self.curr}{rev:,.2f}\n"
                f"- Purchase Cost (COGS): {self.curr}{cogs:,.2f}\n"
                f"- Shop Operating Overhead: {self.curr}{opex:,.2f}\n"
                f"- Net Profit: {self.curr}{net_prof:,.2f} ({margin:.1f}% margin)\n\n"
                f"Explain in simple, everyday language why the profit is at this level and what 1 specific action the shopkeeper should take today."
            )
            groq_expl = self._call_groq_llm(
                system_prompt, question or "Explain my shop profit breakdown in simple terms.")

            default_explanation = (
                f"Your shop generated {self.curr}{rev:,.0f} in revenue. Product purchase costs (COGS) absorbed {self.curr}{cogs:,.0f}, "
                f"and operating overhead (rent, staff, electricity) was {self.curr}{opex:,.0f}. "
                f"This delivered a net profit of {self.curr}{net_prof:,.0f} ({margin:.1f}% net margin)."
            )

            return {
                "title": f"Financial Breakdown for {shop_name}",
                "summary_badge": f"Net Profit Margin: {margin:.1f}%",
                "waterfall": {
                    "revenue": f"{self.curr}{rev:,.0f}",
                    "cogs": f"{self.curr}{cogs:,.0f} ({(cogs/rev*100):.1f}% of sales)",
                    "opex": f"{self.curr}{opex:,.0f} ({(opex/rev*100):.1f}% of sales)",
                    "net_profit": f"{self.curr}{net_prof:,.0f}"
                },
                "explanation": groq_expl or default_explanation,
                "recommendation": "Review low-margin products and collect overdue customer dues to improve cashflow."
            }
        else:
            return {
                "title": "Awaiting Shop Data",
                "summary_badge": "No Data Added",
                "explanation": "Add sales, products, and operating expenses to generate your customized AI root-cause attribution.",
                "recommendation": "Click 'Add / Upload Bills' or 'Type Daily Records' to add your business numbers."
            }

    def find_my_money(self) -> Dict[str, Any]:
        """Audits trapped capital across receivables, inventory, and expenses."""
        summary = self.metrics.get("summary", {})
        overdue = float(summary.get("overdue_receivables", 0.0))
        cogs = float(summary.get("total_cogs", 0.0))
        opex = float(summary.get("total_opex", 0.0))

        items = []
        if overdue > 0:
            items.append({
                "category": "Overdue Customer Dues",
                "amount": overdue,
                "amount_formatted": f"{self.curr}{overdue:,.0f}",
                "description": "Pending payments overdue from customers/dealers.",
                "priority": 1,
                "priority_label": "IMMEDIATE CASH RECOVERY",
                "action": "Send 1-click payment reminder notice with quick-settlement discount."
            })

        if opex > 0:
            potential_opex_cut = opex * 0.12
            items.append({
                "category": "Operating Overhead Optimization",
                "amount": potential_opex_cut,
                "amount_formatted": f"{self.curr}{potential_opex_cut:,.0f}/month",
                "description": "Potential 12% savings by consolidating logistics and pruning utility bills.",
                "priority": 2,
                "priority_label": "EXPENSE CONTROL",
                "action": "Audit recurring utility bills and freight dispatch routes."
            })

        if not items:
            items.append({
                "category": "Capital Audit Ready",
                "amount": 0,
                "amount_formatted": f"{self.curr}0",
                "description": "Add your shop's transactions or estimate to scan for trapped working capital.",
                "priority": 1,
                "priority_label": "ACTION REQUIRED",
                "action": "Enter shop numbers to activate trapped capital scanner."
            })

        total_opp = sum([i["amount"] for i in items])
        return {
            "total_opportunity_amount": total_opp,
            "total_opportunity_formatted": f"{self.curr}{total_opp:,.0f}",
            "headline": "Money at Risk / Recovery Opportunities",
            "items": items,
            "top_priority_advice": f"Prioritize collecting overdue receivables ({self.curr}{overdue:,.0f}) to inject liquid cash into operating payroll without operational friction."
        }

    def rescue_my_profit(self) -> Dict[str, Any]:
        """Returns 5 prioritized recovery steps tailored to user's shop."""
        summary = self.metrics.get("summary", {})
        overdue = float(summary.get("overdue_receivables", 0.0))
        rev = float(summary.get("total_revenue", 0.0))
        opex = float(summary.get("total_opex", 0.0))

        opportunities = [
            {
                "rank": 1,
                "title": f"Collect Overdue Customer Dues ({self.curr}{overdue:,.0f})" if overdue > 0 else "Tighten Customer Credit Policy",
                "potential_saving": f"{self.curr}{overdue:,.0f} cash recovery" if overdue > 0 else f"{self.curr}15,000 cashflow protection",
                "impact_score": 95,
                "urgency": "HIGH",
                "confidence": "98%",
                "rationale": "Immediate working capital replenishment from verified delivery invoices."
            },
            {
                "rank": 2,
                "title": "Reprice Low-Margin Products (+10% Target)",
                "potential_saving": f"{self.curr}{round(rev * 0.04, 0):,.0f}/month margin gain" if rev > 0 else f"{self.curr}5,000/month",
                "impact_score": 90,
                "urgency": "HIGH",
                "confidence": "92%",
                "rationale": "Passing through supplier inflation directly expands gross profit margin."
            },
            {
                "rank": 3,
                "title": "Optimize Operating Overhead & Utilities",
                "potential_saving": f"{self.curr}{round(opex * 0.12, 0):,.0f}/month savings" if opex > 0 else f"{self.curr}3,000/month",
                "impact_score": 80,
                "urgency": "MEDIUM",
                "confidence": "90%",
                "rationale": "Audit transport routes, lighting bills, and recurring service contracts."
            },
            {
                "rank": 4,
                "title": "Negotiate Supplier Volume Discounts (-5%)",
                "potential_saving": f"{self.curr}{round(rev * 0.03, 0):,.0f}/month COGS reduction" if rev > 0 else f"{self.curr}4,500/month",
                "impact_score": 75,
                "urgency": "MEDIUM",
                "confidence": "85%",
                "rationale": "Consolidate monthly purchase orders to negotiate 5% bulk rebate."
            },
            {
                "rank": 5,
                "title": "Create High-Margin Product Bundles",
                "potential_saving": f"{self.curr}2,500/month profit uplift",
                "impact_score": 70,
                "urgency": "LOW",
                "confidence": "88%",
                "rationale": "Pair accessories with core equipment to increase average basket size."
            }
        ]
        return {
            "opportunities_count": len(opportunities),
            "headline": "5 Profit Recovery Opportunities Detected",
            "opportunities": opportunities,
            "cfo_recommendation": "Start with collecting overdue customer payments and repricing thin-margin SKUs for maximum confidence and immediate liquidity."
        }

    def get_action_plan(self) -> List[Dict[str, Any]]:
        summary = self.metrics.get("summary", {})
        overdue = float(summary.get("overdue_receivables", 0.0))
        rev = float(summary.get("total_revenue", 0.0))

        return [
            {
                "id": "ACT-01",
                "priority": 1,
                "title": f"Collect {self.curr}{overdue:,.0f} overdue customer receivables",
                "why": "Delayed payments restrict cashflow for supplier replenishment and payroll.",
                "expected_impact": f"{self.curr}{overdue:,.0f} cash recovery",
                "urgency": "HIGH",
                "confidence": "98%",
                "status": "Pending",
                "action_type": "Generate Reminder"
            },
            {
                "id": "ACT-02",
                "priority": 2,
                "title": "Audit product pricing against 25%+ gross margin target",
                "why": "Commodity items with razor-thin margins erode overall store profitability.",
                "expected_impact": f"+{self.curr}{round(rev * 0.04, 0):,.0f}/month margin expansion" if rev > 0 else "Margin expansion",
                "urgency": "HIGH",
                "confidence": "92%",
                "status": "Pending",
                "action_type": "Reprice"
            },
            {
                "id": "ACT-03",
                "priority": 3,
                "title": "Consolidate supplier purchase orders for bulk pricing",
                "why": "Frequent small orders incur higher freight and unnegotiated unit prices.",
                "expected_impact": "5% to 8% COGS reduction",
                "urgency": "MEDIUM",
                "confidence": "88%",
                "status": "Pending",
                "action_type": "Supplier PO"
            }
        ]

    def generate_payment_reminder(
        self,
        customer_name: str = "Customer Account",
        amount_due: float = 0.0,
        days_overdue: int = 30,
        invoice_ref: str = "INV-001"
    ) -> Dict[str, Any]:
        curr = self.curr
        letter = (
            f"Subject: Overdue Payment Reminder – {self.profile.get('shop_name', 'Our Shop')}\n\n"
            f"Dear {customer_name},\n\n"
            f"Greetings from {self.profile.get('shop_name', 'Our Shop')}.\n\n"
            f"This is a gentle reminder regarding your pending balance of {curr}{amount_due:,.2f} against Invoice #{invoice_ref}, which is currently overdue by {days_overdue} days.\n\n"
            f"To support your business, we are happy to offer a 2% Quick-Settlement Discount ({curr}{amount_due * 0.02:,.2f} savings) if the balance of {curr}{amount_due * 0.98:,.2f} is cleared within the next 48 hours.\n\n"
            f"Please arrange payment via UPI / Bank Transfer / Cash and let us know once completed.\n\n"
            f"Thank you for your business and partnership.\n\n"
            f"Warm regards,\n"
            f"Accounts & Billing\n"
            f"{self.profile.get('shop_name', 'Our Shop')}\n"
            f"{self.profile.get('location', 'India')}"
        )
        return {
            "customer_name": customer_name,
            "amount_due": amount_due,
            "days_overdue": days_overdue,
            "invoice_ref": invoice_ref,
            "letter_body": letter
        }

    def get_daily_brief(self) -> Dict[str, Any]:
        summary = self.metrics.get("summary", {})
        rev = float(summary.get("total_revenue", 0.0))
        net_prof = float(summary.get("net_profit", 0.0))
        overdue = float(summary.get("overdue_receivables", 0.0))
        shop_name = self.profile.get("shop_name", "Your Shop")

        return {
            "greeting": "GOOD MORNING 👋",
            "business_name": shop_name,
            "kpis": [
                {"label": "Turnover", "value": f"{self.curr}{rev:,.0f}",
                    "trend": "Active", "positive": True},
                {"label": "Net Profit", "value": f"{self.curr}{net_prof:,.0f}",
                    "trend": f"{summary.get('net_profit_margin_pct', 0):.1f}% Margin", "positive": net_prof > 0},
                {"label": "Receivables", "value": f"{self.curr}{overdue:,.0f}",
                    "trend": "Overdue" if overdue > 0 else "Cleared", "positive": overdue == 0}
            ],
            "important_alert": f"🚨 Receivables Alert: {self.curr}{overdue:,.0f} in customer dues pending collection." if overdue > 0 else "✅ Customer receivables are under control.",
            "opportunity": f"💡 Margin Opportunity: Repricing low-margin products can lift monthly profit by {self.curr}{round(rev * 0.04, 0):,.0f}." if rev > 0 else "💡 Add products to unlock profit opportunities.",
            "priority": f"🎯 Today's Priority: Follow up on {self.curr}{overdue:,.0f} customer dues to ensure healthy operating cashflow." if overdue > 0 else "🎯 Today's Priority: Record daily sales and audit supplier costs.",
            "audio_script": (
                f"Good morning team at {shop_name}. "
                f"Here is your AI CFO briefing. "
                f"Your recorded business turnover is {self.curr}{rev:,.0f}, delivering a net profit of {self.curr}{net_prof:,.0f}. "
                f"Your top priority today is collecting customer receivables and keeping operating overhead tight."
            )
        }

    def answer_chat(self, user_message: str) -> Dict[str, Any]:
        """Grounded conversational AI CFO Chat using Groq LLM with deterministic context."""
        summary = self.metrics.get("summary", {})
        rev = float(summary.get("total_revenue", 0.0))
        net_prof = float(summary.get("net_profit", 0.0))
        margin = float(summary.get("net_profit_margin_pct", 0.0))
        cogs = float(summary.get("total_cogs", 0.0))
        opex = float(summary.get("total_opex", 0.0))
        overdue = float(summary.get("overdue_receivables", 0.0))
        outstanding = float(summary.get("outstanding_receivables", 0.0))
        shop_name = self.profile.get("shop_name", "Your Business")
        shop_type = self.profile.get("shop_type", "Retail & Wholesale")
        location = self.profile.get("location", "India")
        health_score = self.health_score.get("overall_score", 70)
        health_status = self.health_score.get("status_label", "Moderate")
        top_prod = summary.get("top_product")
        low_prod = summary.get("lowest_margin_product")

        # Extract leaks summary
        leaks_text = ""
        if self.profit_leaks:
            leaks_text = "\n".join(
                [f"- {l.get('category', 'Leak')}: {l.get('title', '')} (Impact: {l.get('financial_impact', '')})" for l in self.profit_leaks[:3]])

        # If zero data recorded yet
        if not self.metrics.get("has_data", False):
            return {
                "reply": (
                    f"### 💡 Welcome to AI CFO for **{shop_name}**!\n\n"
                    "I am powered by high-speed Groq AI and ready to analyze your shop's performance, but I need your business numbers first.\n\n"
                    "**Two easy ways to start:**\n"
                    "1. 📁 Click **'1. Add / Upload Bills'** to upload your sales Excel sheets, invoices, or bank statement.\n"
                    "2. ✏️ Click **'Type Daily Records'** to quickly record today's sales, product catalog, or customer dues.\n\n"
                    "Once you add your records, I will analyze your true net profit, warn you about money leaks, and answer any business question!"
                )
            }

        # Fetch specific debtors & promotion facts from database
        debtors_text = ""
        exp_text = ""
        promote_text = ""
        try:
            conn = get_db()
            rec_rows = conn.execute(
                "SELECT customer_name, pending_amount, days_overdue FROM receivables WHERE user_id = ? AND pending_amount > 0 ORDER BY pending_amount DESC", (self.user_id,)).fetchall()
            exp_rows = conn.execute(
                "SELECT category, SUM(amount) as total FROM expenses WHERE user_id = ? GROUP BY category ORDER BY total DESC", (self.user_id,)).fetchall()
            conn.close()
            if rec_rows:
                debtors_text = "Customer Debtors (Who Owes Money):\n" + "\n".join(
                    [f"- {r['customer_name']}: {self.curr}{float(r['pending_amount']):,.2f} ({r['days_overdue']} days overdue)" for r in rec_rows])
            if exp_rows:
                exp_text = "Operating Expenses Breakdown:\n" + \
                    "\n".join(
                        [f"- {r['category']}: {self.curr}{float(r['total']):,.2f}" for r in exp_rows])

            # Import ZohoSocialService for promotion facts
            from integrations.zoho_social.service import ZohoSocialService
            promo_res = ZohoSocialService.get_promote_recommendations(
                self.user_id)
            recs = promo_res.get("recommendations", [])
            if recs:
                top_p = recs[0]
                promote_text = f"Top Recommended Product To Promote: '{top_p['product_name']}' (Profit/unit: {self.curr}{top_p['profit_per_unit']}, Margin: {top_p['margin_pct']}%, Stock: {top_p['current_stock']} units, Social Engagement: {top_p['social_engagement']}). Reason: {top_p['recommendation_reason']}"
        except Exception:
            debtors_text = ""
            exp_text = ""
            promote_text = ""

        top_name = top_prod.get('name') if isinstance(
            top_prod, dict) else 'N/A'
        top_rev = f"{self.curr}{float(top_prod.get('revenue', 0)):,.2f}" if isinstance(
            top_prod, dict) else 'N/A'
        low_name = low_prod.get('name') if isinstance(
            low_prod, dict) else 'N/A'
        low_margin = f"{low_prod.get('margin_pct', 0)}%" if isinstance(
            low_prod, dict) else 'N/A'

        # Construct Grounded System Prompt for Groq
        system_prompt = (
            f"You are the dedicated AI CFO & Business Advisor for '{shop_name}', a {shop_type} located in {location}.\n\n"
            f"### Verified Shop Financial & Social Data (Ground Truth):\n"
            f"- Total Revenue / Sales: {self.curr}{rev:,.2f}\n"
            f"- Product Purchase Cost (COGS): {self.curr}{cogs:,.2f}\n"
            f"- Gross Profit (Sales - Product Cost): {self.curr}{gross_profit if 'gross_profit' in locals() else (rev - cogs):,.2f}\n"
            f"- Operating Overhead (Shop Rent/Staff/Bills): {self.curr}{opex:,.2f}\n"
            f"- Actual Net Profit (Gross Profit - Operating Expenses): {self.curr}{net_prof:,.2f} ({margin:.1f}% Net Margin)\n"
            f"- Total Customer Receivables: {self.curr}{outstanding:,.2f}\n"
            f"- Overdue Customer Dues: {self.curr}{overdue:,.2f}\n"
            f"- Shop Health Score: {health_score}/100 ({health_status})\n"
            f"- Top Selling Product: {top_name} (Revenue: {top_rev})\n"
            f"- Low Margin Product: {low_name} (Margin: {low_margin})\n"
            f"{f'{promote_text}' if promote_text else ''}\n"
            f"{f'{debtors_text}' if debtors_text else ''}\n"
            f"{f'{exp_text}' if exp_text else ''}\n"
            f"{f'Detected Money Leaks:\n{leaks_text}' if leaks_text else ''}\n\n"
            f"### Instructions for Response:\n"
            f"1. Always ground your analysis strictly on the above verified financial numbers.\n"
            f"2. Use simple, warm, everyday business language suitable for a shopkeeper (English or Hinglish-friendly). Avoid complex academic jargon; explain terms simply.\n"
            f"3. When asked 'What should I promote to increase profit?', recommend the exact top product from the promotion facts, citing its profit margin, stock availability, and social engagement.\n"
            f"4. When asked 'Who owes me money?', list the exact customer debtors and amounts from the debtors list.\n"
            f"5. Use the shop's currency symbol {self.curr}.\n"
            f"6. Be direct, helpful, and provide practical, concrete recommendations on how to increase profit, collect dues, and reduce waste.\n"
            f"7. Format your output nicely using clear markdown headings (###), bullet points, and emojis."
        )

        # Call Groq LLM
        groq_reply = self._call_groq_llm(system_prompt, user_message)

        if groq_reply:
            return {"reply": groq_reply}

        # Deterministic Grounded Fallback (if Groq is unreachable)
        msg_lower = user_message.lower().strip()
        if "how is my business" in msg_lower or "performing" in msg_lower or "summary" in msg_lower:
            reply = (
                f"### 📊 Business Performance Overview for **{shop_name}**\n\n"
                f"- **Business Health Score**: **{health_score}/100** ({health_status})\n"
                f"- **Total Revenue**: {self.curr}{rev:,.0f}\n"
                f"- **Total Expenses**: {self.curr}{summary.get('total_expenses', 0):,.0f}\n"
                f"- **Net Profit**: {self.curr}{net_prof:,.0f} (**{margin:.1f}% Net Margin**)\n"
                f"- **Overdue Customer Dues**: {self.curr}{overdue:,.0f}\n\n"
                f"**Recommendation**: Focus on collecting overdue receivables and repricing low-margin items to boost liquid cash."
            )
        else:
            reply = (
                f"### 💡 AI CFO Intelligence for {shop_name}\n\n"
                f"- **Health Score**: {health_score}/100\n"
                f"- **Net Profit**: {self.curr}{net_prof:,.0f} ({margin:.1f}% margin)\n"
                f"- **Overdue Receivables**: {self.curr}{overdue:,.0f}\n\n"
                f"You can ask me any question about your profits, customer debts, expenses, or product pricing!"
            )

        return {"reply": reply}
