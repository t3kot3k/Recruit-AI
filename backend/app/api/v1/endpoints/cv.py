from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import Response
from typing import Optional, Union, List
from app.core.security import get_current_user, get_optional_user, CurrentUser
from app.services.firebase import user_service, cv_service
from app.services.firebase.usage_gate import authorize_ai_feature
from app.services.ai import analyze_cv, optimize_cv
from app.utils.document_parser import extract_text_from_file, validate_file
from app.utils.pdf_generator import generate_cv_pdf
from app.schemas.cv import (
    CVAnalysisRequest,
    CVAnalysisResult,
    CVAnalysisPreview,
    OptimizedCV,
    CVExportRequest,
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


@router.post("/optimize", response_model=OptimizedCV)
async def optimize_cv_endpoint(
    file: UploadFile = File(...),
    job_description: str = Form(..., min_length=50),
    analysis_id: Optional[str] = Form(None),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Generate an AI-optimized version of a CV.
    This is a premium AI feature (uses free uses or requires Pro plan).
    """
    # Usage gate — counts as an AI use
    user = await user_service.get_user(current_user.uid)
    plan = user.plan if user else "free"
    await authorize_ai_feature(current_user.uid, plan)

    # Read and validate file
    file_content = await file.read()
    is_valid, error = validate_file(file_content, file.content_type or "")
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error,
        )

    # Extract text
    try:
        cv_text = extract_text_from_file(
            file_content, file.content_type or "", file.filename
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    if not cv_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract text from the CV.",
        )

    # Optionally load prior analysis for context
    analysis_summary = ""
    missing_keywords: list[str] = []
    if analysis_id:
        analysis = await cv_service.get_analysis(current_user.uid, analysis_id)
        if analysis:
            analysis_summary = analysis.summary
            missing_keywords = analysis.missing_keywords

    optimized = await optimize_cv(
        cv_text=cv_text,
        job_description=job_description,
        analysis_summary=analysis_summary,
        missing_keywords=missing_keywords,
    )

    return optimized


@router.post("/export")
async def export_cv_pdf(
    data: CVExportRequest,
    cv: OptimizedCV,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Export optimized CV as an ATS-friendly PDF."""
    pdf_bytes = generate_cv_pdf(cv, template=data.template)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=optimized_cv.pdf"},
    )
