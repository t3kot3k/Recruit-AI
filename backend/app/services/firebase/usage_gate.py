from fastapi import HTTPException, status
from app.services.firebase.user_service import user_service


async def authorize_ai_feature(user_id: str, plan: str) -> None:
    """
    Gate for AI features. Raises HTTP 402 if user cannot proceed.

    Rules:
    - Premium users: always allowed (unlimited)
    - Free users with free_uses_remaining > 0: allowed, decrement by 1
    - Free users with 0 remaining: blocked with 402
    """
    if plan == "premium":
        return  # Unlimited

    user = await user_service.get_user(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.free_uses_remaining > 0:
        await user_service.decrement_free_uses(user_id)
        return

    raise HTTPException(
        status_code=status.HTTP_402_PAYMENT_REQUIRED,
        detail={
            "message": "You've used all your free AI uses. Upgrade to Pro for unlimited access.",
            "free_uses_remaining": 0,
            "upgrade_url": "/pricing",
        },
    )
