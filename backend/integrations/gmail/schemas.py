from pydantic import BaseModel
from typing import Optional


class GmailStatusResponse(BaseModel):
    connected: bool
    email_address: Optional[str] = None
    last_sync_at: Optional[str] = None


class GmailMessageResponse(BaseModel):
    id: str
    thread_id: Optional[str] = None
    sender: Optional[str] = None
    subject: Optional[str] = None
    received_at: Optional[str] = None
    has_attachments: bool = False


class GmailSyncResponse(BaseModel):
    success: bool
    email_address: Optional[str] = None
    messages_found: int = 0
    business_messages: int = 0
    attachments_found: int = 0
    message: str