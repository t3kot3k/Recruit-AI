from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.core.security import get_current_user, CurrentUser
from app.services.firebase import user_service, cover_letter_service
from app.services.firebase.usage_gate import authorize_ai_feature
from app.services.ai import generate_cover_letter
from app.schemas.cover_letter import (
    CoverLetterRequest,
    CoverLetterResponse,
    CoverLetterUpdate,
    CoverLetterListItem,
)

router = APIRouter()


@router.post("/generate", response_model=CoverLetterResponse)
async def generate_cover_letter_endpoint(
    request: CoverLetterRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Generate a personalized cover letter using AI."""
    # Check free uses / subscription
    user = await user_service.get_user(current_user.uid)
    plan = user.plan if user else "free"

    await authorize_ai_feature(current_user.uid, plan)

    # Generate cover letter
    cover_letter = await generate_cover_letter(
        job_title=request.job_title,
        company_name=request.company_name,
        job_description=request.job_description,
        tone=request.tone,
        additional_context=request.additional_context,
    )

    # Save to Firestore
    letter_id = await cover_letter_service.save_cover_letter(
        current_user.uid, cover_letter
    )
    cover_letter.id = letter_id
    cover_letter.user_id = current_user.uid

    return cover_letter


@router.get("/", response_model=List[CoverLetterListItem])
async def get_cover_letters(
    limit: int = 20,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get the current user's cover letter history."""
    letters = await cover_letter_service.get_user_cover_letters(
        current_user.uid, limit
    )
    return letters


@router.get("/{letter_id}", response_model=CoverLetterResponse)
async def get_cover_letter(
    letter_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get a specific cover letter by ID."""
    letter = await cover_letter_service.get_cover_letter(current_user.uid, letter_id)

    if not letter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cover letter not found",
        )

    return letter


@router.put("/{letter_id}", response_model=CoverLetterResponse)
async def update_cover_letter(
    letter_id: str,
    update_data: CoverLetterUpdate,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Update a cover letter's content."""
    letter = await cover_letter_service.update_cover_letter(
        current_user.uid, letter_id, update_data.content
    )

    if not letter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cover letter not found",
        )

    return letter


@router.delete("/{letter_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cover_letter(
    letter_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Delete a cover letter."""
    deleted = await cover_letter_service.delete_cover_letter(
        current_user.uid, letter_id
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cover letter not found",
        )

    return None
