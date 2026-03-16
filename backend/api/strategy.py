"""
Strategy generation API.

This endpoint is the "AI brain" for the initial outreach:
- Reads the structured `CustomerBackground` from DB
- Builds a strategy prompt (plus internal knowledge + value content blocks)
- Calls the LLM and returns:
  - customer profile (summary/risks/opportunities/positioning)
  - outreach strategy (goal/value/sequence)
  - an initial email draft (subject/body)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Customer
from app.schemas.strategy_engine import StrategyEngineRequest, StrategyEngineResponse
from app.services.strategy_engine_service import StrategyEngineService


router = APIRouter(prefix="/strategy", tags=["strategy"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "/generate",
    response_model=StrategyEngineResponse,
    status_code=status.HTTP_200_OK,
)
def generate_strategy(
    payload: StrategyEngineRequest,
    db: Session = Depends(get_db),
):
    """
    Generates a strategy and initial email draft for a customer.

    Errors:
    - 404 if customer does not exist
    - 503 if LLM is not configured (OPENAI_API_KEY missing)
    - other errors bubble up for visibility in demo/dev
    """
    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    service = StrategyEngineService(db)
    try:
        return service.generate(payload)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
