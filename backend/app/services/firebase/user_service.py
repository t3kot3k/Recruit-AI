from google.cloud.firestore import FieldFilter
from datetime import datetime
from typing import Optional
from app.core.firebase import get_firestore_client
from app.schemas.user import UserProfile, UserUpdate


class UserService:
    """Service for managing user data in Firestore."""

    COLLECTION = "users"

    def __init__(self):
        self.db = get_firestore_client()

    async def get_user(self, uid: str) -> Optional[UserProfile]:
        """Get a user profile by UID."""
        doc_ref = self.db.collection(self.COLLECTION).document(uid)
        doc = doc_ref.get()

        if not doc.exists:
            return None

        data = doc.to_dict()
        return UserProfile(
            uid=uid,
            email=data.get("email"),
            display_name=data.get("displayName"),
            photo_url=data.get("photoURL"),
            plan=data.get("plan", "free"),
            free_uses_remaining=data.get("freeUsesRemaining", 3),
            stripe_customer_id=data.get("stripeCustomerId"),
            created_at=data.get("createdAt"),
            consent_terms=data.get("consentTerms", True),
            consent_marketing=data.get("consentMarketing", False),
        )

    async def update_user(self, uid: str, update_data: UserUpdate) -> Optional[UserProfile]:
        """Update a user profile."""
        doc_ref = self.db.collection(self.COLLECTION).document(uid)

        update_dict = {}
        if update_data.display_name is not None:
            update_dict["displayName"] = update_data.display_name
        if update_data.consent_marketing is not None:
            update_dict["consentMarketing"] = update_data.consent_marketing

        if update_dict:
            update_dict["updatedAt"] = datetime.utcnow()
            doc_ref.update(update_dict)

        return await self.get_user(uid)

    async def update_stripe_customer_id(self, uid: str, customer_id: str) -> None:
        """Update user's Stripe customer ID."""
        doc_ref = self.db.collection(self.COLLECTION).document(uid)
        doc_ref.update({
            "stripeCustomerId": customer_id,
            "updatedAt": datetime.utcnow(),
        })

    async def update_plan(self, uid: str, plan: str) -> None:
        """Update user's subscription plan."""
        doc_ref = self.db.collection(self.COLLECTION).document(uid)
        doc_ref.update({
            "plan": plan,
            "updatedAt": datetime.utcnow(),
        })

    async def decrement_free_uses(self, uid: str) -> int:
        """Decrement free_uses_remaining by 1. Returns new value."""
        doc_ref = self.db.collection(self.COLLECTION).document(uid)
        doc = doc_ref.get()
        if not doc.exists:
            return 0
        current = doc.to_dict().get("freeUsesRemaining", 0)
        new_value = max(0, current - 1)
        doc_ref.update({
            "freeUsesRemaining": new_value,
            "updatedAt": datetime.utcnow(),
        })
        return new_value

    async def delete_user_data(self, uid: str) -> None:
        """
        Delete all user data from Firestore (GDPR compliance).
        This deletes the user document and all subcollections.
        """
        user_ref = self.db.collection(self.COLLECTION).document(uid)

        # Delete subcollections
        subcollections = ["cv_documents", "cv_analyses", "cover_letters", "user_cv_data", "photo_enhancements", "credit_transactions"]
        for subcoll in subcollections:
            docs = user_ref.collection(subcoll).stream()
            for doc in docs:
                doc.reference.delete()

        # Delete user document
        user_ref.delete()

    async def get_user_by_stripe_customer_id(self, customer_id: str) -> Optional[UserProfile]:
        """Find a user by their Stripe customer ID."""
        query = (
            self.db.collection(self.COLLECTION)
            .where(filter=FieldFilter("stripeCustomerId", "==", customer_id))
            .limit(1)
        )
        docs = query.stream()

        for doc in docs:
            data = doc.to_dict()
            return UserProfile(
                uid=doc.id,
                email=data.get("email"),
                display_name=data.get("displayName"),
                photo_url=data.get("photoURL"),
                plan=data.get("plan", "free"),
                free_uses_remaining=data.get("freeUsesRemaining", 3),
                stripe_customer_id=data.get("stripeCustomerId"),
                created_at=data.get("createdAt"),
                consent_terms=data.get("consentTerms", True),
                consent_marketing=data.get("consentMarketing", False),
            )

        return None


# Singleton instance
user_service = UserService()
