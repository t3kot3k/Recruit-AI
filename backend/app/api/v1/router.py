from fastapi import APIRouter
from .endpoints import users, cv, cover_letter, subscription

api_router = APIRouter()

api_router.include_router(
    users.router,
    prefix="/users",
    tags=["users"],
)

api_router.include_router(
    cv.router,
    prefix="/cv",
    tags=["cv"],
)

api_router.include_router(
    cover_letter.router,
    prefix="/cover-letters",
    tags=["cover-letters"],
)

api_router.include_router(
    subscription.router,
    prefix="/subscriptions",
    tags=["subscriptions"],
)
