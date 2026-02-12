from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.core.security import get_current_user, CurrentUser
from app.services.firebase.application_service import application_service
from app.schemas.application import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationResponse,
)

router = APIRouter()


@router.post("/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    data: ApplicationCreate,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Create a new job application."""
    return await application_service.create_application(current_user.uid, data)


@router.get("/", response_model=List[ApplicationResponse])
async def get_applications(
    limit: int = 50,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get all job applications for the current user."""
    return await application_service.get_applications(current_user.uid, limit)


@router.get("/{app_id}", response_model=ApplicationResponse)
async def get_application(
    app_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get a specific job application."""
    app = await application_service.get_application(current_user.uid, app_id)
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )
    return app


@router.put("/{app_id}", response_model=ApplicationResponse)
async def update_application(
    app_id: str,
    data: ApplicationUpdate,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Update a job application."""
    app = await application_service.update_application(current_user.uid, app_id, data)
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )
    return app


@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    app_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Delete a job application."""
    deleted = await application_service.delete_application(current_user.uid, app_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )
    return None
