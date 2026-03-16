"""
Email automation APIs.

Core concepts:
- EmailAccount: who sends the email (salesperson identity + provider config).
- Email (draft): subject/body stored in DB for review.
- pending_approval: drafts that require human approval before sending.
- schedule/send-now: two ways to send email. Both should write EmailEvent and update CustomerState.
- events: webhook-like endpoint to record opened/replied, updating the customer state machine.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Email
from app.schemas.email_automation import (
    EmailAccountCreate,
    EmailAccountOut,
    EmailComposeRequest,
    EmailEventIn,
    EmailScheduleRequest,
    EmailSendNowRequest,
)
from app.services.email_automation_service import EmailAutomationService


router = APIRouter(prefix="/emails", tags=["emails"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/accounts", response_model=EmailAccountOut, status_code=status.HTTP_201_CREATED)
def create_email_account(
    payload: EmailAccountCreate,
    db: Session = Depends(get_db),
):
    """Creates a sender account used for send-now/schedule."""
    service = EmailAutomationService(db)
    return service.create_account(payload)


@router.get("/accounts", response_model=list[EmailAccountOut])
def list_email_accounts(db: Session = Depends(get_db)):
    """Lists available sender accounts."""
    service = EmailAutomationService(db)
    return service.list_accounts()


@router.post("/compose", response_model=int, status_code=status.HTTP_201_CREATED)
def compose_email(
    payload: EmailComposeRequest,
    db: Session = Depends(get_db),
):
    """
    Stores a draft email in DB (pending_approval).

    The front-end generates or edits the content, then calls this endpoint so the draft
    appears in the Follow-up Board for review.
    """
    service = EmailAutomationService(db)
    email = service.compose_email(payload)
    return email.id


@router.post("/schedule", response_model=int, status_code=status.HTTP_201_CREATED)
def schedule_email(
    payload: EmailScheduleRequest,
    db: Session = Depends(get_db),
):
    """
    Schedules an existing draft email for delivery.

    The background scheduler will pick up due schedules and send them.
    """
    service = EmailAutomationService(db)
    try:
        schedule = service.schedule_email(payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return schedule.id


@router.post("/send-now", response_model=int, status_code=status.HTTP_200_OK)
def send_now(
    payload: EmailSendNowRequest,
    db: Session = Depends(get_db),
):
    """
    Sends an existing draft email immediately (demo transport may be a no-op).

    On success this should:
    - mark email as sent
    - create EmailEvent(sent)
    - update CustomerState (EMAIL_SENT)
    """
    service = EmailAutomationService(db)
    try:
        email = service.send_now(payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return email.id


@router.post("/events", status_code=status.HTTP_202_ACCEPTED)
def record_event(
    payload: EmailEventIn,
    db: Session = Depends(get_db),
):
    """
    Records tracking events for an email (opened/replied).

    This endpoint is designed for:
    - tracking pixel callbacks
    - inbound reply parsing callbacks
    In demo it can be called manually to simulate events.
    """
    service = EmailAutomationService(db)
    service.record_event(payload)
    return {"status": "ok"}


@router.get("/pending-approval", response_model=list[dict])
def list_pending_approval(db: Session = Depends(get_db)):
    """Lists drafts that require human approval before sending."""
    emails = db.query(Email).filter(Email.status == "pending_approval").all()
    return [
        {
            "id": email.id,
            "customer_id": email.customer_id,
            "account_id": email.account_id,
            "subject": email.subject,
            "status": email.status,
            "scheduled_at": email.scheduled_at,
            "sent_at": email.sent_at,
        }
        for email in emails
    ]


@router.get("/{email_id}", response_model=dict)
def get_email(email_id: int, db: Session = Depends(get_db)):
    """Gets a single email draft for the email review page."""
    email = db.query(Email).filter(Email.id == email_id).first()
    if email is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email not found")
    return {
        "id": email.id,
        "customer_id": email.customer_id,
        "product_id": email.product_id,
        "strategy_id": email.strategy_id,
        "account_id": email.account_id,
        "subject": email.subject,
        "body": email.body,
        "status": email.status,
        "scheduled_at": email.scheduled_at,
        "sent_at": email.sent_at,
        "country": email.country,
        "time_zone": email.time_zone,
    }


@router.put("/{email_id}", response_model=int, status_code=status.HTTP_200_OK)
def update_email(email_id: int, payload: dict, db: Session = Depends(get_db)):
    """
    Updates editable fields of a draft email.

    The email review page uses this to save manual edits prior to sending/scheduling.
    """
    email = db.query(Email).filter(Email.id == email_id).first()
    if email is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email not found")
    # Only allow safe fields to update
    if "subject" in payload and isinstance(payload["subject"], str):
        email.subject = payload["subject"]
    if "body" in payload and isinstance(payload["body"], str):
        email.body = payload["body"]
    if "time_zone" in payload:
        email.time_zone = payload["time_zone"]
    if "country" in payload:
        email.country = payload["country"]
    db.commit()
    return email.id
