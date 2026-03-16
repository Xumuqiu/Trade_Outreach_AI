"""
Follow-up APIs (state machine + draft generation).

What this module provides:
- `/followups/state/{customer_id}`: read the current outreach state for UI badges and automation logic.
- `/followups/generate-next`: generate the next follow-up email draft based on current state.
- `/followups/generate-due`: batch-generate drafts that are due today (used by scheduler).

Key concept:
We use a simple 1-3-7 cadence driven by `CustomerState.sequence_step` and `last_contacted_at`.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.schemas.followup import CustomerFollowUpState, FollowUpDraftRequest, FollowUpDraftResponse
from app.services.followup_orchestrator_service import FollowUpOrchestratorService
from app.services.followup_state_service import FollowUpStateService


router = APIRouter(prefix="/followups", tags=["followups"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/state/{customer_id}", response_model=CustomerFollowUpState)
def get_followup_state(customer_id: int, db: Session = Depends(get_db)):
    """Returns the current follow-up state for a customer."""
    return FollowUpStateService(db).get_state(customer_id)


@router.post(
    "/generate-next",
    response_model=FollowUpDraftResponse,
    status_code=status.HTTP_201_CREATED,
)
def generate_next_followup(payload: FollowUpDraftRequest, db: Session = Depends(get_db)):
    """
    Generates a single follow-up draft email (pending_approval).

    Errors:
    - 400 if customer is not eligible (replied/stopped)
    - 503 if LLM is not configured
    """
    service = FollowUpOrchestratorService(db)
    try:
        return service.generate_next_draft(payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))


@router.post("/generate-due", response_model=list[FollowUpDraftResponse])
def generate_due_followups(db: Session = Depends(get_db)):
    """
    Generates follow-up drafts that are due right now.

    This is typically called by the background scheduler, but can also be invoked manually.
    """
    service = FollowUpOrchestratorService(db)
    return service.generate_due_drafts()
