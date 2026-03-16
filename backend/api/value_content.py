from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Customer
from app.schemas.value_content import ValueContentRequest, ValueContentResponse
from app.services.value_content_service import ValueContentService


router = APIRouter(prefix="/value-content", tags=["value-content"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "/generate",
    response_model=ValueContentResponse,
    status_code=status.HTTP_200_OK,
)
def generate_value_content(
    payload: ValueContentRequest,
    db: Session = Depends(get_db),
):
    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    service = ValueContentService(db)
    try:
        return service.generate(payload)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
