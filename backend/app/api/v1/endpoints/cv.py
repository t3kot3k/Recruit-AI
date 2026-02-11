from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from typing import Optional, Union, List
from app.core.security import get_current_user, get_optional_user, CurrentUser
from app.services.firebase import user_service, cv_service
from app.services.ai import analyze_cv
from app.utils.document_parser import extract_text_from_file, validate_file
from app.schemas.cv import (
    CVAnalysisRequest,
    CVAnalysisResult,
    CVAnalysisPreview,
)

router = APIRouter()


@router.post("/analyze", response_model=Union[CVAnalysisResult, CVAnalysisPreview])
async def analyze_cv_endpoint(
    file: UploadFile = File(...),
    job_description: str = Form(..., min_length=50),
    current_user: Optional[CurrentUser] = Depends(get_optional_user),
):
    """
    Analyze a CV against a job description.

    For authenticated users: Returns full analysis and saves to history.
    For unauthenticated users: Returns limited preview.
    ATS analysis is always free — no usage gate.
    """
    # Read file content
    file_content = await file.read()

    # Validate file
    is_valid, error = validate_file(file_content, file.content_type or "")
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error,
        )

    # Extract text from CV
    try:
        cv_text = extract_text_from_file(
            file_content,
            file.content_type or "",
            file.filename,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    if not cv_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract text from the CV. Please ensure the file is not empty or corrupted.",
        )

    # Analyze CV
    is_preview = current_user is None
    analysis = await analyze_cv(cv_text, job_description, is_preview=is_preview)

    # For authenticated users, save analysis
    if current_user and isinstance(analysis, CVAnalysisResult):
        analysis_id = await cv_service.save_analysis(current_user.uid, analysis)
        analysis.id = analysis_id
        analysis.user_id = current_user.uid

    return analysis


@router.get("/analyses", response_model=List[CVAnalysisResult])
async def get_user_analyses(
    limit: int = 10,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get the current user's CV analysis history."""
    analyses = await cv_service.get_user_analyses(current_user.uid, limit)
    return analyses


@router.get("/analyses/{analysis_id}", response_model=CVAnalysisResult)
async def get_analysis(
    analysis_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get a specific CV analysis by ID."""
    analysis = await cv_service.get_analysis(current_user.uid, analysis_id)

    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )

    return analysis


@router.delete("/analyses/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_analysis(
    analysis_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Delete a CV analysis."""
    deleted = await cv_service.delete_analysis(current_user.uid, analysis_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )

    return None
