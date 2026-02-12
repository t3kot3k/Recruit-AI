from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CVAnalysisRequest(BaseModel):
    """Request schema for CV analysis."""
    job_description: str = Field(..., min_length=50, max_length=10000)


class KeywordMatch(BaseModel):
    """Schema for a keyword match result."""
    keyword: str
    found: bool
    importance: str = "medium"  # low, medium, high
    suggestion: Optional[str] = None


class CVSection(BaseModel):
    """Schema for a CV section analysis."""
    name: str
    score: int = Field(..., ge=0, le=100)
    feedback: str
    suggestions: list[str] = []


class CVAnalysisResult(BaseModel):
    """Complete CV analysis result."""
    id: Optional[str] = None
    user_id: Optional[str] = None
    overall_score: int = Field(..., ge=0, le=100)
    ats_compatibility: int = Field(..., ge=0, le=100)
    keyword_matches: list[KeywordMatch] = []
    missing_keywords: list[str] = []
    sections: list[CVSection] = []
    summary: str
    improvement_tips: list[str] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CVAnalysisPreview(BaseModel):
    """Partial CV analysis for free users (unauthenticated)."""
    overall_score: int = Field(..., ge=0, le=100)
    preview_keywords: list[KeywordMatch] = []  # Limited to 3
    summary_preview: str  # Truncated summary
    upgrade_message: str = "Create an account for the full analysis with all keywords, detailed section feedback, and personalized improvement tips."


class OptimizedCVSection(BaseModel):
    """A section entry in the optimized CV (experience or education)."""
    title: str
    organization: str = ""
    period: str = ""
    bullets: list[str] = []
    details: Optional[str] = None


class OptimizedCV(BaseModel):
    """Complete optimized CV output from AI."""
    contact_name: str = ""
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_location: Optional[str] = None
    contact_linkedin: Optional[str] = None
    summary: str = ""
    experience: list[OptimizedCVSection] = []
    education: list[OptimizedCVSection] = []
    skills: list[str] = []
    certifications: list[str] = []
    estimated_score: int = Field(0, ge=0, le=100)


class CVExportRequest(BaseModel):
    """Request schema for exporting optimized CV to PDF."""
    template: str = Field("classic", pattern="^(minimalist|executive|classic)$")


class CVUploadResponse(BaseModel):
    """Response after uploading a CV."""
    file_id: str
    filename: str
    content_type: str
    size_bytes: int
    upload_url: Optional[str] = None
