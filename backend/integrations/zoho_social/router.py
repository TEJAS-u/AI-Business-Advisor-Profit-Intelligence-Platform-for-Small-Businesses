"""
FastAPI Router for Zoho Social Integration Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from typing import Dict, Any, Optional

from integrations.zoho_social.schemas import (
    ZohoSocialStatusResponse,
    ZohoSocialSyncResponse,
    ProductMapRequest,
    PromoteRecommendationsResponse
)
from integrations.zoho_social.oauth import get_zoho_auth_url, verify_oauth_state
from integrations.zoho_social.service import ZohoSocialService

# Import authentication dependency from auth module
from auth import get_current_user_dep

router = APIRouter(prefix="/api/integrations/zoho-social",
                   tags=["Zoho Social Integration"])


@router.get("/connect")
def connect_zoho_social(user: Dict[str, Any] = Depends(get_current_user_dep)):
    """Generates the secure Zoho OAuth 2.0 authorization URL."""
    auth_url = get_zoho_auth_url(user["id"])
    return {
        "status": "success",
        "auth_url": auth_url,
        "message": "Redirect user to auth_url to complete Zoho OAuth authorization."
    }


@router.get("/callback")
def zoho_social_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None
):
    """Receives Zoho OAuth callback, verifies state, exchanges code for tokens, and links connection."""
    if error:
        return RedirectResponse(url="/#datahub?zoho_error=" + error)

    if not code or not state:
        return RedirectResponse(url="/#datahub?zoho_error=missing_code_or_state")

    user_id = verify_oauth_state(state)
    if not user_id:
        return RedirectResponse(url="/#datahub?zoho_error=invalid_or_expired_state")

    try:
        res = ZohoSocialService.connect_with_code(user_id, code)
        return RedirectResponse(url="/#datahub?zoho_connected=true")
    except Exception as e:
        print(f"[ZohoSocial OAuth Error]: {e}")
        return RedirectResponse(url="/#datahub?zoho_error=" + str(e))


@router.get("/status", response_model=ZohoSocialStatusResponse)
def get_zoho_social_status(user: Dict[str, Any] = Depends(get_current_user_dep)):
    """Returns connection status, portal/brand details, and real connected channels."""
    status_data = ZohoSocialService.get_connection_status(user["id"])
    return status_data


@router.post("/sync", response_model=ZohoSocialSyncResponse)
def sync_zoho_social(user: Dict[str, Any] = Depends(get_current_user_dep)):
    """Triggers manual synchronization of connected channels, published posts, and metrics."""
    result = ZohoSocialService.sync_zoho_social_data(user["id"])
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result


@router.delete("/disconnect")
def disconnect_zoho_social(user: Dict[str, Any] = Depends(get_current_user_dep)):
    """Safely revokes and disconnects Zoho Social connection."""
    return ZohoSocialService.disconnect(user["id"])


@router.post("/map-product")
def map_product_to_social_post(req: ProductMapRequest, user: Dict[str, Any] = Depends(get_current_user_dep)):
    """Connects a social post to a business catalog product."""
    return ZohoSocialService.map_product_to_post(user["id"], req.post_id, req.product_id)


@router.get("/promote-recommendations", response_model=PromoteRecommendationsResponse)
def get_promote_recommendations(user: Dict[str, Any] = Depends(get_current_user_dep)):
    """
    SIGNATURE HACKATHON FEATURE: Backend Deterministic Promotion Engine.
    Calculates: "What should I promote to increase profit?"
    """
    return ZohoSocialService.get_promote_recommendations(user["id"])


@router.post("/instagram/sync")
def sync_instagram_data(user: Dict[str, Any] = Depends(get_current_user_dep)):
    """
    Fetches and synchronizes Instagram business and marketing activity via Zoho Social API.
    Never fabricates metrics; records metrics ONLY if returned by the API (otherwise NULL).
    """
    return ZohoSocialService.sync_instagram_data(user["id"])


@router.get("/instagram/signals")
def get_instagram_signals(user: Dict[str, Any] = Depends(get_current_user_dep)):
    """
    Retrieves real Instagram business signals and attributed revenue for the Business Data Hub.
    Calculates Instagram revenue ONLY if sales records contain explicit Instagram attribution.
    """
    return ZohoSocialService.get_instagram_business_signals(user["id"])
