from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema."""
    email: Optional[EmailStr] = None
    display_name: Optional[str] = None
    photo_url: Optional[str] = None


class UserProfile(UserBase):
    """User profile as stored in Firestore."""
    uid: str
    plan: str = "free"
    free_uses_remaining: int = 3
    stripe_customer_id: Optional[str] = None
    created_at: Optional[datetime] = None
    consent_terms: bool = True
    consent_marketing: bool = False

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Schema for updating user profile."""
    display_name: Optional[str] = None
    consent_marketing: Optional[bool] = None


class UserResponse(UserBase):
    """User response schema."""
    uid: str
    plan: str
    free_uses_remaining: int = 3
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
