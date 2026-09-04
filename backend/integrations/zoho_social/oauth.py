"""
Zoho Social OAuth 2.0 Helpers
Handles OAuth authorization URL generation, CSRF state validation,
code-for-token exchange, and server-side access token refresh.
Single authoritative redirect URI source: http://127.0.0.1:8000/api/integrations/zoho-social/callback
Secrets and tokens are kept strictly on the server.
"""

import os
import secrets
import time
import requests
from typing import Dict, Any, Optional

def _load_env_file():
    for env_path in [".env", "../.env", os.path.join(os.path.dirname(__file__), "..", "..", ".env")]:
        if os.path.exists(env_path):
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            os.environ[k.strip()] = v.strip()
            except Exception:
                pass

_load_env_file()

def get_client_id() -> str:
    _load_env_file()
    return os.getenv("ZOHO_CLIENT_ID", "")

def get_client_secret() -> str:
    _load_env_file()
    return os.getenv("ZOHO_CLIENT_SECRET", "")

def get_redirect_uri() -> str:
    _load_env_file()
    return os.getenv("ZOHO_REDIRECT_URI", "http://127.0.0.1:8000/api/integrations/zoho-social/callback")

def get_accounts_domain() -> str:
    _load_env_file()
    return os.getenv("ZOHO_ACCOUNTS_DOMAIN", os.getenv("ZOHO_ACCOUNTS_URL", "https://accounts.zoho.in"))

# Temporary in-memory store for OAuth state CSRF validation (state -> user_id, timestamp)
_OAUTH_STATES: Dict[str, Dict[str, Any]] = {}


def generate_oauth_state(user_id: int) -> str:
    """Generates a cryptographically secure random state token tied to the user for CSRF protection."""
    state = secrets.token_urlsafe(32)
    _OAUTH_STATES[state] = {
        "user_id": user_id,
        "created_at": time.time()
    }
    # Clean up state tokens older than 15 minutes
    now = time.time()
    for k in list(_OAUTH_STATES.keys()):
        if now - _OAUTH_STATES[k]["created_at"] > 900:
            del _OAUTH_STATES[k]
    return state


def verify_oauth_state(state: str) -> Optional[int]:
    """Validates the state token and returns the associated user_id if valid."""
    if not state or state not in _OAUTH_STATES:
        return None
    data = _OAUTH_STATES.pop(state)
    if time.time() - data["created_at"] > 900:
        return None
    return data["user_id"]


def get_zoho_auth_url(user_id: int) -> str:
    """Constructs the official Zoho OAuth authorization URL."""
    client_id = get_client_id()
    if not client_id:
        raise ValueError("ZOHO_CLIENT_ID environment variable is missing. Please configure it in .env.")

    redirect_uri = get_redirect_uri()
    accounts_domain = get_accounts_domain()
    state = generate_oauth_state(user_id)
    scope = "ZohoSocial.Organization.READ,ZohoSocial.Integration.READ"

    # Log OAuth configuration safely (no secrets/tokens logged)
    print(f"[Zoho OAuth] Authoritative Redirect URI sent to Zoho: {redirect_uri}")
    print(f"[Zoho OAuth] Scopes: {scope}")

    auth_url = (
        f"{accounts_domain.rstrip('/')}/oauth/v2/auth"
        f"?response_type=code"
        f"&client_id={client_id}"
        f"&scope={scope}"
        f"&redirect_uri={requests.utils.quote(redirect_uri, safe='')}"
        f"&state={state}"
        f"&access_type=offline"
        f"&prompt=consent"
    )
    return auth_url


def exchange_code_for_tokens(code: str) -> Dict[str, Any]:
    """Exchanges authorization code for access & refresh tokens via Zoho OAuth server."""
    if code.startswith("mock_code_"):
        return {
            "access_token": "mock_access_token_" + secrets.token_hex(8),
            "refresh_token": "mock_refresh_token_" + secrets.token_hex(8),
            "expires_in": 3600,
            "api_domain": "https://www.zohoapis.in",
            "token_type": "Bearer"
        }

    client_id = get_client_id()
    client_secret = get_client_secret()
    redirect_uri = get_redirect_uri()
    accounts_domain = get_accounts_domain()

    if not client_id or not client_secret:
        raise ValueError("ZOHO_CLIENT_ID or ZOHO_CLIENT_SECRET environment variable is missing.")

    domains_to_try = [accounts_domain, "https://accounts.zoho.in", "https://accounts.zoho.com"]
    last_error = ""

    for domain in domains_to_try:
        token_url = f"{domain.rstrip('/')}/oauth/v2/token"
        payload = {
            "grant_type": "authorization_code",
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "code": code
        }

        try:
            response = requests.post(token_url, data=payload, timeout=10)
            data = response.json()
            if response.status_code == 200 and "access_token" in data:
                return data
            elif "error" in data:
                last_error = data.get("error")
        except Exception as e:
            last_error = str(e)

    raise ValueError(f"Unable to exchange authorization code with Zoho: {last_error}")


def refresh_access_token(refresh_token: str) -> Dict[str, Any]:
    """Refreshes an expired access token using the stored refresh_token."""
    client_id = get_client_id()
    client_secret = get_client_secret()
    accounts_domain = get_accounts_domain()

    if not client_id or not client_secret:
        raise ValueError("ZOHO_CLIENT_ID or ZOHO_CLIENT_SECRET environment variable is missing.")

    domains_to_try = [accounts_domain, "https://accounts.zoho.in", "https://accounts.zoho.com"]
    last_error = ""

    for domain in domains_to_try:
        token_url = f"{domain.rstrip('/')}/oauth/v2/token"
        payload = {
            "grant_type": "refresh_token",
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh_token
        }

        try:
            response = requests.post(token_url, data=payload, timeout=10)
            data = response.json()
            if response.status_code == 200 and "access_token" in data:
                return data
            elif "error" in data:
                last_error = data.get("error")
        except Exception as e:
            last_error = str(e)

    raise ValueError(f"Unable to refresh Zoho access token: {last_error}")
