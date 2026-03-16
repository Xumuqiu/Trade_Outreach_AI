"""
Customer CRUD + background data APIs.

Why this matters:
- `Customer` is the identity (who we sell to).
- `CustomerBackground` is the structured context (what we know about them).
  The AI strategy and emails must only rely on this structured background.
- `CustomerState` is the outreach state machine (sent/opened/replied/follow-up steps).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Customer, CustomerAssignment, CustomerBackground, CustomerState, Email, EmailEvent, EmailSchedule
from app.schemas.customer_background import (
    CustomerBackgroundCreate,
    CustomerBackgroundOut,
    CustomerBackgroundUpdate,
)
from app.repositories.customer_state_repository import CustomerStateRepository
from app.services.customer_background_service import CustomerBackgroundService


router = APIRouter(prefix="/customers", tags=["customers"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class CustomerCreate(BaseModel):
    name: str
    email: EmailStr
    company: str | None = None
    job_title: str | None = None
    linkedin_url: str | None = None
    industry: str | None = None


class CustomerOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    company: str | None = None
    job_title: str | None = None
    linkedin_url: str | None = None
    industry: str | None = None

    class Config:
        from_attributes = True


@router.get("/")
def list_customers(db: Session = Depends(get_db)):
    """
    List customers for the Dashboard.

    Includes basic identity fields and the current outreach state machine fields
    so the UI can show a status badge without extra API calls.
    """
    customers = db.query(Customer).all()
    state_repo = CustomerStateRepository(db)
    result: list[dict] = []
    for customer in customers:
        state = state_repo.get_or_create(customer.id)
        result.append(
            {
                "id": customer.id,
                "name": customer.name,
                "email": customer.email,
                "company": customer.company,
                "industry": customer.industry,
                "status": state.status,
                "sequence_step": state.sequence_step,
                "last_contacted_at": state.last_contacted_at,
            }
        )
    return result


@router.post("/", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    """
    Create a customer (idempotent by email).

    - If email already exists, returns the existing customer.
    - Ensures a `CustomerState` row exists for the customer so the state machine
      always has a baseline record (NEW_LEAD).
    """
    existing = db.query(Customer).filter(Customer.email == payload.email).first()
    if existing is not None:
        return CustomerOut.model_validate(existing)

    customer = Customer(
        name=payload.name,
        email=payload.email,
        company=payload.company,
        job_title=payload.job_title,
        linkedin_url=payload.linkedin_url,
        industry=payload.industry,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    CustomerStateRepository(db).get_or_create(customer.id)
    return CustomerOut.model_validate(customer)


@router.get(
    "/{customer_id}/background",
    response_model=CustomerBackgroundOut | None,
)
def get_customer_background(customer_id: int, db: Session = Depends(get_db)):
    """
    Returns the structured customer background if it exists, otherwise null.

    The front-end uses this to pre-fill the Customer Detail form.
    """
    service = CustomerBackgroundService(db)
    return service.get_for_customer(customer_id)


@router.put(
    "/{customer_id}/background",
    response_model=CustomerBackgroundOut,
    status_code=status.HTTP_200_OK,
)
def upsert_customer_background(
    customer_id: int,
    payload: CustomerBackgroundCreate | CustomerBackgroundUpdate,
    db: Session = Depends(get_db),
):
    """
    Create or update background for a customer.

    This is the primary input that drives:
    - AI strategy generation
    - initial outreach email generation
    - follow-up email generation
    """
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    service = CustomerBackgroundService(db)
    return service.upsert_for_customer(customer_id, payload)


@router.delete(
    "/{customer_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    """
    Hard-delete a customer and related rows.

    Demo-friendly behavior:
    - Removes background, state, email records, scheduling records, and events.
    - Keeps the database consistent without relying on cascade deletes.
    """
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    email_ids = [row[0] for row in db.query(Email.id).filter(Email.customer_id == customer_id).all()]
    if email_ids:
        db.query(EmailEvent).filter(EmailEvent.email_id.in_(email_ids)).delete(synchronize_session=False)
        db.query(EmailSchedule).filter(EmailSchedule.email_id.in_(email_ids)).delete(synchronize_session=False)

    db.query(Email).filter(Email.customer_id == customer_id).delete(synchronize_session=False)
    db.query(CustomerAssignment).filter(CustomerAssignment.customer_id == customer_id).delete(synchronize_session=False)
    db.query(CustomerBackground).filter(CustomerBackground.customer_id == customer_id).delete(synchronize_session=False)
    db.query(CustomerState).filter(CustomerState.customer_id == customer_id).delete(synchronize_session=False)
    db.query(Customer).filter(Customer.id == customer_id).delete(synchronize_session=False)

    db.commit()
    return None
