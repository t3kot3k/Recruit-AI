from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime


class SubscriptionStatus(BaseModel):
    """Current subscription status."""
    plan: Literal["free", "premium"]
    status: Literal["active", "canceled", "past_due", "unpaid", "trialing"] = "active"
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False


class CheckoutSessionRequest(BaseModel):
    """Request to create a Stripe checkout session."""
    success_url: str
    cancel_url: str


class CheckoutSessionResponse(BaseModel):
    """Response with Stripe checkout session URL."""
    checkout_url: str
    session_id: str


class PortalSessionResponse(BaseModel):
    """Response with Stripe customer portal URL."""
    portal_url: str


class PlanStatus(BaseModel):
    """Combined subscription + free uses status for the frontend."""
    plan: Literal["free", "premium"]
    subscription_status: Literal["active", "canceled", "past_due", "unpaid", "trialing", "none"] = "none"
    free_uses_remaining: int = 3
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False
