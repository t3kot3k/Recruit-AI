from fastapi import APIRouter, Depends
from app.core.security import get_current_user, CurrentUser
from app.core.firebase import get_firestore_client
from app.schemas.stats import UserStats, CompletenessStatus

router = APIRouter()


@router.get("/me/stats", response_model=UserStats)
async def get_user_stats(
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get dashboard statistics for the current user."""
    db = get_firestore_client()
    user_ref = db.collection("users").document(current_user.uid)

    # Count subcollections
    cv_docs = list(user_ref.collection("cv_analyses").limit(100).stream())
    letter_docs = list(user_ref.collection("cover_letters").limit(100).stream())
    photo_docs = list(user_ref.collection("photos").limit(100).stream())
    app_docs = list(user_ref.collection("applications").limit(100).stream())

    cv_count = len(cv_docs)
    letter_count = len(letter_docs)
    photo_count = len(photo_docs)
    application_count = len(app_docs)

    # Get latest CV score
    latest_cv_score = None
    if cv_count > 0:
        latest = list(
            user_ref.collection("cv_analyses")
            .order_by("createdAt", direction="DESCENDING")
            .limit(1)
            .stream()
        )
        if latest:
            data = latest[0].to_dict()
            latest_cv_score = data.get("overallScore")

    return UserStats(
        cv_count=cv_count,
        letter_count=letter_count,
        photo_count=photo_count,
        application_count=application_count,
        latest_cv_score=latest_cv_score,
        completeness=CompletenessStatus(
            has_cv=cv_count > 0,
            has_photo=photo_count > 0,
            has_letter=letter_count > 0,
            has_application=application_count > 0,
        ),
    )
