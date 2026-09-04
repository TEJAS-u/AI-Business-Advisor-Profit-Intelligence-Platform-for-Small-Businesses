import os
import json
import sqlite3
from datetime import datetime
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv

from .oauth import create_authorization_flow
from .client import create_gmail_client, get_profile, list_messages, get_message, get_attachment
from .service import extract_message_details, extract_attachments, BUSINESS_SEARCH_QUERY
from consolidation_engine import ConsolidationEngine
from auth import get_current_user_dep, get_user_from_token

load_dotenv()

router = APIRouter(
    prefix="/api/integrations/gmail",
    tags=["Gmail Integration"],
)

# Temporary in-memory storage for Gmail Credentials
gmail_credentials = None
gmail_oauth_state = None
gmail_oauth_flow = None


@router.get("/connect")
def connect_gmail():
    """Start Google Gmail OAuth flow."""
    global gmail_oauth_state
    global gmail_oauth_flow

    gmail_oauth_flow, authorization_url, state = create_authorization_flow()
    gmail_oauth_state = state

    return RedirectResponse(url=authorization_url)


@router.get("/callback")
def gmail_callback(code: str, state: str):
    """Handle Google OAuth callback."""
    global gmail_credentials
    global gmail_oauth_state
    global gmail_oauth_flow

    if not code:
        raise HTTPException(
            status_code=400,
            detail="Authorization code was not received.",
        )

    if gmail_oauth_state and state != gmail_oauth_state:
        raise HTTPException(
            status_code=400,
            detail="Invalid OAuth state.",
        )

    if gmail_oauth_flow is None:
        raise HTTPException(
            status_code=400,
            detail="OAuth session expired. Please connect Gmail again.",
        )

    try:
        gmail_oauth_flow.fetch_token(code=code)
        gmail_credentials = gmail_oauth_flow.credentials

        return RedirectResponse(url="/#datahub?gmail_connected=true")

    except Exception as exc:
        return RedirectResponse(url=f"/#datahub?gmail_error={str(exc)}")


@router.get("/status")
def gmail_status():
    """Check whether Gmail is connected."""
    if gmail_credentials is None:
        return {
            "connected": False,
            "email_address": None,
        }

    try:
        gmail_service = create_gmail_client(
            access_token=gmail_credentials.token,
            refresh_token=gmail_credentials.refresh_token,
            client_id=os.getenv("GOOGLE_GMAIL_CLIENT_ID"),
            client_secret=os.getenv("GOOGLE_GMAIL_CLIENT_SECRET"),
        )

        profile = get_profile(gmail_service)

        return {
            "connected": True,
            "email_address": profile.get("emailAddress"),
        }

    except Exception as exc:
        return {
            "connected": False,
            "email_address": None,
            "error": str(exc),
        }


@router.post("/sync")
@router.get("/sync")
@router.get("/messages")
def sync_gmail(user: Dict[str, Any] = Depends(get_current_user_dep)):
    """
    Pipes Gmail business emails & attachments directly into the existing ConsolidationEngine.
    Processes every email and attachment independently so one bad file never crashes the sync.
    """
    global gmail_credentials

    if gmail_credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Gmail is not connected. Please connect Gmail first.",
        )

    try:
        gmail_service = create_gmail_client(
            access_token=gmail_credentials.token,
            refresh_token=gmail_credentials.refresh_token,
            client_id=os.getenv("GOOGLE_GMAIL_CLIENT_ID"),
            client_secret=os.getenv("GOOGLE_GMAIL_CLIENT_SECRET"),
        )

        # 1. Fetch business-relevant messages matching financial keywords
        message_refs = list_messages(
            gmail_service,
            query=BUSINESS_SEARCH_QUERY,
            max_results=50,
        )

        total_evaluated = len(message_refs)
        print(f"[Gmail Sync] Messages found: {total_evaluated}")

        if total_evaluated == 0:
            return {
                "status": "success",
                "success": True,
                "message": "No business emails found.",
                "emails_found": 0,
                "business_emails": 0,
                "attachments_found": 0,
                "attachments_processed": 0,
                "attachments_failed": 0,
                "records_imported": 0,
                "count": 0,
                "failed_attachments": [],
                "last_synced_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }

        business_emails_count = 0
        attachments_found = 0
        attachments_processed = 0
        attachments_failed = 0
        records_imported = 0
        failed_attachments: List[Dict[str, str]] = []

        user_id = user["id"]

        # 2. Iterate through messages independently
        for message_ref in message_refs:
            msg_id = message_ref["id"]
            try:
                message = get_message(gmail_service, msg_id)
                details = extract_message_details(message)

                if not details.get("is_business_relevant"):
                    continue

                business_emails_count += 1
                subject = details.get("subject", "No Subject").replace("/", "_").replace("\\", "_")
                sender = details.get("sender_email", "unknown")
                print(f"[Gmail Sync] Business message: '{subject}' from {sender}")

                att_list = extract_attachments(message)

                if att_list:
                    print(f"[Gmail Sync] Attachments found ({len(att_list)}): {[a.get('filename') for a in att_list]}")
                    for att in att_list:
                        attachments_found += 1
                        att_id = att.get("provider_attachment_id")
                        filename = att.get("filename", "attachment.pdf")

                        if not att_id:
                            continue

                        # Wrap each attachment independently
                        try:
                            print(f"[Gmail Sync] Processing attachment: {filename}")
                            file_bytes = get_attachment(gmail_service, msg_id, att_id)
                            if file_bytes:
                                provenance_name = f"Gmail -> {sender} -> {subject} -> {filename}"
                                engine = ConsolidationEngine(user_id)
                                result = engine.process_files([(provenance_name, file_bytes)])
                                attachments_processed += 1
                                records_imported += result.get("total_records", 0)
                        except Exception as att_err:
                            attachments_failed += 1
                            failed_attachments.append({
                                "filename": filename,
                                "reason": f"Unable to safely parse file structure: {str(att_err)}"
                            })
                            print(f"[Gmail Sync Attachment Warning] '{filename}' skipped: {att_err}")
                else:
                    # Parse structured financial text body if available
                    body_text = details.get("body_text", "").strip()
                    if body_text and len(body_text) > 10:
                        attachments_found += 1
                        try:
                            text_filename = f"Gmail -> {sender} -> {subject} -> email_body.txt"
                            print(f"[Gmail Sync] Processing email text body from '{subject}'")
                            engine = ConsolidationEngine(user_id)
                            result = engine.process_files([(text_filename, body_text.encode("utf-8"))])
                            records_in_body = result.get("summary", {}).get("records_normalized", 0) or result.get("total_records", 0)
                            if records_in_body > 0:
                                attachments_processed += 1
                                records_imported += records_in_body
                            else:
                                print(f"[Gmail Sync] Email body '{subject}' contained no structured financial facts.")
                        except Exception as text_err:
                            attachments_failed += 1
                            failed_attachments.append({
                                "filename": f"email_{msg_id[:8]}.txt",
                                "reason": f"Could not extract financial fields: {str(text_err)}"
                            })
            except Exception as msg_err:
                print(f"[Gmail Sync Message Warning] Message {msg_id} skipped: {msg_err}")

        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        if records_imported == 0:
            status_msg = "Sync completed — no business records found."
        else:
            status_msg = f"Sync completed — {records_imported} business records imported."

        if attachments_failed > 0:
            status_msg += f" ({attachments_failed} attachment warnings)"

        print(f"[Gmail Sync] Final result: {status_msg} (Imported records: {records_imported})")

        return {
            "status": "success",
            "success": True,
            "message": status_msg,
            "emails_found": total_evaluated,
            "business_emails": business_emails_count,
            "business_emails_count": business_emails_count,
            "attachments_found": attachments_found,
            "attachments_processed": attachments_processed,
            "attachments_failed": attachments_failed,
            "records_imported": records_imported,
            "count": records_imported,
            "failed_attachments": failed_attachments,
            "last_synced_at": now_str
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Gmail sync failed: {str(exc)}",
        )


@router.get("/imported-data")
def get_imported_gmail_data(user: Dict[str, Any] = Depends(get_current_user_dep)):
    """
    Retrieves all consolidated SSOT records derived from Gmail for the user.
    """
    user_id = user["id"]
    from database import get_db
    conn = get_db()

    records = []

    # Sales
    sales = conn.execute(
        "SELECT id, source_file, customer_name, product_name, total_revenue, sale_date FROM unified_sales WHERE user_id = ? AND source_file LIKE 'Gmail%' ORDER BY id DESC",
        (user_id,)
    ).fetchall()
    for s in sales:
        records.append({
            "id": s["id"],
            "type": "Sale",
            "party_name": s["customer_name"] or "General Customer",
            "item_name": s["product_name"] or "General Item",
            "amount": s["total_revenue"],
            "date": s["sale_date"] or "",
            "source_lineage": s["source_file"],
            "status": "CONSOLIDATED"
        })

    # Expenses
    expenses = conn.execute(
        "SELECT id, source_file, vendor_name, category, amount, expense_date FROM unified_expenses WHERE user_id = ? AND source_file LIKE 'Gmail%' ORDER BY id DESC",
        (user_id,)
    ).fetchall()
    for e in expenses:
        records.append({
            "id": e["id"],
            "type": "Expense",
            "party_name": e["vendor_name"] or "Supplier/Vendor",
            "item_name": e["category"] or "Operating Expense",
            "amount": e["amount"],
            "date": e["expense_date"] or "",
            "source_lineage": e["source_file"],
            "status": "CONSOLIDATED"
        })

    # Invoices
    invoices = conn.execute(
        "SELECT id, source_file, party_name, total_amount, invoice_date, status FROM unified_invoices WHERE user_id = ? AND source_file LIKE 'Gmail%' ORDER BY id DESC",
        (user_id,)
    ).fetchall()
    for i in invoices:
        records.append({
            "id": i["id"],
            "type": "Invoice / Payment",
            "party_name": i["party_name"] or "Customer/Party",
            "item_name": "Invoice Line",
            "amount": i["total_amount"],
            "date": i["invoice_date"] or "",
            "source_lineage": i["source_file"],
            "status": i["status"] or "PENDING"
        })

    conn.close()

    return {
        "status": "success",
        "count": len(records),
        "records": records
    }