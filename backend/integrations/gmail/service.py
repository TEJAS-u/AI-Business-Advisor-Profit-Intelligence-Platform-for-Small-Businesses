import base64
import re
from email.utils import parseaddr

BUSINESS_KEYWORDS = [
    "invoice", "bill", "receipt", "payment", "paid", "purchase", "order",
    "sales", "supplier", "vendor", "expense", "rent", "electricity", "salary",
    "shipping", "gst", "statement", "outstanding", "due", "pending", "credit",
    "debit", "udhaar", "quotation", "delivery", "transaction"
]

BUSINESS_SEARCH_QUERY = "invoice OR bill OR receipt OR payment OR paid OR purchase OR order OR sales OR supplier OR vendor OR expense OR rent OR electricity OR salary OR shipping OR GST OR statement OR outstanding OR due OR pending OR credit OR debit OR Udhaar OR quotation OR delivery"


def decode_email_body(data: str) -> str:
    """Decode Gmail's URL-safe base64 email content."""
    if not data:
        return ""

    try:
        decoded = base64.urlsafe_b64decode(data + "===")
        return decoded.decode("utf-8", errors="ignore")
    except Exception:
        return ""


def get_header(headers, name: str) -> str:
    """Get a specific Gmail message header."""
    for header in headers:
        if header.get("name", "").lower() == name.lower():
            return header.get("value", "")
    return ""


def extract_message_details(message: dict) -> dict:
    """Extract useful information from a Gmail message."""
    payload = message.get("payload", {})
    headers = payload.get("headers", [])

    sender_raw = get_header(headers, "From")
    sender_name, sender_email = parseaddr(sender_raw)

    subject = get_header(headers, "Subject")
    received_at = get_header(headers, "Date")

    body_text = ""

    def extract_parts(part):
        nonlocal body_text

        mime_type = part.get("mimeType", "")
        body = part.get("body", {})
        data = body.get("data")

        if mime_type == "text/plain" and data:
            body_text += decode_email_body(data)

        for child in part.get("parts", []):
            extract_parts(child)

    extract_parts(payload)

    return {
        "provider_message_id": message.get("id"),
        "thread_id": message.get("threadId"),
        "sender_name": sender_name,
        "sender_email": sender_email,
        "subject": subject,
        "received_at": received_at,
        "body_text": body_text,
        "is_business_relevant": is_business_relevant(
            subject,
            body_text,
        ),
    }


def is_business_relevant(subject: str = "", body: str = "") -> bool:
    """Determine whether an email appears relevant to business data."""
    text = f"{subject} {body}".lower()

    return any(
        re.search(rf"\b{re.escape(keyword)}\b", text)
        for keyword in BUSINESS_KEYWORDS
    )


def extract_attachments(message: dict) -> list:
    """Find business-relevant file attachments in a Gmail message."""
    attachments = []

    def walk_parts(part):
        filename = part.get("filename", "")
        body = part.get("body", {})
        mime_type = part.get("mimeType", "")

        if filename:
            extension = filename.lower().split(".")[-1]

            allowed_extensions = {
                "pdf",
                "csv",
                "xls",
                "xlsx",
            }

            if extension in allowed_extensions:
                attachments.append(
                    {
                        "provider_attachment_id": body.get(
                            "attachmentId"
                        ),
                        "filename": filename,
                        "mime_type": mime_type,
                        "file_size": body.get("size", 0),
                    }
                )

        for child in part.get("parts", []):
            walk_parts(child)

    walk_parts(message.get("payload", {}))

    return attachments


def filter_business_messages(messages: list) -> list:
    """Keep only messages relevant to business operations."""
    return [
        message
        for message in messages
        if message.get("is_business_relevant")
    ]