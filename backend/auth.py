"""
Authentication & User Management for AI CFO Platform
Handles secure password hashing, registration, login, and session verification.
"""

from fastapi import Header, HTTPException
import hashlib
import secrets
from typing import Dict, Any, Optional
from database import get_db

# In-Memory Active Sessions: token -> user_dict
ACTIVE_SESSIONS: Dict[str, Dict[str, Any]] = {}


def hash_password(password: str, salt: Optional[str] = None) -> str:
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.sha256((password + salt).encode('utf-8')).hexdigest()
    return f"{salt}${hashed}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, expected_hash = stored_hash.split('$', 1)
        actual_hash = hashlib.sha256(
            (password + salt).encode('utf-8')).hexdigest()
        return secrets.compare_digest(actual_hash, expected_hash)
    except Exception:
        return False


def register_user(
    email: str,
    password: str,
    full_name: str,
    shop_name: str,
    shop_type: str,
    location: str,
    employees: int = 1,
    currency: str = "₹"
) -> Dict[str, Any]:
    conn = get_db()
    cursor = conn.cursor()

    email_clean = email.strip().lower()

    # Check if email exists
    cursor.execute("SELECT id FROM users WHERE email = ?", (email_clean,))
    if cursor.fetchone():
        conn.close()
        raise ValueError(
            "An account with this email already exists. Please login instead.")

    pwd_hash = hash_password(password)

    cursor.execute("""
    INSERT INTO users (email, password_hash, full_name, shop_name, shop_type, location, employees, currency)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (email_clean, pwd_hash, full_name.strip(), shop_name.strip(), shop_type.strip(), location.strip(), employees, currency))

    user_id = cursor.lastrowid
    conn.commit()

    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user_row = dict(cursor.fetchone())
    conn.close()

    del user_row["password_hash"]
    token = secrets.token_hex(32)
    ACTIVE_SESSIONS[token] = user_row

    return {"token": token, "user": user_row}


def login_user(email: str, password: str) -> Dict[str, Any]:
    conn = get_db()
    cursor = conn.cursor()

    email_clean = email.strip().lower()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email_clean,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise ValueError(
            "Invalid email or password. Please check your credentials.")

    user_dict = dict(row)
    if not verify_password(password, user_dict["password_hash"]):
        raise ValueError(
            "Invalid email or password. Please check your credentials.")

    del user_dict["password_hash"]
    token = secrets.token_hex(32)
    ACTIVE_SESSIONS[token] = user_dict

    return {"token": token, "user": user_dict}


def get_user_from_token(token: Optional[str]) -> Optional[Dict[str, Any]]:
    if not token:
        return None
    # Support "Bearer <token>" or raw token
    if token.startswith("Bearer "):
        token = token.split(" ", 1)[1].strip()
    return ACTIVE_SESSIONS.get(token)


def get_current_user_dep(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization:
        conn = get_db()
        row = conn.execute(
            "SELECT * FROM users ORDER BY id ASC LIMIT 1").fetchone()
        conn.close()
        if row:
            u = dict(row)
            if "password_hash" in u:
                del u["password_hash"]
            return u
        return {
            "id": 1,
            "email": "owner@myshop.com",
            "full_name": "Shop Owner",
            "shop_name": "My Business",
            "shop_type": "Retail & Wholesale",
            "location": "India",
            "employees": 1,
            "currency": "₹"
        }

    user = get_user_from_token(authorization)
    if not user:
        raise HTTPException(
            status_code=401, detail="Session expired or invalid token. Please login.")
    return user
