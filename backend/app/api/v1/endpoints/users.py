from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user, CurrentUser
from app.core.firebase import delete_user
from app.services.firebase import user_service
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get the current user's profile."""
    user = await user_service.get_user(current_user.uid)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found",
        )

    return UserResponse(
        uid=user.uid,
        email=user.email,
        display_name=user.display_name,
        photo_url=user.photo_url,
        plan=user.plan,
        free_uses_remaining=user.free_uses_remaining,
        created_at=user.created_at,
    )


@router.patch("/me", response_model=UserResponse)
async def update_current_user_profile(
    update_data: UserUpdate,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Update the current user's profile."""
    user = await user_service.update_user(current_user.uid, update_data)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found",
        )

    return UserResponse(
        uid=user.uid,
        email=user.email,
        display_name=user.display_name,
        photo_url=user.photo_url,
        plan=user.plan,
        free_uses_remaining=user.free_uses_remaining,
        created_at=user.created_at,
    )


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_current_user(
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Delete the current user's account (GDPR compliance).
    This deletes all user data from Firestore and the Firebase Auth account.
    """
    # Delete user data from Firestore
    await user_service.delete_user_data(current_user.uid)

    # Delete Firebase Auth account
    try:
        delete_user(current_user.uid)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete authentication account: {str(e)}",
        )

    return None
