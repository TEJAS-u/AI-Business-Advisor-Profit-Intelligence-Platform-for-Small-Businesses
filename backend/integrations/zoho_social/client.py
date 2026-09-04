"""
Zoho Social API Client
Encapsulates REST calls to official Zoho Social API v2 endpoints using https://social.zoho.in (as instructed by Zoho Support).
- Portals:  GET https://social.zoho.in/social/v2/socialportals
- Brands:   GET https://social.zoho.in/social/v2/socialbrands (Header: portal_id)
- Channels: GET https://social.zoho.in/social/v2/channels (Headers: portal_id, brand_id)

Provides safe diagnostic logging (HTTP method, API path, safe response headers, safe response body).
NEVER logs access tokens, refresh tokens, client secrets, or auth codes.
"""

import requests
from typing import Dict, Any, List, Optional


class ZohoSocialClient:
    def __init__(self, access_token: str, api_domain: str = "https://social.zoho.in"):
        self.access_token = access_token
        raw = (api_domain or "https://social.zoho.in").rstrip('/')
        
        # Route directly to social.zoho.in / social.zoho.com as instructed by Zoho Support
        if "zoho.in" in raw or "zohoapis.in" in raw:
            self.api_domain = "https://social.zoho.in"
        elif "zoho.eu" in raw or "zohoapis.eu" in raw:
            self.api_domain = "https://social.zoho.eu"
        else:
            self.api_domain = "https://social.zoho.com"
        
        self.headers = {
            "Authorization": f"Zoho-oauthtoken {self.access_token}",
            "Content-Type": "application/json"
        }

    def get_portals(self) -> List[Dict[str, Any]]:
        """Retrieves real organization portals using exact api_domain: GET {api_domain}/social/v2/socialportals."""
        if not self.access_token:
            raise ValueError("No access token provided for Zoho Social API.")

        if self.access_token.startswith("mock_access_token_"):
            return [{"id": "100982341", "name": "Main Shop Portal"}]

        url = f"{self.api_domain}/social/v2/socialportals"
        print(f"[ZohoSocialClient] API Domain: {self.api_domain}")
        print(f"[ZohoSocialClient] Requesting: GET {url}")
        print(f"[ZohoSocialClient] Authorization Header format: Zoho-oauthtoken [REDACTED]")

        try:
            res = requests.get(url, headers=self.headers, timeout=10)
            content_type = res.headers.get("content-type", "")

            print(f"[ZohoSocialClient] HTTP Status: {res.status_code}")
            print(f"[ZohoSocialClient] Content-Type: {content_type}")
            
            safe_headers = {k: v for k, v in res.headers.items() if k.lower() in ['server', 'date', 'www-authenticate', 'content-type', 'x-ratelimit-limit']}
            print(f"[ZohoSocialClient] Safe Response Headers: {safe_headers}")

            if res.status_code == 200:
                if "json" not in content_type.lower():
                    print(f"[ZohoSocialClient] Non-JSON response received from {url}")
                    print(f"[ZohoSocialClient] Response snippet: {res.text[:300]}")
                    raise ValueError(f"HTTP 200: Received non-JSON response ({content_type}) from {url}")

                data = res.json()
                top_keys = list(data.keys()) if isinstance(data, dict) else "array"
                print(f"[ZohoSocialClient] Response JSON top-level keys: {top_keys}")

                portals = []
                if isinstance(data, list):
                    portals = data
                elif isinstance(data, dict):
                    raw_p = (
                        data.get("socialportals") or 
                        data.get("portals") or 
                        data.get("portal") or 
                        data.get("social_portals") or 
                        data.get("data") or
                        data.get("results")
                    )
                    if isinstance(raw_p, list):
                        portals = raw_p
                    elif isinstance(raw_p, dict):
                        portals = [raw_p]
                    else:
                        portals = [data]

                print(f"[ZohoSocialClient] Number of portals in data: {len(portals)}")
                if len(portals) > 0 and isinstance(portals[0], dict):
                    first_fields = list(portals[0].keys())
                    print(f"[ZohoSocialClient] First portal object fields: {first_fields}")

                return portals
            else:
                err_body = res.text[:300]
                print(f"[ZohoSocialClient] Error Response Body: {err_body}")
                raise ValueError(f"HTTP {res.status_code}: {err_body} from {url}")

        except Exception as e:
            if "HTTP" in str(e):
                raise
            raise ValueError(f"Unable to retrieve Zoho Social portals from {url}: {str(e)}")

    def get_brands(self, portal_id: str) -> List[Dict[str, Any]]:
        """Retrieves real brands under portal_id using exact api_domain: GET {api_domain}/social/v2/socialbrands."""
        if not self.access_token:
            raise ValueError("No access token provided for Zoho Social API.")

        if self.access_token.startswith("mock_access_token_"):
            return [{"id": "900123847", "name": "Main Shop Brand"}]

        url = f"{self.api_domain}/social/v2/socialbrands"
        headers = dict(self.headers)
        headers["portal_id"] = str(portal_id)

        print(f"[ZohoSocialClient] Requesting: GET {url} (portal_id: {portal_id})")

        try:
            res = requests.get(url, headers=headers, timeout=10)
            content_type = res.headers.get("content-type", "")

            print(f"[ZohoSocialClient] HTTP Status: {res.status_code}")
            print(f"[ZohoSocialClient] Content-Type: {content_type}")

            if res.status_code == 200:
                if "json" not in content_type.lower():
                    raise ValueError(f"HTTP 200: Received non-JSON response ({content_type}) from {url}")

                data = res.json()
                top_keys = list(data.keys()) if isinstance(data, dict) else "array"
                print(f"[ZohoSocialClient] Response JSON top-level keys: {top_keys}")

                brands = []
                if isinstance(data, list):
                    brands = data
                elif isinstance(data, dict):
                    raw_b = (
                        data.get("socialbrands") or 
                        data.get("brands") or 
                        data.get("brand") or 
                        data.get("social_brands") or 
                        data.get("data") or
                        data.get("results")
                    )
                    if isinstance(raw_b, list):
                        brands = raw_b
                    elif isinstance(raw_b, dict):
                        brands = [raw_b]
                    else:
                        brands = [data]

                print(f"[ZohoSocialClient] Number of brands in data: {len(brands)}")
                if len(brands) > 0 and isinstance(brands[0], dict):
                    first_fields = list(brands[0].keys())
                    print(f"[ZohoSocialClient] First brand object fields: {first_fields}")

                return brands
            else:
                err_body = res.text[:300]
                print(f"[ZohoSocialClient] Error Response Body: {err_body}")
                raise ValueError(f"HTTP {res.status_code}: {err_body} from {url}")

        except Exception as e:
            if "HTTP" in str(e):
                raise
            raise ValueError(f"Unable to retrieve Zoho Social brands from {url}: {str(e)}")

    def get_connected_channels(self, portal_id: str, brand_id: str) -> List[Dict[str, Any]]:
        """Retrieves real connected channels using exact api_domain: GET {api_domain}/social/v2/channels."""
        if not self.access_token:
            raise ValueError("No access token provided for Zoho Social API.")

        if self.access_token.startswith("mock_access_token_"):
            return [
                {"id": "101", "channel_id": "ig_98765", "account_name": "@shop_official", "network": "instagram", "status": "active"},
                {"id": "102", "channel_id": "yt_12345", "account_name": "Shop Channel", "network": "youtube", "status": "active"},
                {"id": "103", "channel_id": "fb_55443", "account_name": "Shop Page", "network": "facebook", "status": "active"}
            ]

        url = f"{self.api_domain}/social/v2/channels"
        headers = dict(self.headers)
        headers["portal_id"] = str(portal_id)
        headers["brand_id"] = str(brand_id)

        print(f"[ZohoSocialClient] Requesting: GET {url} (portal_id: {portal_id}, brand_id: {brand_id})")

        try:
            res = requests.get(url, headers=headers, timeout=10)
            content_type = res.headers.get("content-type", "")

            print(f"[ZohoSocialClient] HTTP Status: {res.status_code}")
            print(f"[ZohoSocialClient] Content-Type: {content_type}")

            if res.status_code == 200:
                if "json" not in content_type.lower():
                    raise ValueError(f"HTTP 200: Received non-JSON response ({content_type}) from {url}")

                data = res.json()
                top_keys = list(data.keys()) if isinstance(data, dict) else "array"
                print(f"[ZohoSocialClient] Response JSON top-level keys: {top_keys}")

                channels = []
                if isinstance(data, list):
                    channels = data
                elif isinstance(data, dict):
                    raw_c = (
                        data.get("channels") or 
                        data.get("networks") or 
                        data.get("channel") or 
                        data.get("data") or
                        data.get("results")
                    )
                    if isinstance(raw_c, list):
                        channels = raw_c
                    elif isinstance(raw_c, dict):
                        channels = [raw_c]
                    else:
                        channels = [data]

                print(f"[ZohoSocialClient] Number of channels in data: {len(channels)}")
                if len(channels) > 0 and isinstance(channels[0], dict):
                    first_fields = list(channels[0].keys())
                    print(f"[ZohoSocialClient] First channel object fields: {first_fields}")

                return channels
            else:
                err_body = res.text[:300]
                print(f"[ZohoSocialClient] Error Response Body: {err_body}")
                raise ValueError(f"HTTP {res.status_code}: {err_body} from {url}")

        except Exception as e:
            if "HTTP" in str(e):
                raise
            raise ValueError(f"Unable to retrieve Zoho Social channels from {url}: {str(e)}")

    def get_channel_posts(self, portal_id: str, brand_id: str, channel_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Officially checks for channel posts.
        Note: The official Zoho Social REST API v2 publishing/posts endpoints (GET /social/v2/posts) 
        require special scope permissions and return HTTP 401 INVALID_OAUTHSCOPE under standard access.
        Returns an empty list [] without throwing exceptions or fabricating fake posts.
        """
        if not self.access_token or self.access_token.startswith("mock_access_token_"):
            return []

        url = f"{self.api_domain}/social/v2/posts"
        headers = dict(self.headers)
        headers["portal_id"] = str(portal_id)
        headers["brand_id"] = str(brand_id)
        if channel_id:
            headers["channel_id"] = str(channel_id)

        try:
            res = requests.get(url, headers=headers, timeout=10)
            print(f"[ZohoSocialClient] Request URL: GET {url}")
            print(f"[ZohoSocialClient] HTTP Status: {res.status_code}")
            if res.status_code == 200 and "json" in res.headers.get("content-type", "").lower():
                data = res.json()
                keys = list(data.keys()) if isinstance(data, dict) else "array"
                print(f"[ZohoSocialClient] Response top-level keys: {keys}")
                records = []
                if isinstance(data, list):
                    records = data
                elif isinstance(data, dict):
                    records = data.get("posts") or data.get("data") or data.get("results") or []
                print(f"[ZohoSocialClient] Number of returned records: {len(records)}")
                return records
            elif res.status_code == 401:
                print(f"[ZohoSocialClient] Scope Error: HTTP 401 INVALID_OAUTHSCOPE on GET {url}. Scope ZohoSocial.Publish.READ required.")
            print(f"[ZohoSocialClient] Published post retrieval via GET /social/v2/posts is not supported by current Zoho Social API access (Status {res.status_code}).")
            return []
        except Exception as e:
            print(f"[ZohoSocialClient] Channel posts fetch info: {e}")
            return []

    def get_draft_posts(self, portal_id: str, brand_id: str) -> Dict[str, Any]:
        """
        Tests and fetches draft posts: GET {api_domain}/social/v2/posts/drafts.
        Logs request URL, HTTP status, top-level keys, and returned record count.
        Detects missing scope (e.g., ZohoSocial.Publish.READ) cleanly on HTTP 401.
        """
        url = f"{self.api_domain}/social/v2/posts/drafts"
        headers = dict(self.headers)
        headers["portal_id"] = str(portal_id)
        headers["brand_id"] = str(brand_id)

        print(f"[ZohoSocialClient] Request URL: GET {url} (portal_id: {portal_id}, brand_id: {brand_id})")

        if not self.access_token or self.access_token.startswith("mock_access_token_"):
            print(f"[ZohoSocialClient] HTTP Status: 200 (Mock)")
            print(f"[ZohoSocialClient] Response top-level keys: ['drafts']")
            print(f"[ZohoSocialClient] Number of returned records: 0")
            return {"status_code": 200, "supported": True, "records": []}

        try:
            res = requests.get(url, headers=headers, timeout=10)
            print(f"[ZohoSocialClient] HTTP Status: {res.status_code}")

            if res.status_code == 200:
                data = res.json()
                keys = list(data.keys()) if isinstance(data, dict) else "array"
                print(f"[ZohoSocialClient] Response top-level keys: {keys}")
                records = []
                if isinstance(data, list):
                    records = data
                elif isinstance(data, dict):
                    records = data.get("drafts") or data.get("posts") or data.get("data") or []
                print(f"[ZohoSocialClient] Number of returned records: {len(records)}")
                return {"status_code": 200, "supported": True, "records": records}
            elif res.status_code == 401:
                print(f"[ZohoSocialClient] Scope Error: HTTP 401 INVALID_OAUTHSCOPE on GET {url}. Missing scope: ZohoSocial.Publish.READ / ZohoSocial.Publish.ALL")
                return {"status_code": 401, "supported": False, "error": "INVALID_OAUTHSCOPE", "records": []}
            else:
                print(f"[ZohoSocialClient] GET {url} returned HTTP {res.status_code}: {res.text[:200]}")
                return {"status_code": res.status_code, "supported": False, "records": []}
        except Exception as e:
            print(f"[ZohoSocialClient] Exception fetching drafts from {url}: {e}")
            return {"status_code": 500, "supported": False, "records": []}

    def get_scheduled_posts(self, portal_id: str, brand_id: str) -> Dict[str, Any]:
        """
        Tests and fetches scheduled posts: GET {api_domain}/social/v2/posts/schedules.
        Logs request URL, HTTP status, top-level keys, and returned record count.
        Detects missing scope (e.g., ZohoSocial.Publish.READ) cleanly on HTTP 401.
        """
        url = f"{self.api_domain}/social/v2/posts/schedules"
        headers = dict(self.headers)
        headers["portal_id"] = str(portal_id)
        headers["brand_id"] = str(brand_id)

        print(f"[ZohoSocialClient] Request URL: GET {url} (portal_id: {portal_id}, brand_id: {brand_id})")

        if not self.access_token or self.access_token.startswith("mock_access_token_"):
            print(f"[ZohoSocialClient] HTTP Status: 200 (Mock)")
            print(f"[ZohoSocialClient] Response top-level keys: ['schedules']")
            print(f"[ZohoSocialClient] Number of returned records: 0")
            return {"status_code": 200, "supported": True, "records": []}

        try:
            res = requests.get(url, headers=headers, timeout=10)
            print(f"[ZohoSocialClient] HTTP Status: {res.status_code}")

            if res.status_code == 200:
                data = res.json()
                keys = list(data.keys()) if isinstance(data, dict) else "array"
                print(f"[ZohoSocialClient] Response top-level keys: {keys}")
                records = []
                if isinstance(data, list):
                    records = data
                elif isinstance(data, dict):
                    records = data.get("schedules") or data.get("posts") or data.get("data") or []
                print(f"[ZohoSocialClient] Number of returned records: {len(records)}")
                return {"status_code": 200, "supported": True, "records": records}
            elif res.status_code == 401:
                print(f"[ZohoSocialClient] Scope Error: HTTP 401 INVALID_OAUTHSCOPE on GET {url}. Missing scope: ZohoSocial.Publish.READ / ZohoSocial.Publish.ALL")
                return {"status_code": 401, "supported": False, "error": "INVALID_OAUTHSCOPE", "records": []}
            else:
                print(f"[ZohoSocialClient] GET {url} returned HTTP {res.status_code}: {res.text[:200]}")
                return {"status_code": res.status_code, "supported": False, "records": []}
        except Exception as e:
            print(f"[ZohoSocialClient] Exception fetching scheduled posts from {url}: {e}")
            return {"status_code": 500, "supported": False, "records": []}
