import stripe
from typing import Optional
from app.core.config import settings
from app.services.firebase import user_service


# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeService:
    """Service for managing Stripe subscriptions."""

    async def get_or_create_customer(
        self, user_id: str, email: str
    ) -> stripe.Customer:
        """Get existing or create new Stripe customer for user."""
        user = await user_service.get_user(user_id)

        if user and user.stripe_customer_id:
            try:
                return stripe.Customer.retrieve(user.stripe_customer_id)
            except stripe.error.InvalidRequestError:
                pass

        customer = stripe.Customer.create(
            email=email,
            metadata={"firebase_uid": user_id},
        )

        await user_service.update_stripe_customer_id(user_id, customer.id)

        return customer

    async def create_checkout_session(
        self,
        user_id: str,
        email: str,
        success_url: str,
        cancel_url: str,
    ) -> stripe.checkout.Session:
        """Create a Stripe Checkout session for premium subscription."""
        customer = await self.get_or_create_customer(user_id, email)

        session = stripe.checkout.Session.create(
            customer=customer.id,
            payment_method_types=["card"],
            line_items=[
                {
                    "price": settings.STRIPE_PRICE_ID_PREMIUM,
                    "quantity": 1,
                },
            ],
            mode="subscription",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"firebase_uid": user_id},
        )

        return session

    async def create_portal_session(
        self, user_id: str, return_url: str
    ) -> Optional[stripe.billing_portal.Session]:
        """Create a Stripe Customer Portal session for managing subscription."""
        user = await user_service.get_user(user_id)

        if not user or not user.stripe_customer_id:
            return None

        session = stripe.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url=return_url,
        )

        return session

    async def handle_webhook_event(self, event: stripe.Event) -> None:
        """Handle Stripe webhook events."""
        event_type = event.type
        data = event.data.object

        if event_type == "checkout.session.completed":
            await self._handle_checkout_completed(data)
        elif event_type == "customer.subscription.updated":
            await self._handle_subscription_updated(data)
        elif event_type == "customer.subscription.deleted":
            await self._handle_subscription_deleted(data)
        elif event_type == "invoice.payment_failed":
            await self._handle_payment_failed(data)

    async def _handle_checkout_completed(
        self, session: stripe.checkout.Session
    ) -> None:
        """Handle successful checkout completion (subscription only)."""
        firebase_uid = session.metadata.get("firebase_uid")
        if not firebase_uid:
            return

        await user_service.update_plan(firebase_uid, "premium")

    async def _handle_subscription_updated(
        self, subscription: stripe.Subscription
    ) -> None:
        """Handle subscription status changes."""
        customer_id = subscription.customer
        user = await user_service.get_user_by_stripe_customer_id(customer_id)

        if user:
            if subscription.status == "active":
                await user_service.update_plan(user.uid, "premium")
            elif subscription.status in ["canceled", "unpaid", "past_due"]:
                await user_service.update_plan(user.uid, "free")

    async def _handle_subscription_deleted(
        self, subscription: stripe.Subscription
    ) -> None:
        """Handle subscription cancellation."""
        customer_id = subscription.customer
        user = await user_service.get_user_by_stripe_customer_id(customer_id)

        if user:
            await user_service.update_plan(user.uid, "free")

    async def _handle_payment_failed(self, invoice: stripe.Invoice) -> None:
        """Handle failed payment - could send notification email."""
        pass

    def construct_webhook_event(
        self, payload: bytes, signature: str
    ) -> stripe.Event:
        """Construct and verify a webhook event from Stripe."""
        return stripe.Webhook.construct_event(
            payload,
            signature,
            settings.STRIPE_WEBHOOK_SECRET,
        )


# Singleton instance
stripe_service = StripeService()
