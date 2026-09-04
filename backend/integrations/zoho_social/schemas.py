"""
Pydantic Schemas for Zoho Social Integration
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class ZohoSocialChannel(BaseModel):
    id: int
    platform: str  # 'instagram', 'facebook', 'youtube', 'x', 'linkedin', 'pinterest'
    external_channel_id: str
    account_name: str
    status: str = "active"
    profile_id: Optional[str] = ""
    brand_id: Optional[str] = ""
    portal_id: Optional[str] = ""
    source: Optional[str] = "Zoho Social"
    fetched_at: Optional[str] = None


class ZohoSocialStatusResponse(BaseModel):
    is_connected: bool
    status: str  # 'CONNECTED', 'DISCONNECTED', 'EXPIRED'
    portal_id: Optional[str] = ""
    brand_id: Optional[str] = ""
    brand_name: Optional[str] = ""
    last_synced_at: Optional[str] = None
    connected_channels: List[ZohoSocialChannel] = []


class ZohoSocialSyncResponse(BaseModel):
    status: str
    message: str
    channels_synced: int = 0
    records_received: int = 0
    records_created: int = 0
    records_updated: int = 0
    last_synced_at: Optional[str] = None


class ProductMapRequest(BaseModel):
    post_id: int
    product_id: int


class PromoteRecommendationItem(BaseModel):
    product_id: int
    product_name: str
    selling_price: float
    purchase_cost: float
    profit_per_unit: float
    margin_pct: float
    current_stock: int
    recent_sales_units: int
    social_engagement: str  # 'STRONG', 'MODERATE', 'NEW'
    related_posts_count: int
    recommendation_reason: str
    suggested_action: str


class PromoteRecommendationsResponse(BaseModel):
    recommendations: List[PromoteRecommendationItem]
    facts_summary: Dict[str, Any]
