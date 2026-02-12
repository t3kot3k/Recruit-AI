from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import Response
from typing import Optional
from app.core.security import get_current_user, CurrentUser
from app.services.firebase import user_service
from app.services.firebase.usage_gate import authorize_ai_feature
from app.services.ai.photo_processor import process_photo

router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/jpg"}
MAX_SIZE_MB = 10


@router.post("/enhance")
async def enhance_photo(
    file: UploadFile = File(...),
    background: str = Form("blur"),
    brightness: float = Form(1.1),
    contrast: float = Form(1.1),
    sharpness: float = Form(1.2),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Enhance a photo for professional use.
    This is a premium AI feature (uses free uses or requires Pro plan).
    """
    # Usage gate
    user = await user_service.get_user(current_user.uid)
    plan = user.plan if user else "free"
    await authorize_ai_feature(current_user.uid, plan)

    # Validate file type
    content_type = file.content_type or ""
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Please upload a JPEG or PNG image.",
        )

    # Read and validate size
    file_content = await file.read()

    # Magic bytes validation
    if not (file_content[:3] == b'\xff\xd8\xff' or  # JPEG
            file_content[:8] == b'\x89PNG\r\n\x1a\n'):  # PNG
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content does not match expected image format.",
        )

    size_mb = len(file_content) / (1024 * 1024)
    if size_mb > MAX_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {MAX_SIZE_MB}MB.",
        )

    if len(file_content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is empty.",
        )

    # Validate background parameter
    valid_backgrounds = {"original", "blur", "office", "solid"}
    if background not in valid_backgrounds:
        background = "blur"

    # Clamp numeric parameters
    brightness = max(0.5, min(2.0, brightness))
    contrast = max(0.5, min(2.0, contrast))
    sharpness = max(0.5, min(3.0, sharpness))

    # Process photo
    try:
        result_bytes = await process_photo(
            image_bytes=file_content,
            background=background,
            brightness=brightness,
            contrast=contrast,
            sharpness=sharpness,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process photo. Please try a different image.",
        )

    return Response(
        content=result_bytes,
        media_type="image/jpeg",
        headers={"Content-Disposition": "attachment; filename=enhanced_photo.jpg"},
    )
