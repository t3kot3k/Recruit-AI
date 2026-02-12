from pydantic import BaseModel, Field
from typing import Literal


class PhotoEnhanceParams(BaseModel):
    """Parameters for photo enhancement."""
    background: Literal["original", "blur", "office", "solid"] = "blur"
    brightness: float = Field(1.1, ge=0.5, le=2.0)
    contrast: float = Field(1.1, ge=0.5, le=2.0)
    sharpness: float = Field(1.2, ge=0.5, le=3.0)
