"""
FastAPI Server for AI CFO Platform
Complete Multi-User SaaS Architecture & Business Data Consolidation Engine:
- User Registration & Authentication (SQLite Database)
- Multi-Source Data Ingestion (CSV, Excel .xlsx/.xls, PDF Invoices/Reports, Bank Statements)
- Data Normalization, Entity Resolution & Fuzzy Matching
- Duplicate Detection, Conflict Detection & 6-Dimension Data Quality Scoring
- Single Source of Truth (SSOT) Unified Dataset & Lineage Tracking
- Deterministic Analytics, Profit Leak Radar & Grounded AI CFO Chat
- Single-Port Static SPA Serving
"""

from integrations.zoho_social import zoho_social_router
from integrations.gmail import gmail_router
import io
import os
import json
import sqlite3
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import pandas as pd

from database import get_db, init_db
from auth import register_user, login_user, get_user_from_token, get_current_user_dep
from analytics_engine import UserAnalyticsEngine, sanitize_for_json
from health_score import UserHealthScoreEngine
from profit_leak_radar import UserProfitLeakRadar
from simulator_engine import SimulatorEngine
from ai_advisor import UserAIAdvisor
from consolidation_engine import ConsolidationEngine

# Import Zoho Social Router

# Ensure Database Tables Exist
init_db()

app = FastAPI(
    title="AI CFO Platform & Business Data Consolidation Engine",
    description="Consolidates fragmented business data into a single source of truth and delivers AI profit intelligence.",
    version="5.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Zoho Social Integration Router
app.include_router(zoho_social_router)
app.include_router(gmail_router)

# Request Models


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    shop_name: str
    shop_type: str = "Retail & Wholesale"
    location: str = "India"
    employees: int = 1
    currency: str = "₹"


class LoginRequest(BaseModel):
    email: str
    password: str


class ResolveActionRequest(BaseModel):
    action: str


class ResolveConflictRequest(BaseModel):
    choice: str


class ProductCreateRequest(BaseModel):
    product_name: str
    category: str = "General"
    unit_cost: float
    unit_price: float
    stock_on_hand: int = 0
    supplier_name: Optional[str] = ""


class SaleCreateRequest(BaseModel):
    product_name: str
    category: Optional[str] = "General"
    quantity: int = 1
    unit_price: float
    unit_cost: float
    customer_name: Optional[str] = "Walk-in Customer"
    customer_phone: Optional[str] = ""
    payment_type: Optional[str] = "Paid"  # "Paid" | "Udhaar"
    sale_date: Optional[str] = None


class PaymentRecordRequest(BaseModel):
    amount_paid: float
    payment_date: Optional[str] = None
    note: Optional[str] = ""


class ExpenseCreateRequest(BaseModel):
    category: str
    amount: float
    vendor: Optional[str] = ""
    description: Optional[str] = ""
    expense_date: Optional[str] = None


class ReceivableCreateRequest(BaseModel):
    customer_name: str
    total_amount: float
    pending_amount: float
    days_overdue: int = 0
    due_date: Optional[str] = ""
    phone: Optional[str] = ""
    invoice_ref: Optional[str] = ""


class EstimateRequest(BaseModel):
    monthly_revenue: float
    margin_pct: float
    rent: float = 0.0
    salaries: float = 0.0
    utilities: float = 0.0
    transport: float = 0.0
    marketing: float = 0.0
    other_opex: float = 0.0
    total_receivables: float = 0.0
    overdue_receivables: float = 0.0


class WhyRequest(BaseModel):
    target_id: Optional[str] = None
    question: Optional[str] = None


class ChatRequest(BaseModel):
    message: str


class SimulationRequest(BaseModel):
    price_change_pct: float = 10.0
    supplier_discount_pct: float = 8.0
    opex_cut_pct: float = 10.0
    receivables_collected_pct: float = 60.0


class DecisionRequest(BaseModel):
    title: str
    category: str
    reason: str
    expected_outcome: str

# ----------------- AUTHENTICATION ROUTES -----------------


@app.post("/api/auth/register")
def register(req: RegisterRequest):
    try:
        res = register_user(
            email=req.email,
            password=req.password,
            full_name=req.full_name,
            shop_name=req.shop_name,
            shop_type=req.shop_type,
            location=req.location,
            employees=req.employees,
            currency=req.currency
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/auth/login")
def login(req: LoginRequest):
    try:
        res = login_user(email=req.email, password=req.password)
        return res
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@app.get("/api/auth/me")
def get_current_user_profile(user: Dict[str, Any] = Depends(get_current_user_dep)):
    return user


@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "AI CFO Business Data Consolidation Platform v5.0"}

# ----------------- DATA CONSOLIDATION ENGINE ROUTES -----------------


@app.post("/api/consolidation/upload")
async def upload_files_for_consolidation(
    files: List[UploadFile] = File(...),
    user: Dict[str, Any] = Depends(get_current_user_dep)
):
    """
    Accepts multiple heterogeneous files (CSV, Excel, PDF, Bank statements),
    runs the full consolidation pipeline, and populates the unified SSOT dataset.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")

    file_payloads = []
    for f in files:
        content = await f.read()
        file_payloads.append((f.filename, content))

    engine = ConsolidationEngine(user["id"])
    result = engine.process_files(file_payloads)
    return result


@app.get("/api/consolidation/status")
def get_consolidation_status(user: Dict[str, Any] = Depends(get_current_user_dep)):
    """Returns status of uploaded files and recent consolidation jobs."""
    conn = get_db()
    files = [dict(r) for r in conn.execute(
        "SELECT * FROM uploaded_files WHERE user_id = ? ORDER BY id DESC", (user["id"],)).fetchall()]
    jobs = [dict(r) for r in conn.execute(
        "SELECT * FROM import_jobs WHERE user_id = ? ORDER BY id DESC LIMIT 5", (user["id"],)).fetchall()]

    cursor = conn.cursor()
    cursor.execute(
        "SELECT COUNT(*) FROM duplicate_candidates WHERE user_id = ? AND status = 'PENDING'", (user["id"],))
    pending_duplicates = cursor.fetchone()[0]

    cursor.execute(
        "SELECT COUNT(*) FROM entity_matches WHERE user_id = ? AND status = 'PENDING'", (user["id"],))
    pending_entities = cursor.fetchone()[0]

    cursor.execute(
        "SELECT COUNT(*) FROM data_conflicts WHERE user_id = ? AND status = 'PENDING'", (user["id"],))
    pending_conflicts = cursor.fetchone()[0]
    conn.close()

    latest_job = jobs[0] if jobs else None
    return {
        "files_count": len(files),
        "files": files,
        "latest_job": latest_job,
        "pending_reviews": {
            "duplicates": pending_duplicates,
            "entity_matches": pending_entities,
            "conflicts": pending_conflicts,
            "total_pending": pending_duplicates + pending_entities + pending_conflicts
        }
    }


@app.get("/api/consolidation/quality")
def get_data_quality(user: Dict[str, Any] = Depends(get_current_user_dep)):
    """Returns the latest calculated 6-dimension data quality score."""
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM data_quality_logs WHERE user_id = ? ORDER BY id DESC LIMIT 1", (user["id"],)).fetchone()
    conn.close()
    if row:
        res = dict(row)
        res["warnings"] = json.loads(res.get("warnings_json") or "[]")
        return res
    return {
        "overall_score": 100.0,
        "completeness_score": 100.0,
        "consistency_score": 100.0,
        "duplicate_rate": 0.0,
        "conflict_rate": 0.0,
        "format_validity_score": 100.0,
        "entity_matching_confidence": 100.0,
        "status_label": "Awaiting Data",
        "warnings": []
    }


@app.get("/api/consolidation/unified-data")
def get_unified_ssot_data(user: Dict[str, Any] = Depends(get_current_user_dep)):
    """Returns the consolidated Single Source of Truth dataset with lineage."""
    engine = ConsolidationEngine(user["id"])
    return engine.get_unified_dataset()


@app.get("/api/consolidation/duplicates")
def get_duplicate_candidates(user: Dict[str, Any] = Depends(get_current_user_dep)):
    """Returns duplicate candidates for user review."""
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM duplicate_candidates WHERE user_id = ? ORDER BY status ASC, id DESC", (user["id"],)).fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d["record_data"] = json.loads(d.get("record_data_json") or "{}")
        result.append(d)
    return {"duplicates": result}


@app.post("/api/consolidation/duplicates/{candidate_id}/resolve")
def resolve_duplicate(candidate_id: int, req: ResolveActionRequest, user: Dict[str, Any] = Depends(get_current_user_dep)):
    engine = ConsolidationEngine(user["id"])
    return engine.resolve_duplicate(candidate_id, req.action)


@app.get("/api/consolidation/entity-matches")
def get_entity_matches(user: Dict[str, Any] = Depends(get_current_user_dep)):
    """Returns fuzzy entity matches for user review."""
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM entity_matches WHERE user_id = ? ORDER BY status ASC, id DESC", (user["id"],)).fetchall()
    conn.close()
    return {"entity_matches": [dict(r) for r in rows]}


@app.post("/api/consolidation/entity-matches/{match_id}/resolve")
def resolve_entity_match(match_id: int, req: ResolveActionRequest, user: Dict[str, Any] = Depends(get_current_user_dep)):
    engine = ConsolidationEngine(user["id"])
    return engine.resolve_entity_match(match_id, req.action)


@app.get("/api/consolidation/conflicts")
def get_conflicts(user: Dict[str, Any] = Depends(get_current_user_dep)):
    """Returns detected data conflicts for user review."""
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM data_conflicts WHERE user_id = ? ORDER BY status ASC, id DESC", (user["id"],)).fetchall()
    conn.close()
    return {"conflicts": [dict(r) for r in rows]}


@app.post("/api/consolidation/conflicts/{conflict_id}/resolve")
def resolve_conflict(conflict_id: int, req: ResolveConflictRequest, user: Dict[str, Any] = Depends(get_current_user_dep)):
    engine = ConsolidationEngine(user["id"])
    return engine.resolve_conflict(conflict_id, req.choice)

# ----------------- SHOP DATA CRUD & DASHBOARD ROUTES -----------------


@app.get("/api/shop/dashboard")
def get_shop_dashboard(user: Dict[str, Any] = Depends(get_current_user_dep)):
    engine = UserAnalyticsEngine(user["id"])
    metrics = engine.compute_all_metrics()

    health_engine = UserHealthScoreEngine(metrics, user)
    health = health_engine.compute_health_score()

    radar = UserProfitLeakRadar(user["id"], metrics, user)
    leaks = radar.detect_all_leaks()

    advisor = UserAIAdvisor(user["id"], metrics, health, leaks, user)
    find_money = advisor.find_my_money()

    return {
        "profile": user,
        "mode": metrics.get("mode", "EMPTY_STATE"),
        "has_data": metrics.get("has_data", False),
        "source_files": metrics.get("source_files", []),
        "summary": metrics["summary"],
        "health_score": health,
        "monthly_trends": metrics["monthly_trends"],
        "product_analytics": metrics["product_analytics"],
        "profit_leaks": leaks,
        "find_my_money_summary": find_money
    }


@app.get("/api/shop/health-score")
def get_health_score(user: Dict[str, Any] = Depends(get_current_user_dep)):
    engine = UserAnalyticsEngine(user["id"])
    metrics = engine.compute_all_metrics()
    health_engine = UserHealthScoreEngine(metrics, user)
    return health_engine.compute_health_score()


@app.get("/api/shop/profit-leaks")
def get_profit_leaks(user: Dict[str, Any] = Depends(get_current_user_dep)):
    engine = UserAnalyticsEngine(user["id"])
    metrics = engine.compute_all_metrics()
    radar = UserProfitLeakRadar(user["id"], metrics, user)
    return {"leaks": radar.detect_all_leaks()}


@app.post("/api/shop/why")
def explain_why(req: WhyRequest, user: Dict[str, Any] = Depends(get_current_user_dep)):
    engine = UserAnalyticsEngine(user["id"])
    metrics = engine.compute_all_metrics()
    health = UserHealthScoreEngine(metrics, user).compute_health_score()
    leaks = UserProfitLeakRadar(user["id"], metrics, user).detect_all_leaks()
    advisor = UserAIAdvisor(user["id"], metrics, health, leaks, user)
    return advisor.explain_why(target_id=req.target_id, question=req.question)


@app.get("/api/shop/find-my-money")
def get_find_my_money(user: Dict[str, Any] = Depends(get_current_user_dep)):
    engine = UserAnalyticsEngine(user["id"])
    metrics = engine.compute_all_metrics()
    health = UserHealthScoreEngine(metrics, user).compute_health_score()
    leaks = UserProfitLeakRadar(user["id"], metrics, user).detect_all_leaks()
    advisor = UserAIAdvisor(user["id"], metrics, health, leaks, user)
    return advisor.find_my_money()


@app.get("/api/shop/rescue-my-profit")
def get_rescue_my_profit(user: Dict[str, Any] = Depends(get_current_user_dep)):
    engine = UserAnalyticsEngine(user["id"])
    metrics = engine.compute_all_metrics()
    health = UserHealthScoreEngine(metrics, user).compute_health_score()
    leaks = UserProfitLeakRadar(user["id"], metrics, user).detect_all_leaks()
    advisor = UserAIAdvisor(user["id"], metrics, health, leaks, user)
    return advisor.rescue_my_profit()


@app.post("/api/shop/simulate")
def run_simulation(req: SimulationRequest, user: Dict[str, Any] = Depends(get_current_user_dep)):
    engine = UserAnalyticsEngine(user["id"])
    metrics = engine.compute_all_metrics()
    health = UserHealthScoreEngine(metrics, user).compute_health_score()
    simulator = SimulatorEngine(
        metrics=metrics, health_score=health, raw_data={})
    return simulator.simulate(
        price_change_pct=req.price_change_pct,
        supplier_discount_pct=req.supplier_discount_pct,
        opex_cut_pct=req.opex_cut_pct,
        receivables_collected_pct=req.receivables_collected_pct
    )


@app.get("/api/shop/action-plan")
def get_action_plan(user: Dict[str, Any] = Depends(get_current_user_dep)):
    engine = UserAnalyticsEngine(user["id"])
    metrics = engine.compute_all_metrics()
    health = UserHealthScoreEngine(metrics, user).compute_health_score()
    leaks = UserProfitLeakRadar(user["id"], metrics, user).detect_all_leaks()
    advisor = UserAIAdvisor(user["id"], metrics, health, leaks, user)
    return {"actions": advisor.get_action_plan()}


@app.get("/api/shop/business-memory")
def get_business_memory(user: Dict[str, Any] = Depends(get_current_user_dep)):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM decisions WHERE user_id = ? ORDER BY id DESC", (user["id"],)).fetchall()
    conn.close()
    return {"decisions": [dict(r) for r in rows]}


@app.post("/api/shop/business-memory")
def add_decision(req: DecisionRequest, user: Dict[str, Any] = Depends(get_current_user_dep)):
    conn = get_db()
    cursor = conn.cursor()
    date_val = pd.Timestamp.now().strftime("%Y-%m-%d")
    cursor.execute("""
    INSERT INTO decisions (user_id, title, category, reason, expected_outcome, decision_date, result_status, ai_learning)
    VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE / EVALUATING', 'AI CFO is tracking consolidated transaction deltas to compute ROI.')
    """, (user["id"], req.title.strip(), req.category.strip(), req.reason.strip(), req.expected_outcome.strip(), date_val))
    dec_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"status": "success", "decision_id": dec_id, "message": "Decision recorded in Business Memory."}


@app.get("/api/shop/payment-reminder")
def get_payment_reminder(
    customer_name: Optional[str] = "Customer Account",
    amount_due: Optional[float] = 0.0,
    days_overdue: Optional[int] = 30,
    invoice_ref: Optional[str] = "INV-001",
    user: Dict[str, Any] = Depends(get_current_user_dep)
):
    engine = UserAnalyticsEngine(user["id"])
    metrics = engine.compute_all_metrics()
    health = UserHealthScoreEngine(metrics, user).compute_health_score()
    leaks = UserProfitLeakRadar(user["id"], metrics, user).detect_all_leaks()
    advisor = UserAIAdvisor(user["id"], metrics, health, leaks, user)
    return advisor.generate_payment_reminder(
        customer_name=customer_name,
        amount_due=amount_due,
        days_overdue=days_overdue,
        invoice_ref=invoice_ref
    )


@app.get("/api/shop/daily-brief")
def get_daily_brief(user: Dict[str, Any] = Depends(get_current_user_dep)):
    engine = UserAnalyticsEngine(user["id"])
    metrics = engine.compute_all_metrics()
    health = UserHealthScoreEngine(metrics, user).compute_health_score()
    leaks = UserProfitLeakRadar(user["id"], metrics, user).detect_all_leaks()
    advisor = UserAIAdvisor(user["id"], metrics, health, leaks, user)
    return advisor.get_daily_brief()


@app.post("/api/shop/chat")
def chat_with_cfo(req: ChatRequest, user: Dict[str, Any] = Depends(get_current_user_dep)):
    engine = UserAnalyticsEngine(user["id"])
    metrics = engine.compute_all_metrics()
    health = UserHealthScoreEngine(metrics, user).compute_health_score()
    leaks = UserProfitLeakRadar(user["id"], metrics, user).detect_all_leaks()
    advisor = UserAIAdvisor(user["id"], metrics, health, leaks, user)
    return advisor.answer_chat(user_message=req.message)

# ----------------- MANUAL DATA CRUD & ESTIMATES -----------------


@app.get("/api/shop/products")
def get_products(user: Dict[str, Any] = Depends(get_current_user_dep)):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM products WHERE user_id = ? ORDER BY id DESC", (user["id"],)).fetchall()
    conn.close()
    return {"products": [dict(r) for r in rows]}


@app.post("/api/shop/products")
def add_product(req: ProductCreateRequest, user: Dict[str, Any] = Depends(get_current_user_dep)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO products (user_id, product_name, category, unit_cost, unit_price, stock_on_hand, supplier_name)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (user["id"], req.product_name.strip(), req.category.strip(), req.unit_cost, req.unit_price, req.stock_on_hand, req.supplier_name.strip()))
    prod_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"status": "success", "product_id": prod_id, "message": f"Product '{req.product_name}' saved successfully."}


@app.put("/api/shop/products/{product_id}")
def update_product(product_id: int, req: ProductCreateRequest, user: Dict[str, Any] = Depends(get_current_user_dep)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE products
    SET product_name = ?, category = ?, unit_cost = ?, unit_price = ?, stock_on_hand = ?, supplier_name = ?
    WHERE id = ? AND user_id = ?
    """, (req.product_name.strip(), req.category.strip(), req.unit_cost, req.unit_price, req.stock_on_hand, req.supplier_name.strip(), product_id, user["id"]))
    conn.commit()
    conn.close()
    return {"status": "success", "message": f"Product '{req.product_name}' updated successfully."}


@app.delete("/api/shop/products/{product_id}")
def delete_product(product_id: int, user: Dict[str, Any] = Depends(get_current_user_dep)):
    conn = get_db()
    conn.execute("DELETE FROM products WHERE id = ? AND user_id = ?",
                 (product_id, user["id"]))
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Product deleted."}


@app.get("/api/shop/sales")
def get_sales(user: Dict[str, Any] = Depends(get_current_user_dep)):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM sales WHERE user_id = ? ORDER BY id DESC", (user["id"],)).fetchall()
    conn.close()
    return {"sales": [dict(r) for r in rows]}


@app.post("/api/shop/sales")
def add_sale(req: SaleCreateRequest, user: Dict[str, Any] = Depends(get_current_user_dep)):
    if req.quantity <= 0:
        raise HTTPException(
            status_code=400, detail="Quantity sold must be at least 1.")

    conn = get_db()
    cursor = conn.cursor()

    # Stock validation if product exists
    prod_row = cursor.execute("""
    SELECT stock_on_hand FROM products 
    WHERE user_id = ? AND LOWER(TRIM(product_name)) = LOWER(TRIM(?))
    """, (user["id"], req.product_name.strip())).fetchone()

    if prod_row and prod_row["stock_on_hand"] is not None:
        avail_stock = int(prod_row["stock_on_hand"])
        if avail_stock > 0 and req.quantity > avail_stock:
            conn.close()
            raise HTTPException(
                status_code=400,
                detail=f"Only {avail_stock} items are available in stock."
            )

    rev = req.quantity * req.unit_price
    cogs = req.quantity * req.unit_cost
    profit = rev - cogs
    date_val = req.sale_date or pd.Timestamp.now().strftime("%Y-%m-%d")
    cust_name = req.customer_name.strip() if req.customer_name else "Walk-in Customer"
    pay_type = req.payment_type.strip() if req.payment_type else "Paid"

    cursor.execute("""
    INSERT INTO sales (user_id, product_name, category, quantity, unit_price, unit_cost, revenue, cogs, profit, customer_name, sale_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (user["id"], req.product_name.strip(), req.category.strip(), req.quantity, req.unit_price, req.unit_cost, rev, cogs, profit, cust_name, date_val))
    sale_id = cursor.lastrowid

    # Automatically reduce stock_on_hand in products table if product exists
    cursor.execute("""
    UPDATE products
    SET stock_on_hand = MAX(0, stock_on_hand - ?)
    WHERE user_id = ? AND LOWER(TRIM(product_name)) = LOWER(TRIM(?))
    """, (req.quantity, user["id"], req.product_name.strip()))

    # Also update unified_inventory if exists
    cursor.execute("""
    UPDATE unified_inventory
    SET current_stock = MAX(0, current_stock - ?)
    WHERE user_id = ? AND LOWER(TRIM(product_name)) = LOWER(TRIM(?))
    """, (req.quantity, user["id"], req.product_name.strip()))

    # If Udhaar / Credit: automatically create or increment customer receivable
    if pay_type.lower() == "udhaar":
        rec_row = cursor.execute("""
        SELECT id, total_amount, pending_amount, days_overdue FROM receivables
        WHERE user_id = ? AND LOWER(TRIM(customer_name)) = LOWER(TRIM(?))
        """, (user["id"], cust_name)).fetchone()

        if rec_row:
            cursor.execute("""
            UPDATE receivables
            SET total_amount = total_amount + ?, 
                pending_amount = pending_amount + ?,
                days_overdue = MAX(days_overdue, 1)
            WHERE id = ?
            """, (rev, rev, rec_row["id"]))
        else:
            cursor.execute("""
            INSERT INTO receivables (user_id, customer_name, total_amount, pending_amount, days_overdue, due_date, phone, invoice_ref)
            VALUES (?, ?, ?, ?, 1, ?, ?, ?)
            """, (user["id"], cust_name, rev, rev, date_val, req.customer_phone.strip() if req.customer_phone else "", f"SALE-{sale_id}"))

    conn.commit()
    conn.close()
    return {
        "status": "success",
        "sale_id": sale_id,
        "message": f"Sale of {req.quantity}x {req.product_name} recorded. Stock updated." + (" Added to Customer Udhaar." if pay_type.lower() == "udhaar" else "")
    }


@app.delete("/api/shop/sales/{sale_id}")
def delete_sale(sale_id: int, user: Dict[str, Any] = Depends(get_current_user_dep)):
    conn = get_db()
    conn.execute("DELETE FROM sales WHERE id = ? AND user_id = ?",
                 (sale_id, user["id"]))
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Sale record deleted."}


@app.get("/api/shop/expenses")
def get_expenses(user: Dict[str, Any] = Depends(get_current_user_dep)):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM expenses WHERE user_id = ? ORDER BY id DESC", (user["id"],)).fetchall()
    conn.close()
    return {"expenses": [dict(r) for r in rows]}


@app.post("/api/shop/expenses")
def add_expense(req: ExpenseCreateRequest, user: Dict[str, Any] = Depends(get_current_user_dep)):
    conn = get_db()
    cursor = conn.cursor()
    date_val = req.expense_date or pd.Timestamp.now().strftime("%Y-%m-%d")

    cursor.execute("""
    INSERT INTO expenses (user_id, category, amount, vendor, description, expense_date)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (user["id"], req.category.strip(), req.amount, req.vendor.strip(), req.description.strip(), date_val))
    exp_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"status": "success", "expense_id": exp_id, "message": "Expense recorded."}


@app.delete("/api/shop/expenses/{expense_id}")
def delete_expense(expense_id: int, user: Dict[str, Any] = Depends(get_current_user_dep)):
    conn = get_db()
    conn.execute("DELETE FROM expenses WHERE id = ? AND user_id = ?",
                 (expense_id, user["id"]))
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Expense record deleted."}


@app.get("/api/shop/receivables")
def get_receivables(user: Dict[str, Any] = Depends(get_current_user_dep)):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM receivables WHERE user_id = ? ORDER BY days_overdue DESC", (user["id"],)).fetchall()
    conn.close()
    return {"receivables": [dict(r) for r in rows]}


@app.post("/api/shop/receivables")
def add_receivable(req: ReceivableCreateRequest, user: Dict[str, Any] = Depends(get_current_user_dep)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO receivables (user_id, customer_name, total_amount, pending_amount, days_overdue, due_date, phone, invoice_ref)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (user["id"], req.customer_name.strip(), req.total_amount, req.pending_amount, req.days_overdue, req.due_date, req.phone, req.invoice_ref))
    rec_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"status": "success", "receivable_id": rec_id, "message": "Customer due record added."}


@app.post("/api/shop/receivables/{rec_id}/payment")
def record_customer_payment(rec_id: int, req: PaymentRecordRequest, user: Dict[str, Any] = Depends(get_current_user_dep)):
    if req.amount_paid <= 0:
        raise HTTPException(
            status_code=400, detail="Payment amount must be greater than zero.")
    conn = get_db()
    cursor = conn.cursor()
    row = cursor.execute(
        "SELECT * FROM receivables WHERE id = ? AND user_id = ?", (rec_id, user["id"])).fetchone()
    if not row:
        conn.close()
        raise HTTPException(
            status_code=404, detail="Customer receivable record not found.")

    curr_pending = float(row["pending_amount"])
    new_pending = max(0.0, curr_pending - req.amount_paid)

    cursor.execute("""
    UPDATE receivables
    SET pending_amount = ?
    WHERE id = ? AND user_id = ?
    """, (new_pending, rec_id, user["id"]))
    conn.commit()
    conn.close()
    return {
        "status": "success",
        "message": f"Payment of ₹{req.amount_paid:,.2f} recorded. Remaining customer due: ₹{new_pending:,.2f}.",
        "new_pending": new_pending
    }


@app.delete("/api/shop/receivables/{rec_id}")
def delete_receivable(rec_id: int, user: Dict[str, Any] = Depends(get_current_user_dep)):
    conn = get_db()
    conn.execute(
        "DELETE FROM receivables WHERE id = ? AND user_id = ?", (rec_id, user["id"]))
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Receivable record deleted."}


@app.get("/api/shop/customers")
def get_customers(user: Dict[str, Any] = Depends(get_current_user_dep)):
    """Returns aggregated customer list with total purchases, paid amount, and outstanding Udhaar."""
    conn = get_db()
    sales_rows = conn.execute(
        "SELECT * FROM sales WHERE user_id = ? ORDER BY id DESC", (user["id"],)).fetchall()
    rec_rows = conn.execute(
        "SELECT * FROM receivables WHERE user_id = ?", (user["id"],)).fetchall()
    conn.close()

    customers_map = {}

    # Aggregate receivables
    for r in rec_rows:
        c_name = r["customer_name"].strip()
        if c_name not in customers_map:
            customers_map[c_name] = {
                "customer_name": c_name,
                "phone": r["phone"] or "",
                "total_purchases": 0.0,
                "total_paid": 0.0,
                "total_due": float(r["pending_amount"]),
                "days_overdue": int(r["days_overdue"]),
                "receivable_id": r["id"],
                "transactions": []
            }
        else:
            customers_map[c_name]["total_due"] += float(r["pending_amount"])
            if r["phone"]:
                customers_map[c_name]["phone"] = r["phone"]

    # Aggregate sales
    for s in sales_rows:
        c_name = s["customer_name"].strip(
        ) if s["customer_name"] else "Walk-in Customer"
        rev = float(s["revenue"])
        if c_name not in customers_map:
            customers_map[c_name] = {
                "customer_name": c_name,
                "phone": "",
                "total_purchases": rev,
                "total_paid": rev,
                "total_due": 0.0,
                "days_overdue": 0,
                "receivable_id": None,
                "transactions": [dict(s)]
            }
        else:
            customers_map[c_name]["total_purchases"] += rev
            customers_map[c_name]["transactions"].append(dict(s))

    # Calculate total paid
    for c_name, c_data in customers_map.items():
        c_data["total_paid"] = max(
            0.0, c_data["total_purchases"] - c_data["total_due"])

    return {"customers": list(customers_map.values())}


@app.get("/api/shop/estimate")
def get_estimate(user: Dict[str, Any] = Depends(get_current_user_dep)):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM estimates WHERE user_id = ?", (user["id"],)).fetchone()
    conn.close()
    return {"estimate": dict(row) if row else None}


@app.post("/api/shop/estimate")
def save_estimate(req: EstimateRequest, user: Dict[str, Any] = Depends(get_current_user_dep)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO estimates (user_id, monthly_revenue, margin_pct, rent, salaries, utilities, transport, marketing, other_opex, total_receivables, overdue_receivables, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
        monthly_revenue=excluded.monthly_revenue,
        margin_pct=excluded.margin_pct,
        rent=excluded.rent,
        salaries=excluded.salaries,
        utilities=excluded.utilities,
        transport=excluded.transport,
        marketing=excluded.marketing,
        other_opex=excluded.other_opex,
        total_receivables=excluded.total_receivables,
        overdue_receivables=excluded.overdue_receivables,
        updated_at=CURRENT_TIMESTAMP
    """, (user["id"], req.monthly_revenue, req.margin_pct, req.rent, req.salaries, req.utilities, req.transport, req.marketing, req.other_opex, req.total_receivables, req.overdue_receivables))
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Quick estimate updated."}

# ----------------- STATIC SPA SERVING -----------------


frontend_dist = os.path.join(os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")

if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    def serve_index():
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"message": "AI CFO Platform is running."}

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="API route not found")
        target_file = os.path.join(frontend_dist, full_path)
        if os.path.exists(target_file) and os.path.isfile(target_file):
            return FileResponse(target_file)
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
