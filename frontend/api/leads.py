from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.schemas.leads import AssignCustomerRequest, CustomerAssignmentOut
from app.services.leads_service import LeadsService


router = APIRouter(prefix="/leads", tags=["leads"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/replied", response_model=list[dict])
def list_replied_leads(db: Session = Depends(get_db)):
    return LeadsService(db).list_replied()


@router.post(
    "/{customer_id}/assign",
    response_model=CustomerAssignmentOut,
    status_code=status.HTTP_200_OK,
)
def assign_customer(customer_id: int, payload: AssignCustomerRequest, db: Session = Depends(get_db)):
    service = LeadsService(db)
    try:
        assignment = service.assign_customer(customer_id, payload.account_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return assignment

