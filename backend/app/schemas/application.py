from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


ApplicationStatus = Literal["saved", "applied", "interview", "offer", "rejected"]


class ApplicationCreate(BaseModel):
    """Schema for creating an application."""
    company_name: str = Field(..., min_length=1, max_length=200)
    position: str = Field(..., min_length=1, max_length=200)
    status: ApplicationStatus = "saved"
    job_url: Optional[str] = Field(None, max_length=2000)
    cv_analysis_id: Optional[str] = None
    cover_letter_id: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=5000)


class ApplicationUpdate(BaseModel):
    """Schema for updating an application."""
    company_name: Optional[str] = Field(None, min_length=1, max_length=200)
    position: Optional[str] = Field(None, min_length=1, max_length=200)
    status: Optional[ApplicationStatus] = None
    job_url: Optional[str] = Field(None, max_length=2000)
    cv_analysis_id: Optional[str] = None
    cover_letter_id: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=5000)


class ApplicationResponse(BaseModel):
    """Schema for application response."""
    id: str
    user_id: str
    company_name: str
    position: str
    status: ApplicationStatus
    job_url: Optional[str] = None
    cv_analysis_id: Optional[str] = None
    cover_letter_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
