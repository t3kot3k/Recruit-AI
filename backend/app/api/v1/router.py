from fastapi import APIRouter
from .endpoints import users, cv, cover_letter, subscription, stats, applications, photo

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

api_router.include_router(
    stats.router,
    prefix="/users",
    tags=["users"],
)

api_router.include_router(
    applications.router,
    prefix="/applications",
    tags=["applications"],
)

api_router.include_router(
    photo.router,
    prefix="/photos",
    tags=["photos"],
)
