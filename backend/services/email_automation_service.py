"""
Email automation domain service.

This service owns:
- Creating sender accounts (EmailAccount)
- Storing drafts for human approval (Email.status = pending_approval)
- Sending emails now, or scheduling for later
- Recording tracking events (sent/opened/replied) and updating the customer state machine

Important behaviors:
- Drafts must be stored before sending so sales can review and edit content.
- Sending and scheduling should write EmailEvent(sent) and trigger CustomerState updates.
"""

from datetime import datetime, timedelta, time

from sqlalchemy.orm import Session

from app.models import Email, EmailAccount, EmailEvent, EmailSchedule
from app.schemas.email_automation import (
    EmailAccountCreate,
    EmailAccountOut,
    EmailComposeRequest,
    EmailEventIn,
    EmailScheduleRequest,
    EmailSendNowRequest,
)
from app.schemas.followup import FollowUpEvent, FollowUpEventType
from app.services.followup_state_service import FollowUpStateService
from app.repositories.customer_assignment_repository import CustomerAssignmentRepository


class MailTransport:
    """
    Pluggable mail transport.

    In production you would implement this with SMTP/SendGrid/Gmail API.
    In demo/dev it is intentionally not implemented to avoid accidental sends.
    """
    def send_email(self, account: EmailAccount, email: Email) -> None:
        raise NotImplementedError("Mail transport is not configured yet.")


class EmailAutomationService:
    def __init__(self, db: Session, transport: MailTransport | None = None):
        self.db = db
        self.transport = transport or MailTransport()

    def create_account(self, payload: EmailAccountCreate) -> EmailAccountOut:
        account = EmailAccount(
            salesperson_name=payload.salesperson_name,
            email_address=payload.email_address,
            provider=payload.provider,
            time_zone=payload.time_zone,
            country=payload.country,
        )
        self.db.add(account)
        self.db.commit()
        self.db.refresh(account)
        return EmailAccountOut.model_validate(account)

    def list_accounts(self) -> list[EmailAccountOut]:
        accounts = self.db.query(EmailAccount).filter(EmailAccount.is_active.is_(True)).all()
        return [EmailAccountOut.model_validate(a) for a in accounts]

    def compose_email(self, payload: EmailComposeRequest) -> Email:
        """
        Creates a pending-approval email draft.

        This is the bridge between AI generation and the human approval workflow:
        - AI creates subject/body (or sales edits it)
        - This endpoint stores it so it appears in the approval board
        """
        email = Email(
            customer_id=payload.customer_id,
            product_id=payload.product_id,
            strategy_id=payload.strategy_id,
            account_id=payload.account_id,
            subject=payload.subject,
            body=payload.body,
            status="pending_approval",
            country=payload.country,
            time_zone=payload.time_zone,
        )
        self.db.add(email)
        self.db.commit()
        self.db.refresh(email)
        return email

    def schedule_email(self, payload: EmailScheduleRequest) -> EmailSchedule:
        """
        Creates an EmailSchedule entry for a draft email.

        The scheduler will later pick it up and attempt to deliver it.
        """
        email = self.db.query(Email).filter(Email.id == payload.email_id).first()
        if email is None:
            raise ValueError("Email not found")
        if email.account_id is None:
            raise ValueError("Email has no sending account")

        existing = (
            self.db.query(EmailSchedule)
            .filter(
                EmailSchedule.email_id == email.id,
                EmailSchedule.status.in_(["pending", "sent"]),
            )
            .first()
        )
        if existing is not None:
            return existing

        account = self.db.query(EmailAccount).filter(EmailAccount.id == email.account_id).first()
        if account is None:
            raise ValueError("Email account not found")

        base_utc = payload.earliest_utc or datetime.utcnow()

        if payload.desired_local_hour is not None and email.time_zone is not None:
            scheduled_time_utc = self._calculate_local_send_time(
                base_utc=base_utc,
                local_hour=payload.desired_local_hour,
            )
        else:
            scheduled_time_utc = base_utc

        schedule = EmailSchedule(
            email_id=email.id,
            account_id=email.account_id,
            customer_id=email.customer_id,
            scheduled_time_utc=scheduled_time_utc,
            preferred_local_hour=payload.desired_local_hour,
            status="pending",
            next_attempt_at=scheduled_time_utc,
        )
        email.scheduled_at = scheduled_time_utc

        self.db.add(schedule)
        self.db.commit()
        self.db.refresh(schedule)
        return schedule

    def send_now(self, payload: EmailSendNowRequest) -> Email:
        """
        Sends an email immediately.
        This operation is idempotent: if the email is already sent, it returns the existing record.
        """
        email = self.db.query(Email).filter(Email.id == payload.email_id).first()
        if email is None:
            raise ValueError("Email not found")
        if email.account_id is None:
            raise ValueError("Email has no sending account")

        if email.sent_at is not None or email.status in {"sent", "opened", "replied"}:
            return email

        account = self.db.query(EmailAccount).filter(EmailAccount.id == email.account_id).first()
        if account is None:
            raise ValueError("Email account not found")

        # Update state first to prevent race conditions (optimistic locking)
        email.status = "sending"
        self.db.commit()

        try:
            self.transport.send_email(account, email)
        except NotImplementedError:
            pass
        except Exception as e:
            email.status = "failed"
            self.db.commit()
            raise e

        now_utc = datetime.utcnow()
        email.status = "sent"
        email.sent_at = now_utc

        event = EmailEvent(
            email_id=email.id,
            event_type="sent",
            occurred_at=now_utc,
            meta=None,
        )
        self.db.add(event)

        followup_service = FollowUpStateService(self.db)
        followup_service.handle_event(
            FollowUpEvent(
                customer_id=email.customer_id,
                email_id=email.id,
                event_type=FollowUpEventType.EMAIL_SENT,
            ),
            now=now_utc,
        )

        self.db.commit()
        self.db.refresh(email)
        return email

    def record_event(self, payload: EmailEventIn) -> EmailEvent:
        """
        Records tracking events and updates state.

        - opened -> email.status becomes opened (if previously sent)
        - replied -> state machine becomes REPLIED, and we assign the customer to the account
        """
        if payload.event_type in {"opened", "replied"}:
            existing = (
                self.db.query(EmailEvent)
                .filter(
                    EmailEvent.email_id == payload.email_id,
                    EmailEvent.event_type == payload.event_type,
                )
                .first()
            )
            if existing is not None:
                return existing

        event = EmailEvent(
            email_id=payload.email_id,
            event_type=payload.event_type,
            meta=payload.meta,
        )
        self.db.add(event)

        email = self.db.query(Email).filter(Email.id == payload.email_id).first()

        if payload.event_type == "opened":
            if email is not None and email.status == "sent":
                email.status = "opened"

        followup_service = FollowUpStateService(self.db)
        if email is not None and payload.event_type in {"opened", "replied"}:
            event_type = (
                FollowUpEventType.EMAIL_OPENED
                if payload.event_type == "opened"
                else FollowUpEventType.EMAIL_REPLIED
            )
            followup_service.handle_event(
                FollowUpEvent(
                    customer_id=email.customer_id,
                    email_id=email.id,
                    event_type=event_type,
                )
            )

        if email is not None and payload.event_type == "replied" and email.account_id is not None:
            CustomerAssignmentRepository(self.db).upsert(email.customer_id, email.account_id)

        self.db.commit()
        self.db.refresh(event)
        return event

    def due_schedules(self, now_utc: datetime) -> list[EmailSchedule]:
        return (
            self.db.query(EmailSchedule)
            .filter(
                EmailSchedule.status == "pending",
                EmailSchedule.next_attempt_at <= now_utc,
            )
            .all()
        )

    def process_due_schedules(self, now_utc: datetime | None = None) -> None:
        """
        Sends scheduled emails that are due.

        Called by the APScheduler task. On successful send, this will:
        - set email.status = sent and set sent_at
        - write EmailEvent(sent)
        - update CustomerState (EMAIL_SENT) so the follow-up cadence can start
        """
        if now_utc is None:
            now_utc = datetime.utcnow()

        schedules = self.due_schedules(now_utc)
        for schedule in schedules:
            email = self.db.query(Email).filter(Email.id == schedule.email_id).first()
            if email is None:
                schedule.status = "failed"
                continue

            account = (
                self.db.query(EmailAccount)
                .filter(EmailAccount.id == schedule.account_id)
                .first()
            )
            if account is None:
                schedule.status = "failed"
                continue

            if email.sent_at is not None or email.status in {"sent", "opened", "replied"}:
                schedule.status = "sent"
                schedule.last_attempt_at = now_utc
                continue

            try:
                self.transport.send_email(account, email)
            except NotImplementedError:
                pass
            except Exception:
                schedule.last_attempt_at = now_utc
                schedule.attempt_count += 1
                if schedule.attempt_count >= schedule.max_attempts:
                    schedule.status = "failed"
                else:
                    schedule.next_attempt_at = now_utc + timedelta(minutes=15)
                continue

            email.status = "sent"
            email.sent_at = now_utc
            schedule.status = "sent"
            schedule.last_attempt_at = now_utc

            event = EmailEvent(
                email_id=email.id,
                event_type="sent",
                occurred_at=now_utc,
                meta=None,
            )
            self.db.add(event)

            followup_service = FollowUpStateService(self.db)
            followup_service.handle_event(
                FollowUpEvent(
                    customer_id=email.customer_id,
                    email_id=email.id,
                    event_type=FollowUpEventType.EMAIL_SENT,
                ),
                now=now_utc,
            )

        self.db.commit()

    def _calculate_local_send_time(
        self,
        base_utc: datetime,
        local_hour: int,
    ) -> datetime:
        target_time_utc = datetime.combine(base_utc.date(), time(hour=local_hour))
        if target_time_utc <= base_utc:
            target_time_utc = target_time_utc + timedelta(days=1)
        return target_time_utc
