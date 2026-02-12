from google.cloud import firestore
from typing import Optional
from app.core.firebase import get_firestore_client
from app.schemas.application import ApplicationCreate, ApplicationUpdate, ApplicationResponse


class ApplicationService:
    """Service for managing job applications in Firestore."""

    USERS_COLLECTION = "users"
    APPLICATIONS_SUBCOLLECTION = "applications"

    def __init__(self):
        self.db = get_firestore_client()

    async def create_application(
        self, user_id: str, data: ApplicationCreate
    ) -> ApplicationResponse:
        """Create a new application."""
        user_ref = self.db.collection(self.USERS_COLLECTION).document(user_id)
        apps_ref = user_ref.collection(self.APPLICATIONS_SUBCOLLECTION)

        doc_data = {
            "userId": user_id,
            "companyName": data.company_name,
            "position": data.position,
            "status": data.status,
            "jobUrl": data.job_url,
            "cvAnalysisId": data.cv_analysis_id,
            "coverLetterId": data.cover_letter_id,
            "notes": data.notes,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }

        doc_ref = apps_ref.add(doc_data)
        doc_id = doc_ref[1].id

        return ApplicationResponse(
            id=doc_id,
            user_id=user_id,
            company_name=data.company_name,
            position=data.position,
            status=data.status,
            job_url=data.job_url,
            cv_analysis_id=data.cv_analysis_id,
            cover_letter_id=data.cover_letter_id,
            notes=data.notes,
        )

    async def get_applications(
        self, user_id: str, limit: int = 50
    ) -> list[ApplicationResponse]:
        """Get all applications for a user."""
        apps_ref = (
            self.db.collection(self.USERS_COLLECTION)
            .document(user_id)
            .collection(self.APPLICATIONS_SUBCOLLECTION)
            .order_by("createdAt", direction=firestore.Query.DESCENDING)
            .limit(limit)
        )

        docs = apps_ref.stream()
        return [self._doc_to_response(doc.id, user_id, doc.to_dict()) for doc in docs]

    async def get_application(
        self, user_id: str, app_id: str
    ) -> Optional[ApplicationResponse]:
        """Get a specific application."""
        doc_ref = (
            self.db.collection(self.USERS_COLLECTION)
            .document(user_id)
            .collection(self.APPLICATIONS_SUBCOLLECTION)
            .document(app_id)
        )
        doc = doc_ref.get()

        if not doc.exists:
            return None

        return self._doc_to_response(doc.id, user_id, doc.to_dict())

    async def update_application(
        self, user_id: str, app_id: str, data: ApplicationUpdate
    ) -> Optional[ApplicationResponse]:
        """Update an application."""
        doc_ref = (
            self.db.collection(self.USERS_COLLECTION)
            .document(user_id)
            .collection(self.APPLICATIONS_SUBCOLLECTION)
            .document(app_id)
        )
        doc = doc_ref.get()

        if not doc.exists:
            return None

        update_data = {"updatedAt": firestore.SERVER_TIMESTAMP}
        if data.company_name is not None:
            update_data["companyName"] = data.company_name
        if data.position is not None:
            update_data["position"] = data.position
        if data.status is not None:
            update_data["status"] = data.status
        if data.job_url is not None:
            update_data["jobUrl"] = data.job_url
        if data.cv_analysis_id is not None:
            update_data["cvAnalysisId"] = data.cv_analysis_id
        if data.cover_letter_id is not None:
            update_data["coverLetterId"] = data.cover_letter_id
        if data.notes is not None:
            update_data["notes"] = data.notes

        doc_ref.update(update_data)

        updated_doc = doc_ref.get()
        return self._doc_to_response(updated_doc.id, user_id, updated_doc.to_dict())

    async def delete_application(self, user_id: str, app_id: str) -> bool:
        """Delete an application."""
        doc_ref = (
            self.db.collection(self.USERS_COLLECTION)
            .document(user_id)
            .collection(self.APPLICATIONS_SUBCOLLECTION)
            .document(app_id)
        )
        doc = doc_ref.get()

        if not doc.exists:
            return False

        doc_ref.delete()
        return True

    def _doc_to_response(
        self, doc_id: str, user_id: str, data: dict
    ) -> ApplicationResponse:
        """Convert Firestore document to ApplicationResponse."""
        return ApplicationResponse(
            id=doc_id,
            user_id=user_id,
            company_name=data.get("companyName", ""),
            position=data.get("position", ""),
            status=data.get("status", "saved"),
            job_url=data.get("jobUrl"),
            cv_analysis_id=data.get("cvAnalysisId"),
            cover_letter_id=data.get("coverLetterId"),
            notes=data.get("notes"),
            created_at=data.get("createdAt"),
            updated_at=data.get("updatedAt"),
        )


# Singleton instance
application_service = ApplicationService()
