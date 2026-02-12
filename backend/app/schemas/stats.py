from pydantic import BaseModel


class CompletenessStatus(BaseModel):
    """Profile completeness indicators."""
    has_cv: bool = False
    has_photo: bool = False
    has_letter: bool = False
    has_application: bool = False


class UserStats(BaseModel):
    """Dashboard statistics for a user."""
    cv_count: int = 0
    letter_count: int = 0
    photo_count: int = 0
    application_count: int = 0
    latest_cv_score: int | None = None
    completeness: CompletenessStatus = CompletenessStatus()
