from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from app.core.security import get_current_user, CurrentUser
from app.services.firebase import user_service
from app.services.stripe import stripe_service
from app.schemas.subscription import (
    SubscriptionStatus,
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    PortalSessionResponse,
    PlanStatus,
)
import stripe

router = APIRouter()


@router.get("/status", response_model=SubscriptionStatus)
async def get_subscription_status(
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get the current user's subscription status."""
    user = await user_service.get_user(current_user.uid)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return SubscriptionStatus(
        plan=user.plan,
        status="active",
    )


@router.get("/plan-status", response_model=PlanStatus)
async def get_plan_status(
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get combined plan + free uses status for the frontend."""
    user = await user_service.get_user(current_user.uid)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return PlanStatus(
        plan=user.plan,
        subscription_status="active" if user.plan == "premium" else "none",
        free_uses_remaining=user.free_uses_remaining,
    )


@router.post("/checkout", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    request: CheckoutSessionRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Create a Stripe Checkout session for premium subscription."""
    if not current_user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User email is required for checkout",
        )

    try:
        session = await stripe_service.create_checkout_session(
            user_id=current_user.uid,
            email=current_user.email,
            success_url=request.success_url,
            cancel_url=request.cancel_url,
        )

        return CheckoutSessionResponse(
            checkout_url=session.url,
            session_id=session.id,
        )
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create checkout session: {str(e)}",
        )


@router.post("/portal", response_model=PortalSessionResponse)
async def create_portal_session(
    return_url: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Create a Stripe Customer Portal session for managing subscription."""
    session = await stripe_service.create_portal_session(
        user_id=current_user.uid,
        return_url=return_url,
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No subscription found. Please subscribe first.",
        )

    return PortalSessionResponse(portal_url=session.url)


@router.post("/webhook", include_in_schema=False)
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="Stripe-Signature"),
):
    """Handle Stripe webhook events."""
    if not stripe_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Stripe signature",
        )

    payload = await request.body()

    try:
        event = stripe_service.construct_webhook_event(payload, stripe_signature)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid signature",
        )

    # Handle the event
    await stripe_service.handle_webhook_event(event)

    return {"status": "success"}
